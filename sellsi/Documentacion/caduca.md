# FASE 1 – Optimización Thumbnails (Versión Corregida FOCALIZADA EN PERFORMANCE REAL)

Corrección del documento anterior: se detectaron varias asunciones incorrectas. Aquí se alinea el plan con el estado REAL del código.

---
## 1. Estado Actual REAL
Servicio: `phase1ETAGThumbnailService`.
Problema crítico: SIEMPRE consulta la base antes de decidir si es HIT (no hay short‑circuit). Por eso hit ratio lógico = 0 en términos de ahorro de roundtrips.
Concurrencia: Ya existe pool controlado por `FeatureFlags.THUMB_MAX_CONCURRENT` (default 12). No está serializado.
Límite de caché: Ya hay TTL (30m) + trimming a 1000 entradas en `cleanup()`.
Invalidación por firma: Implícita (cada fetch compara firma y reemplaza si cambió) pero irrelevante sin short‑circuit (porque siempre se pega a DB).
Batch: `useThumbnailsBatch` hace una query IN eficiente (no usar N llamadas individuales).

---
## 2. Problema Principal
La capa no reduce lecturas a DB. Aporta overhead (JS + logs) sin ahorro. Prefetch en este estado solo adelanta el costo, no lo elimina.

---
## 3. Objetivo Concreto Fase 1
Segundo acceso (o acceso repetido dentro de TTL) al mismo `product_id` DEBE devolver desde memoria sin tocar DB.

---
## 4. Cambios Imprescindibles (Orden Técnico Lógico)
1. Short‑Circuit en servicio: si existe entrada válida (TTL no expirado) devolver inmediatamente SIN query.
2. Nueva API batch `fetchMany(productIds)` que haga UNA query IN y rellene cache (evitar N queries en warmup/prefetch).
3. Adaptar `useThumbnailsBatch` para que use el servicio (poblando cache) y retornar map desde memoria tras primera carga.
4. Unificar solo lecturas “main thumbnail” (mantener queries de mutación: upload, reorder, delete, cleanup fuera del servicio).
5. Prefetch (después de 1–3): usar `fetchMany` con primeros N productos visibles.
6. Revisar si bajar `THUMB_MAX_CONCURRENT` de 12 a ~8 mejora estabilidad (opcional; no bloquear Fase 1).
7. Opcional micro‑optimización: silenciar logs `[FASE1_ETAG]` en producción para reducir ruido y micro-costo.

---
## 5. Plan de Acción Revisado (Ejecutable)
Paso 1: Modificar `fetchThumbnailWithETag`:
	- Lookup cache.
	- If válido (now - ts < TTL) return (HIT) sin DB.
	- Else hacer query; si firma igual simplemente refrescar timestamp; si cambia actualizar data+signature.
Paso 2: Implementar `async fetchMany(productIds)` dentro del servicio:
	- Filtrar ids ya válidos (evitar repetir) -> `idsToFetch`.
	- Si vacío => return map inmediato.
	- Query IN (mismas columnas / image_order=0) y poblar `cache`.
Paso 3: Cambiar `useThumbnailsBatch` para que:
	- Llame a `phase1ETAGService.fetchMany(productIds)`.
	- Devuelva map de `product_id -> entrada`.
Paso 4: Reemplazar lecturas sueltas de main thumbnail que aún usen supabase directo (solo lectura, no mutaciones) con `getOrFetchMainThumbnail`.
Paso 5: Prefetch posterior a cargar listado inicial (usar `fetchMany`).
Paso 6: Añadir flag `FEATURE_PHASE1_THUMBS` (si no existe) para fallback rápido.
Paso 7: Reducir verbosidad de logs en producción (condición NODE_ENV !== 'production').

### 5.1 Pasos YA Implementados (Ejecución Real)
| Paso | Descripción | Archivo(s) / Cambio | Estado |
|------|-------------|---------------------|--------|
| 1 | Short‑circuit en `fetchThumbnailWithETag` (no DB si TTL válido) | `src/services/phase1ETAGThumbnailService.js` | COMPLETO |
| 2 | Nueva API `fetchMany(productIds)` con query IN y populate cache | `phase1ETAGThumbnailService.js` (método `fetchMany`) | COMPLETO |
| 3 | Hook batch usa servicio (en lugar de query directa cuando flag ON) | `src/hooks/useThumbnailQueries.js` (`useThumbnailsBatch`) | COMPLETO |
| 4 | Unificación lecturas: hooks principales (`useThumbnailQuery`, phase, batch) usan servicio | Hooks actualizados; directos fuera de hooks (otros servicios) pendientes revisión | PARCIAL |
| 5 | Prefetch inicial primeros N (24) productos tras montaje | `ProductsSection.jsx` (useEffect con `getOrFetchManyMainThumbnails`) | BÁSICO (mejorable) |
| 6 | Feature flag maestro `FEATURE_PHASE1_THUMBS` | `featureFlags.js` + fallback en batch | COMPLETO |
| 7 | Reducir logs en producción (condicional en nuevos logs de HIT/MISS) | Condición `process.env.NODE_ENV !== 'production'` en servicio; `recordMetric` aún loggea siempre | PARCIAL |

### 5.2 Detalle de Cambios Realizados
- Servicio: añadido short‑circuit (ver bloque inicial del método) y batch `fetchMany`, más helper exportado `getOrFetchManyMainThumbnails`.
- Hook batch: ahora elige servicio si `FeatureFlags.FEATURE_PHASE1_THUMBS` es true; fallback legacy preservado.
- Flag: añadido `FEATURE_PHASE1_THUMBS` (default true) para rollback rápido sin tocar código.
- Prefetch: efecto en `ProductsSection` toma primeros 24 IDs de `renderItems` y llama a batch (silencioso).
- Logging: nuevos mensajes HIT/MISS suprimidos en producción; pendiente silenciar `recordMetric` o convertirlo en no‑op en prod si se desea.

### 5.3 Pendiente / Próximos Ajustes para Cerrar Fase 1
1. Revisar y migrar (solo lecturas de main thumbnail) llamadas residuales fuera de hooks: buscar `.from('product_images')` y filtrar las que solo leen `image_order=0` (excluir mutaciones y mantenimiento).
2. (Opcional) Silenciar `recordMetric` en producción o agrupar logs en un solo resumen periódico.
3. Añadir chunking en `fetchMany` si se detectan lotes > 500 IDs (hoy no crítico).
4. Validar que el índice parcial se usa (EXPLAIN) y guardar captura en documentación.
5. Micro-mejora prefetch: evitar re-prefetch si usuario cambia de página rápidamente (flag interna `prefetched` persistida con ref).

### 5.4 Cómo Verificar Manualmente Ahora
1. Cargar listado (primer render) – observar una sola query IN (batch) + algunas individuales (si hooks fuera de batch).  
2. Scroll arriba/abajo: repetir acceso a mismos productos NO debe emitir nuevas queries (hit en memoria).  
3. Forzar re-render ligero (ej: cambiar filtro menor sin invalidar thumbnails) – thumbnails deben aparecer instantáneos.  
4. Desactivar flag (`VITE_FEATURE_PHASE1_THUMBS=false`) y comparar (debe volver a golpear DB en cada acceso).  

### 5.5 Riesgos Abiertos
- Algunas rutas de UI podrían seguir usando consultas directas aún no migradas (impacto: reducción de beneficio parcial).  
- Logs de `recordMetric` todavía generan ruido si el volumen sube (evaluar gating).  
- Prefetch actual es simple (no gestiona visibilidad ni abortos en navegación rápida).  

### 5.6 Siguiente Commit Sugerido
Una vez migradas lecturas restantes y ajustado logging:  
`feat(etag-phase1): finalize unification of main thumbnail reads and quiet metrics in production`  


---
## 6. Detalles Clave de Implementación
Short‑Circuit Pseudocódigo:
```
const entry = cache.get(id)
if (entry && (Date.now() - entry.timestamp) < TTL && !forceRefresh) {
	metric('cache_hit')
	return entry.data
}
// solo aquí ir a DB
```
Batch Pseudocódigo:
```
fetchMany(ids) {
	const need = ids.filter(id => !validCache(id))
	if (!need.length) return buildMap(ids)
	const { data } = await supabase.from('product_images')
		 .select('product_id, thumbnails, thumbnail_url, thumbnail_signature')
		 .in('product_id', need).eq('image_order',0)
	data.forEach(row => upsertCache(row))
	return buildMap(ids)
}
```
Prefetch: tras recibir productos visibles => tomar primeros N ids => `fetchMany(idsPrefetch)`.

---
## 7. Qué YA Existe (No Rehacer)
- Concurrencia configurable (`THUMB_MAX_CONCURRENT`).
- Límite + TTL + cleanup (aunque se puede subir `maxSize` si hace falta, hoy 1000).
- Comparación de firma (sirve pero cobrará valor real tras short‑circuit).

---
## 8. Qué NO Tocar en Fase 1
- Flujos de upload / reorder (`uploadService`, etc.).
- Servicios de limpieza (`storageCleanupService`).
- Tests E2E que hacen deletes/updates sobre `product_images`.

---
## 9. Checklist Rápido (Debe Quedar Verdadero al Final)
[] Short‑circuit implementado (ver segundo acceso sin request de red).
[] `useThumbnailsBatch` usando `fetchMany`.
[] Prefetch inicial llena caché para scroll inmediato.
[] Lecturas aisladas migradas (sin romper mutaciones).
[] Logs reducidos en producción.
[] Fallback flag listo.

---
## 10. Próximo Commit (Scope Esperado)
"feat(etag-phase1): add short-circuit + fetchMany + batch integration + prefetch hook skeleton"

Incluye: cambios servicio, adaptación batch hook, prefetch básico (desactivable), docs actualizados.

---
## 11. Riesgos (Breve) & Mitigación
- Riesgo: Cache inconsistente tras mutación -> Mitigar: invalidar manualmente en mutaciones críticas (ya se hace donde corresponda). 
- Riesgo: Memoria -> Ajustar `maxSize` y limpiar.
- Riesgo: Batch grande bloquea -> Dividir ids en chunks de 200 si se vuelve masivo.

---
## 12. Notas Finales
El beneficio REAL empieza exactamente cuando el servicio deja de consultar DB en cada acceso. Nada anterior (prefetch, pool, logs) reemplaza este primer paso.

Fin versión corregida.

