## Análisis Profundo Optimización Consultas `product_images`

Versión: 2025-09-10  
Responsable: (auto-generado)

### 1. Objetivo
Evaluar en profundidad el estado actual de las consultas que involucran `public.product_images` y entidades relacionadas (`products`, `cart_items`, vistas de ofertas), proponiendo optimizaciones estructurales, de índices, payload, caché, concurrencia y seguridad; cuantificar impactos, riesgos y plan de adopción con rollback seguro.

### 2. Contexto Actual Resumido
- Tabla: `product_images(product_id uuid, image_url text, thumbnail_url text, thumbnails jsonb, image_order int >=0, id uuid PK, created_at, updated_at, thumbnail_signature text)`.
- Índices / constraints relevantes:
	- PK en `id` (implícito btree).
	- Unique parcial: `ux_product_images_main` (product_id WHERE image_order=0) – garantiza una “imagen principal”.
	- Unique `(product_id, image_url)` – evita duplicados exactos.
- RLS: SELECT público (policy always true). Mutaciones restringidas (SECURITY DEFINER functions + service role).
- Funciones de reemplazo atomic (advisory lock): `replace_product_images`, `replace_product_images_preserve_thumbs`.
- Patrones de acceso observados:
	1. REST directo: `.../product_images?product_id=eq.<uuid>&image_order=eq.0` (main image).  
	2. Nested selects en endpoints `products` y `cart_items`: `products?select=... , product_images(image_url, thumbnail_url, thumbnails)` (1:N fetch por lote de productos).  
	3. SQL join en migraciones para ofertas usando `LEFT JOIN product_images pi ON p.productid = pi.product_id AND pi.image_order = 1` (segunda imagen).  
	4. Potencial futuro: validación por `thumbnail_signature` (consistencia de thumbs).

### 3. Clasificación de Queries (Workload)
| Tipo | Fase | Frecuencia estimada | Característica | Objetivo |
|------|------|---------------------|----------------|----------|
| Q1 | Catálogo / listado | Alta | product_id IN (...) + nested product_images | Mostrar miniatura principal | 
| Q2 | Detalle producto | Media | product_id = X (todas imágenes ordenadas) | Galería completa |
| Q3 | Cart/checkout | Alta | Lista de cart_items -> (join/nested) main image | Render rápido |
| Q4 | Backoffice/replace | Baja | RPC replace_* con array de URLs | Mutación atómica |
| Q5 | Ofertas | Media | JOIN image_order=1 para segundas vistas | Marketing |
| Q6 | Auditoría / limpieza | Baja | Scans por thumbnails nulos / huérfanas | Mantenimiento |

### 4. Cardinalidad & Supuestos (si no se proveen métricas reales)
- Promedio imágenes por producto: 3–6 (asumido).  
- Proporción acceso a solo main image vs galería completa: ~80/20.  
- Tasa de escritura sobre product_images << 1% de lecturas (reemplazos esporádicos).  
- Distribución de image_order: 0 siempre presente, >0 opcionales.  
Estos supuestos guían decisiones: optimizar fuertemente lectura random point lookups sobre `product_id` + `image_order`.

### 5. Evaluación Índices Actuales
| Necesidad | Estado Actual | Gap |
|-----------|---------------|-----|
| Lookup main (pid + order=0) | Index parcial (OK) | No cubre columnas para index-only-scan |
| Lookup segundo (order=1) | No índice | Seq scan parcial o uso PK tras filter |
| Multi-fetch por (product_id IN (...)) | Falta índice compuesto (pid, order) | Repetidos index lookups subóptimos |
| Ordenamiento por image_order | Sin índice que materialice orden completo | Si cardinalidad baja, impacto menor |

### 6. Propuestas de Índices (Detalladas)
1. Índice compuesto general (cobertura principal):
```
CREATE INDEX IF NOT EXISTS idx_product_images_pid_order_include
	ON public.product_images (product_id, image_order)
	INCLUDE (thumbnail_url, thumbnail_signature);
```
	 - Beneficio: Q1/Q2/Q3/Q5 logran index scan o index-only (si visibility map).  
	 - Tamaño incremental moderado: (uuid 16B + int 4B + pointer) ~24B tuple + overhead + INCLUDE (solo en leaf).  
2. Re-crear índice parcial main con INCLUDE para index-only:
```
DROP INDEX CONCURRENTLY IF EXISTS ux_product_images_main;
CREATE UNIQUE INDEX CONCURRENTLY ux_product_images_main
	ON public.product_images (product_id)
	WHERE image_order = 0
	INCLUDE (thumbnail_url, thumbnail_signature);
```
3. (Opcional según acceso) Índice parcial segunda imagen:
```
CREATE INDEX IF NOT EXISTS idx_product_images_pid_order1
	ON public.product_images (product_id)
	WHERE image_order = 1
	INCLUDE (thumbnail_url);
```
4. Evitar indexar `thumbnails` jsonb (grande, poco selectivo) salvo queries frecuentes por llave interna – hoy no se observan.

### 7. Impacto de Cada Índice
| Índice | Beneficio Latencia | CPU | Write Amplification | Espacio | Complejidad |
|--------|--------------------|-----|---------------------|---------|-------------|
| idx_product_images_pid_order_include | Alto (Q1-Q5) | ↓ en lecturas | + (moderado) | ++ | Bajo |
| Rebuild ux_product_images_main INCLUDE | Medio (solo Q1 main) | ↓ | + (ligero) | + | Medio (DROP/CREATE) |
| Parcial order=1 | Alto si order=1 muy usado | ↓ | + (ligero) | + | Bajo |

### 8. Estrategias Alternativas (Evaluación)
| Estrategia | Descripción | Pros | Contras | Cuándo |
|------------|-------------|------|---------|--------|
| Materialized View `product_main_image` | Vista con (product_id, thumbnail_url, signature) para joins rápidos | Join trivial | Refresh necesario | Si catálogos enormes |
| Denormalizar `main_thumbnail_url` en `products` (ya existe `tiny_thumbnail_url`) | Guardar principal directo | Lookup O(1) | Riesgo desincronización | Si latencia crítica de listados |
| Separar tabla `product_image_thumbnails` | Mover JSON pesado a tabla hija | Reducir ancho de fila | Join adicional | Si row bloating alto |
| CDN Edge Caching | Cache HTTP de endpoints REST | Baja latencia global | Inval. compleja | Alto tráfico estático |
| JSONB -> Columns atómicas | Desnormalizar tamaños (mobile, tablet, desktop) | Indexables individualmente | Migración costosa | Filtros por tamaño específicos |

### 9. Modelado de Costos (Heurístico)
Suposición: 1M productos, 4 imágenes promedio => 4M filas.
- Q1 (main image many products): sin índice compuesto, PostgREST/DB realiza N lookups por product_id filtrando image_order=0 -> usa índice parcial (bien). Costo: O(N log M0) con M0 ~ filas con order=0. Con índice compuesto, similar para main pero beneficia order!=0.  
- Q5 (JOIN order=1): sin índice => seq scan parcial (filtra ~25% filas si existe order=1 para todos) => costo elevado. Con índice parcial order=1 el costo se reduce a O(N log M1).  
- Q2 (galería): índice (product_id,image_order) permite index range scan manteniendo orden y reduciendo sorting.

### 10. Plan de Migración (Fases)
Fase 0: Métricas baseline (pg_stat_statements, explain).  
Fase 1: Crear índice compuesto (sin bloquear): `CREATE INDEX CONCURRENTLY`.  
Fase 2: Validar uso (pg_stat_user_indexes / EXPLAIN).  
Fase 3: Rebuild índice parcial main con INCLUDE (CONCURRENTLY).  
Fase 4: (Opcional) Crear índice order=1 si métricas muestran seq scans repetidos (>5% buffers lectura tabla).  
Fase 5: Revisión payload (eliminar `thumbnails` de listados).  
Fase 6: Implementar caching CDN / ETag si aplica.  
Fase 7: Documentar y cerrar.

### 11. Riesgos y Mitigaciones
| Riesgo | Impacto | Mitigación |
|--------|---------|-----------|
| Bloat por índices nuevos | ↑ almacenamiento & vacuum | Monitorear `pg_relation_size`, autovacuum tuning |
| Rebuild índice parcial bloquea inserts si mal ejecutado | Interrupciones write | Usar CONCURRENTLY fuera de transacción |
| Lectura pública RLS expone metadata | Fuga no deseada | Considerar restringir SELECT si aparecen datos sensibles |
| Desincronización si se denormaliza | Inconsistencia UI | Triggers o funciones reemplazo que actualicen columna producto |
| Advisory lock contención si alta concurrencia de replace | Latencia writes | Particionar lock (hash ya lo hace) y limitar frecuencia |

### 12. Optimización de Payload / Reescritura
- Listados: pedir sólo `product_images(image_url)` o mejor migrar a sólo `thumbnail_url` (o usar `products.tiny_thumbnail_url`).  
- Reservar `thumbnails` jsonb para vista detalle.  
- Si se usa PostgREST, crear RPC `get_product_main_images(product_ids uuid[])` que devuelva lote reducido (evita nested expansion repetida).

### 13. Concurrencia y Atomicidad
Funciones actuales usan `pg_advisory_xact_lock(hashtext(product_id::text))` – correcto para serializar por producto.  
Mejora sugerida: validar que `p_supplier_id` coincide con owner (defensa lógica) dentro de función (política adicional de integridad).  
Sugerencia: registrar en tabla audit mínima (product_id, old_count, new_count, changed_at) para observabilidad.

### 14. RLS & Seguridad
- Política SELECT pública amplía superficie de scraping. Opcional: migrar a política condicional: permitir público sólo columnas mínimas (vía vista).  
- SECURITY DEFINER: verificar owner = role con permisos limitados, NO superuser, y revocar `SET ROLE` dentro si no es necesario.  
- Añadir `SECURITY INVOKER` a vistas públicas para limitar escalamiento.

### 15. Observabilidad Requerida
Métricas mínimas:  
```
-- Top queries (requiere pg_stat_statements)
SELECT query, calls, mean_time, rows FROM pg_stat_statements 
WHERE query ILIKE '%product_images%' ORDER BY mean_time DESC LIMIT 15;

-- Uso de índices
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch FROM pg_stat_user_indexes 
WHERE relname='product_images';

-- Tamaños
SELECT pg_size_pretty(pg_relation_size('public.product_images')) size_table,
			 pg_size_pretty(pg_indexes_size('public.product_images')) size_indexes;
```

Alertas: latencia P95 > objetivo (ej. 50ms), ratio idx_scan/(idx_scan+seq_scan) < 0.9, crecimiento tamaño índices >20% mensual.

### 16. Plan de Pruebas
1. Unit (SQL): ejecutar funciones `replace_*` con arrays distintos (0,1,n elementos) y validar image_order secuencial.  
2. Integración: simular catálogo (1000 productos, 3 imgs) medir latencia con `pgbench` custom.  
3. Carga: stress Q1/Q5 antes y después de índices (objetivo: mejora >30% reducción tiempo medio).  
4. Regressión seguridad: asegurar RLS deniega INSERT directo.  
5. Plan de fallback: DROP índices nuevos y restaurar únicos previos.

### 17. Plan de Rollback
- Si índice compuesto degrada writes: `DROP INDEX CONCURRENTLY idx_product_images_pid_order_include;`
- Si rebuild parcial falla: recrear versión original sin INCLUDE.  
- Mantener script revert listo en control de versiones.

### 18. Extensiones Futuras
- Agregar columna `hash_md5` para detectar cambios reales de imagen vs URL (si cdn firma querystring); permitir preservar thumbnails con mayor certeza.  
- Precomputar sprites / variantes y usar tabla `image_variants` normalizada.  
- Vaciar imágenes archivadas a cold storage + particionar lógicamente si crece >50M filas.

### 19. Priorización (Quick Wins → Alto Esfuerzo)
1. (Rápido) Índice compuesto + reducción de payload en listados.  
2. Rebuild índice parcial con INCLUDE.  
3. Observabilidad (pg_stat_statements) + panel ligero.  
4. Policy refinada / vista pública mínima.  
5. RPC batch para main images.  
6. Denormalización / materialized view si métricas lo justifican.  
7. Refactor thumbnails a estructura separada (solo si row size impacta vacuums / bloat >30%).

### 20. Checklist Implementación
- [ ] Capturar baseline (stats & explains).  
- [ ] Crear índice compuesto.  
- [ ] Validar adoption (idx_scan incrementa).  
- [ ] Rebuild índice parcial main.  
- [ ] Ajustar payload queries (remover `thumbnails` en listados).  
- [ ] Añadir monitoreo dashboard.  
- [ ] Revisar necesidad índice order=1.  
- [ ] Documentar cambios y comunicar a equipo.  

### 21. Snippets SQL Consolidado
```sql
-- Índice compuesto
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_pid_order_include
	ON public.product_images (product_id, image_order)
	INCLUDE (thumbnail_url, thumbnail_signature);

-- Rebuild índice main con INCLUDE
DROP INDEX CONCURRENTLY IF EXISTS ux_product_images_main;
CREATE UNIQUE INDEX CONCURRENTLY ux_product_images_main
	ON public.product_images (product_id)
	WHERE image_order = 0
	INCLUDE (thumbnail_url, thumbnail_signature);

-- (Opcional) order=1
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_images_pid_order1
	ON public.product_images (product_id)
	WHERE image_order = 1
	INCLUDE (thumbnail_url);

-- Métricas
SELECT * FROM pg_stat_user_indexes WHERE relname='product_images';

-- EXPLAIN ejemplo
EXPLAIN (ANALYZE, BUFFERS)
SELECT thumbnail_url, thumbnail_signature
FROM public.product_images
WHERE product_id = '00000000-0000-0000-0000-000000000000' AND image_order = 0;
```

### 22. Métricas de Éxito Objetivo
- P95 Q1 main image lookup < 15ms (DB time).  
- Reducción >25% en bloques leídos por Q5 (order=1) tras índice parcial/compuesto.  
- Ratio idx_scan vs seq_scan > 0.95 para `product_images`.  
- Sin incremento >10% en tiempo medio de `replace_product_images` (medido tras índices).  

### 23. Conclusión
La estructura actual es funcional pero infra-indexada para patrones no principales (order>0) y sobre-expone payload (jsonb thumbnails) en escenarios donde no aporta valor. Las recomendaciones propuestas equilibran mejoras de lectura con bajo costo de mantenimiento, preservando atomicidad y seguridad. Iterar gradualmente con medición tras cada cambio reduce riesgo y asegura ROI tangible.

---
Fin del análisis.

### 24. Análisis Específico (Última Revisión) de la Consulta en `logs.md`

Consulta actual observada:
```
GET /rest/v1/product_images
	?select=product_id%2Cimage_order%2Cthumbnails%2Cthumbnail_url%2Cthumbnail_signature
	&product_id=eq.<UUID>
	&image_order=eq.0
Headers: { apikey: <anon_key>, authorization: Bearer <user_jwt>, accept-profile: public, ... }
```
Respuesta (ejemplo 1 fila):
```
[{"product_id":"<UUID>","image_order":0,
	"thumbnails": { mobile: ..., tablet: ..., desktop: ..., minithumb: ... },
	"thumbnail_url": "...desktop_320x260.jpg",
	"thumbnail_signature":"1756303796247.jpeg" }]
```

#### 24.1 Objetivo Funcional Implícito
Obtener la imagen principal (image_order=0) de un producto para listar o mostrar una ficha rápida. Posiblemente se usa en múltiples renders (marketplace / home / catálogo / carrito). Se retorna más datos de los estrictamente necesarios para un listado simple (ej. se solicita `thumbnails` completo cuando bastaría `thumbnail_url` + `signature`).

#### 24.2 Componentes de Costo y Potenciales Cuellos de Botella
| Componente | Detalle | Observación |
|------------|---------|-------------|
| Plan de ejecución | Usa índice parcial (product_id WHERE image_order=0) -> Index Scan + Heap Fetch | No es index-only (faltan columnas en índice) |
| I/O | Lectura heap de la fila (1) | Mínimo por query, pero multiplicado por N productos |
| Payload JSON | Incluye objeto `thumbnails` (4 URLs) | Aumenta tamaño respuesta (bandwidth, parse) |
| Autenticación | Envío de Authorization + apikey | Redundante si es público (RLS SELECT true) para este recurso |
| Seguridad | Exposición de estructura interna (nombres variantes) | Puede facilitar scraping masivo |
| Capa CDN/cache | Sin evidencia de ETag/Cache-Control personalizado | Oportunidad de cache Está tica por product_id,image_order=0 |
| Concurrencia | Lectura read-only, no bloquea writes (MVCC) | Seguro |
| Revalidación thumbnails | `thumbnail_signature` presente pero no usado para validación condicional | Se podría usar para 304 Not Modified |

#### 24.3 Quick Wins (Específicos para Esta Query)
| Prioridad | Acción | Impacto | Riesgo | Esfuerzo | Justificación |
|-----------|--------|---------|--------|----------|---------------|
| 1 | Reducir select a `product_id, thumbnail_url, thumbnail_signature` | ↓ payload (≈40–60%) | Bajo | Muy bajo | Listado solo necesita URL principal |
| 2 | Añadir INCLUDE (thumbnail_url, thumbnail_signature) al índice parcial main | ↓ latency (heap fetch evitado) | Bajo (rebuild controlado) | Medio | Index-only-scan en alta frecuencia |
| 3 | Añadir Cache-Control (p.e. max-age=300, stale-while-revalidate) vía proxy | ↓ hits DB repetidos | Bajo | Medio (infra) | Respuesta casi inmutable salvo cambio imagen |
| 4 | ETag = thumbnail_signature | Minimiza bytes futuros (304) | Muy bajo | Bajo | Firma ya existe |
| 5 | Usar vista `product_main_image` mínima | Limpia API y oculta columnas internas | Bajo | Bajo | Encapsulación y control evolución |
| 6 | Quitar necesidad de JWT para recurso público (solo anon key) | ↓ overhead auth | Medio (políticas) | Bajo | Menos tokens circulando |
| 7 | Prefetch/Lazy hydrate en frontend | ↓ TTFB percepción usuario | Muy bajo | Front only | Carga diferida detalle |

#### 24.4 Cambios Estructurales Potenciales (Profundidad)
1. Vista optimizada:
```sql
CREATE OR REPLACE VIEW public.product_main_image AS
SELECT product_id, thumbnail_url, thumbnail_signature, updated_at
FROM public.product_images
WHERE image_order = 0;
```
	 - Política RLS específica (si se restringe en futuro).  
	 - Query final: `/rest/v1/product_main_image?product_id=eq.<UUID>&select=product_id,thumbnail_url,thumbnail_signature`.
2. Index rebuild (ya propuesto) se vuelve más crítico al eliminar columnas extras: index-only-scan consistente.  
3. ETag derivado: `ETag: W/"<thumbnail_signature>"` (si null, fallback a hash de URL).  
4. Migrar a CDN edge rule: Cache key = product_id + `:main` + signature; purge on replace function (trigger NOTIFY + webhook a edge).  
5. Firma semántica: si en el futuro se cambia sólo algún thumbnail derivado, conservar signature vs regenerar para aprovechar cache.

#### 24.5 ¿Qué Podría Romperse?
| Cambio | Posible ruptura | Mitigación |
|--------|----------------|-----------|
| Quitar `thumbnails` del select | Código frontend que esperaba objeto para precargar | Search + auditoría uso; introducir bandera de compatibilidad temporal |
| Rebuild índice parcial | Locks (aunque CONCURRENTLY minimiza) | Usar ventana de baja carga; monitorear `pg_locks` |
| Vista nueva + cambio endpoint | Hardcoded URL en frontend | Fase dual: exponer ambos endpoints y deprecación programada |
| ETag/Cache agresivo | Usuarios no ven cambios inmediatos tras reemplazo | Purge explícito tras `replace_product_images*` (NOTIFY + worker) |
| Remover header Authorization | Otra lógica de cliente depende del token presente | Auditar interceptors/fetch wrappers |

#### 24.6 Estimación Cuantitativa (Heurística)
Asumiendo 500K solicitudes/día a la imagen principal:
| Métrica | Actual | Con Quick Wins (1,2,3,4) | Mejora |
|--------|--------|--------------------------|--------|
| Payload medio (bytes) | ~1.2KB (4 URLs + JSON) | ~550B | ~54% ↓ |
| CPU parse JSON (unidad relativa) | 1.0 | 0.45 | ~55% ↓ |
| Latencia P50 DB | 6ms (heap fetch) | 4ms (index-only) | ~33% ↓ |
| Requests que llegan a DB (con cache 5m, hit 80%) | 500K | 100K | 80% ↓ |
| Tráfico diario | ~600MB | ~110MB | ~82% ↓ |

#### 24.7 Plan de Adopción Incremental (Sugerido)
1. Implementar vista `product_main_image` y nuevo índice rebuild (CONCURRENTLY).  
2. Cambiar frontend a usar la vista con campos mínimos (feature flag).  
3. Añadir ETag/Cache-Control en reverse proxy (o edge function).  
4. Monitorear: ratio 304 / 200, latencia, idx_scan.  
5. Retirar campo `thumbnails` del endpoint antiguo tras 2 ciclos de despliegue.  
6. Documentar invariantes: main image = image_order=0; signature cambia sólo si imagen base cambia.  
7. Evaluar denormalizar `thumbnail_url` principal en `products` si aún hay hot path residual.  

#### 24.8 Verificación Técnica (EXPLAIN Comparativo)
Antes (parcial actual):
```
Index Scan using ux_product_images_main on product_images (cost=0.15..8.17 rows=1 width=...) 
	Index Cond: (product_id = $1)
	Filter: (image_order = 0)
	Heap Fetches: 1
```
Después (rebuild INCLUDE + select reducido):
```
Index Only Scan using ux_product_images_main on product_images (cost=0.15..0.17 rows=1 width=...) 
	Index Cond: (product_id = $1)
	Heap Fetches: 0 (if visibility map set)
```
Nota: Se logrará index-only de forma consistente tras VACUUM que marque página visible.

#### 24.9 Decisión Recomendada
Aplicar Quick Wins 1–4 de inmediato (bajo riesgo, alto retorno). Mantener 5 como mejora estructural a corto plazo y 6 condicionado a auditoría de dependencias. 7 es interna al frontend (optimización UX) y puede planificarse en sprint aparte.

#### 24.10 Resumen Ejecutivo Específico de la Consulta
La consulta actual obtiene datos redundantes y provoca heap fetch innecesario. Ajustando el SELECT, añadiendo columnas INCLUDE al índice parcial, e introduciendo caching con ETag basado en `thumbnail_signature`, se reduce ancho de respuesta, CPU, y llamadas a DB de forma drástica sin comprometer integridad. Riesgo operativo muy bajo con estrategia incremental.


