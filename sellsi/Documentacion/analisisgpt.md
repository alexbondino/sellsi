## Análisis Profundo BuyerCart / PaymentMethod / Edge Functions Khipu / BuyerOrders / Orders / Notificaciones

### Resumen Ejecutivo de Problemas Reportados
1. Precios con price tiers llegan como 0 (fallback) a BuyerOrders.
2. Chip "Procesando Pago" nunca se pinta / no evoluciona a "Pago Confirmado" – payment_status ignorado.
3. Notificaciones no se muestran.
4. Fecha estimada (estimated arrival / estimated_delivery_date) no aparece en BuyerOrders tras despachar en TableRows.jsx.

Cada problema se descompone abajo: causa raíz probable, confirmaciones de código y plan de corrección incremental (quick wins + refactor estructural si necesario).

---
### 1. Price Tiers y price_at_addition = 0 en BuyerOrders
**Síntoma:** En el hook `useBuyerOrders` (legacy carts + payment orders) se loggea warn cuando `price_at_addition === 0`.

**Flujos de datos relevantes:**
- Carrito agrega items via `prepareCartItem` => fija `price_at_addition = product.price_at_addition || basePrice` y garantiza un `price_tiers` array (fallback de un solo tier).
- Al crear la orden de pago (edge function `create-payment-khipu`), se genera payload `itemsPayload` con campos: `price`, `price_at_addition: ci.price_at_addition || price`.
- Guardado en tabla `orders.items` (JSON). Posterior lectura: `GetBuyerPaymentOrders` → `parseOrderItems` → normaliza por item: toma `rawPriceAddition = it.price_at_addition ?? it.price`; si es number válido lo usa; si string intenta parsear; si falla marca `pricing_warning` y deja en 0.
- Legacy (carts) mapeo: `GetBuyerOrders` → si `price_at_addition` no es number válido, fallback a `item.products.price`.

**Posibles Causas:**
1. Almacenamiento de `price_at_addition` como string no parseable o nulo en `orders.items` (edge function usa `ci.price || ci.price_at_addition || 0`; si `ci.price` es undefined y `ci.price_at_addition` es undefined → 0). Falta de cálculo dinámico por tier en el momento de crear la orden: el precio real por cantidad (tier aplicado) quizá no se propaga a `ci.price`/`ci.price_at_addition`.
2. El cálculo de precio por tier ocurre sólo en front (hook de cálculo) y no se inyecta de vuelta al objeto de item que se manda a la edge function (es decir, se usa el precio base sin aplicar tier; si ese base viene vacío → 0).
3. Transformación adicional en base de datos (triggers inexistentes, pero potencial casting) no aplica aquí: más probable que el origen ya es cero.
4. En payment orders, code path de normalización: si llega string con símbolos (ej: `$ 12.345`) el parser limpia; si el formato trae coma miles y punto decimales mezclados podría fallar.

**Confirmaciones en código:**
- `prepareCartItem` garantiza `price_at_addition` > 0 sólo si el producto original trae `precio` / `price` válido. Si producto sin price (0) y tiers se esperan para definir precio real, ese precios tier NUNCA se copia a `price_at_addition`.
- Ningún paso antes de la edge function convierte el precio calculado (tier) en un campo persistente por item.

**Conclusión Técnica:** La responsabilidad de aplicar el tier se pierde entre la capa de cálculo (front) y la serialización al backend. El backend persiste 0 porque nunca recibe el precio aplicado. Falta una función de `finalUnitPrice` consolidada que sea usada como fuente de verdad para `price_at_addition` (y repetida en ambos dominios legacy y payment order).

**Plan de Corrección:**
Short-term (Hotfix):
1. Antes de llamar a `create-payment-khipu`, mapear `cart_items` in-flight calculando `effective_price = calculatePriceForQuantity(quantity, price_tiers, basePrice)` y setear tanto `price` como `price_at_addition` a `effective_price`.
2. Añadir validación en edge function: si `price_at_addition` recibido es 0 y `price_tiers` existe, recalcular server-side (duplicar pequeña función tier) como fallback.

Mid-term:
3. Centralizar util de determinación de precio por cantidad (mismo algoritmo de front) en módulo compartido (o replicar en edge functions con misma lógica) para consistencia.
4. Migrar DB para guardar explícitamente: `unit_price_original`, `unit_price_tier_applied`, `tier_band_used`.

Long-term:
5. Eliminar fallback silencioso a 0: si no se puede determinar precio, registrar error y bloquear creación de order.

**Profundización Adicional (NUEVO):**
- El cálculo de tiers correcto ya existe en front (`calculatePriceForQuantity`) y se vuelve a usar parcialmente en `PaymentMethodSelector` dentro de `getItemPrice`. Sin embargo la orden se guarda con `subtotal`, `tax`, `total` pre-calculados, pero los ITEMS guardados mantienen los campos originales (sin forzar `price_at_addition = effectiveTierPrice`). Luego el edge function vuelve a insertar / actualizar items con fallback `price: ci.price || ci.price_at_addition || 0` (ver `khipuService` payload). Si el item en `orderData.items` no trae `price` directamente y solo confía en que el UI cálculo es transitorio, la persistencia queda a 0.
- Riesgo de desalineación IVA: El UI recalcula IVA usando `totalBruto` rederivado de tiers, pero en createOrder se pasa `subtotal` y `tax` originales (pueden diferir si la lógica del store difiere del recalculo en PaymentMethodSelector). Invariante faltante: server debería recalcular y validar.
- Se detecta ausencia de un campo estructurado `unit_price_effective`. Recomendable introducirlo para analytics y auditoría.
- Para órdenes legacy (carts materializados), los `cart_items.price_at_addition` dependerán de la lógica de materialización en webhook: allí se recorre `normItems` y se inserta `price_at_addition: it.price_at_addition`. Si se materializa después de haber reparado el valor en `orders.items`, se sincroniza; si no, se perpetúa 0.

**Test Recomendados (unit):**
1. Dado producto con tiers [{min:1,price:1000},{min:10,price:900}], quantity=12 → price_at_addition persistido = 900.
2. Items sin price ni price_at_addition pero con tiers → rechazo (error) al crear order.
3. String con formato chileno `"1.234"` → parse correcto a 1234.
4. Formato incorrecto `"$1.234,56"` → se normaliza a 1234.56 o se rechaza según política.

---

Riesgos: Cambios deben ser idempotentes y no romper ordenes previas; implementar sólo en nuevas ordenes.

---
### 2. Chip "Procesando Pago" nunca activo / actualización a "Pago Confirmado"
**Observaciones de Código:**
- `BuyerOrders.jsx` determina chips vía `getStatusChips(productStatus, order.payment_status)`.
- La variable `activeKey` depende de `status` (accepted, in_transit, delivered) y si no se cumple, cae a pago (`payment_status` paid || pending).
- PERO: el set `statusChips(productStatus, order.payment_status)` es llamado dentro del map de `items` con `productStatus` derivado de `order.status`. Si `order.status` comienza en `'pending'` y `payment_status` es `'pending'`, `activeKey` se vuelve `'pago'` y debería pintar el chip naranja (warning). Si no se pinta: probable `payment_status` llega undefined (falta en resultado combined legacy + payment) o hay colisión entre legacy carts y payment orders.
- En `GetBuyerPaymentOrders` se setea siempre `payment_status: row.payment_status || 'pending'`. Para legacy `GetBuyerOrders` NO se añade `payment_status`; merge en `useBuyerOrders` combina arrays y el UI render trata ambos igual. Legacy orders (carts) carecen de `payment_status`; al iterar, pasa undefined → en `getStatusChips` la condición `paymentStatus === 'paid' || paymentStatus === 'pending'` evalúa false (porque undefined), entonces `activeKey` queda null y chip de pago aparece inactivo.

**Causa Principal:** Mezcla de estructuras: legacy orders sin campo `payment_status` conviven con payment orders. UI asume que siempre existe `payment_status`. Resultado: primer chip nunca se activa para legacy y confunde percepción de estado (parece "no se pinta"). Para payment orders reales, la actualización realtime existe, pero si la vista está mostrando legacy (cart materializado) en vez de la fila de payment order, se sigue viendo inactivo.

**También:** Edge function `process-khipu-webhook` actualiza tabla `orders` a paid, pero después materializa hacia `carts` (legacy). La vista podría mostrar el cart (legacy) en lugar de la row de `orders` si el filtrado / merge lo ordena por fecha y uno relega al otro.

**Plan de Corrección:**
1. En `GetBuyerOrders` agregar `payment_status: cart.status === 'pending' ? 'pending' : (cart.status === 'cancelled' ? 'cancelled' : 'paid')` como heurística transitoria o mejor: `null` explícito y UI trate `null` como ocultar chip (menos confusión).
2. En UI: si `order.is_payment_order` es false y no hay `payment_status`, pero existe `payment_order_id`, buscar la correspondencia en `orders` array y tomar su estado de pago.
3. Cambiar highlight logic: chip pago activo si `order.payment_status in ('pending','paid')`; si undefined pero `order.is_payment_order` false -> mostrar chip gris con label "No Aplica" o no renderizar.
4. Validar realtime: asegurar que la vista está mostrando la fila `is_payment_order` y no sólo la materialización legacy (quizá filtrar duplicates: si payment order + cart comparten items, no mostrar ambos).

**Profundización Adicional (NUEVO):**
- `useBuyerOrders.mergeAndSort` concatena arrays sin deduplicar: un mismo flujo genera (a) payment order row (orders) y (b) cart materializado (carts) con mismo conjunto de items; el usuario ve solo uno (según orden de fecha) y puede ser que el cart quede arriba si la materialización sucede después, pero el cart no tiene `payment_status` → sensación de no actualización.
- Real-time subscription solo a tabla `orders`. Si el UI termina mostrando la versión cart (sin subscription) no verá cambios de pago.
- `recentlyPaid` highlight set depende de transición `payment_status` a `paid` dentro del array actual. Si el elemento visible no es el payment order (o no se actualizó su campo), highlight nunca se dispara.
- Inconsistencia transitoria: En webhook se setea `payment_status='paid'` y luego se materializa en legacy. Si la materialización actualiza `updated_at` posterior a la update de pago, al recombinar por `created_at` la versión sin payment_status puede reorder. (Se ordena por created_at, no updated_at; still, created_at es igual, se mantiene orden original. Visibilidad depende de fusión.)

**Acción Extra:** Deduplicar por `payment_order_id` y `cart_id`: si `order.is_payment_order` true y existe `someCart` con `cart.cart_id === order.cart_id` o `cart.payment_order_id === order.order_id`, descartar la representación legacy en la lista BuyerOrders.

---

---
### 3. Notificaciones no se muestran
**Ruta de Datos:** Edge / backend genera notificaciones vía RPC `create_notification` (ver `NotificationService`). En UI, `NotificationsProvider` llama `useNotifications(userId)`: 
- Carga inicial: `notificationService.fetchInitial()` sin filtro de user_id (FALTA eq user_id en query). Esto es crítico: se traen TODAS las notificaciones (o ninguna si RLS limita). Si RLS restringe a row-level en `notifications` a `auth.uid() = user_id`, llamada sin `eq` igual devuelve sólo las del usuario. Por ende no es la causa inmediata si RLS funciona.
- Realtime: canal `notifications_${userId}` escucha INSERT en tabla `notifications` filtrando user_id => correcto.

**Posibles causas de "no se muestran":**
1. `NotificationsProvider` depende de `useAuth()`; si sesión no presente (ej: user_id en localStorage distinto a `session.user.id`) el provider no inicializa userId → no hace bootstrap ni realtime.
2. UI que las consume podría no estar envuelta en `NotificationsProvider`.
3. RLS / policies en Supabase impiden SELECT (no se incluyó a rol actual). Sin error en front porque se descarta error silenciosamente.
4. El RPC `create_notification` falla silenciosamente (catches vacíos) – ergo no se insertan filas.
5. Falta de llamada a `notificationService.fetchInitial()` en un momento posterior tras login (efecto `useEffect` se saltó por userId nulo en primer render y no reintenta cuando se setea).

**Confirmaciones:** Código de `useNotifications` sí depende de `userId` en dependencia del effect; cuando `session` cambia debería disparar. Necesario verificar que `useAuth` realmente expone `session` a tiempo (no incluido en análisis).

**Plan de Diagnóstico y Fix:**
1. Instrumentar logs: tras bootstrap, contar notificaciones y exponer en UI debug (temporal). 
2. Verificar en consola Supabase que filas se insertan (SELECT count). Si no, revisar RPC y permisos.
3. Añadir `eq('user_id', userId)` explícito en queries para claridad y prevenir fugas.
4. Propagar errores: donde se hace `catch {}` reemplazar con logging condicional DEBUG.
5. Asegurar que BuyerOrders llama `markContext('buyer_orders')` sólo después de provider listo (actualmente try/catch dinámico podría fallar sin aviso). Añadir fallback: si `markContext` no existe, no intentar.

**Profundización Adicional (NUEVO):**
- `NotificationsProvider` crea contexto usando `useAuth`; si `needsOnboarding` es true se invoca RPC `create_welcome_notification`. Si RLS impide esa inserción (por falta de service role) no genera error visible (catch vacío) y el usuario ve la bandeja vacía sin punto de referencia de que la feature funciona.
- `notificationService.fetchInitial()` no filtra por user_id pero rely en RLS: si en algún momento se desactiva RLS o se aflojan policies, riesgo de fuga multi-tenant (exposición). Security issue latente.
- `bulkMarkContext` marca como leídas sin actualizar inmediatamente backend (sí hace markRead RPC después) pero sin transaccionalidad; si hay fallo en RPC se pierde consistencia (UI cree que están leídas). Proponer cola de reintentos.
- Falta canal realtime para UPDATE (solo INSERT). Si un backend marca notificación como leída (ej. proceso batch), el front no se sincroniza (menor prioridad).

**Observabilidad:** Añadir métrica: número de notificaciones insertadas por order vs notificaciones leídas / minuto; log en consola DEBUG para mismatch > 0.2.

---

---
### 4. Fecha estimada no aparece en BuyerOrders tras despacho
**Observación:**
- `BuyerOrders.jsx` sólo muestra `Fecha estimada de entrega` para `order.status === 'in_transit' && order.estimated_delivery_date`.
- Legacy mapping (`GetBuyerOrders`) NO incluye `estimated_delivery_date` (campo no existe en carts schema). Payment orders mapping (`GetBuyerPaymentOrders`) no selecciona columna `estimated_delivery_date` en `OrdersRepository.listByBuyer` → esa columna no se recupera; por tanto siempre null en UI.
- Supplier acción de despacho (en TableRows o acciones) probablemente actualiza status en `carts` o `orders` pero no setea `estimated_delivery_date`.

**Causas:**
1. Falta seleccionar columna en query de orders: `OrdersRepository.listByBuyer` no incluye `estimated_delivery_date`.
2. Falta lógica backend para calcular y persistir fecha estimada en despacho (p.ej. shipping region + delivery_days de product_delivery_regions). TableRows sólo ejecuta acción; el comando `UpdateOrderStatus` (no mostrado en análisis) debería aceptar `estimated_delivery_date` y persistir.
3. UI condiciona display estrictamente a status `in_transit`. Si se quiere mostrar antes (accepted) se necesita ajuste.

**Plan de Corrección:**
1. Añadir campo `estimated_delivery_date` al select de `OrdersRepository.listByBuyer` y al mapping en `GetBuyerPaymentOrders`.
2. Modificar acción 'dispatch' para calcular estimated (máx delivery_days de items) y enviar en `additionalData`.
3. En UI, fallback: si `order.status === 'accepted'` y existe estimated, mostrar "Fecha estimada de entrega (prevista)".
4. Para legacy carts: decidir si se sincroniza estimated via materialización (añadir columna en carts o reutilizar shipping metadata). O mejor: migrar UI a solo payment orders y esconder legacy duplicada.

**Profundización Adicional (NUEVO):**
- `UpdateOrderStatus` permite setear `estimated_delivery_date` SOLO si la transición es a `in_transit` y viene en `additionalData`. Si la UI de supplier (acciones en TableRows) no envía este campo, jamás se persistirá. Debe agregarse en acción 'dispatch'.
- Fórmula recomendada: `estimated_delivery_date = NOW() + max(delivery_days)` de los productos en la orden (usando `product_delivery_regions` filtrado por región de envío). Si ninguno tiene delivery_days, se puede fallback a `NOW() + INTERVAL '3 days'`.
- Cuando `split` se activó (SPLIT_MODE dual/split) cada supplier cart debería tener su propia estimación potencialmente distinta; actual persistencia se hace a nivel `orders` (global). Si se requiere granular, agregar `estimated_delivery_date` por cart (columna nueva) y mostrar en supplier panel.

---

---
### Interacciones Entre Dominios (Arquitectura y Debt)
1. Doble modelo Orders vs Carts introduce duplicación de estado (payment_status sólo en orders). Materialización en webhook complica coherencia.
2. La UI mezcla ambos sin reconciliación: se necesitan reglas de deduplicación (mostrar preferentemente payment order y ocultar cart materializado para el mismo order_id/cart_id).
3. Pricing: cálculo final sólo en front; persistencia carece de invariantes server-side.
4. Notificaciones: silencian errores, dificultan debugging.

**Recomendación Estratégica:** Plan de migración a un único modelo (orders) con roles buyer/supplier y vista derivada; carts solo como estado temporal (status=active). Quitar materialización de paid→carts o marcar carts origin=payment_order y excluir en list buyer orders.

**Profundización Adicional (NUEVO):**
- Materialización dual en webhook aumenta latencia y complejidad: cada pago genera writes múltiples: update orders, (opcional) update carts active→pending, insert/delete cart_items, potencial splits y ventas. Esto eleva riesgo de condiciones de carrera y costos transaccionales.
- El control de idempotencia se basa en checks simples (e.g. `.neq('payment_status','paid')` y `split_status`). Falta hashing de items para detectar duplicados parciales.
- Falta correlación de logs (no se genera `request_id` correlacionado en todas las funciones). Introducir `requestId` en metrics wrapper.

---

---
### Quick Win Checklist (Prioridad Alta)
- [ ] Edge function `create-payment-khipu`: recalcular precio por tier si llega 0.
- [ ] Front antes de llamar a edge: inyectar unit_price calculado.
- [ ] `OrdersRepository.listByBuyer`: añadir `estimated_delivery_date`.
- [ ] `GetBuyerPaymentOrders`: mapear `estimated_delivery_date`.
- [ ] `BuyerOrders.jsx`: si no hay `payment_status` pero hay `payment_order_id`, buscar matching order y usar su estado.
- [ ] Añadir `eq('user_id', userId)` en fetch notifications.
- [ ] Log de errores condicional DEBUG en notification flows.
- [ ] Añadir heurística para evitar mostrar duplicado cart + payment order (filtrar por `payment_order_id`).
- [ ] Acciones supplier (dispatch) enviar `estimated_delivery_date` calculada.
- [ ] Edge function: si materializa legacy, copiar `estimated_delivery_date` cuando exista.

---

---
### Cambios de Código Recomendados (Resumen)
1. OrdersRepository: include `estimated_delivery_date`.
2. BuyerPaymentOrders mapping: pass field.
3. BuyerOrders UI: robust chip logic; null-safe payment_status.
4. Pre-checkout pipeline: compute effective price tiers -> embed into item payload.
5. Edge: fallback recompute if 0.
6. NotificationService: optional logging.
7. useNotifications service queries: add explicit `eq('user_id', userId)`.
8. UpdateOrderStatus caller (UI supplier) debe pasar `estimated_delivery_date` en dispatch.
9. Deduplicación en `useBuyerOrders`: filtrar legacy carts cuya `cart_id` exista como `cart_id` de payment order with `is_payment_order`.
10. Introducir `unit_price_effective` (persistido) y `tier_band` (opcional) en `orders.items`.

---

---
### Métricas de Validación Posterior
| Área | Métrica | Objetivo |
|------|---------|----------|
| Pricing | % items con price_at_addition=0 en nuevas órdenes | 0% |
| Pago | Latencia confirmación pago (webhook→UI) | < 5s (realtime) |
| Notificaciones | Diferencia count DB vs UI inicial | 0 |
| Estimated Delivery | % órdenes in_transit con fecha mostrada | ~100% |
| Duplicados | Ratio (carts mostrados con payment_order_id)/(payment_orders) | 0 |
| Logging Errores Pricing | incidencias pricing/100 órdenes | < 1 |

---

---
### Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|-----------|
| Duplicación de órdenes (cart + payment order) | Filtro en merge y futura eliminación de legacy view |
| Cálculo tier inconsistente (front vs edge) | Centralizar helper compartido y tests |
| Errores silenciosos RPC notificaciones | Añadir logging DEBUG y path de fallback |
| Realtime fallbacks no disparados | Reducir POLL_INTERVAL_MS dinámicamente si pending > 0 |

---
### Próximos Pasos (Orden sugerido)
1. Añadir campos faltantes y mapping (estimated_delivery_date).
2. Hotfix pricing in-flight & edge fallback.
3. Ajustar BuyerOrders merge (dedupe + payment chip fallback).
4. Notificaciones: query filtrada + instrumentation.
5. Despliegue incremental y monitoreo logs para 24h.
6. Refactor migración a modelo único (épica separada).
7. Pruebas automáticas e2e (cypress o playwright) para: flujo pago Khipu hasta confirmación chip, visualización estimated_delivery_date y aparición de notificaciones.

---

---
### Notas Finales
El origen principal de la mayoría de los problemas es la coexistencia de dos modelos (legacy carts y nueva tabla orders) combinada con falta de invariantes server-side (pricing) y campos no seleccionados (estimated_delivery_date). Atacar coherencia del modelo reducirá incidencias colaterales.

Se sugiere crear tests unitarios (node + jest) para: (a) cálculo de price tiers, (b) mapeo GetBuyerPaymentOrders con datos mixtos, (c) lógica de chips en BuyerOrders dado set de combinaciones (status, payment_status), (d) parseo estimated_delivery_date.

Fin del análisis.

---
## Addendum Final (Revisión Completa Edge Functions Khipu & Riesgos Avanzados)

### Edge Functions Relevantes Revisadas
1. `create-payment-khipu` (principal actual) – actualiza orden existente y rellena campos Khipu; preserva `payment_status=paid` si ya estaba.
2. `process-khipu-webhook` – valida firma HMAC, marca `payment_status=paid`, materializa a `carts` (legacy / split) y afecta inventario + ventas.
3. `verify-khipu-payment` – verificación on-demand (polling manual) sin persistencia directa (no actualiza `orders`).
4. `create-khipu-payment` – implementación genérica antigua (no integra con tabla `orders` directamente); no usada en flujo actual (posible deuda / redundancia).
5. `khipu-webhook-handler` – deprecada (solo logging, no muta estado) conservada para compatibilidad.

### Mapa de Flujo Pago (Estado Actual)
Front (PaymentMethodSelector) ⇒ `checkoutService.createOrder` ⇒ row `orders` (pending/pending). Luego
Front ⇒ `khipuService.createPaymentOrder` ⇒ edge `create-payment-khipu`: PUT (update) order + retorna URL ⇒ Usuario paga ⇒ Khipu envía webhook ⇒ `process-khipu-webhook` actualiza `payment_status=paid` y materializa.

### Puntos Críticos Detectados (Edge Layer)
| Punto | Descripción | Impacto | Severidad | Acción Recomendada |
|-------|-------------|---------|-----------|--------------------|
| Duplicidad create vs process | `create-khipu-payment` residual con firma diferente | Confusión / uso accidental | Medio | Retirar o renombrar claramente `legacy-create-khipu-payment` + feature flag |
| Materialización Legacy | Reinsertar items en carts tras pago | Estado duplicado / inconsistencias | Alta | Plan de retiro progresivo (flag SPLIT_MODE) |
| Falta recalculo server price tiers | Edge no valida que los unit prices correspondan a tiers | Riesgo precios 0 / fraude | Alta | Implementar verificación + abort si mismatch > tolerancia |
| Idempotencia parcial | `process-khipu-webhook` usa `.neq('payment_status','paid')` pero operaciones posteriores (inventario, ventas) pueden correr múltiples veces | Doble decremento inventario (si cambia payload o reintentos) | Alta | Guardar `webhook_event_id` y breve tabla processed_events para short-circuit |
| Seguridad firma | Solo `process-khipu-webhook` valida HMAC; `create-payment-khipu` no usa autenticación de cliente (confía en apikey pública de Supabase Functions) | Posible abuso para spam requests (limitado) | Medio | API key rota / rate limiting; considerar token interno firmado (JWT) entre front y edge |
| Falta atomicidad split | Creación de multiple carts + inserts sin transacción | Estados parciales | Medio | En PostgREST imposible multi-step en única tx, pero se puede usar RPC PL/pgSQL para agrupar |
| Logging no correlado | Sin `request_id` consistente en create + webhook | Dificulta trazabilidad | Medio | Generar UUID upstream y propagar en headers/metrics |
| verify-khipu-payment sin persistencia | Poll manual no actualiza DB; front podría creer pagado pero DB no | Estado divergente | Bajo | Añadir path opcional update si status=done & DB pending |
| Sanitización items | En create-payment-khipu se aceptan items sin validar contra catálogo | Inyección de precios | Alta | Validar en edge consultando products table (precio, supplier) antes de persistir |

### Validaciones Faltantes (Detalle Técnico)
1. Cohesión de Montos: No se compara `sum(item.price_at_addition * qty) + shipping` vs `total` al momento del update edge. Debe abortar si diferencia > X CLP.
2. Inventario Idempotente: Actualmente re-ejecutar webhook podría descontar inventario varias veces; se intenta mitigar con upsert en `product_sales` pero no evita decremento repetido en `products.productqty`.
3. Concurrencia Split: Si se procesan dos webhooks simultáneos (reintentos), se puede crear carts duplicados para suppliers distintos si no existían inicialmente (control parcial por set existingSet). Necesario un lock lógico (`orders` update + check row version) o unique constraint (`carts(payment_order_id, supplier_id)` + manejo de conflicto). 
4. price_tiers Ausentes: Persistidos tal cual; si en futuro se editan tiers, auditoría de histórico depende de snapshot intacto. Recomendado firmar (hash) items para integridad.

### Refactor Propuesto (Capas y Orden)
Fase 0 (Seguridad & Integridad Rápida):
- Añadir validación de totales y bloqueo inventario idempotente (tabla `order_locks` o marca `inventory_processed_at`).
- Unique constraint: `carts(payment_order_id, supplier_id)` (solo ruta split/dual) para evitar duplicados.

Fase 1 (Modelo Unificado):
- Flag `SPLIT_MODE=off` y exponer para ensayo A/B; desactivar materialización legacy para subset usuarios.
- UI BuyerOrders: filtrar carts con `payment_order_id NOT NULL` (si orders visible) → oculta duplicados.
	Nota preservación split por proveedor: Necesitamos mantener UN solo pago (mismo `payment_id` y `order_id` padre) pero mostrar PEDIDOS distintos por proveedor. Antes de filtrar los carts legacy crea un "split virtual" en BuyerOrders: agrupa `order.items` por `supplier_id` y renderiza cada grupo como un sub-pedido con un id lógico `${order_id}-${supplier_id}` (visible al usuario como Pedido #<corto>-<supplier>), mostrando subtotal parcial, shipping proporcional (si aplica) y heredando `payment_status` del padre. Más adelante, al refactorizar, sustituir este id lógico por filas reales en una tabla `order_parts` (o `supplier_orders`) con columnas propias (`id` per-supplier, `parent_order_id`, `supplier_id`, `status`, `estimated_delivery_date`). Así garantizamos: (a) un solo flujo de pago y conciliación, (b) tracking y cancelaciones parciales por proveedor, sin depender de carts legacy.

Fase 2 (Server Pricing Authority):
- RPC `finalize_order_pricing(order_id)` que recalcula y sella precios (marca `pricing_verified_at`).
- Edge `create-payment-khipu` llama a RPC antes de llamar a Khipu (evita enviar montos divergentes).

Fase 3 (Event Sourcing Light):
- Tabla `order_events` (order_id, type, payload, created_at, request_id) para compilar timeline y facilitar debugging.

### Métricas de Observabilidad Sugeridas
| Métrica | Fuente | Objetivo |
|---------|--------|----------|
| webhook_pay_latency_ms | create vs process timestamps | p95 < 4000ms |
| pricing_mismatch_count | edge check | 0 |
| duplicate_cart_attempts | unique violation logs | 0 |
| inventory_double_decrement_detected | diff expected vs actual stock snapshot | 0 |
| notifications_delivery_rate | inserted vs realtime delivered | > 95% |

### Riesgos si No se Aplica Refactor
- Inconsistencias de inventario acumuladas (hard to audit after weeks).
- Dificultad forense ante disputa de pago (sin hash items + eventos).
- Escalamiento de deuda técnica al agregar nuevos métodos de pago (cada uno replicaría materialización).

### Resumen Final Acción Inmediata (Top 5)
1. Dedupe BuyerOrders (prefer payment order row). 
2. Ajustar pipeline precios (front inyecta, edge valida, DB sella).
3. Añadir `estimated_delivery_date` end-to-end y set en dispatch.
4. Fix notificaciones (query filtrada + logging).
5. Inventario idempotente (marcar processed). 

---
Fin del addendum final.

---
## Checklist de Implementación Integral
Formato: [ ] Pendiente / [Completado] cuando se ejecute. Se agrupa por fases y dominios.

### A. Documentación / Preparación
- [Completado] Añadir nota de preservación de split por proveedor (split virtual) en análisis.
- [Completado] Generar análisis profundo y addendum de riesgos.
- [ ] Publicar este checklist al equipo y acordar orden de ejecución.

### B. Quick Wins (Producción de valor inmediato)
1. Pricing inmediato
	- [x] Front: antes de `create-payment-khipu` inyectar `effective_price` (tier) en `price` y `price_at_addition`.
	- [x] Edge `create-payment-khipu`: si `price_at_addition==0` y hay `price_tiers`, recalcular server-side.
2. Estimated Delivery
	- [x] `OrdersRepository.listByBuyer`: incluir `estimated_delivery_date`.
	- [x] `GetBuyerPaymentOrders`: mapear el campo.
	- [x] Acción supplier (dispatch): proveedor selecciona y envía `estimated_delivery_date` (flujo manual, se descarta cálculo automático).
	- [x] UI BuyerOrders: mostrar fecha también en estado `accepted` (como prevista) opcional.
3. BuyerOrders / Pago
	- [x] Heurística o fallback para `payment_status` en legacy (o esconder chip) mientras existan.
	- [x] Dedupe: filtrar carts con `payment_order_id` cuando exista la fila payment order.
4. Notificaciones
	- [x] Query inicial: añadir `eq('user_id', userId)`.
	- [x] Logging de errores (no `catch {}` vacío).

### C. Modelo Unificado & Split Virtual (Fase 1)
- [x] Activar lógica split virtual agrupando por `supplier_id` en `useBuyerOrders`.
- [x] Implementar split virtual en BuyerOrders (group by `supplier_id`).
- [x] Clave sintética `${order_id}-${supplier_id}` y subtotales parciales.
- [x] Ocultar carts legacy duplicados (ya se filtraban; reforzado en split virtual).
- [x] Flag `VITE_SPLIT_MODE` introducida (`virtual` por defecto, usar `off` para desactivar en build).
- [ ] (Opcional) Métrica ratio duplicados post-split (objetivo 0).

### D. Migración a supplier_orders (order_parts) (Fase 1.5)
\- (Actualización) Código legacy de carts (repositorio y queries GetBuyerOrders / GetSupplierOrders / GetSupplierOrderStats / SearchSupplierOrders) eliminado físicamente tras validar paridad funcional de supplier_orders (parts). Fallbacks en `orderService` reemplazados por retornos seguros vacíos cuando la flag de parts está desactivada, consolidando el modelo único.
- [x] Crear tablas `supplier_orders` y `supplier_order_items` (schema propuesto).
- [x] UNIQUE `(parent_order_id, supplier_id)` (incluida en migración inicial).
- [x] Script migración retroactiva desde orders.items (backfill inicial) (`20250820172000_backfill_supplier_orders.sql`).
- [x] Webhook: crear supplier_orders en lugar de carts bajo nuevo flag `SUPPLIER_PARTS_ENABLED` (implementado en `process-khipu-webhook`).
 - [x] BuyerOrders: si existen parts, renderizar parts; sino fallback split virtual.
 - [x] Supplier UI: migrar a supplier_orders (service ahora consume parts bajo flag `VITE_SUPPLIER_PARTS_ENABLED`).
- [x] Deshabilitar creación de carts en ruta pago (flag final) (omitida creación de nuevo cart activo cuando `SUPPLIER_PARTS_ENABLED`).
 - [x] Eliminar consultas a carts en BuyerOrders (cuando `VITE_SUPPLIER_PARTS_ENABLED` activo se retorna []).
 - [x] (Nuevo) Eliminar físicamente repositorio y queries legacy (CartsRepository, GetBuyerOrders, GetSupplierOrders, GetSupplierOrderStats, SearchSupplierOrders).

### E. Server Pricing Authority (Fase 2)
- [x] Crear RPC `finalize_order_pricing(order_id)` (recalcula tiers, IVA, total, hash items).
- [x] Añadir campos persistentes: `pricing_verified_at`, `items_hash`.
- [x] Campo `unit_price_effective` (JSON) + original + tier_band.
- [x] Edge `create-payment-khipu` invoca RPC (abort on fail).
- [x] Validación explícita mismatch (WARNING→ABORT si |frontend-total - sealed-total| > 5 CLP).
- [x] Hash verificación en webhook (409 mismatch).
- [x] Remover fallback silencioso a 0.
- [x] Validación básica items (precio server ≥ 1 y coincide supplier/product).

### F. Seguridad & Idempotencia (Lean)
- [x] `inventory_processed_at` en orders + check atómico en webhook.
- [x] Validación mínima items en create-payment-khipu (producto existe y supplier ok, precio no menor al calculado server).
- [Defer] processed_webhook_events table.
- [Defer] rate limit avanzado (revisar métricas primero).
- [Defer] token interno JWT.
- [Defer] rotación programada HMAC (documentar manual).

### G. Event Sourcing Light (Deferido)
- [Defer] order_events + emisión eventos.

### H. Observabilidad (Lean)
- [ ] Log single line mismatch pricing (contador simple en memoria / best‑effort).
- [Defer] métricas formales y dashboards.

### I. Lógica UI / UX (Same)
- (sin cambios respecto a pendientes esenciales)

### J. Notificaciones
- [Defer] realtime UPDATE + retry queue.

### K. Tests Automatizados (Lean)
- [ ] Test unit `finalize_order_pricing` (tier aplica precio correcto y hash cambia).
- [ ] Test unit parse tiers edge fallback precio 0 (ya no debe ocurrir).
- [Defer] battery completa chips & performance.

### L / M / N / O / P (Ajustes)
- Remover entradas ya Dropped o Defer en sus secciones al consolidar roadmap futuro.

---

