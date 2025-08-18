## Análisis Profundo Flujo BuyerOrders / Payment Orders / Duplicados

### 1. Resumen Ejecutivo
Problema reportado: Al iniciar un pago (Khipu) aparece una "Orden de Pago" (payment order) con estado "Procesando Pago" que muestra correctamente: (Precio x Unidad) + Envío y metadata (mini thumbnail, document_type, etc). Cuando el pago pasa a `payment_status = paid` y se materializa un pedido clásico (tabla `carts`), aparecen DOS tarjetas:
1. La original (Orden de Pago) todavía visible.
2. Un nuevo "Pedido" (orden clásica) donde:
	- Falta el costo de envío (solo muestra Precio * Unidades)
	- Se pierden mini-thumbnails / imagen
	- Se pierde `document_type` y quizá otros metadatos.

Objetivo deseado: Debe existir **una sola tarjeta continua**, que evolucione en sus chips de estado: comienza con "Procesando Pago" y luego cambia a "Pago Confirmado" (u otro nombre), manteniendo todos los datos (imágenes, document_type, shipping, etc) sin pérdida / duplicación.

### 2. Flujo Actual (End-to-End)
Secuencia al iniciar pago:
1. Frontend (PaymentMethod) crea previamente un registro en `orders` (no revisado aquí pero inferido) y luego llama a función Edge `create-payment-khipu` pasando `order_id`, `cart_items`, etc.
2. `create-payment-khipu` (Supabase Function) actualiza la fila existente en `orders`: setea `payment_status = 'pending'`, guarda items (campos limitados), total/subtotal/shipping, khipu ids, etc.
3. Frontend muestra la tarjeta "Orden de Pago" porque `useBuyerOrders` mezcla:
	- `getPaymentOrdersForBuyer` (tabla `orders`, is_payment_order = true)
	- `getOrdersForBuyer` (tabla `carts`, legacy)
4. Khipu envía webhook -> función `process-khipu-webhook`:
	- Actualiza `orders.payment_status = paid` y `status = paid`.
	- Materializa un pedido clásico: reutiliza carrito `active` convirtiéndolo a `pending` o crea uno nuevo en `carts` y sincroniza `cart_items` con los items de la orden de pago.
	- Actualiza posteriormente la fila de `orders` con `cart_id` (link determinístico) SOLO si `cart_id` era NULL.
5. Frontend recibe cambios SOLO vía:
	- Suscripción realtime a tabla `orders` (cambios de `payment_status` / `status`).
	- Polling liviano que solo refresca `payment_status` y lo mezcla en estado local.
6. NO se vuelve a ejecutar el pipeline de deduplicación completo tras el cambio de estado, por lo tanto la lógica que podría ocultar la orden de pago ya materializada **no se aplica**.

### 3. Estructura de Datos y Diferencias
| Aspecto | Payment Order (`orders`) | Pedido Clásico (`carts`) |
|---------|--------------------------|--------------------------|
| Campo ID front | `order_id = orders.id` | `order_id = cart.cart_id` |
| `is_payment_order` | true | false (no se setea) |
| Items | Array reducida: product_id, quantity, price_at_addition, supplier_id, document_type | Incluye join de `products` con imágenes / supplier info |
| Total mostrado | `row.total` (incluye shipping) | Suma lineal de items (NO shipping) |
| `document_type` | Persistido en items de `orders` | NO seleccionado en query buyer (`document_type` faltante en `cart_items` select) |
| Imágenes | No hay enriquecimiento (se quedan en null) | Sí (join a product_images) |

### 4. Código Clave Revisado
1. `useBuyerOrders.js` – función `fetchOrders` (deduplicación):
```js
const isLikelyMaterialized = (payOrd) => {
  if (payOrd.payment_status !== 'paid') return false;
  if (payOrd.cart_id && classicOrders.some(c => c.cart_id === payOrd.cart_id)) return true;
  if (payOrd.cart_id) return false; // espera aparición del clásico
  // heurística overlap >= 60% dentro ventana 45 min
};
```
2. Filtrado final de payment orders:
```js
filter(po => {
  if (po.payment_status === 'pending') return true;
  if (po.payment_status === 'expired') return false;
  return !isLikelyMaterialized(po);
});
```
3. Actualizaciones posteriores (suscripción / polling) SOLO cambian `payment_status` dentro de `orders` state, **sin re-ejecutar `fetchOrders()`** ni replicar la lógica de dedupe.
4. `orderService.getOrdersForBuyer` (buyer) – SELECT de `cart_items` NO incluye `document_type` → pérdida.
5. `orderService.getPaymentOrdersForBuyer` no hace join a `products` ni enriquece con imágenes.
6. `process-khipu-webhook` puede reutilizar un carrito `active` con `created_at` muy anterior, excediendo ventana de 45 minutos y rompiendo heurística de overlap temporal si `cart_id` no se enlaza aún.

### 5. Causas Raíz Identificadas
1. Dedupe no reactiva: Al cambiar `payment_status` a `paid` la lógica de deduplicación NO se vuelve a correr (ni se refrescan pedidos clásicos), dejando la payment order visible permanentemente.
2. Enlace tardío / no observado: El campo `cart_id` se asigna en `orders` después de materializar; si el frontend ya recibió `paid` antes de que se haga el update del `cart_id`, no existe trigger extra para volver a deduplicar.
3. Heurística temporal frágil: Reutilizar un carrito creado tiempo atrás puede romper condición de ±45 min provocando `isLikelyMaterialized = false` aun cuando ya existe el pedido clásico.
4. Pérdida de `document_type`: Falta en el SELECT de `cart_items` en `getOrdersForBuyer` (buyer).
5. Falta de mini thumbnails: `getPaymentOrdersForBuyer` no enriquece items con datos de `products.product_images`.
6. Inconsistencia de total vs shipping: Legacy (`carts`) no conserva shipping; payment order sí. Resultado: salto visual en total. (Shipping tampoco se vuelve a guardar como campo separado en el pedido clásico para buyer.)
7. Estado UI separado: "Procesando Pago" se renderiza como banner aparte y no como chip dentro del mismo set de chips que luego muestran "Pago Confirmado" → complica la transición suave.

### 6. Síntomas Derivados
| Síntoma | Causa Raíz | Evidencia |
|---------|-----------|----------|
| Duplicidad de tarjetas | (1)(2)(3) | Payment order + pedido clásico coexistiendo |
| Falta shipping en pedido clásico | (6) | total_amount = suma líneas |
| Pérdida de thumbnail | (5) | Campos image_url/thumbnail_url null en payment order |
| Pérdida de document_type | (4) | SELECT sin document_type |
| Transición UX discontinua | (7) | Banner vs chips separados |

### 7. Riesgos Ocultos / Edge Cases
1. Expiración local de payment order (`expired_locally`) tras TTL 20 min podría ocultar registro aunque backend siga pendiente → posible desincronización si hay latencia.
2. Race conditions entre webhook y polling: si polling actualiza `payment_status` antes de que `cart_id` se linkee, dedupe falla.
3. Multipago paralelo: Si usuario inicia dos pagos simultáneamente, heurística de overlap (≥60% items) puede marcar materialización incorrecta.
4. Cambios parciales de inventario / stock durante materialización podrían alterar totales y romper heurística (precio o conjunto de items modificado vs snapshot inicial en orders.items).

### 8. Estrategia de Solución (Alta Prioridad → Baja)
1. Re-dedupe reactivo: Cuando un payment order cambia de `payment_status` (suscripción o polling) a `paid`, disparar:
	- `fetchOrders()` completo O
	- Aplicar inline dedupe: si order.payment_status pasó a `paid`, y trae `cart_id` (o heurística exitosa) filtrar del estado.
2. Enriquecimiento de payment orders:
	- Al leer `orders`, recolectar `product_id`s y hacer batch a `products` (similar a supplier path) para injectar imágenes y metadatos.
3. Seleccionar `document_type` en `getOrdersForBuyer` (buyer) para no perderlo.
4. Shipping consistente:
	- Persistir shipping desglosado en `carts` al materializar (añadir columnas o una tabla `order_totals`), o
	- Calcular shipping replicando lógica (si existe definible) y sumarlo a `total_amount` mostrado; marcar campo `original_total` con shipping para payment orders y usarlo tras materialización.
5. Unificar componente de chips:
	- Añadir un primer chip `procesando_pago` activo mientras `payment_status === 'pending'`.
	- Al pasar a `paid`, muta a `pago_confirmado` (mismo array de chips) en lugar de banner separado.
6. Eliminar heurística temporal (45 min) cuando se use `cart_id` determinístico; mantenerla solo como fallback con ventana ampliada (ej. 6h) para reducir falsos negativos.
7. Idempotencia / sincronía:
	- Tras webhook éxito, forzar update de `orders.updated_at` después de setear `cart_id` para asegurar evento realtime que front-end reciba.
8. Telemetría / logs (temporal):
	- Guardar en localStorage (modo DEBUG) las transiciones order_id → payment_status → cart_id para reproducir.

### 9. Propuesta Técnica Concisa (No Implementada Aún)
Pseudo-cambios mínimos:
```js
// useBuyerOrders: en callback realtime/polling después de mutar statuses:
setOrders(prev => {
  const updated = applyStatusUpdate(prev, statusMap);
  return recomputeDedupe(updated); // reutiliza misma lógica filtrado que fetchOrders
});

function recomputeDedupe(list) {
  // Reaplicar lógica de merge y filtrado (extraer en función pura reutilizable)
}
```
Agregar selección de `document_type` en `getOrdersForBuyer` buyer.
Enriquecimiento `getPaymentOrdersForBuyer`:
```js
// Después de parsear items -> recolectar product_ids -> fetch products(product_images...)
// mapear y setear product.thumbnail_url, thumbnails
```
Chip unificado: Introducir `payment_status` en `getStatusChips` y mapear:
`pending(payment)` → chip Procesando Pago; `paid` → Pago Confirmado; luego accepted, in_transit, delivered.

### 10. Validación / Test Plan
Casos a validar manual + unit tests (ideal):
1. Pago normal (carrito creado < 45 min): aparece 1 tarjeta que cambia de Procesando → Pago Confirmado (sin duplicar) y conserva imagen/document_type.
2. Carrito viejo (>45 min): sigue sin duplicar (gracias a cart_id determinístico). Si cart_id se enlaza tarde, se oculta tras evento realtime.
3. Multi pago simultáneo: Cada orden mantiene su propia transición sin false dedupe.
4. Expiración TTL local: Payment order supera 20 min sin webhook → mostrar estado Expirado (no desaparición silenciosa) y opción de reintentar.
5. Shipping: total mostrado consistente antes y después de materialización.

### 11. Métricas / Instrumentación Recomendada (temporal)
Registrar (en consola condicionada por flag DEBUG):
`[buyerOrders] onChange order_id=<id> status=<status> payment_status=<payment_status> cart_id=<cart_id>`
`[buyerOrders] afterRecompute visiblePaymentOrders=<n>`

### 12. Riesgos de Refactor
| Riesgo | Mitigación |
|--------|-----------|
| Cambios en SELECT añaden payload más grande | Limitar columnas estrictas en enrichment | 
| Recompute dedupe en cada evento -> costo O(N) | N normalmente pequeño; throttle si > X | 
| Falsos positivos heurística overlap | Usar cart_id determinístico primero | 
| Inconsistencia shipping legacy | Introducir migración / fallback calculado | 

### 13. Prioridades Inmediatas (Orden)
1. Extraer dedupe a función pura y reutilizar tras eventos realtime/polling (soluciona duplicados).
2. Añadir `document_type` al SELECT buyer.
3. Enriquecer payment orders con imágenes (batch products).
4. Unificar chips (Procesando ↔ Pago Confirmado) eliminando banner aparte.
5. Estrategia shipping (definir campo persistente o cálculo consistente).
6. Ajustar heurística (ventana + fallback) y asegurar `updated_at` bump tras set cart_id.

### 14. Checklist de Hallazgos → Acciones
- [x] Dedupe no reactivo → Recompute tras cambios.
- [x] Falta `document_type` en buyer legacy SELECT → Añadir.
- [x] Falta enriquecimiento imágenes en payment orders → Batch fetch.
- [x] Inconsistencia shipping → Definir un modelo unificado.
- [x] Chips disjuntos → Integrar payment_status a pipeline de chips.
- [x] Heurística temporal frágil → Priorizar cart_id y ampliar ventana.
- [x] Riesgo de estado desincronizado con TTL local → Mostrar Expirado explícito.

### 15. Conclusión
El problema central NO es únicamente la creación de una segunda tarjeta sino la falta de re-ejecución del algoritmo de deduplicación ante transiciones de estado y la asimetría en los modelos de datos (selección de columnas e imágenes). Aplicando los pasos priorizados se logrará una única representación continua del pedido, preservando metadatos y evitando divergencias visuales de total y estados.

---
Documento generado para guiar refactor; no se han aplicado cambios de código aún.

## Addendum de Validación Profunda (2da Pasada)

Se revisaron archivos adicionales para confirmar / ajustar hipótesis:

### A. Creación inicial de la fila en `orders`
- Confirmado en `checkoutService.createOrder`: se inserta una fila en `orders` con `items` (array completo) ANTES de llamar a Khipu.
- Luego `checkoutService.processKhipuPayment` re-llama a `khipuService.createPaymentOrder` que a su vez invoca la función edge `create-payment-khipu` pasando el `order_id` existente. Esa función ACTUALIZA (no crea) la fila agregando `khipu_payment_*` y normaliza items (puede sobrescribir `items` con versión reducida si perdió campos). Esto refuerza riesgo de pérdida de metadatos si la normalización ahí descarta atributos adicionales de producto (p.e. thumbnails si venían inline).

Conclusión: Para conservar fidelidad, la UI debería enriquecer siempre a partir de joins a `products`, no confiar en snapshot en `orders.items` para imágenes.

### B. Shipping y Totales
- En la creación inicial se guarda `shipping` y `total` en `orders` (incluye shipping + IVA + serviceFee según cálculo fuera del hook). `total_amount` no existe explícito para buyer; se usa `total`.
- Al materializar en `carts`, el shipping NO se replica (no hay lugar). Resultado inevitable: divergencia visual si se muestra `total_amount` basado solo en líneas. Necesario: persistir shipping en otra tabla o una columna nueva en `carts` (migración) o recalcular shipping dinámico para la vista de pedido (pero debe ser determinístico y coincidente con el momento de pago). Recalcular a posteriori podría dar valor distinto si precios/reglas de envío cambian → preferible persistencia.

### C. Estado de Checkout Persistido (Zustand `useCheckout`)
- Persistencia local (storage key `sellsi-checkout`). Si el usuario refresca en medio de un pago puede reentrar con datos. No impacta duplicación directa, pero podría recrear flujo si el usuario vuelve a PaymentMethod y dispara otra orden antes que la primera se materialice. Caso multi-pago simultáneo soportado pero incrementa riesgo de heurística overlap incorrecta.

### D. ¿Qué pasa si webhook llega tardíamente?
- Mientras tanto, polling sigue marcando `pending`. TTL (20 min) en hook cliente fuerza `expired_locally`. Si luego llega webhook, la orden estaría oculta (si expiraciones la filtran) → Requiere manejo: si `payment_status` cambia a `paid` sobre una orden marcada `expired_locally`, se debe revalidar y no ocultar abruptamente.

### E. Materialización y Orden de Eventos
Secuencia potencial real:
1. Webhook setea `status='paid', payment_status='paid'`.
2. Materializa / crea-cart, sincroniza items.
3. Actualiza `orders.cart_id` (solo si era null) – puede ocurrir *después* de (1).
4. Realtime front recibe evento (1) y actualiza solo estado local → no dedupe.
5. Evento (3) puede que no dispare UI si no se escuchan columnas adicionales (se escucha a * en tabla, sí debería llegar). Aun así lógica no se reinvoca.

### F. Revisión de `getPaymentOrdersForBuyer`
- No trae `shipping` ni `total` separados en objeto retornado (usa `row.total`). Buena; pero si se desea mostrar desglose posterior se necesitará preserve `shipping` (columna existe). Sugerencia: añadir `shipping` y `tax` al objeto normalizado.

### G. Pérdida de `document_type` en legacy buyer
- Confirmado: en `getOrdersForBuyer` (buyer) SELECT de `cart_items` no incluye `document_type`, sin embargo más abajo en map se accede a `item.document_type` → inevitablemente `undefined` (solo fallback `'ninguno'`). Debe agregarse columna.

### H. Minimización de Cambios para Fase 1
Orden exacto recomendado de intervención (revalidado):
1. Extraer función pura `mergeAndDedupe(paymentOrders, classicOrders)` usada en `fetchOrders` y reutilizar en handlers realtime / polling tras actualizar statuses.
2. Incluir `document_type` en SELECT buyer y propagar.
3. Enrich de payment orders con batch a `products` para thumbnails (reutilizar patrones de supplier).
4. Chips integrados (`payment_status` -> chips) eliminando banner.
5. Migración (si aprobada) para agregar `shipping_total` a `carts`; mientras tanto usar fallback: si order tiene `is_payment_order=false` y existe una payment order hermana (link via cart_id o heurística) tomar su shipping para la card fusionada.
6. Ajustar TTL UX: mostrar "Reintentá el pago" + botón si expira, en vez de desaparecer.

### I. Validación de que Análisis Inicial Sigue Vigente
Todos los hallazgos originales se mantienen; solo se adicionó el posible overwrite de `orders.items` durante `create-payment-khipu` como fuente adicional de pérdida de detalle, y el orden de actualización `cart_id` que impacta la heurística.

### J. Métricas Adicionales Recomendadas
- Contador de reintentos de dedupe.
- Tiempo entre `paid` y disponibilidad de `cart_id` (para detectar retrasos backend).

### K. Posibles Falsos Positivos en Overlap >= 60%
- Si dos órdenes distintas con muchos productos similares se pagan cercanas en tiempo, la heurística puede ocultar la orden incorrecta. Con `cart_id` determinístico esto se reduce; considerar almacenar un hash de items al crear la orden y compararlo exactamente tras materialización.

### L. Confirmación de No-Modificación
Este addendum solo amplía documentación; no se han introducido cambios en componentes / hooks.

---
Addendum completado.
