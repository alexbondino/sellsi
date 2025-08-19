## Análisis Profundo: Modelo de Órdenes Actual vs Objetivo (Buyer debe ver 1 pedido por Proveedor, NO la Orden de Pago)

### 1. Resumen Ejecutivo
Actualmente el flujo crea:
1. (Frontend Checkout) Se crea una fila en `orders` ("Orden de Pago" / Payment Order) que agrupa TODOS los ítems del carrito (posibles múltiples proveedores).
2. Edge Function `create-payment-khipu` actualiza esa misma fila con datos de Khipu.
3. Cuando Khipu confirma (webhook `process-khipu-webhook`), se materializa el pedido "real" convirtiendo el carrito activo (`carts` status=active) a `pending` y clonando sus `cart_items` (uno solo, mezclando productos de distintos proveedores).
4. BuyerOrders.jsx hoy mezcla:
	- Pedidos clásicos (`carts` != 'active')
	- Payment orders (`orders`), marcadas con `is_payment_order`.

Problema: El comprador ve la Orden de Pago única y luego un único "pedido" con ítems de varios proveedores. Requerimiento: Mostrar 1 pedido por proveedor (p.e. Pedido Juan, Pedido Pedro) y **ocultar totalmente** la orden de pago (uso interno / auditoría / conciliación).

### 2. Arquitectura Actual (Resumen Técnico)

Componentes críticos revisados:
* `checkoutService.createOrder` inserta en `orders` (status/payment_status = pending).
* `khipuService.createPaymentOrder` invoca Edge Function `create-payment-khipu` que solo ACTUALIZA esa fila.
* `process-khipu-webhook`:
  - Marca `orders.payment_status = 'paid'`.
  - Materializa en `carts` (1 fila) y llena/reescribe `cart_items` con los ítems pagados.
  - Ajusta inventario, ventas, crea carrito nuevo activo vacío.
* `orderService.getPaymentOrdersForBuyer` trae filas de `orders` y las marca `is_payment_order`.
* `useBuyerOrders` mezcla payment orders + carts (merge & dedupe) para UI.
* Para suppliers `getOrdersForSupplier` filtra ítems dentro de un único cart que puede contener productos de múltiples suppliers.

### 3. Dolencias / Riesgos del Modelo Actual
| Problema | Impacto |
|----------|---------|
| Buyer ve una entidad (Payment Order) que no representa un pedido despachable | Confusión UX |
| Un solo `cart` multi-supplier complica estados por proveedor (accepted/rejected/in_transit) | Lógica condicional, riesgos de divergencia |
| No existe relación directa Payment Order -> múltiples pedidos por proveedor | Refactor requiere migración |
| Cancelaciones / estados parciales por proveedor no expresables sin complejidad extra | Futuro escalado afectado |
| Shipping total único; difícil prorratear o recalcular por proveedor | Costos incorrectos / Reporting |

### 4. Objetivo Funcional Nuevo
Tras pago exitoso debe existir:
* 1 fila en `orders` (uso interno) – NO visible al comprador.
* N filas en `carts` (status inicial: `pending`), UNA por proveedor involucrado.
* Cada fila `carts` contiene SOLO sus `cart_items` de ese proveedor.
* BuyerOrders.jsx muestra SOLO `carts` (ya no mezcla con `orders`).
* Suppliers (MyOrders) ya funcionan de forma natural (cada cart ya es exclusivamente suyo ⇒ simplifica lógica y filtros).

### 5. Cambios de Datos / Esquema Propuestos
1. Nuevo campo en `carts`: `payment_order_id uuid NULL REFERENCES public.orders(id)` (indexado).
2. (Opcional) Campo `supplier_id uuid` en `carts` para marcar propietario lógico del pedido (hoy se infiere a partir de `cart_items.products.supplier_id`). Facilita queries y contadores.
3. (Opcional) Tabla audit `payment_order_cart_links(payment_order_id, cart_id, supplier_id, created_at)` si se requiere histórico independiente.
4. (Opcional) Campo `split_status` en `orders` (`not_split` | `split` | `partial`) para idempotencia / reentrancia del webhook.

### 6. Lógica de Split (Webhook `process-khipu-webhook`)
Pseudo-algoritmo tras confirmar pago:
```
items = parse(order.items)
groups = group items by supplier_id
if groups.size == 1:
  comportamiento casi igual actual:
	  convertir carrito activo a pending (o crear si no existe)
	  asignar payment_order_id, supplier_id
else:
  descartar enfoque de un único cart:
	  1) (Si existe cart activo) NO convertirlo directamente; usarlo solo como fuente y luego ponerlo en status='converted' (nuevo estado) o eliminarlo si negocio lo permite.
	  2) Por cada grupo supplier:
			 insertar cart { user_id, status:'pending', payment_order_id, supplier_id, shipping_total calculado }
			 insertar cart_items filtrados
	  3) (Opcional) crear nuevo carrito activo vacío.
  marcar order.split_status='split'.
```
Idempotencia: si webhook se re-ejecuta revisar `split_status` o existencia de carts con `payment_order_id = order.id` y abortar duplicados.

### 7. Shipping por Proveedor
Opciones:
1. Recalcular desde reglas de `product_delivery_regions` (recomendado — precisa aunque más costoso).
2. Prorratear proporcional al subtotal de cada supplier: `shipping_slice = round(total_shipping * (supplier_subtotal / global_subtotal))` asegurando suma = total.
3. Fijo 0 y dejar que cada supplier agregue despacho (cambia modelo de negocio – NO sugerido).

Plan: Implementar util `allocateShippingPerSupplier(items, totalShipping)` mediante prorrateo con ajuste al último proveedor para cuadrar redondeo.

### 8. Estados y Transiciones
* `orders.payment_status`: sigue representando pago global.
* Cada `cart.status` evoluciona independientemente: `pending → accepted/rejected → in_transit → delivered`.
* Cancelación parcial: se cancela un cart sin impactar otros; `orders` podría recibir `has_partial_cancellation` (boolean) opcional.

### 9. Ajustes de Código Necesarios
| Área | Acción |
|------|--------|
| DB Migrations | Añadir columnas: `payment_order_id`, `supplier_id` (carts); `split_status` (orders); índices. |
| Edge Function `process-khipu-webhook` | Reemplazar materialización monolítica por split; idempotencia. |
| `useBuyerOrders` | Eliminar consultas a payment orders (`getPaymentOrdersForBuyer`), quitar merge logic. Solo usar `getOrdersForBuyer` (carts). Simplificar estado/polling. |
| `orderService.getPaymentOrdersForBuyer` | Puede quedar para otros dashboards, pero BuyerOrders dejará de usarlo. |
| BuyerOrders.jsx | Quitar referencias a `is_payment_order`, chips de pago inicial; estados comienzan en `pending` (pedido supplier). |
| Checkout flujo | Después de crear `orders` y redirigir a pago: Buyer al entrar a /buyer/orders antes de pago verá vacío (aceptado por requerimiento). Se puede mostrar mensaje "Tu pago está en proceso" si se desea (opcional NO solicitado). |
| MyOrdersPage Supplier | Simplificación futura: ya no filtrar ítems por supplier dentro de un cart (porque cada cart será single-supplier). Ajustable luego. |
| Notificaciones | `notifyNewOrder`: disparar DESPUÉS del split por cart (por supplier) o adaptar para enviar una por cart nuevo en lugar de por item global. |
| Seguridad / Auditoría | Posible trigger para bloquear cambios en `orders.items` luego de split. |

### 10. Estrategia de Migración (Fases Seguras)
1. Fase 0 (Preparación):
	- Crear migraciones agregando columnas nuevas e índices (sin usar aún).
	- Deploy sin modificar lógica.
2. Fase 1 (Webhook Guardas):
	- Añadir lectura de `split_status`; no cambiar materialización aún.
3. Fase 2 (Implementar Split DUAL):
	- Webhook crea nuevos carts por supplier **además** del cart único legacy, marcando `split_status='split'`.
	- Marcar los nuevos carts con `payment_order_id`.
	- BuyerOrders aún muestra legacy (sin cambios) ⇒ validación interna.
4. Fase 3 (Switch Buyer View):
	- Modificar `useBuyerOrders` para ignorar payment orders y filtrar carts con `payment_order_id IS NOT NULL` cuando `split_status='split'` (o simplemente todos los carts != active). Verificar que hay uno por supplier.
5. Fase 4 (Depuración Legacy):
	- Dejar de insertar cart legacy (o marcarlo status='deprecated').
	- Limpieza de código de merge. Documentar.
6. Fase 5 (Backfill Histórico Opcional):
	- Script que detecte carts multi-supplier históricos (status pending/accepted/…) y los divide (complejo si estados divergieron ⇒ evaluar necesidad real).

### 11. Consideraciones de Consistencia
| Caso | Manejo |
|------|--------|
| Webhook llega dos veces | Chequear `split_status='split'` o existencia carts con `payment_order_id`; abortar duplicados. |
| Falta supplier_id en item | Validar antes de split; si falta → log crítico + fallback a cart agrupado. |
| Shipping = null | Tratar como 0; prorrateo se vuelve 0 para todos. |
| Un supplier rechaza | Solo cambia ese cart; buyer sigue viendo otros. |
| Documentos tributarios | Siguen a nivel de item; no cambia. |

### 12. Performance / Costos
* Más filas en `carts` proporcional al número de suppliers por compra (esperado pequeño < 5).
* Consultas supplier se simplifican (no requiere filtrar items). Potencial reducción de payload.
* Index en `payment_order_id` permite auditoría y conciliación.

### 13. Plan de Cambios de Código (Listado Concreto)
1. Migration SQL (ejemplo):
```sql
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS payment_order_id uuid REFERENCES public.orders(id);
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS supplier_id uuid; -- opcional (considerar FK a users)
CREATE INDEX IF NOT EXISTS idx_carts_payment_order_id ON public.carts(payment_order_id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS split_status text CHECK (split_status IN ('not_split','split','partial')) DEFAULT 'not_split';
```
2. Edge Function `process-khipu-webhook`: encapsular materialización en función `materializeOrder(orderRow)` y dentro hacer split.
3. Nuevo helper en función para prorrateo shipping.
4. Actualizar `useBuyerOrders.js`: eliminar toda lógica de payment orders / polling Khipu; `fetchOrders` solo llama `getOrdersForBuyer`.
5. `BuyerOrders.jsx`: remover label "Orden de Pago", chips de pago; ajustar `formatOrderNumber` para trabajar solo con `cart_id`.
6. (Opcional) Añadir mensaje si lista vacía y existe una payment order pendiente (se puede detectar consultando orders con `user_id` y `payment_status='pending'`). Requerimiento actual indica que NO se muestre la payment order, así que este paso es opcional y se saltará inicialmente.

### 14. Puntos de Riesgo y Mitigación
| Riesgo | Mitigación |
|--------|-----------|
| Errores al dividir ítems (datos inconsistentes) | Validar cada item: product_id, supplier_id > abort split si corrupto. Logging. |
| Duplicación de inventario decrement | Marcar split antes de decrementar y usar flag para evitar doble ejecución. |
| Reprocesamiento webhook tardío | Idempotencia por `split_status` + búsqueda carts existentes. |
| Queries legacy que esperan múltiples suppliers en un cart | Revisar paneles admin / reportes antes de eliminar legado. |

### 15. Backfill (Si se solicita luego)
Script potencial:
1. Seleccionar carts con >1 supplier distinto.
2. Crear carts nuevos por supplier copiando atributos (status, timestamps, shipping prorrateado).
3. Mover cart_items.
4. Marcar cart original status='split_legacy'.
5. Registrar mapping en tabla audit.

### 16. Próximos Pasos Recomendados
1. Implementar migración (Fase 0).
2. PR para refactor de webhook con modo dual (feature flag o variable env `SPLIT_ORDERS_ENABLED=true`).
3. QA en staging: ejecutar compra multi-supplier y validar:
	- carts creados = número de suppliers.
	- BuyerOrders muestra N pedidos sin payment order.
	- MyOrders de cada supplier muestra solo sus ítems.
4. Retirar lógica de payment orders del frontend.
5. Monitorear métricas (tiempo webhook, recuento carts) 1 semana.

### 17. Resumen Final
El rediseño propone separar la Orden de Pago (entidad financiera) de los Pedidos operativos (uno por proveedor) simplificando estados, visibilidad y escalabilidad (cancelaciones parciales, SLAs, métricas por proveedor). Los cambios son localizados: una migración ligera, refactor moderado del webhook y simplificación sustancial del frontend (eliminar mezcla y polling de payment orders). Esta dirección alinea el modelo con prácticas de marketplaces multi-supplier.

Documento generado automáticamente (mantener como base viva para la implementación). Actualizar secciones 13–16 conforme se avance.

---
## Estado de Implementación (Actualización 2025-08-19)

Resumen rápido de qué ya está hecho en código en la rama actual:

| Elemento | Estado |
|----------|--------|
| Migración columnas (`payment_order_id`, `supplier_id` en `carts`, `split_status` en `orders`) | HECHO (archivo SQL agregado) |
| Webhook `process-khipu-webhook` modo DUAL con variable `SPLIT_MODE` (`legacy|dual|split`) | HECHO |
| Lógica split: crea carts por supplier + legacy mientras DUAL | HECHO |
| Prorrateo shipping proporcional con ajuste final | HECHO (inline) |
| `useBuyerOrders` sin payment orders, sin polling de estados de pago | HECHO |
| `BuyerOrders.jsx` muestra sólo pedidos (carts) y debajo "Orden de Pago #" opcional | HECHO |
| Propagación `payment_order_id` a UI | HECHO |
| Remover creación cart legacy al pasar a modo `split` | PENDIENTE (activar cuando se decida) |
| Limpieza código de soporte payment orders (servicio y hooks) | PARCIAL (aún existe `getPaymentOrdersForBuyer`) |

Próximo toggle: cambiar variable de entorno a `SPLIT_MODE=split` una vez validado que no necesitamos el cart legacy duplicado.

Sugerencia de despliegue controlado:
1. Deploy actual con `SPLIT_MODE=dual` (o mantener `legacy` si aún no se quiere crear split) para validar en staging.
2. Verificar tras una compra multi-supplier que se crean N carts (uno por supplier) y que Buyer sólo ve esos carts (sin Payment Order directa).
3. Si OK, cambiar `SPLIT_MODE=split` y (en refactor siguiente) eliminar rama legacy del webhook.

Checklist post-deploy (staging):
- [ ] Compra con 2 suppliers → aparecen 2 carts en DB (`payment_order_id` poblado, `supplier_id` distinto).
- [ ] Inventario decrementado exactamente una vez por item.
- [ ] `product_sales` upsert sin duplicados (clave compuesta order_id+product_id+supplier_id).
- [ ] UI Buyer: no aparece duplicado ni Orden de Pago suelta (solo la línea secundaria bajo Pedido).
- [ ] UI Supplier: cada supplier ve sólo sus items en su propio cart.

Cuando todos los checks pasen ⇒ proceder a `SPLIT_MODE=split`.

---
