# Análisis Profundo: Pipeline de Imágenes / Thumbnails y Hooks relacionados (Agosto 2025)

## Objetivo
Documentar en detalle el flujo completo desde la creación / edición de un producto (pantalla AddProduct) hasta la generación, cacheo, invalidación y visualización de thumbnails; identificar puntos ciegos, hipótesis de fallos (desaparición / no refresco de thumbnails) y plan mínimo de corrección SIN cambiar la política vigente: imágenes WEBP se ignoran (no se generan thumbnails y no se intentará transcodificar).

---
## 1. Cadena de Flujo Completa

```
AddProduct.jsx
  ├─ useProductForm
  │    └─ useSupplierProducts (facade)
  │         ├─ useSupplierProductsCRUD
  │         ├─ useProductImages → UploadService → replaceAllProductImages
  │         │     └─ dispatch productImagesReady (temprano)
  │         │     └─ _ensureMainThumbnails → edge generate-thumbnail
  │         ├─ useProductSpecifications
  │         ├─ useProductPriceTiers (Zustand dominio supplier)
  │         ├─ useProductBackground (procesamiento async coordinado)
  │         ├─ useProductCleanup
  │         └─ useSupplierProductFilters
  ├─ useProductValidation
  ├─ useProductPricingLogic

Frontend Render (Buyer/Supplier views)
  └─ UniversalProductImage
		  ├─ useResponsiveThumbnail / useMinithumb
		  │     └─ useThumbnailQuery (React Query)
		  └─ Listener 'productImagesReady' (invalidación + reintentos)

Edge Function: generate-thumbnail (Deno / imagescript)
Storage Buckets: product-images, product-images-thumbnails
```

---
## 2. Hooks / Servicios Involucrados

Categorías:

1. Formulario / Creación:
	- `useProductForm`
	- `useProductValidation`
	- `useProductPricingLogic`
2. Facade y sub‑sistemas:
	- `useSupplierProducts`
	- `useSupplierProductsCRUD`
	- `useProductImages`
	- `useProductSpecifications`
	- `useProductPriceTiers` (Zustand dominio supplier)
	- `useProductBackground`
	- `useProductCleanup`
	- `useSupplierProductFilters`
3. Thumbnails / Visualización:
	- `UploadService` (no hook)
	- `_ensureMainThumbnails` (método interno UploadService)
	- Edge `generate-thumbnail`
	- `useResponsiveThumbnail`, `useMinithumb`, `useThumbnailQuery`
	- `UniversalProductImage`
4. Pricing compartido (impacta al refresco general):
	- `shared/hooks/product/useProductPriceTiers` (React Query)
5. Limpieza / Integridad:
	- `StorageCleanupService`
	- `CacheManagementService` (invocado desde `useProductImages`)

---
## 3. Flujo Narrado Paso a Paso

1. Usuario crea / edita producto y envía formulario.
2. `useProductForm` empaqueta `imagenes` como lista (wrappers: `{file|url,isExisting,...}`).
3. Facade `useSupplierProducts` delega a background para procesar asincrónicamente imágenes / tramos / especificaciones.
4. `useProductImages.uploadImages` decide ruta: reemplazo atómico (`replaceAllProductImages`).
5. `replaceAllProductImages`:
	- Reúne URLs (sube nuevas primero, conserva existentes).
	- Ejecuta RPC `replace_product_images` (inserción ordenada) y corrige main si necesario (swap).
	- DISPATCH temprano `productImagesReady` (estado: thumbnailsPending=true) ANTES de tener thumbnails.
	- Lanza `_ensureMainThumbnails` con reintentos (hasta 3) que invoca edge si faltan variantes.
6. Edge `generate-thumbnail`:
	- Detecta tipo; si `webp` → responde success ignored (no genera).
	- Comprueba idempotencia: si las 4 variantes + `thumbnail_url` ya existen → early return (NO valida si corresponden a la imagen actual).
	- Subida de 4 variantes JPG y update de fila principal.
7. `_ensureMainThumbnails` marca éxito si detecta todas las variantes y vuelve a lanzar evento (mismo nombre) provocando invalidaciones adicionales.
8. `UniversalProductImage` escucha `productImagesReady` e invalida query `['thumbnail', productId]` + reinicia estados; si la imagen aún no está lista o se mantiene nula, la caché puede quedar con placeholders.
9. Al cargar la UI, `useResponsiveThumbnail` selecciona: `product.thumbnails` → query result → heurística de reemplazo de sufijo → imagen original → placeholder.

---
## 4. Problemas / Puntos Ciegos Detectados

| Nº | Problema | Descripción | Impacto |
|----|----------|-------------|---------|
| 1 | Idempotencia laxa | Edge solo verifica existencia de claves, no coherencia con la imagen principal actual | Thumbnails obsoletos no se regeneran tras reemplazo de imagen |
| 2 | Evento temprano | Se emite `productImagesReady` antes de tener thumbnails → React Query cachea estado vacío | Placeholders persistentes / reintentos manuales |
| 3 | Falta de firma / versión | No hay `thumbnail_signature` ni `version` para detectar stale | Cache poisoning silencioso |
| 4 | Reorden + race | Reemplazo y swap de main puede ocurrir mientras `_ensureMainThumbnails` procesa el main anterior | Variantes asociadas a imagen equivocada |
| 5 | Doble ruta de procesamiento | Facade vs background podría duplicar operaciones si se usan APIs mezcladas | Condiciones de carrera, estados intermedios incoherentes |
| 6 | Limpieza prematura | `cleanupProductOrphans` puede borrar archivos antes de consolidar thumbnails nuevos | Desaparición intermitente |
| 7 | Bug `ensureIntegrity` | Referencia a `updatedImages` inexistente; reparación nunca se completa | Falta de auto-curación de caché |
| 8 | Tormenta de eventos | Múltiples dispatch seguidos → invalidaciones frecuentes | CPU / red extra, flashing |
| 9 | Manejo WEBP sin estado final | Se ignora sin marcar estado persistente (solo evento parcial) | Reintentos inútiles para webp principal |
|10 | Falta de reset thumbnails al cambiar main | Al reemplazar imagen principal no se nulifican thumbnails previos antes de chequear edge | Idempotencia falsa |

---
## 5. Hipótesis de Causas de “Desaparecen / No refrescan”

1. Thumbnails obsoletos aceptados como válidos (idempotencia laxa) → UI muestra rutas que luego 404 tras limpieza.
2. Cache de React Query se invalida temprano y se repuebla con `null`/placeholder; posteriores eventos no cambian porque la query entra en cool‑down hasta siguiente interacción.
3. Limpieza temprana elimina variantes subidas justo antes del update DB; fila queda apuntando a URLs inexistentes.
4. Reemplazo rápido de imagen principal durante reintentos: `_ensureMainThumbnails` genera variantes para la imagen anterior.
5. Ausencia de `thumbnail_signature` impide detectar mismatch y forzar regeneración.
6. Bug `ensureIntegrity` evita que el sistema repare rows parciales / corruptas.

---
## 6. Instrumentación Propuesta (Pre‑Fix)

Agregar logs y campos temporales:

Edge `generate-thumbnail`:
- Log JSON: `{productId, mainUrlBasename, existingThumbDesktopBasename, regenerated:true|false, staleDetected:true|false}`.
- Detectar stale: si `thumbnails.desktop` basename != main basename (sin sufijos) → marcar `staleDetected`.

UploadService:
- En `replaceAllProductImages` antes de dispatch: comparar main anterior vs nuevo. Si cambia → set `thumbnails=null, thumbnail_url=null` para image_order=0 (reset explícito).
- Marcar meta en dispatch: `phase:'base_insert' | 'thumbnails_ready' | 'thumbnails_skipped_webp' | 'thumbnails_partial'`.

UniversalProductImage:
- Debounce invalidaciones: ignorar eventos del mismo productId dentro de 250ms.
- Contador de eventos últimos 5s (diagnóstico).

ensureIntegrity:
- Corregir referencia inexistente; si detecta JSON thumbnails parcial => force reset a null y emitir evento `productImagesRepairScheduled`.

---
## 7. Plan de Corrección (Iterativo, sin tocar política WEBP)

Orden recomendado:
1. (B) Ajuste flujo de eventos: separar dispatch inicial y dispatch “ready”.
2. (A) Instrumentación + detección de stale + reset en cambio de main.
3. (C) Corregir bug `ensureIntegrity` y activar auto-repair.
4. Añadir `thumbnail_signature` (basename / hash) para idempotencia fuerte.
5. Post‑firma: edge regenera si `thumbnail_signature != main_basename`.
6. Retrasar cleanup a `thumbnails_ready OR thumbnails_skipped_webp`.
7. Debounce listener UI / añadir `thumbnailsState`.

---
## 8. Datos / Campos Nuevos Propuestos

Tabla `product_images` (fila principal `image_order=0`):
- `thumbnail_signature` (text): basename de la imagen usada para generar.
- (Opcional futuro) `thumbnails_version` (int incremental) para bust de cache.

Meta evento `productImagesReady.detail` añadirá:
```
{
  productId,
  phase: 'base_insert' | 'thumbnails_ready' | 'thumbnails_skipped_webp' | 'thumbnails_partial' | 'repair',
  staleDetected?: boolean,
  attempt?: number,
  previousSignature?: string,
  newSignature?: string
}
```

---
## 9. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Regeneraciones masivas tras introducir firma | Hacer rollout gradual: primero loggear diferencias, luego activar reset | 
| Aumento de latencia en creación | Mantener generación async; UI solo muestra placeholder corto periodo | 
| Limpieza difiere y acumula huérfanos temporales | Job cron de cleanup ya existente + delay configurable | 
| Eventos perdidos en navegación rápida | Firma y reset en DB asegura reintento independiente del evento | 

---
## 10. Métricas para Validar Éxito

Antes / Después (7 días ventana):
- % productos con main image y thumbnails coherentes (firma coincide) > 99.5%.
- Número medio de eventos `productImagesReady` por producto durante creación: bajar de X (medir baseline) a X/2.
- Incidencias de 404 al cargar `thumbnail_url` (monitor con fetch HEAD) → reducción > 90%.
- Tiempo medio hasta `thumbnails_ready` < 2.5s p95.

---
## 11. Decisiones Aclaradas

- WEBP principal se sigue ignorando: se documenta estado `thumbnails_skipped_webp` y no se transcodifica.
- No se fuerza conversión para uniformidad porque decisión de negocio/perf es mantener JPG generados solo para formatos soportados directos.
- No se cambia aún la política de TTL de React Query; se evitará cache poisoning con firma + versioning posterior.

---
## 12. Próximo Paso (Pendiente de Confirmación)

Esperando confirmación para iniciar implementación en orden: B → A → C. Una vez aprobada, se crearán parches incrementales y commits separados: 
1. `feat(thumbnails): phased events + instrumentation` 
2. `feat(thumbnails): stale detection + reset logic` 
3. `fix(thumbnails): ensureIntegrity repair bug`.

---
## 13. Apéndice: Glossario Rápido

| Término | Significado |
|---------|-------------|
| Main Image | Imagen con `image_order=0` |
| Stale Thumbnails | Variantes cuyo basename no coincide con el de la main actual |
| Early Dispatch | Evento emitido antes de tener miniaturas generadas |
| Idempotencia Fuerte | Regeneración basada en firma/versión en lugar de simple existencia |

---
Fin del análisis.

9. Próximo paso sugerido
Confírmame si avanzamos primero con: A) Instrumentación + detección de “stale thumbnails” (solo logs y resets sin cambios estructurales). B) Ajuste de flujo de eventos (separar dispatch inicial de ready). C) Corrección del bug ensureIntegrity.

Responde con A, B, C o un orden (ej: “B luego A luego C”) y procedo aplicando parches incrementales.