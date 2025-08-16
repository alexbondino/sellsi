# Plan Combinado Resolución Sistema de Thumbnails

Fecha: 16 Ago 2025  
Estado: Propuesta aprobada (en espera de ejecución)  
Origen: Fusión de hallazgos profundos (analisisclaude.md) + plan estructurado incremental (analisisgpt.md)

## 1. Objetivo
Eliminar races y cache poisoning que causan: (a) placeholders persistentes, (b) desaparición intermitente de thumbnails, (c) falta de actualización tras reemplazos y (d) manejo incompleto de WEBP. Garantizar visibilidad (telemetría/logs) y bases para idempotencia fuerte.

## 2. Principios de Diseño
1. Eventos faseados y únicos: ningún consumer actúa antes de datos estables.  
2. Idempotencia fuerte: decidir regenerar por firma (thumbnail_signature) no por mera existencia.  
3. Reactividad transversal: uiProducts y formularios reflejan llegada tardía de thumbnails sin forzar recargas globales.  
4. Observabilidad primero: nunca ocultar errores (eliminar `.catch(()=>{})`).  
5. Backward‑compatible rollout: cambios schema y edge en fases, evitando regeneraciones masivas inmediatas.

## 3. Modelo de Eventos (Unificado)
Evento: `productImagesReady`  
Payload (detail):
```
{
	productId: uuid,
	phase: 'base_insert' | 'thumbnails_ready' | 'thumbnails_skipped_webp' | 'thumbnails_partial' | 'repair',
	attempt?: number,
	staleDetected?: boolean,
	previousSignature?: string,
	newSignature?: string,
	count?: number
}
```
Reglas:
- `base_insert`: se emite SOLO si se requiere feedback UI inmediato (por ejemplo, lista refleja nuevas imágenes) PERO NO dispara invalidación de thumbnails (listener filtrará).  
- `thumbnails_ready` | `thumbnails_skipped_webp`: únicas fases que disparan invalidación de queries de thumbnails.  
- Debounce (250ms) y coalescing: múltiples eventos dentro de ventana → una sola invalidación.

## 4. Cambios por Capa

### 4.1 UploadService
- Eliminar dispatch prematuro con `thumbnailsPending:true`.  
- Promisificar `_ensureMainThumbnails(productId, supplierId, mainImageUrl, attempt)` → retorna `{status: 'ready'|'skipped_webp'|'partial'|'failed', signature, stale?:boolean}`.  
- Registrar errores con objeto estructurado `THUMBNAILS_MAIN_GENERATION_ERROR`.  
- Reset explícito (DB update) de `thumbnails=null, thumbnail_url=null, thumbnail_signature=null` cuando cambia imagen principal (antes de programar generación).  
- Reintentos: backoff exponencial 250ms, 750ms, 2000ms (configurable).  
- No usar `.catch(()=>{})`; propagar y emitir evento `repair` si la integridad se compromete.

### 4.2 Edge Function `generate-thumbnail`
- Añadir lectura de fila principal y comparar basename vs `thumbnail_signature` (si existe).  
- Fase 1 (observación): calcular `main_basename` y si `thumbnail_signature` no coincide → `staleDetected:true` en log; NO regenerar todavía.  
- Fase 2 (activación): si mismatch → regenerar y actualizar `thumbnail_signature = main_basename`.  
- WEBP: devolver `{ignored:true, reason:'webp_main_ignored'}` y NO intentar transcoding; UploadService ya maneja flujo y emite `thumbnails_skipped_webp`.

### 4.3 Base de Datos
Migración (faseada):
1. Añadir columna `thumbnail_signature text NULL` a `product_images` (solo filas `image_order=0`).  
2. Nueva función `replace_product_images_preserve_thumbs` que:  
	 - Respalda (SELECT) thumbnails y signature previos si la nueva imagen principal es idéntica (basename igual).  
	 - Si diferente → limpia campos (reset).  
3. (Opcional futuro) `thumbnails_version int DEFAULT 1`.  

### 4.4 React Query / Hooks
- Nueva queryKey: `['thumbnail', productId, phase]` mientras fase != estable (ready/ skipped_webp). Luego se consolida en `['thumbnail', productId]` copiando datos.  
- TTL dinámico:  
	- Fase transitoria: `staleTime: 5_000`, `refetchInterval: 1500` (stop cuando listo).  
	- Fase estable: `staleTime: 5 * 60_000`, sin refetch interval.  
- Listener en `UniversalProductImage`:  
	- Ignorar `base_insert`.  
	- Procesar `thumbnails_ready` / `thumbnails_skipped_webp`.  
	- Debounce hash por `productId`.  
	- No reiniciar contador de reintentos si no cambia fase.

### 4.5 uiProducts / useSupplierProducts
- Introducir `useQueries` para thumbnails por producto (ligero; solo enabled cuando visible en viewport o en modo edición).  
- Dependencias de `useMemo` incluyen snapshot mínimo `thumbnail_url` y `signature`.  
- Inyección perezosa: si thumbnails llegan después, uiProducts se re-mapea sin reconsultar backend completo.

### 4.6 useProductForm
- Rehidratación selectiva: si número de imágenes cambia o si la main gana `thumbnail_url` inexistente antes → actualizar solo campos de imágenes (no sobreescribir edición de otros campos).  
- Guardar `formData._thumbSig` y comparar para detectar refresco necesario.

### 4.7 Cleanup / Integridad
- Retrasar ejecución de limpieza de huérfanos hasta recibir `thumbnails_ready` / `thumbnails_skipped_webp` (flag en job).  
- Arreglar bug de `ensureIntegrity` (referencia a `updatedImages`).  
- Auto-repair: si fila principal tiene `thumbnail_url` 404 (opcional HEAD check) → reset y reenfilar generación.

### 4.8 Observabilidad
- Canal único de logs (console / supabase logs) prefijo `[THUMBS]`.  
- Campos mínimos: `ts, productId, phase, attempt, durationMs, outcome, staleDetected, errorCode`.  
- Crear hook debug `useThumbnailDebugInfo(productId)` que lee de un store en memoria / React Query devtools friendly.

## 5. Roadmap Faseado

| Fase | Objetivo | Cambios Clave | Riesgo | Rollback |
|------|----------|---------------|--------|----------|
| 0 | Instrumentación mínima | Logs UploadService + debounce listener (sin schema) | Bajo | Toggle flag env | 
| 1 | Flujo de eventos sólido | Promisificar, eliminar dispatch temprano, payload phase | Medio | Restaurar versión previa UploadService | 
| 2 | Idempotencia observada | Columna signature + edge logging mismatch (sin regenerar) | Bajo | Drop columna | 
| 3 | Idempotencia activa | Regenerar si mismatch y reset en cambio main | Medio | Desactivar flag `ENABLE_SIGNATURE_ENFORCE` | 
| 4 | Reactividad UI | uiProducts reactivo + rehidratación selectiva form | Bajo | Revertir memo deps | 
| 5 | Limpieza segura | Delay cleanup + auto-repair | Medio | Revertir job flag | 
| 6 | Optimización | TTL dinámico, consolidación cache | Bajo | Volver a staleTime global | 

## 6. Backlog Detallado (Historias)
1. feat(upload): promisificar `_ensureMainThumbnails` y emitir fases correctas.  
2. chore(ui): implementar debounce eventos y filtrado por phase en `UniversalProductImage`.  
3. feat(db): migración `add_thumbnail_signature` (SQL + revert script).  
4. feat(edge): logging mismatch (fase observación).  
5. feat(upload): reset thumbnails al cambiar main (respetando misma imagen).  
6. feat(edge): regeneración condicionada por signature (flag).  
7. feat(uiProducts): añadir dependencias thumbnails y lazy queries visibles.  
8. feat(form): rehidratación diferencial imágenes.  
9. fix(integrity): corregir `ensureIntegrity` + evento `repair`.  
10. feat(cleanup): retrasar cleanup hasta phase final.  
11. feat(observability): hook debug + agregador de logs en memoria.  
12. perf(cache): TTL dinámico según phase.  

## 7. Métricas y Validación
Recolectar baseline 48h antes de activar Fase 1:  
- p95 tiempo `base_insert → thumbnails_ready`.  
- % productos con `thumbnail_url` no nulo a los 5s.  
- Promedio eventos `productImagesReady` por producto creación.  
- 404 rate en bucket thumbnails.  

Objetivos tras Fase 6:  
- p95 < 3s, ratio thumbnails persistentes > 95%, eventos por producto <= 2, 404 rate < 0.5%.

## 8. Flags de Control (Feature Toggles)
| Flag | Descripción | Default |
|------|-------------|---------|
| ENABLE_PHASED_THUMB_EVENTS | Activa nuevo modelo de fases | true | 
| ENABLE_SIGNATURE_COLUMN | DB ha migrado y se usa signature | false (auto true post migración) | 
| ENABLE_SIGNATURE_ENFORCE | Regenerar si mismatch | false | 
| ENABLE_DYNAMIC_THUMB_TTL | TTL corto en fase transitoria | false | 
| ENABLE_DELAYED_CLEANUP | Cleanup espera phase final | true | 

## 9. Riesgos y Mitigaciones Adicionales
- Regeneración tormenta al activar enforcement: Mitigar con lote progresivo (activar flag sólo en productos nuevos primera semana).  
- Crecimiento transitorio de objetos huérfanos: Cron cleanup existente absorbe tras window de 24h.  
- Overfetch React Query con TTL corto: limitar a productos en viewport (IntersectionObserver / virtual list).  
- Incompatibilidad edge antigua: versionar función (`generate-thumbnail-v2`) y cambiar ruta progresivamente.

## 10. Plan de Pruebas Resumido
Casos automatizables:  
1. Reemplazo main → signature cambia → thumbnails reset → evento ready.  
2. Mismo main re-subido → no reset (firma igual).  
3. WEBP main → phase `thumbnails_skipped_webp` y no reintentos posteriores.  
4. Mismatch artificial (manipular DB) → enforcement regenera.  
5. Evento storm (simular 3 dispatch) → 1 invalidación efectiva.  
6. Race refreshProduct vs setQueryData → estado final conserva thumbnails.  

## 11. Deliverables por Fase
- Código (services, hooks, edge, migraciones).  
- Scripts rollback migraciones.  
- Documentación actualizada (`Documentacion/`).  
- Resumen métricas comparativas (pre/post) en `Documentacion/thumbnails-metrics.md`.  

## 12. Exclusiones (Out of Scope Inicial)
- Transcodificación WEBP → JPG.  
- CDN invalidation avanzada (cache HTTP externo).  
- Versionado de thumbnails múltiples por producto (solo main).  

## 13. Próximos Pasos Inmediatos
1. Implementar Fase 0 + 1 (feat(upload) + listener UI).  
2. Preparar migración signature (sin enforcement).  
3. Recoger baseline métricas 48h.  
4. Revisar logs y validar ausencia de placeholders persistentes.  

---
Fin del documento.

---

## 14. Mapeo Problemas ←→ Soluciones (Trazabilidad)
| Problema / Causa Raíz | Sección Solución | Flag / Fase |
|-----------------------|------------------|-------------|
| Evento temprano (RC1) | 4.1 / 3 (phases) | Fase 1 |
| Cache poisoning TTL largo | 4.4 / 6 | ENABLE_DYNAMIC_THUMB_TTL |
| WEBP sin invalidación | 4.1 / 4.2 / phases `thumbnails_skipped_webp` | Fase 2 |
| Destrucción thumbnails en replace | 4.3 / función preserve | Fase 3 |
| Error masking `.catch(()=>{})` | 4.1 / 4.8 | Fase 1 |
| Idempotencia laxa (sin firma) | 4.2 / 4.3 / signature | Fases 2–3 |
| uiProducts no reactivo | 4.5 | Fase 4 |
| Rehidratación bloqueada form | 4.6 | Fase 4 |
| Múltiples fuentes evento | 14.1 (nuevo) | Fase 1 |
| refreshProduct pisa cache | 14.2 | Fase 1 |
| Criterio éxito demasiado estricto | 14.3 | Fase 1 |
| Parcial vs ready indistinto | 3 / 14.3 | Fase 1 |
| Limpieza prematura | 4.7 | ENABLE_DELAYED_CLEANUP |
| ensureIntegrity bug | 6 item 9 | Fase 5 |
| Falta consolidación cache estable | 14.5 | Fase 6 |
| Métricas sin mecanismo | 14.6 | Fase 0 |
| Overfetch thumbnails | 14.7 | Fase 4 |
| Falta cooldown enforcement firma | 14.4 | Fase 3 |
| Reintentos sin backoff suficiente | 4.1 | Fase 1 |
| Falta reset selectivo form | 4.6 / 14.8 | Fase 4 |

## 15. Clarificaciones Operativas Añadidas

### 15.1 Fuente Única de Eventos
- Único emisor de fases finales: `UploadService` tras resolver `_ensureMainThumbnails`.  
- `useProductBackground` deja de emitir `productImagesReady`; sólo podrá emitir un evento interno distinto (`productProcessQueued`) si sigue siendo necesario para otra lógica (documentar si se mantiene).  
- `_ensureMainThumbnails` emite exactamente una transición final (`thumbnails_ready` | `thumbnails_skipped_webp` | `thumbnails_partial` -> opcional upgrade posterior).  

### 15.2 Mitigación Race `refreshProduct()`
- Envolver `refreshProduct` en wrapper que retorna diff y aplica merge:  
	- Si la respuesta DB trae `thumbnail_url = null` pero cache actual (queryClient) tiene valor no nulo → conservar valor cache (no sobreescribir).  
	- Introducir `imagesRevision` (contador local) incrementado en cada reemplazo; `refreshProduct` sólo aplica si `payload.revision >= currentRevision`.  

### 15.3 Criterio Parcial / Ready
- `thumbnails_partial`: presente `thumbnail_url` + al menos variante `desktop`. Faltan una o más variantes (tablet, mobile, minithumb).  
- Upgrade a `thumbnails_ready` cuando polling detecta todas variantes o tras edge confirm.  
- UI: usar `thumbnail_url` inmediatamente; no mostrar indicador de carga extra.  

### 15.4 Cooldown Enforcement Firma
- Variable `SIGNATURE_ENFORCE_COOLDOWN_MS = 5000`.  
- Enforcement sólo si (ahora - `mainImageUpdatedAt`) > cooldown y no hay generación en curso (flag en memoria).  

### 15.5 Consolidación Cache
1. Durante fases transitorias se usa key `['thumbnail', id, phase]`.  
2. Al entrar en `thumbnails_ready` / `thumbnails_skipped_webp`:  
	 - Leer data transitoria.  
	 - `queryClient.setQueryData(['thumbnail', id], data)`  
	 - Invalidar únicamente keys transitorias antiguas.  
3. Evitar cascada: no invalidar la key estable inmediatamente después del set.

### 15.6 Mecanismo Métricas
- Agregador en memoria módulo `thumbnailMetrics.ts`: funciones `record(eventType, payload)` y `flush()`; flush cada 60s vía `setInterval` → `console.log('[THUMBS_METRIC]', JSON.stringify(batch))`.  
- Eventos registrados: `event_emit`, `generation_start`, `generation_result`, `cache_hit_empty`, `cache_promote`, `repair_trigger`.  

### 15.7 Viewport / Lazy Activation
- Hook `useInViewport(ref, options)` (IntersectionObserver).  
- Thumbnails queries habilitadas sólo si: producto en viewport OR producto en modo edición OR es imagen principal en galería destacada.  

### 15.8 Rehidratación Selectiva Form
- Al detectar cambio en `thumbnail_url` de main (null→valor) y `formData.userHasTouchedImages === false`, actualizar sólo `formData.imagenes[0].thumbnail_url` y `formData._thumbSig`.  
- No tocar otros campos (precio, stock, etc.).  
- Flag `userHasTouchedImages` se setea true en la primera interacción manual (drag, reorder, remove).  

### 15.9 Ajustes React Query Existentes
- Archivo esperado (verificar): `src/utils/queryClient.js` o `src/utils/queryClient.ts`.  
- Reducir temporalmente `staleTime` global de thumbnails a 0 en Fase 0 detrás de `ENABLE_DYNAMIC_THUMB_TTL`.  
- Añadir función `getThumbnailQueryOptions(phase)` que retorna TTL y refetchInterval según phase.

### 15.10 Rollback Plan Específico
- Fase 1 rollback: revertir cambios en UploadService y listener (feature flag `ENABLE_PHASED_THUMB_EVENTS=false`).  
- Fase 2 rollback: ignorar signature en edge (flag) y no escribir columna (dejar valores actuales).  
- Fase 3 rollback: desactivar enforcement flag, mantener datos pre-existentes.  
- Fase 4 rollback: deshabilitar viewport gating (flag) para regresar a comportamiento simple.  
- Fases 5–6 rollback: reactivar cleanup inmediato y restablecer TTL global original.

### 15.11 Almacenamiento de Flags
- Fuente: archivo `.env` + wrapper `config/featureFlags.ts` exportando booleanos parseados.  
- Ejemplo: `VITE_ENABLE_PHASED_THUMB_EVENTS=true` (exponer a frontend vía prefijo `VITE_`).  

### 15.12 Estados de Error y Códigos
| Código | Descripción | Acción Automática |
|--------|-------------|-------------------|
| EDGE_WEBP_IGNORED | Main es WEBP | Emitir `thumbnails_skipped_webp` |
| EDGE_GEN_FAIL | Error generando variante | Reintento (si attempt < max) |
| DB_UPDATE_FAIL | No se pudo actualizar fila | Reintento exponencial |
| SIGNATURE_MISMATCH | Firma no coincide | Regenerar (si enforcement activo) |
| REPAIR_404 | HEAD 404 detectado | Reset + reenqueue |

### 15.13 Secuencia Detallada Reemplazo Imagen Principal
1. Usuario sube nueva imagen principal.  
2. UploadService detecta cambio (basename distinto) → DB reset thumbnails + signature null.  
3. Emitir phase `base_insert` (opcional).  
4. Inicia `_ensureMainThumbnails` (attempt 1).  
5. Edge genera variantes → update DB (sin firma hasta Fase 2).  
6. UploadService verifica DB; si desktop + thumbnail_url presentes pero faltan otras → `thumbnails_partial`; continúa polling cada 750ms (máx 4) hasta completo → `thumbnails_ready`.  
7. Consolidación cache.  
8. Cleanup se habilita (delay) tras phase final.  

### 15.14 Checklist de Aceptación por Fase
- Fase 1: No más eventos `thumbnailsPending:true` en logs; cada creación produce máx 2 eventos (base_insert + ready/skipped).  
- Fase 2: Logs muestran `staleDetected:true` sin regeneración; no aumento de latencia >5%.  
- Fase 3: Cuando mismatch manual, edge regenera y firma actualizada; ningún producto queda con firma inconsistente > 10s.  
- Fase 4: Scroll grande no dispara más de N (= número items viewport * 2) queries simultáneas.  
- Fase 5: 404 thumbnails < baseline -80%.  
- Fase 6: p95 ready < 3s mantenido 48h.

### 15.15 Plan Métricas Persistencia (Opcional Futuro)
- Enviar batch a Supabase table `thumbnail_metrics` (write-only) cada 5 min (feature flag).  
- Campos: `ts, product_id, phase, duration_ms, attempts, outcome`.  

## 16. Acciones Adicionales para Completar el Plan
Agregar a Backlog (extensión):
13. chore(background): eliminar dispatch en `useProductBackground`.  
14. fix(refresh): merge defensivo `refreshProduct`.  
15. feat(cache): función consolidación cache estable.  
16. feat(metrics): agregador + flush interval.  
17. feat(viewport): hook `useInViewport`.  
18. feat(form): flag `userHasTouchedImages`.  
19. chore(flags): módulo `featureFlags.ts`.  
20. chore(types): definir tipos `ThumbnailPhase`, `ThumbnailEventDetail`, `ThumbnailGenerationOutcome`.  

## 17. Lista Final de Archivos Previstos a Modificar / Crear
| Tipo | Ruta (estimada) | Acción |
|------|-----------------|--------|
| JS/TS | `src/shared/services/upload/UploadService.js` | Promisificar, phases, logging |
| JS/TS | `src/components/UniversalProductImage.jsx` | Listener filtrado + debounce + consolidación |
| JS/TS | `src/domains/supplier/hooks/background/useProductBackground.js` | Remover dispatch redundante |
| JS/TS | `src/domains/supplier/hooks/useSupplierProducts.js` | uiProducts reactivo / lazy queries |
| JS/TS | `src/domains/supplier/hooks/useProductForm.js` | Rehidratación selectiva |
| JS/TS | `src/utils/queryClient.js` | Dynamic TTL / helpers |
| JS/TS | `src/hooks/thumbnails/useThumbnailQuery.js` (o similar) | Phase-aware keys |
| TS | `supabase/functions/generate-thumbnail/index.ts` | Firma, logging, enforcement flag |
| SQL | `supabase/migrations/<timestamp>_add_thumbnail_signature.sql` | Columna + índice opcional |
| SQL | `supabase/migrations/<timestamp>_replace_product_images_preserve_thumbs.sql` | Nueva función |
| JS/TS | `src/utils/featureFlags.ts` | Exponer flags |
| JS/TS | `src/hooks/useInViewport.ts` | Viewport gating |
| JS/TS | `src/metrics/thumbnailMetrics.ts` | Agregador local |
| MD | `Documentacion/thumbnails-metrics.md` | Seguimiento métricas |

## 18. Confirmación de Completitud Documental
Los análisis originales (`analisisclaude.md`, `analisisgpt.md`) quedan totalmente referenciados; esta síntesis incorpora todas las causas y soluciones, incluyendo aquellas inicialmente implícitas (races adicionales, consolidación cache, cooldown enforcement, viewport gating, merge defensivo refresh).  
Una vez implementadas secciones 15 & 16 no será necesario mantener los dos análisis operativos (pueden archivarse).  

---
Documento Definitivo Consolidado (v1.1).
