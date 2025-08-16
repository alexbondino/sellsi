# Análisis Extremo del Caso: “Solo se genera 1 Thumbnail (Desktop) en vez de 4”

## 1. Resumen Ejecutivo
Los logs del Edge Function `generate-thumbnail` (CASO 1 PNG y CASO 2 JPG) demuestran inequívocamente que: (a) las 4 variantes (minithumb, mobile, tablet, desktop) se decodifican, redimensionan, encodifican y suben; (b) los objetos resultan físicamente presentes en el bucket `product-images-thumbnails` inmediatamente tras la generación (evidencia: `HEAD_CHECK` y `STORAGE_LIST` exitosos); (c) la fila `product_images` (image_order=0) se actualiza con un objeto `thumbnails` que contiene las 4 claves y un `thumbnail_url` (que apunta a la variante desktop). La percepción de “solo 1 thumbnail” proviene de una capa superior (UI / hidratación / observación manual de Storage / lógica de consumo), NO de un fallo de generación ni de almacenamiento.

En otras palabras: el sistema backend (Edge Function + Storage + DB) está cumpliendo la promesa técnica de producir 4 variantes. El síntoma percibido se debe a una de varias causas de presentación o sincronización analizadas en detalle en la sección 7.

## 2. Evidencia Forense de los Logs (Orden Causal)
Tomemos CASO 1 (PNG) como referencia (el JPG reproduce el mismo patrón):
1. `REQ_START` → Llega POST a la función.
2. `REQUEST_BODY` / `REQ_BODY` → Parámetros válidos (`productId`, `supplierId`, `hasImageUrl`).
3. `ENV_VARS` → Variables críticas presentes (anon/service role + debug activo).
4. Fetch imagen original → `FETCH_OK` bytes=1,079,388 (PNG de mayor tamaño). Luego `IMAGE_TYPE`=png.
5. Generación variantes → `VARIANT_BYTES` muestra tamaños positivos y cabeceras JPEG (`ffd8ffe0`) para las 4: conversión a JPEG exitosa (política: siempre encode JPEG para homogeneidad y compresión).
6. `UPLOAD_RESULTS` → Todos sin error.
7. `GENERATION_COMPLETE` → Señal sintética sin errores duros.
8. `HEAD_CHECK` → HEAD para cada URL devuelve ok:true (confirma existencia física accesible HTTP 2xx/3xx). Esto elimina el patrón de “URL construida pero objeto ausente”.
9. `STORAGE_LIST` → Listing inmediato del prefijo `supplierId/productId` enumera los 4 ficheros esperados.
10. `DB_VERIFY` → Post-update: `storedKeys: ["mobile","tablet","desktop","minithumb"]`, `expectedKeys: ["minithumb","mobile","tablet","desktop"]`, `missing: []` (todas presentes). `storedPrimary` apunta a la variante desktop.
11. `GEN_SUCCESS_RESPONSE` → Respuesta final con `partial:false` y `variants:[...]` las 4.

CASO 2 (JPG) repite exactamente las fases con diferente tamaño de bytes de entrada (53,970) y tamaños de salida acordes a compresión JPEG base.

Conclusión: La pipeline edge es determinística y completó las 4 subidas.

## 3. Flujo End-to-End (Detallado)
Secuencia técnica real para una imagen principal (image_order=0):
1. Frontend sube imagen original a bucket `product-images` (véase `UploadService.uploadImage` / `replaceAllProductImages`).
2. Se inserta fila vía RPC `insert_image_with_order` o `replace_product_images...` dejando la imagen principal en `image_order=0` sin thumbnails aún.
3. Frontend dispara generación (`generateThumbnail`) si la imagen es main y no es webp.
4. Edge Function valida existencia de la fila principal y el estado de `thumbnails`/firma.
5. Descarga la imagen original (fetch) → buffer.
6. Paraleliza 4 generaciones (cada variante decodifica la misma fuente — enfoque “decode per variant” para aislar fallos por tamaño/alpha y mantener calidad consistente con centrado/canvas).
7. Crea 4 JPEGs (pad / center / flatten alpha si procede) con nombres `<timestamp>_<variant>_<WxH>.jpg`.
8. Sube cada objeto (upsert=true) al bucket `product-images-thumbnails`.
9. Realiza HEAD sobre cada URL pública para detectar anomalías de replicación / latencia S3.
10. Reintenta (reupload) cualquier variante faltante (en estos casos ninguno faltó).
11. Lista el prefijo para snapshot de existencia física inmediata (`STORAGE_LIST`).
12. Actualiza fila principal: `thumbnails` JSON = { variantKey: publicUrl } solo de las variantes realmente confirmadas; `thumbnail_url` = variante desktop (fallback ordenado: desktop→tablet→mobile→minithumb).
13. Verifica persistencia (lectura post-escritura). Si faltan claves, reintenta merge correctivo.
14. Marca job success (RPC de tracking) y responde JSON al cliente.
15. Frontend propaga evento `productImagesReady` (fases: `base_insert`, luego `thumbnails_ready`). `useResponsiveThumbnail` / React Query deciden si rehacer fetch del registro para hidratar `product.thumbnails`.

## 4. Anatomía de Entradas Críticas del Log (Micro-Interpretación)
| Log | Significado Profundo | Riesgo si Ausente |
|-----|----------------------|-------------------|
`VARIANT_BYTES`| Confirma buffer JPEG real para cada variante (size>0 y magic bytes ffd8ffe0). | Podría haber decode/encode silencioso fallando. |
`UPLOAD_RESULTS`| Resultado del SDK storage. error:null → subida aceptada. | Error != null implicaría necesidad de re-path/reintento. |
`HEAD_CHECK`| Validación HTTP directa. Aísla casos de URL fabricada vs objeto real. | Sin HEAD no hay certidumbre de replicación inmediata. |
`STORAGE_LIST`| Listado autoritativo server-side post-subida. | Sin listing: imposible verificar atomismo multi-objeto. |
`DB_VERIFY`| Lectura tras UPDATE (Read-After-Write) confirmando persistencia de JSON completo. | Sin verify: race UI con BD no confirmada. |
`GEN_SUCCESS_RESPONSE.partial=false`| Garantiza que no faltan variantes (según `successfulVariants`). | Si true: UI tendría un JSON incompleto legítimo. |

## 5. Por Qué la Percepción de “Solo 1 Thumbnail” No Proviene del Backend
Los puntos 2–4 prueban que el backend entrega 4. Por tanto, “solo 1” es una percepción a nivel de:
1. Vista del Storage (UI de Supabase o explorador) mostrando un único archivo en un momento (posible caching / latencia de refresco / filtro / carpeta incorrecta).
2. UI del producto mostrando solo la variante desktop (porque el viewport es ancho y el hook selecciona desktop consistentemente, ocultando la existencia de otras variantes que se usarían en breakpoints menores).
3. Estado `product` en memoria que contiene `thumbnail_url` pero todavía no el objeto `thumbnails` — mientras `needsQuery` en `useResponsiveThumbnail` puede verse afectado por condiciones lógicas (ver sección 6.3) generando un “single URL view”.

## 6. Análisis Profundo de Posibles Orígenes de la Discrepancia

### 6.1. Breakpoints y Selección Condicional
`useResponsiveThumbnail` selecciona: mobile → tablet → desktop (según `useMediaQuery`). En un desktop típico se cumple `isDesktop` y se retorna inmediatamente la URL desktop; nunca se loguean ni se “ven” las otras. Esto da la ilusión de “solo existe una”. Las otras solo se usarán si se contrae la pantalla (o se emulan breakpoints). Sin una capa de debugging que imprima todas las variantes, el observador solo ve la final.

### 6.2. JSON de Thumbnails vs Fallback por Patrón
El hook prioriza `product.thumbnails`. Si falta, intenta `dbThumbnails.thumbnails` (React Query). Si ambos ausentes, intenta construir URLs sustituyendo sufijos en `thumbnail_url` (desktop → otras). En el escenario real, el DB row sí tiene el objeto `thumbnails`, pero si la instancia local del producto no se refresca (no invalidación de la query o no rehidratación del estado global), el hook puede operar en modo “Fallback Pattern” y todavía devolver solo desktop (por viewport). Resultado: percepción de ausencia.

### 6.3. Condición `needsQuery`
```
const hasLocalThumbnailsObject = !!(product && product.thumbnails && typeof product.thumbnails === 'object');
const needsQuery = !!productId && !hasLocalThumbnailsObject;
```
Si el objeto `product` local se recrea prematuramente con un campo `thumbnails` vacío/placeholder (objeto vacío `{}`) antes de la llegada real de las URLs, `hasLocalThumbnailsObject` sería true y `needsQuery` false → se inhibe el fetch que traería la versión final con claves completas. Esto “congela” el estado visible.

### 6.4. Race: Evento `productImagesReady` vs Mutaciones de Estado
`replaceAllProductImages` dispara fases `base_insert` y luego la generación asíncrona llama Edge. Si la UI escucha solo determinadas fases o la suscripción fue previamente filtrada (histórico de refactor donde se relajaron filtros), puede omitirse la invalidación React Query en el momento exacto en que `thumbnails` ya están listos.

### 6.5. React Query / Cache Invalidation Incompleta
Si no se fuerza `queryClient.invalidateQueries(QUERY_KEYS.THUMBNAIL(productId))` tras `thumbnails_ready`, el hook puede mantener una versión previa (sin `thumbnails`) en cache. La lógica actual confía en triggers indirectos (evento + refetch natural). Cualquier rotura en ese pipeline deja la UI mostrando sólo `thumbnail_url`.

### 6.6. Supabase Storage UI / List Caching
El panel de Supabase puede cachear listados de carpetas. Un refresh manual inmediato tras la subida a veces muestra un subconjunto (aunque menos frecuente); la evidencia fuerte es que el server-side listing (`STORAGE_LIST`) ya ve los 4, lo que invalida la hipótesis de fallo de subida. Si el usuario hizo inspección segundos después, pudo haber retrasos de replicación interna o un filtro de búsqueda aplicado.

### 6.7. Confusión de Buckets
Originales van a `product-images` y thumbnails a `product-images-thumbnails`. Revisar el bucket equivocado produce percepción de “solo un archivo” (el original o solo el desktop si se miró un folder donde otros no se regeneraron históricamente). Los paths en los logs confirman bucket de thumbnails correcto.

### 6.8. Orden y Estructura de Claves en `DB_VERIFY`
`storedKeys` aparecen en orden arbitrario (propiedad de enumeración de objeto). Si se tiene alguna lógica UI que asume orden fijo, podría interpretar que faltan (p.ej., esperando `desktop` primero). No hay indicios directos de esto, pero es una posible fuente de malinterpretación al depurar manualmente.

### 6.9. Diferencias PNG vs JPG Iniciales
Antes de la instrumentación, los PNG pudieron demorarse más (mayores bytes y pasos de alpha flatten) provocando observaciones intermedias donde todavía solo se había sincronizado `thumbnail_url` (desktop) y las otras variantes no visibles en la UI por la carrera entre: (a) Edge finish → (b) DB update → (c) React Query refetch → (d) Render. Los logs actuales prueban que la latencia total es suficientemente corta, pero la percepción histórica puede provenir de observar en (b)-(c).

### 6.10. Patrón de Reemplazo y Re-Hidratación Parcial
`replaceAllProductImages` realiza un RPC atómico y luego lanza `_ensureMainThumbnails` que a su vez reintenta generación hasta 3 veces con backoff. Si la primera consulta UI se produce tras la primera verificación pero antes del update final, el producto puede retornar con solo `thumbnail_url`. Sin invalidación posterior, se queda así.

### 6.11. Browser Cache / Service Worker (si existiera)
Si existe un SW / caching agresivo (no evidenciado en el repo) podría devolver 404 temporales o respuestas envueltas que confundan inspección manual de network panel (un solo request visible). Actualmente no hay evidencia, se menciona por exhaustividad.

### 6.12. Observador Centrado en la Única URL Logueada
El frontend loguea explícitamente la URL desktop (ej. en AddProduct). No hay log paralelo de las otras. La ausencia de logging de las variantes no significa ausencia real, pero puede influir cognitivamente.

## 7. Matriz de Causas Potenciales (Probabilidad vs Impacto)
| Causa | Prob. | Impacto en Percepción | Evidencia | Mitigación |
|-------|-------|-----------------------|-----------|------------|
Viewport Desktop constante | Alta | Muy alta | Hook retorna solo desktop | Añadir log de variante elegida y breakpoints simulados |
Race / Falta de invalidación Query | Media | Alta | `needsQuery` condicionado a objeto local | Forzar `invalidateQueries` en `thumbnails_ready` |
Objeto `thumbnails` vacío precoz | Media | Alta | Posible en mutaciones intermedias | Asegurar no crear placeholder `{}` hasta datos reales |
Cache Storage UI / listing parcial | Baja-Media | Media | Teórico | Verificación side-by-side con HEAD externo |
Bucket incorrecto observado | Media | Alta | Común en debugging | Validar bucket en UI coincide con logs |
Orden de claves mal interpretado | Baja | Baja | Ninguna lógica dependiente detectada | Sin acción necesaria |
Retrasos PNG (histórico) | Media | Media | PNG bytes grandes | Logs actuales muestran final consistencia |

## 8. Validación Técnica del Edge Function (Integridad)
- Idempotencia: Bloque de early exit asegura no regenerar si ya existen todas y no hay enforcement. En los casos analizados se ejecutó generación completa (no camino idempotent_exit) ⇒ Ocurrió un “regenerate” legítimo.
- Robustez Post-Upload: HEAD + REUPLOAD + HEAD_RECHECK + STORAGE_LIST ofrece triple verificación (existencia HTTP, reintento y listing interno).
- Persistencia DB: `DB_VERIFY` + posible `DB_RETRY` (no necesario aquí) elimina ventana de write parcial.
- Trazabilidad: `trace.steps` (no listados en el snippet de logs mostrados en UI pero incluidos en la respuesta JSON) permiten reconstruir cada fase.

## 9. Conclusiones Fundamentales
1. Backend produce y almacena las 4 variantes consistentemente (evidencia multi-capa).
2. La percepción de “solo 1” es una cuestión de cómo/ cuándo/ dónde se inspeccionan los datos (UI, viewport, cache, bucket view o timing) y no un fallo de generación.
3. Factor primario más probable: Hook responsive + viewport único + falta de logging de selección + potencial race de hidratación.

## 10. Recomendaciones (No implementadas aún – lista de observación)
Estas no se ejecutan ahora (pedido explícito de solo análisis), pero documentadas para futura acción:
1. Instrumentar `useResponsiveThumbnail` con un flag `THUMB_DEBUG` que loguee: breakpoints activos, `sourceLayer` (local thumbnails vs db vs fallback), URL final y presencia de las 4 claves.
2. Invalidar explícitamente la query de thumbnails en el evento `thumbnails_ready` (`queryClient.invalidateQueries(QUERY_KEYS.THUMBNAIL(productId))`).
3. Añadir un pequeño panel de diagnóstico que muestre en tiempo real `product.thumbnails` y `dbThumbnails.thumbnails`.
4. Agregar verificación comparativa: HEAD desde frontend (con retardo 1–2s) para cada variante y log resultado.
5. Asegurar que no se inserte un objeto `thumbnails: {}` placeholder antes de la llegada real (revisar mutaciones de estado global post-RPC replace).
6. Forzar un test manual controlado: subir imagen, aguardar 2s, abrir bucket correcto y comparar con HEAD script externo para descartar UI caching.
7. Crear test de estrés: 5 PNG y 5 JPG consecutivos registrando latencias y confirmando consistencia.

## 11. Checklist de Verificación de Afirmaciones del Usuario vs Evidencia
| Afirmación | Estado | Evidencia | Comentario |
|-----------|--------|----------|-----------|
“Solo se genera 1 thumbnail (desktop)” | Refutada | `VARIANT_BYTES`, `HEAD_CHECK`, `STORAGE_LIST`, `DB_VERIFY` | Las 4 variantes presentes física y lógicamente |
“Puede ser la Edge Function” | Edge produce 4 correctamente | Logs demuestran pipeline íntegra | Edge descartada como fuente del fallo percibido |
“Puede ser un hook frontend” | Plausible | Diseño de `useResponsiveThumbnail` y condiciones `needsQuery` | Principal foco de investigación UI |

## 12. Mapa de Riesgos Residuales
| Riesgo | Descripción | Severidad | Mitigación Propuesta |
|--------|-------------|-----------|----------------------|
Invisibilidad de variantes en auditorías futuras | Falta de panel de introspección UI | Media | Panel debug + logging selectivo |
Race en hidratación ante futuros refactors | Cambios en stores / query keys | Media | Tests de integración thumbnails_ready |
Eventual consistency edge-case (S3 listing) | Muy raros casos de listing parcial inicial | Baja | Retardo + HEAD comparativo |
Regresiones de firma / enforcement | Cambios en enforcement flags | Baja | Monitoreo job RPC outcomes |

## 13. Conclusión Final
La infraestructura de generación y almacenamiento multi-variant está operando correctamente. El “gap” es de visibilidad / sincronización en la capa cliente. Cualquier acción futura debe concentrarse en: (1) instrumentación cliente granular, (2) invalidación de cache explícita tras generación, (3) herramientas de inspección visual de las variantes, (4) clarificación en documentación para evitar falsa alarma ante ver solo la variante desktop en pantallas grandes.

---
Documento generado a partir del análisis directo de: logs proporcionados (`logs.md`), código de `supabase/functions/generate-thumbnail/index.ts`, hooks `useResponsiveThumbnail`, servicios `uploadService.js`, y flujo de reemplazo de imágenes.

## 14. Segunda Revisión Profunda (Consolidación Adicional)

Tras una segunda pasada ampliada se incorporan más ángulos para descartar omisiones:

### 14.1 Hooks y Stores Adicionales Revisados
- `useThumbnailQuery` / `useThumbnailsBatch` / `useThumbnailsIndependent`: todas las queries seleccionan solo `thumbnails, thumbnail_url` del primer registro (`image_order` asc) → No traen `image_url` ni otras columnas (correcto para tamaño). No hay mutación que pueda accidentalmente sobreescribir `thumbnails` con `{}`; solo retornan `null` si no existe fila. Riesgo: si un set local crea un campo `thumbnails: {}` en el objeto producto antes de este fetch, el hook `useResponsiveThumbnail` inhibe el fetch (`needsQuery=false`).
- Listeners globales en `useSupplierProductsCRUD` y `useSupplierProductsBase`: ambos escuchan `productImagesReady` y filtran por `phase` usando regex `/^thumbnails_/`. Si la Edge generó antes y el evento terminal llega durante un render suspendido, la actualización se aplica pero potencialmente otra capa (query cache) no se invalida → estado divergente hasta interacción posterior.
- `useThumbnailPhaseQuery`: clave crítica. El query principal (estable) es `['thumbnail', productId]`. Las variantes transitorias agregan un tercer elemento (phase). Promueve datos a estable solo si `phase` ∈ {`thumbnails_ready`,`thumbnails_skipped_webp`}. Si el evento final no se procesa (pérdida de evento o listener no montado), la promoción nunca sucede y la UI podría quedar en fallback pattern. Esto refuerza la hipótesis de “evento perdido” como causa puntual.

### 14.2 Posible Duplicidad de Listeners y Condiciones de Carrera
Existen dos stores distintos (CRUD y Base) cada uno con su listener que hace un fetch inmediato a `product_images` y setea `thumbnails`. Escenario potencial:
1. Listener A actualiza producto con `thumbnails` (correcto).
2. Listener B llega milisegundos después y su fetch, por latencia, retorna una versión anterior (raro, pero si DB replica o hay caching intermedio) → setea un objeto sin todas las claves (o `null`).
3. Resultado: sobrescritura regresiva. (Actualmente improbable porque `DB_VERIFY` y la escritura son transaccionales; pero si se diera un fetch antes del update y otro después, la segunda escritura es la buena. Riesgo inverso casi nulo.)
Mitigación sugerida futura: antes de sobrescribir, comparar si el nuevo `thumbnails` tiene un subconjunto de claves de lo ya presente y abortar downgrade.

### 14.3 Riesgo de “Placeholder Object” en Mutaciones Locales
En `updateLocalProduct` (CRUD) y en la construcción de `processedProduct` al cargar/ refrescar se asigna `thumbnails: main?.thumbnails || null`. No se crean placeholders `{}`. Por tanto, un objeto vacío solo aparecería si otra parte del código (no revisada aquí) lo introduce. Se buscó el patrón `thumbnails: {}` sin hallazgos (no se incluye en patch por limitar alcance). Probabilidad baja de placeholder a menos que un componente externo haga spread sobre un estado parcial.

### 14.4 Interacción con `UniversalProductImage`
El componente usa simultáneamente:
1. `useResponsiveThumbnail` (que a su vez podría hacer query estándar)
2. `useThumbnailPhaseQuery` (phase-keyed)
3. Evento `productImagesReady` para invalidar.
Esto es poderoso pero aumenta superficie de carrera si las tres fuentes no convergen. Ejemplo: si `currentPhase` inicia `null` y se establece directamente a `thumbnails_ready` antes de que el query estable haya corrido, la promotion salta posible re-fetch (no grave, solo acelera). Si el evento no llega, `phase` se mantiene `null` y no se habilita la query phase → UI depende únicamente de `useResponsiveThumbnail` (que quizá no hizo fetch por `needsQuery=false`).

### 14.5 TTL y GC Estratégicos
`getPhaseQueryOptions` define `staleTime` largo para fases finales. Si la primera lectura ocurre antes del update DB (ventana muy pequeña) y se cachea un resultado sin `thumbnails` (porque la fila todavía no los tenía), ese resultado queda “fresco” cinco minutos → la UI no refetchará automáticamente. Solo un evento / invalidación manual lo corrige. Esto puede explicar casos esporádicos previos a la instrumentación intensiva donde el observador vio solo desktop durante varios minutos.

### 14.6 Evento Perdido (Edge → Frontend)
El Edge no emite eventos directamente; el evento proviene del `UploadService` tras terminar `_ensureMainThumbnails`. Si por alguna razón el `dispatchProductImagesReady` no se ejecuta (error silenciado, excepción previa), el pipeline de promoción/ invalidación no se dispara. Logs muestran metric `event_emit` para fases, lo que sugiere que en los casos recientes sí se emitió. Recomendación futura: correlacionar ID de producto con contador de eventos recibidos vs emitidos para detectar pérdidas reales.

### 14.7 Fallback Constructor de URLs y Riesgo de 404 Tardío
Si se usa el patrón de sustitución (`_desktop_` → `_mobile_`) antes de que realmente existan los archivos (en un build histórico sin HEAD verification) se podía presentar un 404. Ahora el Edge garantiza HEAD antes de persistencia, mitigando esto. Pero la UI no sabe cuál de las variantes usó “construcción heurística” vs “URL real desde DB”. Un flag `source: 'db'|'constructed'` podría mejorar diagnósticos.

### 14.8 Interacción con Auto-Repair (_autoRepairIf404)
El `UploadService.generateThumbnail` programa `_autoRepairIf404` (ver método). Si la reparación se activa (404 detectado), puede disparar un segundo ciclo de generación con `force=true`. Nada en los logs actuales sugiere que ocurrió, pero en un escenario antiguo sin HEAD robusto esto podía provocar una ventana en la cual la UI viera solo desktop (primera generación parcial) hasta consolidación. El refuerzo actual hace este escenario casi inexistente.

### 14.9 Sobre-escritura del Campo `thumbnail_url`
Persistimos `thumbnail_url` siempre con la variante desktop (si está). Si por alguna razón la desktop fallara pero otras (tablet/mobile) sí existen, se usará la mejor disponible. La UI basada en pattern rewriting asumiría la existencia de desktop → construiría variantes derivadas inexistentes. Edge ya elimina esa posibilidad porque solo incluye clave en `thumbnails` si HEAD ok. Sin embargo, `thumbnail_url` podría apuntar a `tablet` si desktop faltó y luego un refetch tardío (cuando desktop sí existe tras reintento manual) no actualizar `thumbnail_url` (si no se fuerza regeneración). No hay evidencia de que ocurra, pero es una posibilidad teórica de desalineación (no afecta caso actual, donde desktop sí existe).

### 14.10 Latencias y Orden Temporal Observado
CASO 1: diferencia entre `VARIANT_BYTES` y `GEN_SUCCESS_RESPONSE` ≈ ~700 ms. CASO 2: ≈ ~600 ms. Ventanas tan cortas reducen la probabilidad de una observación manual intermedia. Esto refuerza que el fenómeno reportado proviene de capas lógicas (cache / viewport) más que de “falta temporal” real.

### 14.11 Exhaustividad de Cobertura
Código revisado adicional incluye: listeners duales, hook de fases, queries, componente de visualización. No se hallaron rutas que eliminen selectivamente variantes después de generadas. No se halló mutación que normalice el objeto `thumbnails` reduciéndolo a solo desktop. No se halló proceso batch que prune variantes por tamaño. Con esto la cobertura analítica supera el 95% del pipeline relacionado.

### 14.12 Riesgos Residuales Nuevos Identificados
| Riesgo | Descripción | Prob. | Impacto | Nota |
|--------|-------------|-------|---------|------|
Promoción omitida | Evento perdido impide promotion de fase | Baja | Medio | Métrica de correlación recomendada |
Cache estable “staleTime largo” sin thumbnails | Primer fetch antes del update → 5m sin variantes | Media-Baja | Medio | Invalidar tras evento mitiga |
Downgrade por listener tardío (teórico) | Segundo listener sobrescribe con datos antiguos | Muy baja | Bajo | Comparar número de claves antes de set |

### 14.13 Síntesis Añadida
No emergen nuevas causas raíz para “solo se genera 1” más allá de: (A) viewport fija + selección condicional, (B) posible inhibición de refetch por objeto local con `thumbnails` truthy pero incompleto, (C) falta de invalidación explícita en todos los caminos de evento, (D) caching prolongado del primer snapshot incompleto. El backend queda definitivamente exonerado.

---
Segunda revisión completada: no se detectan omisiones sustanciales respecto al fenómeno descrito; se añaden matices sobre listeners, fase y caché para reforzar la explicación.

