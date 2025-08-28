## Análisis Profundo: Casos en los que NO se generaron thumbnails para 2 de ~20 productos

### 1. Resumen del incidente
Se cargaron ~20 productos en una sesión rápida. En 2 casos la imagen principal quedó sin thumbnails (desktop/tablet/mobile/minithumb) y luego, al re–subir (o editar) el producto, sí se generaron correctamente. El tester reporta ausencia total de logs de error en la Edge Function `generate-thumbnail`, lo que sugiere que la función **no fue invocada** (o retornó muy temprano / la petición nunca salió del cliente).

### 2. Flujo actual (alto nivel)
1. El usuario completa formulario en `AddProduct` y envía.
2. Se crea el producto base (tabla `products`).
3. En background se procesan imágenes via `UploadService.replaceAllProductImages()` (caso creación) o `UploadService.replaceAllProductImages()` / `uploadMultipleImagesWithThumbnails()` según contexto.
4. Para la imagen principal:
	 - `replaceAllProductImages` termina con `_ensureMainThumbnails()` que:
		 - Lee la fila `product_images` (image_order=0).
		 - Si faltan variantes => llama `generateThumbnail()` (fetch a edge).
	 - Alternativamente, en el camino “legacy” (`uploadImageWithThumbnail`) se llama directamente a `generateThumbnail()` si `imageOrder === 0` y no es WebP.
5. La Edge Function valida parámetros y lee la fila `product_images` de la imagen principal (orden 0). Si no existe => 404 y responde con error. (Esto no generaría logs si la llamada nunca llegó).

### 3. Puntos concretos donde se dispara (o NO) la generación
| Camino | Lugar de disparo | Condición para invocar Edge | Riesgos específicos |
|--------|------------------|-----------------------------|---------------------|
| A: Reemplazo atómico (`replaceAllProductImages`) | Llamado interno a `_ensureMainThumbnails()` | `verifiedRows.length > 0` y falta al menos `desktop` | Muy baja prob. de omisión (solo si `verifiedRows` vacío o row malformada). |
| B: Subida incremental (`uploadImageWithThumbnail`) | Dentro de la misma función tras RPC `insert_image_with_order` | `imageOrder === 0` y tipo != webp | Riesgo: `imageOrder` inesperado != 0 por condición de carrera. |
| C: Reintento / auto-repair | `_autoRepairIf404` y `_ensureMainThumbnails` | Detección de 404 o variantes faltantes | Solo sucede después; no cubre “nunca se llamó” inicial. |

### 4. Matriz de escenarios de falla plausibles
| Escenario | Se invoca Edge? | Qué queda en DB | Logs Edge | Probabilidad | Comentario |
|-----------|-----------------|-----------------|-----------|--------------|------------|
| 1. Petición fetch abortada (navegación rápida / pestaña cerrada) | NO | Fila `product_images` sin thumbnails | NO | Media en uso intensivo | El usuario crea producto y navega antes de terminar fetch. |
| 2. Error de red transitorio (timeout DNS / conexión) | NO (excepción fetch) | Igual que arriba | NO | Baja-Media | Error se silencia (catch) y no reintenta. |
| 3. Race DB visibilidad: Edge se llama demasiado temprano y aún no “ve” la fila principal (lag) -> 404 | SÍ (pero termina 404) | Fila ya existe, sin thumbs | SÍ debería haber 404 (pero el cliente no loguea) | Baja | Si la respuesta 404 se captura y se silencia sin log, parece “no se llamó”. |
| 4. `imageOrder` ≠ 0 por una inserción anterior residual/duplicada | NO (porque condición `effectiveIsMain`) | Fila(s) sin thumbnails | NO | Muy baja | Requiere incoherencia en RPC / datos previos. |
| 5. Tipo WebP (política de exclusión) | Edge salta explícitamente | Fila sin thumbs | Logs mínimos | Dependiente dataset | El tester dijo que al re–subir sí generó => poco probable que fuese WebP. |
| 6. `_ensureMainThumbnails` detecta falsamente que ya existen variantes (JSON “stale”) | NO (exit temprano) | JSON desincronizado, archivos inexistentes | NO | Muy baja | Solo con preservación de thumbnails en un replace con la misma firma (no aplica a producto nuevo). |
| 7. Usuario lanza nueva creación inmediatamente y la UI reutiliza estado intermedio | Depende | Inconsistente | Variable | Baja | “State bleed” improbable por aislamiento por productId. |
| 8. Fallo silencioso en `generateThumbnail()` (throw antes de network, p.e. URL `supabase.supabaseUrl` indefinida en ese instante) | NO | Sin thumbs | NO | Muy baja | Config ya inicializada normalmente. |

### 5. Puntos críticos detectados en el código (con referencias conceptuales)
1. Silenciamiento de errores: 
	 - En `uploadImageWithThumbnail` el bloque `try { const thumbnailResult = await this.generateThumbnail(...) } catch { /* swallow */ }` elimina visibilidad.
	 - En `_ensureMainThumbnails` un error en `generateThumbnail` solo registra métrica (`generation_error`) pero no hace console.error condicionado a flags.
2. No hay retry cliente si la Edge responde 404 por carrera de visibilidad (fila aún no visible en cluster / latencia replicación). 
3. Dependencia total del cliente para primera generación, pese a existir función de mantenimiento `retry-thumbnail-jobs` (que actúa “after the fact”). Una ventana corta puede mostrar productos “sin imágenes” temporalmente sin garantía fuerte de autorreparación inmediata.
4. Posible fetch abort si el usuario cierra/navega porque la generación se hace *después* de la confirmación de creación del producto (UX permite acción nueva antes de completar thumbnails).
5. En el camino incremental (poco usado en creación masiva según flujo actual) la determinación de main depende de respuesta del RPC y ausencia de otra inserción previa; cualquier inconsistencia vuelve a saltar la generación.

### 6. Análisis temporal de una posible carrera (timeline hipotético)
```
T0  -> RPC insert producto (OK commit)
T1  -> Loop uploads imágenes (secuencial en replaceAllProductImages)
T2  -> RPC replace_product_images_preserve_thumbs (INSERT filas product_images)
T3  -> _ensureMainThumbnails: SELECT fila principal (devuelve row correctamente) -> detecta falta de desktop -> llama generateThumbnail()
--- Camino esperado ---

Escenario raro (incremental / network lag):
T0  -> RPC insert producto
T1  -> uploadImageWithThumbnail: upload + RPC insert_image_with_order (commit)
T2  -> generateThumbnail() fetch POST -> Edge ejecuta SELECT ... (pero réplicas aún no reflejan row) => 404
T3  -> Cliente atrapa error y lo silencia => sin retry => sin thumbnails
T4  -> Usuario crea otro producto (abandona contexto) => nunca se reintenta
Tn  -> Cron `retry-thumbnail-jobs` (si corre) podría arreglar más tarde, pero tester observó la falla antes.
```

### 7. Priorización de causas probables (ranking)
1. Fetch abortado / navegación inmediata (alta correlación con “creación rápida en serie”).
2. Error de red transitorio o timeout silencioso sin retry.
3. 404 temprano por carrera (lag visibilidad) + silenciamiento.
4. (Mucho menor) `imageOrder` anómalo impidiendo que se marque como main.
5. (Menor) JSON stale indicando variantes ya existentes.

### 8. Riesgos colaterales / vulnerabilidades lógicas
| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| Pérdida silenciosa de generación (sin métrica visible para frontend) | Productos sin thumbnails => UX inconsistente | Añadir retry + logging estructurado + métrica de “missed_main_thumbnail”. |
| Dependencia exclusiva de cliente para disparo inicial | Si cliente se interrumpe => no hay thumbnails hasta tarea manual | Trigger server-side (DB trigger + NOTIFY / background job) o asegurar job periódico `retry-thumbnail-jobs` con SLA corto. |
| Falta de backoff en error transitorio | Aumenta incidencia de fallos intermitentes | Implementar 2–3 reintentos con backoff ligero (100ms, 400ms, 1s). |
| WebP silenciosamente omitido (usuario desconcertado) | Confusión soporte formatos | Feedback UI: “La imagen principal WebP no genera thumbnails (convertir a JPG/PNG)”. |
| Posible doble invocación paralela (dos pestañas) | Uso innecesario de cuota y contención | Idempotencia ya existe; reforzar lock lógico con `start_thumbnail_job` (ya implementado) y retornar estado claro al cliente. |

### 9. Quick Wins (bajo riesgo)
1. Añadir logging explícito cuando `generateThumbnail` falla (network / 404) y propagar un evento `thumbnails_generation_failed`.
2. Implementar retry en cliente (máx 3 intentos) para códigos 404 y fetch abort (AbortError) antes de abandonar.
3. Pequeño delay (setTimeout 120–200ms) antes de primer intento para reducir probabilidad de 404 por latencia de commit (solo en camino incremental).
4. Métrica: registrar `generation_attempt` y `generation_missed_no_call` (si tras X segundos row main sin thumbnails y nunca se invocó). Esto requiere marcar localmente “intentado”.
5. UI: indicador temporal “Generando miniaturas…” con fallback a auto-repair tras 2–3s.

### 10. Mejoras de nivel medio
1. Refactorizar `uploadImageWithThumbnail` para llamar siempre a `_ensureMainThumbnails` (unificar rutas) reduciendo diferencias de comportamiento.
2. Incorporar un “Job enqueue” en DB (tabla `thumbnail_jobs`) vía trigger `AFTER INSERT ON product_images WHERE image_order=0` que escriba un row; la Edge `retry-thumbnail-jobs` puede consumir filas pendientes.
3. Exponer un endpoint interno (o RPC) `request_thumbnail_generation(product_image_id)` que valide precondiciones y centralice idempotencia.
4. Agregar constraint de integridad: si `thumbnail_url` no nulo entonces JSON `thumbnails` debe tener `desktop` (check constraint) para evitar estados parciales invisibles.

### 11. Largo plazo / robustez máxima
1. Migrar a pipeline asíncrona: Insert main image -> enqueue job (DB / queue / pgmq) -> worker Edge genera thumbs -> update row -> emite NOTIFY -> cliente escucha (o polling leve). El cliente deja de ser punto de origen.
2. Añadir verificación periódica (cron 5 min) que detecte filas `image_order=0` sin `desktop` después de >2 min y re–enqueue.
3. Firma de integridad (hash de bytes de imagen) para decidir regeneraciones más confiables que basename.
4. Observabilidad centralizada: dashboard con métricas (attempts, successes, partials, time-to-first-desktop-thumb p95).

### 12. Instrumentación recomendada mínima
Agregar (client-side):
```js
// Pseudocódigo dentro de generateThumbnail wrapper
for (let attempt=1; attempt<=3; attempt++) {
	try { const res = await doFetch(); if (res.ok) break; if (res.status===404) throw new Retryable('main_row_not_visible'); }
	catch(e){ if (isRetryable(e) && attempt<3) await delay([150,400,900][attempt-1]); else logFinalError(e); }
}
```
Registrar en consola (condicionado a modo debug) la secuencia de reintentos para diagnóstico.

### 13. Validaciones sugeridas para detectar “missed call” hoy mismo
Consulta SQL para auditar productos recientes sin thumbnails y sin intentos registrados (asumiendo columna `attempts` en job tracking — si no existe omitir):
```sql
select p.productid, pi.id as product_image_id, pi.thumbnail_url, pi.thumbnails
from products p
join product_images pi on pi.product_id = p.productid and pi.image_order = 0
where p.createddt > now() - interval '2 days'
	and (pi.thumbnail_url is null or pi.thumbnails is null);
```
Cruzar con logs de métricas (si existen) para confirmar ausencia de eventos.

### 14. Señales de que la Edge no fue llamada
- No hay fila de job tracking incrementada (`start_thumbnail_job`) para ese `product_image_id`.
- No existen logs `REQ_START` correlacionables por `productId` en el período.
- Métricas no muestran `generation_start` ni `generation_error` para ese ID.

### 15. Propuesta concreta de cambio incremental (orden de implementación)
1. Añadir retry y logging (Quick Win #1 y #2).
2. Unificar camino a `_ensureMainThumbnails` (Medio #1).
3. Trigger DB para enqueue (Medio #2) + aprovechar `retry-thumbnail-jobs` como worker.
4. Auditor cron para filas huérfanas (Largo plazo #2).

### 16. Riesgo de implementar reintentos (evaluación)
| Riesgo | Mitigación |
|--------|------------|
| Duplicado de llamadas simultáneas (dos pestañas) | Edge ya idempotente; mantener cooldown / signature. |
| Sobrecarga en picos (sube 100 productos) | Backoff corto y máximo 3 intentos limita carga extra < ~3x base. |
| Retry sobre imágenes realmente inexistentes (URL 404 real) | Interrumpir si 2º intento también 404 y row existe (descartar scenario). |

### 17. Checklist de verificación tras cambios
- [ ] Crear 25 productos en script rápido (<30s) y medir tasa de thumbnails completos.
- [ ] Forzar desconexión/red lenta (throttle) y validar reintentos.
- [ ] Verificar que `retry-thumbnail-jobs` repara cualquier caso residual < 2 min.
- [ ] Confirmar cero productos nuevos quedan sin `desktop` tras 5 min.

### 18. Conclusión
La causa más probable es que la Edge Function **no fue invocada** debido a una condición de carrera de navegación rápida o fallo transitorio de red con errores silenciados y sin reintento. El diseño actual depende del cliente en el momento crítico. La robustez se incrementará significativamente introduciendo (a) reintentos con backoff, (b) logging explícito, (c) un disparador server-side (job queue) y (d) auditoría / autorreparación más agresiva.

---
Este documento prioriza acciones inmediatas y traza una senda evolutiva hacia un pipeline confiable y observable para thumbnails.

## 19. Deep Dive Extendido del Flujo End-to-End (Nivel Bajo)

### 19.1 Creación de Producto + Imágenes (replaceAllProductImages)
Secuencia detallada (éxito esperado):
```
User Submit
	↓
createProduct(): INSERT INTO products RETURNING productid
	↓ (background)
replaceAllProductImages(files[])
	1. Clasifica entradas (existing vs new)
	2. Para cada nueva: upload storage (product-images bucket) -> obtiene publicUrl
	3. Construye orderedUrls[] conservando orden lógico usuario
	4. RPC replace_product_images_preserve_thumbs(productId, supplierId, orderedUrls)
			 - advisory lock por productId (pg_advisory_xact_lock)
			 - lee old main (image_order=0)
			 - decide v_preserve según thumbnail_signature (basename match)
			 - DELETE all product_images del producto
			 - INSERT todas con image_order incremental 0..n-1 (preservando thumbs si v_preserve)
	5. SELECT verificación (recheck) orden y cardinalidad
	6. (Swap si main esperado difiere) usando triple UPDATE atómico de image_order (0 <-> expectedIdx)
	7. Llama _dispatchPhase('base_insert')
	8. Llama _ensureMainThumbnails(productId, supplierId, mainImageUrl)
				a. Loop attempt=1..N (BACKOFFS=[250,750,2000])
				b. SELECT row principal (thumbnails, thumbnail_url)
				c. hasAll? => ready
				d. Si falta desktop -> generateThumbnail() (fetch Edge) -> espera respuesta
				e. Reintento tras backoff si aún faltan
				f. Evalúa partial / failed
```
Punto de carrera principal aquí: entre paso 4 (commits de INSERTS) y primer SELECT de `_ensureMainThumbnails` hay latencia mínima. Sin embargo, ambos comienzan **dentro del mismo proceso cliente** tras confirmación de RPC, por lo que la visibilidad suele ser inmediata (misma conexión ya ve sus commits). Riesgo bajo de 404 por replicación porque Edge se llama DESPUÉS del primer SELECT local (no al revés). 

### 19.2 Camino Alterno Incremental (uploadImageWithThumbnail)
Se usa cuando no se hace reemplazo atómico completo (casos históricos o subidas individuales):
```
uploadImageWithThumbnail(file,isMainGuess)
	1. Subida storage -> nombre = timestamp_random_basename
	2. getPublicUrl()
	3. RPC insert_image_with_order(product_id,image_url,supplier_id)
			 - (No visto aquí, pero presumiblemente fija image_order = COUNT(previas) o hace swap si main). 
	4. imageOrder devuelto => effectiveIsMain = (imageOrder === 0)
	5. Si main y no webp -> generateThumbnail(publicUrl, productId, supplierId)
				- FETCH Edge inmediato (sin espera adicional de verificación local)
```
Aquí SÍ puede existir una carrera: la Edge usa un nuevo pool/servidor que podría consultar antes de que una réplica reciba commit (si la base es single instance esto es improbable; si hay read replicas, probable). Resultado: 404 y se aborta silenciosamente. `_ensureMainThumbnails` no se llama en este camino (divergencia clave) => sin reintentos.

### 19.3 Edge Function generate-thumbnail (detallado por fases)
Fases en código (con etiqueta sugerida):
```
Phase A: Request Validation
	- Method must be POST
	- Body: { imageUrl, productId, supplierId, force }
	- Env: SUPABASE_URL + (ANON_KEY || SERVICE_ROLE_KEY)

Phase B: DB Pre-fetch
	- SELECT main row (image_order=0)
	- If missing => 404 (END)
	- Evaluate signature mismatch & idempotencia
	- If all variants exist and no force / enforcement -> return early (idempotent exit)

Phase C: Job Tracking
	- RPC start_thumbnail_job(productId, product_image_id)
	- Attempts++ / status=processing OR insert new row

Phase D: Fetch Source Image
	- fetch(imageUrl) with 30s timeout
	- Validate non-empty buffer, type (reject webp), size

Phase E: Variant Generation (parallel Promise.allSettled)
	- Variants: minithumb(40x40), mobile(190x153), tablet(300x230), desktop(320x260)
	- createThumbnailFromOriginal(): decode -> conditional resize -> center-canvas -> encode JPEG
	- Collect successes/failures; require at least one success else error

Phase F: Upload Storage
	- Ensure bucket (service role) (rare path)
	- Upload each successful variant path supplierId/productId/timestamp_variant_wxh.jpg
	- Build public URLs only for successful ones
	- HEAD verification optional (parcialmente implementado)

Phase G: (Faltante en fragmento mostrado) Persist update row (probable: UPDATE product_images SET thumbnails=JSON, thumbnail_url=desktop, thumbnail_signature=basename)
	- Mark job success / error via mark_thumbnail_job_success / mark_thumbnail_job_error (No visto en snippet: potencial mejora)

Phase H: Response JSON con { thumbnails, thumbnailUrl, ... }
```
Observaciones:
1. Si se produce un idempotent exit (Phase B) nunca se generan logs de error — esto es correcto. No cubre el caso de “función no invocada”.
2. Un 404 temprano por inexistencia de fila genera respuesta con error (y debería haber log), salvo que la llamada nunca suceda.
3. No se aprecia (en fragmento) un bloque final que marque `mark_thumbnail_job_success`. Podría estar fuera del trecho omitido; si no existe, los jobs quedarían en `processing` indefinidamente (riesgo de heurísticas de retry). 

### 19.4 RPC start_thumbnail_job Concurrency
Características:
```
LOOP UPDATE ... WHERE product_id=p_product_id
IF NOT FOUND -> INSERT (unique_violation => loop)
```
Esto hace lock “optimista” sin selección for update. Concurrencia segura: dos llamadas simultáneas -> una UPDATE, otra unique_violation + retry. No hay posibilidad de duplicar fila. `attempts` se incrementa sin race de pérdida.

### 19.5 RPC replace_product_images_preserve_thumbs Concurrency
Uso de `pg_advisory_xact_lock(hashtext(p_product_id::text)::bigint)` asegura exclusión por producto durante la transacción. Evita:
1. Intercalado de dos reemplazos que terminarían mezclando órdenes.
2. Duplicación de filas intermedia.
Limitación: No evita inserciones concurrentes fuera de este RPC (ej. llamadas a `insert_image_with_order`) mientras el lock está activo (pero generalmente la UI usa un único camino). Unificación futura recomendada: forzar todas las mutaciones de imágenes a pasar por una única RPC de lote.

### 19.6 Divergencia de Caminos (Riesgo de Comportamiento Inconsistente)
| Aspecto | Camino Reemplazo | Camino Incremental |
|---------|------------------|--------------------|
| Genera thumbnails | Sí (via `_ensureMainThumbnails` con reintentos) | Sí (una sola vez directa) |
| Reintentos integrados | Sí (backoff 250/750/2000) | No |
| Preservación thumbnails por firma | Sí (RPC) | No (cada subida es independiente) |
| Logging fases | Fases + métricas (phased events) | Menos granular |
| Exposición a carrera DB->Edge | Menor (Edge se llama después de SELECT local) | Mayor (Edge se llama inmediatamente) |

### 19.7 Principales “Single Points of Failure” (SPOF) Lógicos
1. Única invocación no reintentada en camino incremental.
2. Swallow silencioso de errores de red.
3. Dependencia de fetch POST en ventana donde usuario puede ya abandonar.
4. Falta de confirmación server-side (no existe trigger que garantice job si el cliente falla).

### 19.8 Métricas Recomendadas Adicionales (para observar cada fase)
| Métrica | Dimensiones | Descripción |
|---------|-------------|-------------|
| thumb_client_attempt | productId, attempt, path=incremental| Registro antes de cada fetch Edge |
| thumb_client_result | productId, outcome (ok|fail|abort|404) | Resultado post-fetch |
| thumb_edge_phase_duration | phase (fetch_row|fetch_image|generate|upload|persist) | Duraciones internas (ms) |
| thumb_edge_exit | type (idempotent|success|partial|error|webp_skip) | Clasificación de salida |
| thumb_missing_post_ttl | productId, ttl_bucket | Detecta filas sin desktop tras X segundos |

### 19.9 Propuesta de Estado Finito (FSM) para una Main Image
```
STATE: pending_upload -> uploaded_no_thumb -> thumb_generating -> thumb_ready
																		 ↘ (fail) -> thumb_retry_scheduled -> (max retries) -> thumb_failed
```
Persistir `thumb_state` (text) en `product_images` aceleraría diagnósticos. Hoy se infiere indirectamente (thumbnails JSON vs null, jobs table vs status).

### 19.10 Backpressure / Escalabilidad
En lotes (ej. 50 productos):
1. Camino reemplazo serializa la primera imagen (secuencial) pero variantes se generan en paralelo dentro de Edge (4). Coste CPU dominado por decodificaciones repetidas (no se reutiliza la instancia decodificada por variante – cada variante vuelve a decode en `createThumbnailFromOriginal` con coste adicional). Optimización futura: decode única + resize cascada.
2. Reintentos cliente pueden aumentar QPS Edge en fallos transitorios; mitigar introduciendo jitter.

### 19.11 Ventanas de Inconsistencia Temporal
| Ventana | Causa | Duración típica |
|---------|-------|-----------------|
| A: Imagen principal sin thumbnails visibles | Entre upload y final de `_ensureMainThumbnails` | 0.3s–2s (backoff) |
| B: Estado parcial (solo desktop) | Variantes tardan / errores parciales | Hasta próxima reparación (retry job / manual) |
| C: Sin thumbnails permanente (caso incidente) | Edge nunca invocada y no hay reintento | Indefinido hasta acción manual o job externo |

### 19.12 Checklist de Instrumentación para Confirmar Hipótesis
1. Log en cliente antes de cada `fetch generate-thumbnail` con timestamp y productId.
2. Al montar vista de producto recién creado, programar verificación diferida (2s) que consulte `product_images.image_order=0` y si `thumbnail_url` es null y no existen logs previos => disparar auto-retry.
3. Métrica Edge `REQ_START` ya existe; añadir correlación `x-request-id` pasado desde cliente (uuid v4) para trace cross-layer.

### 19.13 Prevención de Duplicidad de Trabajo
El RPC `start_thumbnail_job` ya controla increments; aprovecharlo para devolver `attempts`. Política sugerida:
```
if attempts > 1 within 10s AND status=processing -> cliente evita invocar de nuevo
```
Requiere exponer attempts en respuesta Edge.

### 19.14 Posibles “Ghost Success” (éxito aparente sin archivos)
Caso: Upload variante falla silenciosamente pero `getPublicUrl` aún construye algo. Mitigación ya iniciada con HEAD (parcial). Completar:
1. Ejecutar HEAD en cada URL y excluir las que devuelvan !=200 antes de persistir JSON.
2. Si menos de 2 variantes válidas -> marcar `partial` y programar requeue.

### 19.15 Riesgos de Integridad con Preservación de Thumbnails
`replace_product_images_preserve_thumbs` preserva thumbnails si basename coincide. Si usuario reemplaza imagen principal con archivo diferente pero mismo nombre (distinto contenido), se recicla thumbnail obsoleto. Mitigación:
1. Utilizar hash SHA-256 (primeros 12 hex) embebido en filename o almacenar `thumbnail_hash` comparando.
2. Si mismatch de hash => fuerza regeneración ignorando preservación.

### 19.16 Ejemplo de Flujo Con Reintentos Incorporados (Pseudocódigo Unificado)
```
async function ensureThumbs(productId, supplierId, mainUrl) {
	const MAX=3, BACKOFF=[150,500,1200];
	for (let i=0;i<MAX;i++) {
		const r = await generateThumbnail(mainUrl, productId, supplierId, { traceId });
		if (r.ok) return r;
		if (!r.retryable) break;
		await delay(BACKOFF[i]);
	}
	scheduleBackgroundRetry(productId, mainUrl);
}
```

### 19.17 Validación de Posturas Previas
El análisis inicial (secciones 1–18) se sostiene; este deep dive añade granularidad: el **único** camino vulnerable a “no call” es el incremental (o un abort de navegación) porque el reemplazo atómico ya incluye la capa `_ensureMainThumbnails` con polling limitado.

### 19.18 Roadmap Refinado con Dependencias Técnicas
| Nº | Acción | Dependencia | Tipo | ETA estimada |
|----|--------|------------|------|--------------|
| 1 | Añadir retry + logging cliente unificado | Ninguna | Quick Win | 0.5d |
| 2 | Exponer attempts en respuesta Edge | Mod Edge + RPC lectura | Medio | 0.25d |
| 3 | Unificar rutas a `_ensureMainThumbnails` | Refactor UploadService | Medio | 0.75d |
| 4 | Trigger en DB para encolar job | Nueva tabla/trigger | Medio | 1d |
| 5 | Worker robusto (retry-thumbnail-jobs mejora) | Step 4 | Medio | 0.5d |
| 6 | Hash de contenido para preservación segura | Cálculo hash (client o edge) | Avanzado | 1d |
| 7 | Dashboard métricas / alerta huérfanos | Métricas + cron | Avanzado | 1.5d |

---
Extensión concluida. Listo para implementar mejoras priorizadas cuando lo solicites.

