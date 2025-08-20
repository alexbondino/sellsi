# Diagnóstico Integral Flujo de Órdenes (BuyerOrders / Pagos Khipu / Notificaciones)

Documento generado a partir de los problemas reportados en `problema.md`.

## Resumen de Problemas

1. Precio por ítem en `BuyerOrders` aparece como `cantidad × 0` (fallback) en algunos casos.
2. Chip de "Procesando Pago" no cambia a "Pago Confirmado" cuando `payment_status = 'paid'`.
3. Notificaciones no se muestran durante el flujo (creación de orden / cambio de estado / pago confirmado).

---
## 1. Precio de la Línea = 0 (Fallback)

### Síntoma
En la vista `BuyerOrders` se renderiza: `3 × $0 = $0` (o similar), pese a que el producto tiene precio y el total de la orden puede ser correcto.

### Flujo Relevante
`GetBuyerOrders.js` (legacy carts) → normaliza cada `cart_item` → asigna `price_at_addition` → `BuyerOrders.jsx` calcula:

```js
const unit = (typeof item.price_at_addition === 'number' && Number.isFinite(item.price_at_addition))
	? item.price_at_addition
	: (typeof item.product?.price === 'number' && Number.isFinite(item.product.price))
		? item.product.price
		: 0;
```

### Posibles Causas (priorizadas)
| # | Causa | Evidencia / Hipótesis | Impacto |
|---|-------|----------------------|---------|
| 1 | `price_at_addition` nulo o string no parseable (por ejemplo "" ó con coma) | El normalizador intenta `Number(raw)`; si da `NaN`, cae a fallback y quizá también falla | Alto |
| 2 | `products.price` viene como string con formato incompatible | Si incluye separadores o formato local -> `Number()` → `NaN` | Medio |
| 3 | Producto eliminado / precio actualizado a 0 en tabla `products` | El fallback toma 0 legítimo pero confunde al usuario | Medio |
| 4 | Multiplicación con `quantity` undefined / 0 | Si quantity viene undefined → total 0 | Bajo |
| 5 | Doble serialización del array items en otra capa (no este flujo) y pérdida de campos originales | Habría items incompletos | Bajo |

### Validaciones Recomendadas
Agregar logging temporal (env controlado) al map de `GetBuyerOrders` cuando el precio normalizado resulte 0:
```js
if (normalizedPrice === 0) {
	console.debug('[GetBuyerOrders][WARN] Precio 0', {
		raw: item.price_at_addition,
		productPrice: item?.products?.price,
		quantity: item.quantity,
		productId: item.product_id
	});
}
```

### Hardening Propuesto (Normalizador)
1. Sanitizar strings: reemplazar `,` por `.` / eliminar símbolos no dígitos / dividir si trae CLP.
2. Si ambos (`price_at_addition` y `products.price`) fallan, intentar:
	 - `price_tiers` (buscar tier matching `quantity`).
	 - Último precio histórico si se guarda en logs (si existe tabla).
3. Marcar flag `pricing_warning: true` en la línea para mostrar tooltip UI (no ocultar el problema silenciosamente).

### Ejemplo de Fallback Robusto
```js
function parsePriceCandidate(val){
	if (val == null) return null;
	if (typeof val === 'number') return Number.isFinite(val) ? val : null;
	if (typeof val === 'string') {
		const cleaned = val.trim().replace(/[^0-9,\.]/g,'').replace(',','.');
		const num = Number(cleaned);
		return Number.isFinite(num) ? num : null;
	}
	return null;
}
```

### Acción UI
Si `unit === 0` y `pricing_warning` true → mostrar chip “Precio no disponible” y sugerir contactar soporte.

---
## 2. Chip de Pago no cambia a "Pago Confirmado"

### Síntoma
El chip permanece en “Procesando Pago” aun tras confirmarse el pago (`payment_status` en BD = paid).

### Hallazgos
| Observación | Detalle |
|-------------|---------|
| Hook `useBuyerOrders` | Solo carga pedidos legacy desde `carts` (no mezcla tabla `orders`). Comentario: “Se ocultan payment orders.” |
| Tabla `orders` | Contiene `payment_status`; hay repositorio `OrdersRepository.js` no usado por el hook. |
| Realtime | No hay suscripción en `useBuyerOrders` a cambios de `orders` (solo lectura inicial). |
| UI Chips | Lógica depende de prop `order.payment_status`; si es `undefined` siempre mostrará la versión pending. |
| Webhook `process-khipu-webhook` | Actualiza `orders.payment_status = 'paid'`. Si la UI no consulta esa tabla, nunca se refleja. |

### Conclusión
La vista BuyerOrders actualmente se alimenta exclusivamente de `carts` (flujo legacy), por lo que:
1. No obtiene el campo `payment_status` real.
2. No recibe eventos realtime de la tabla `orders`.

### Plan de Integración Híbrida
1. Extender `orderService.getOrdersForBuyer` para retornar: `legacyCarts[]` + `paymentOrders[]` normalizados a una forma unificada `{ order_id, items, status, payment_status, ... }`.
2. Modificar `useBuyerOrders` para usar el método anterior (si no lo hace ya) y:
	 - Suscribir a ambos canales realtime: `carts` (para status) y `orders` (para payment_status + transición a accepted si aplica).
	 - O incorporar un polling suave (cada 20–30s) usando `ordersRepository.getMinimalStatuses` para reducir carga (diff local por id).
3. Al recibir `payment_status = 'paid'` → actualizar estado en memoria y re-render sin recarga total.
4. (Opcional) Guardar timestamp `paid_at` e inicializar un temporizador para mostrar mensaje de confirmación.

### Riesgos / Edge Cases
| Caso | Mitigación |
|------|------------|
| Orden pagada pero `status` aún `pending` | Mostrar “Pago Confirmado • Pendiente de aceptación”. |
| Webhook duplicado | Usar idempotencia por `orderId` (ya se hace: update con eq). |
| Orden rechazada post-pago (reembolso manual) | Definir política: mostrar “Pago Confirmado” + “Pedido Rechazado”; no ocultar pago. |

---
## 3. Notificaciones no visibles

### Flujo Esperado
1. Crear orden → `checkoutService.createOrder` → `orderService.notifyNewOrder(data)`.
2. `NotificationService.notifyNewOrder` (dominio órdenes) llama `supabase.rpc('create_notification', {...})` por cada item + resumen supplier.
3. Frontend: `useNotifications(userId)` se monta (en layout global) → `fetchInitial()` → subs realtime a `notifications`.

### Problemas Potenciales
| # | Causa | Evidencia / Hipótesis |
|---|-------|----------------------|
| 1 | La función Postgres `create_notification` no existe / firma distinta | No se incluye en migrations visibles aquí. |
| 2 | Rol anónimo sin permiso `rpc` o `insert/select` en `notifications` | Política RLS podría bloquear; llamadas silencian errores (`catch {}`). |
| 3 | `orderRow.items` no contiene `product_id` / campos requeridos | La RPC podría fallar si parámetros not null. |
| 4 | `useNotifications` no se inicializa en la jerarquía que envuelve `BuyerOrders` | BuyerOrders solo intenta `markContext`; si el Provider no está montado, nunca se leen notificaciones. |
| 5 | Realtime no operativo (channel no se suscribe) | Falta de `realtime` habilitado en proyecto / restricciones de red. |
| 6 | Errores silenciosos en RPC (swallow) | Código actual hace `catch (_) {}` ocultando causa raíz. |

### Acciones de Verificación
1. SQL: `select proname from pg_proc where proname ilike '%create_notification%';`
2. Revisar migración que define tabla `notifications` y función; si no existe, crear migración.
3. Temporariamente loggear errores en `NotificationService.notifyNewOrder` y `notifyStatusChange`.
4. Confirmar que `items` enviados contienen al menos `{ product_id, supplier_id, quantity, price_at_addition, name }`.
5. Confirmar montaje de `<NotificationProvider>` alrededor de layout donde vive `BuyerOrders` y barra superior.
6. Validar política RLS: permitir `insert` vía RPC y `select` a usuario autenticado sobre `notifications`.

### Hardening Propuesto
```js
catch (e) {
	console.error('[NotificationService][notifyNewOrder] RPC fallo', {
		orderId: orderRow.id,
		item: it.product_id,
		error: e.message
	});
}
```

Agregar feature flag para desactivar silenciamiento en staging.

### Métrica Sugerida
Registrar contador en edge functions / frontend: `notifications_rpc_success` / `notifications_rpc_error` para observabilidad.

---
## Modelo de Datos Unificado Propuesto para la UI BuyerOrders

| Campo UI | Fuente Legacy (carts) | Fuente Nueva (orders) | Notas |
|----------|----------------------|------------------------|-------|
| order_id | `cart_id` | `id` | Uniformizar clave primaria en UI |
| status | `status` | `status` | Map a display (Pendiente, etc.) |
| payment_status | (no existe) -> derivar `null` | `payment_status` | Null en legacy oculta chip de pago si se desea |
| items | `cart_items[]` | parse JSON `items` | Asegurar normalización de campos (product, quantity, price_at_addition) |
| final_amount | cálculo líneas + shipping | `total` | Consistencia mostrada |
| shipping_amount | `shipping_total` | `shipping` | |
| created_at | `created_at` | `created_at` | |
| paid_at | n/a | `paid_at` (webhook) | Opcional tooltip |

---
## Plan de Implementación (Fases)

### Fase 0 – Observabilidad (rápida)
- Añadir logs condicionados (flag) para precios 0 y errores de notificaciones.
- Crear dashboard mínimo (console / log tail) para webhook `process-khipu-webhook` confirmando updates.

### Fase 1 – Integración de Órdenes Payment
1. Extender `orderService.getOrdersForBuyer` (si no lo hace) para fusionar `ordersRepository.listByBuyer` + `GetBuyerOrders`.
2. Normalizar shape unificado (tabla arriba).
3. Ajustar `useBuyerOrders` para mostrar ambos tipos; opcional: flag que controla si se ocultan payment orders hasta pagadas.

### Fase 2 – Actualización Dinámica Payment Status
1. Añadir suscripción realtime a `orders` (ya existe método en `orderService`? Verificar implementación real y exponer hook).
2. O fallback: polling incremental con `ordersRepository.getMinimalStatuses` cada 15s hasta que todas las órdenes en pending pasen a paid o expiren.

### Fase 3 – Corrección de Precios
1. Implementar parser robusto (`parsePriceCandidate`).
2. Añadir fallback a `price_tiers`.
3. Agregar flag `pricing_warning` en línea cuando no se logra recuperar precio.
4. Mostrar tooltip informativo en UI.
5. (Backend futuro) Al añadir al carrito, guardar snapshot decimal exacto (NUMERIC) en `cart_items.price_at_addition` no-string.

### Fase 4 – Notificaciones
1. Confirmar existencia / firma de `create_notification` y permisos.
2. Añadir logging de errores (con throttle para no inundar consola).
3. Verificar provider global montado (si no, envolver App en `<NotificationProvider>`).
4. Añadir test manual: insertar notificación vía SQL y validar que aparezca en frontend.

### Fase 5 – Limpieza / UX
1. Eliminar variable muerta `statusChips` en `BuyerOrders.jsx` (se recalcula y no se usa).
2. Ajustar chips para que si `payment_status` es `paid` siempre primer chip success aunque `status` avance a accepted/in_transit.
3. Añadir skeletons / shimmer para transiciones realtime.

---
## Checklist Técnico de Cambios

Frontend:
- [ ] Normalizador robusto de precio.
- [ ] Merge de órdenes legacy + payment.
- [ ] Hook `useBuyerOrders` soporta realtime/polling `orders`.
- [ ] Tooltip de advertencia precio.
- [ ] Logging condicional (flag env). 
- [ ] Ajuste chips / remover código muerto.

Backend / Base de Datos:
- [ ] Confirmar / crear función `create_notification`.
- [ ] Revisar RLS para `notifications` (select/insert vía RPC) + tabla `orders` updates visibles.
- [ ] Asegurar tipos numéricos en `cart_items.price_at_addition` (NUMERIC/INT según modelo) y no texto.
- [ ] Métricas webhook (opcional).

Observabilidad:
- [ ] Logs de eventos: `order_created`, `payment_update`, `notification_rpc_error`.
- [ ] Console warnings precio 0 (remover tras estabilizar).

---
## Estrategia de Pruebas

1. Caso Pago Exitoso:
	 - Crear orden → iniciar pago Khipu (simulado o real sandbox) → verificar transición `payment_status: pending -> paid` y chip.
2. Caso Precio Anómalo:
	 - Insertar manualmente un `cart_item` con `price_at_addition = ''` y `products.price` válido → UI debe mostrar fallback correcto.
	 - Igual pero ambos invalidos → mostrar advertencia.
3. Notificaciones:
	 - Confirmar inserción por RPC (inspeccionar tabla) y recepción realtime.
4. Realtime / Poll Fallback:
	 - Deshabilitar temporalmente realtime (forzar fallo) → polling debe actualizar en ≤30s.
5. Regresión Legacy:
	 - Pedidos antiguos (solo carts) siguen visibles sin romper layout.

---
## Métricas / Monitoreo Sugerido
| Métrica | Descripción | Alerta |
|---------|-------------|--------|
| payment_status_update_latency_ms | `updated_at(paid) - created_at(order)` | p95 > 600000 (10m) |
| orders_with_zero_line_prices | Conteo de líneas con unit=0 (post-normalización) | > 0 sostenido |
| notification_rpc_errors | Errores agregados por hora | > 5/h |
| realtime_fallback_poll_hits | Veces que polling corrige estado | Tendencia ascendente = problema realtime |

---
## Roadmap Breve
1. (Día 0) Logging + verificación DB (función notificaciones, tipos numéricos).
2. (Día 1) Merge órdenes y soporte payment_status + polling.
3. (Día 2) Realtime + hardening precios + UI warning.
4. (Día 3) Hardening notificaciones, métricas finales.
5. (Día 4) Limpieza de logs y documentación final.

---
## Próximos Pasos Inmediatos (accionables)
1. Añadir logging precio 0 y errores RPC notificaciones.
2. Implementar fetch combinado orders+carts para Buyer.
3. Añadir polling minimal de `orders` (cada 15s) mientras existan órdenes con `payment_status = 'pending'`.
4. Validar existencia/firma de `create_notification` y permisos RLS.
5. Revisar datos reales de un `cart_item` que mostró 0 para confirmar causa principal.

---
## Notas Finales
El problema 2 (chip de pago) es principalmente de alcance de datos: la UI no está consumiendo la fuente que posee `payment_status` actualizado. El problema 1 requiere robustez adicional en parsing + snapshot de precio. El problema 3 demanda visibilidad (dejar de silenciar errores) y verificación de infraestructura (función RPC + provider). Con estas correcciones se estabiliza el flujo y se habilita escalabilidad futura (unificar dominio de órdenes y retiro eventual del modelo legacy `carts`).

---
## Addendum de Segunda Revisión (Profundización y Correcciones)

Esta segunda pasada revisó archivos adicionales: `NotificationProvider.jsx`, migraciones de `notifications`, `GetBuyerPaymentOrders.js`, `orderService.js` completo y confirmación de existencia de funciones SQL (`create_notification`). Se detectaron matices y omisiones menores en el análisis inicial.

### A. Existencia Real de Infra de Notificaciones
Contrario a la duda inicial, SÍ existen:
- Tabla `notifications` (migración `20250818100000_notifications_system.sql`) con RLS activado y políticas de `select`/`update` (no `insert`).
- Funciones RPC: `create_notification`, `create_welcome_notification`, `mark_notifications_context_read` (migración `20250818103000_notifications_functions.sql`).

Implicación: El problema 3 no es ausencia de función sino probablemente uno de:
1. Silenciamiento de errores en capa JS → fallos invisibles.
2. Parámetros incompletos en algunas invocaciones (campos opcionales vacíos que afectan dedupe).
3. Falta de eventos de realtime (posible desconexión) o no montaje del provider en escenarios edge (SSR / pruebas / rutas aisladas).
4. Dedupe agresivo (ventana 120s) impidiendo ver notificaciones repetidas en pruebas rápidas.

### B. Dedupe de Notificaciones (Ventana 120s)
La función `create_notification` implementa deduplicación combinando: `(user_id, order_id, product_id, type, order_status)` dentro de 120s. 
Escenario típico que produce “no aparecen notificaciones”: ejecutar varios cambios del mismo estado en <2 min sobre mismo item → se devuelve la existente sin nuevo INSERT (realtime no dispara). 
Acción: Para debugging reducir ventana (e.g. 10s) o agregar metadata adicional (hash distinto) mientras se prueba.

### C. Doble Definición de `notifyNewOrder` en `orderService`
Hay dos métodos con el mismo nombre: uno llama `notificationService.notifyNewOrder`, el segundo sobreescribe llamando `NotifyNewOrder` (command). Efecto: la primera versión queda anulada. Confirmar que `NotifyNewOrder` encapsula la lógica; si incompleta, se pierden notificaciones esperadas.
Acciones:
- Renombrar una (ej. `_notifyNewOrderLegacy`) o eliminar duplicada.
- Verificar que `NotifyNewOrder` delega correctamente a `notificationService.notifyNewOrder` (si no, añadir).

### D. Integración Parcial de Payment Orders ya Implementada (pero no Consumida)
Se encontró `GetBuyerPaymentOrders.js` y método `orderService.getPaymentOrdersForBuyer()`. Sin embargo `useBuyerOrders` sólo invoca `orderService.getOrdersForBuyer` (que trae únicamente carts). Falta un agregador (composite) que combine ambos resultados antes de `setOrders`. 
Acción: Implementar en `useBuyerOrders` un fetch paralelo:
```js
const [legacy, payment] = await Promise.all([
	orderService.getOrdersForBuyer(buyerId, filters),
	orderService.getPaymentOrdersForBuyer(buyerId, filters)
]);
// Opcional: filtrar payment orders pre-paid según flag.
```

### E. Campo `payment_status` y Chips
En `BuyerOrders.jsx` se pasa a `getStatusChips(productStatus, order.payment_status)` pero la función `getStatusChips` internamente se llama con un solo argumento en algunas rutas (`const statusChips = getStatusChips(productStatus);` en línea previa, variable sin uso). Riesgo: confusión al refactor — eliminar variable muerta para reducir errores de mantenimiento.

### F. Origen de Cálculo de `total_amount` en Payment Orders
`GetBuyerPaymentOrders` usa `row.total || (recalc líneas)`. Si `row.total` difiere (por redondeos impuestos / descuentos), UI podría mostrar valor divergente respecto a versión final (impuestos). Recomendar siempre confiar en `row.total` y exponer `computed_lines_total` para auditoría opcional.

### G. Normalización de Precios en Payment Orders
`price_at_addition: it.price_at_addition || it.price || 0` (uso de operador OR) hace que `0` legítimo sea reemplazado por fallback `it.price` si `price_at_addition` = 0. Necesario cambiar a coalescencia explícita:
```js
price_at_addition: it.price_at_addition ?? it.price ?? 0
```
Esto evita falsos positivos de “precio 0”. (Aplicar a `product.price` también.)

### H. Validación de UUID
`orderService.getPaymentOrdersForBuyer` valida formato UUID; `getOrdersForBuyer` también. En `useBuyerOrders` si `buyerId` no es uuid todavía (ej. llego del localStorage antes de login completo) se rompe el flujo, generando `setError`. Sugerir retrasar fetch hasta confirmación de sesión (`auth.session`) o añadir `isUUID` gating.

### I. Realtime de Payments
`orderService.subscribeToBuyerPaymentOrders` está disponible pero no se usa en `useBuyerOrders`. Añadirlo para escuchar transiciones `payment_status -> paid` sin polling. Implementar fallback de polling si canal se cae (timer heartbeat).

### J. Riesgo de Divergencia de Campo `status`
Payment orders usan `status` (`pending`, etc.). Legacy carts también. Al combinar, conviene añadir `source: 'orders' | 'carts'` (ya existe en mapper) y estandarizar display sólo al final para no mezclar lógicas de actualización.

### K. Persistencia de Dirección de Envío
`GetBuyerPaymentOrders` actualmente fija `delivery_address: null`. Si la orden tiene `shipping_address` guardada, debería mapearse para consistencia con legacy. Acción: leer campos si existen (ver migraciones si el campo está). Esto evita UI condicionales inconsistentes.

### L. Edge Case: Orden Pagada sin Items
Si por error `items` JSON vacío o parse fallido, se mostraría orden con total y sin líneas. Añadir guard: si `items.length === 0` y `total > 0`, loggear advertencia para detectar corrupción.

### M. Dedupe vs Estado Rápido
Secuencia: `pending -> paid -> accepted` rápida (<120s) puede resultar en notificaciones: `order_new (pending)`, `order_status paid?` (no implementado explicitamente), `order_status accepted`. Si se decide notificar pago confirmado como un estado separado, deberá agregarse `type='order_status'` con `order_status='paid'` (hoy no está en mapa de `NotificationService.notifyStatusChange`). Acción: ampliar `statusTitles` / `statusBodies` para `paid` o decidir que no se notifica explícitamente.

### N. Webhook: Validación de Firma (Resumen)
`process-khipu-webhook` registra si la firma no válida pero continúa flujo (no corta explicitamente tras invalidación). Código:
```js
if (!isValidSignature) { console.error('Firma inválida'); }
// continúa...
```
Riesgo: permite spoofing actualizando a `paid` sin firma válida. Acción crítica: retornar 401 inmediatamente si la firma es inválida.

### O. Orden del Subject Parsing
`subject.match(/#([0-9a-fA-F-]{36})/)` asume que el `subject` contiene `#<uuid>`. Validar que el formato de subject enviado en `create-payment-khipu` mantenga ese patrón; si no, `orderId` será null y pago no se aplicará. Recomendar almacenar explícitamente `order_id` en metadata (si Khipu lo soporta) o persistir mapa `khipu_payment_id -> order_id` (ya se guarda en `orders`). Alternativamente, en webhook buscar por `payment_id` si no se parsea `orderId`.

### P. Idempotencia del Webhook
Webhook hace un `update` simple sin chequear estado previo; múltiple entrega es tolerante pero se podría optimizar añadiendo `where payment_status != 'paid'` para reducir writes y logging ruidoso.

### Q. Consistencia Temporal Campos `paid_at` / `updated_at`
Webhook setea ambos a `new Date().toISOString()`. A efectos de auditoría se pierde momento real si Khipu provee `paid_at` exacto. Mejor usar `khipuPayload.paid_at` (si existe) y fallback local.

### R. Representación en UI de Ordenes Pre-Pago (Autorización)
Decidir si se muestran en BuyerOrders antes de pago: 
- Opción A: Mostrar inmediatamente con chip amarillo (Procesando Pago). 
- Opción B: Ocultar hasta pagadas para no “inflar” historial. Necesario flag `SHOW_UNPAID_PAYMENT_ORDERS` centralizado.

### S. Métricas Adicionales Sugeridas
- `webhook_invalid_signature_count`
- `webhook_paid_updates_idempotent_skipped`
- `orders_price_normalization_fallback_count`
- `notifications_dedupe_hits`

### T. Lista Revisada de Cambios Prioritarios (Refinada)
1. Seguridad Webhook: cortar ejecución en firma inválida.
2. Merge órdenes en hook + realtime subscription + fallback polling.
3. Normalización robusta de precios (usar `??` en vez de `||`).
4. Logging de precios 0 y notificaciones RPC (flag env).
5. Corrección doble definición `notifyNewOrder` y decisión de notificar `paid` (añadir si se quiere visibilidad temprana).
6. Ajustar dedupe (parámetro de ventana) para entorno staging.
7. Mapear `shipping_address` en payment orders y validar items vacíos.
8. Cambiar parse de subject: fallback a lookup por `khipu_payment_id`.
9. Añadir `source` visible en UI (debug label) durante transición.
10. Documentar decisiones A/B sobre visibilidad de órdenes no pagadas.

---
### Validación del Análisis Original
El análisis inicial se mantiene sustancialmente correcto; los puntos añadidos refinan:
- Confirmación de existencia de la infraestructura de notificaciones (corrige incertidumbre).
- Mayor detalle de deduplicación y su impacto práctico.
- Riesgo de seguridad (firma no detiene flujo) no señalado antes.
- Detalle de bug lógico con `||` sobre `price_at_addition`.
- Detección de duplicación de método en `orderService`.
- Mejores estrategias de recuperación cuando `subject` no parsea UUID.

No se identificaron contradicciones graves; se fortalece profundidad y se agregan medidas de seguridad y consistencia.


