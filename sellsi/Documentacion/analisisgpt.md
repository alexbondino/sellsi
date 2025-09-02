# Análisis Profundo: Sistema de Ofertas (Buyer ↔ Supplier)

> Documento generado: análisis técnico exhaustivo para diseño, modelado de datos, flujos, timers, consistencia de stock, integración con órdenes/pagos y consideraciones operativas. Lenguaje: Español. Alcance: Todo lo descrito en `ofertas.md` + ampliaciones.

---

## 1. Objetivo del Módulo de Ofertas

Permitir que un comprador (buyer) genere una oferta custom (precio + cantidad únicos) sobre un producto existente. El proveedor (supplier) puede aceptarla o rechazarla. Si la acepta, se reserva stock inmediatamente y se abre una ventana de 24h para que el buyer convierta esa oferta en compra (agregando el producto “ofertado” al carrito y concretando pago). Si el buyer no compra en ese plazo, la oferta caduca y el stock reservado se repone. Todo el ciclo tiene visibilidad específica y temporizadores diferenciados para buyer y supplier.

## 2. Entidades y Conceptos Clave

1. Offer (Oferta): Objeto central; referencia a un único producto (no bundle inicialmente). Aporta: precio unitario negociado, cantidad específica, expiraciones y estados.
2. Stock Reservation (Reserva de stock): Al aceptar la oferta se descuenta/reserva stock preventivamente para evitar overselling. Si la compra no se materializa → revertir.
3. Offer Lifecycle Timers:
	 - Timer #1: 48h desde creación en estado `pending` (esperando decisión del supplier). Si pasa el tiempo y sigue `pending` → `expired`.
	 - Transición `pending -> accepted` (acción del supplier) dentro de las 48h.
	 - Timer #2: 24h post-`accepted` para que el buyer compre. Sólo visible al buyer. Expira en `accepted_buyer_expired` (o `expired_after_acceptance`) desde la perspectiva buyer; para supplier se mantiene como “aceptada” pero ya no convertible.
4. Compra Materializada: Generación/actualización de Order que incluye un ítem marcado como “Ofertado” (campo discriminador) y que consume la reserva definitivamente.
5. Cancelaciones/Rechazos: Supplier puede rechazar dentro de la ventana de 48h. Buyer podría querer cancelar mientras esté `pending` (opcional; definir). Actualmente no se ha definido cancelación de buyer → decidir si se permite.
6. Auditoría y Eventos: Imperativo registrar cada transición para trazabilidad y debugging.

## 3. Estados Propuestos de la Oferta

Usar un enum (CHECK) robusto para claridad.

```
pending              -- Creada por buyer, esperando decisión supplier (48h)
rejected             -- Rechazada por supplier antes de 48h
accepted             -- Aceptada; abre ventana 24h para buyer (stock reservado)
converted            -- Buyer concretó compra (orden creada con ítem ofertado)
expired              -- Caducó sin respuesta supplier (48h)
buyer_window_expired -- Buyer no compró dentro de 24h tras aceptación
cancelled_by_buyer   -- (Opcional) Buyer la cancela antes de decisión supplier
invalidated          -- (Opcional) Inconsistencia detectada / rollback manual
```

Notas:
- Desde la perspectiva UI supplier, una oferta en `buyer_window_expired` podría seguir mostrándose como “Aceptada (Caducada para buyer)” o simplificar a “Caducada”; decisión UX.
- `converted` es terminal exitosa.
- Estados terminales: `rejected`, `expired`, `buyer_window_expired`, `converted`, `cancelled_by_buyer`, `invalidated`.

## 4. Campos Clave de la Tabla principal de Ofertas

Tabla: `offers` (nueva).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid (PK) | Identificador oferta |
| product_id | uuid FK products(productid) | Producto base |
| buyer_id | uuid FK users(user_id) | Quien solicita |
| supplier_id | uuid FK users(user_id) | Dueño del producto (denormalizable) |
| unit_price | numeric | Precio ofertado unitario (moneda CLP inicialmente) |
| currency | text | 'CLP' por defecto (compat futuro multi-moneda) |
| quantity | integer | Cantidad negociada |
| status | text | Enum descrito arriba |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() on update |
| pending_expires_at | timestamptz | created_at + interval '48 hours' |
| buyer_window_expires_at | timestamptz | set sólo al aceptar (accepted_at + 24h) |
| accepted_at | timestamptz | timestamp aceptación supplier |
| converted_at | timestamptz | timestamp creación orden (o link) |
| rejected_at | timestamptz | timestamp rechazo |
| buyer_window_expired_at | timestamptz | set cuando expira ventana buyer |
| cancelled_at | timestamptz | si buyer cancela (opcional) |
| cancelled_reason | text | motivo cancelación/invalidez |
| product_snapshot | jsonb | Captura inmutable (nombre, spec, etc) para resiliencia histórica |
| stock_reserved | boolean | true si se reservó stock (en accepted) |
| reserved_quantity | integer | Normalmente = quantity (para verificaciones) |
| reservation_id | uuid | FK opcional a tabla de reservas (si se separa) |
| order_id | uuid | FK orders(id) cuando convertido |
| items_hash_at_creation | text | (Opcional) integridad vs manipulación |
| meta | jsonb | Campos extensibles (ej. canal, notas, device info) |
| audit_version | integer | Para optimistic locking (incremental) |

Índices sugeridos:
1. `idx_offers_buyer_id_created_at` (buyer_id, created_at DESC)
2. `idx_offers_supplier_id_status` (supplier_id, status)
3. `idx_offers_status_pending_expires_at` (status, pending_expires_at) WHERE status = 'pending'
4. `idx_offers_status_buyer_window_expires` (status, buyer_window_expires_at) WHERE status = 'accepted'
5. `idx_offers_order_id` (order_id) UNIQUE WHERE order_id IS NOT NULL

## 5. Reservas de Stock

### Estrategias
1. Inline (bandera en `offers` + decremento directo en `products.productqty`).
2. Tabla dedicada `stock_reservations` para trazabilidad y liberar en expiración.

Se recomienda tabla dedicada para auditoría y consistencia multi-fuente (futuras campañas, pre-orders, etc.).

Tabla: `stock_reservations`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| product_id | uuid | FK products |
| offer_id | uuid | FK offers (UNIQUE) |
| quantity | integer | Reservado |
| created_at | timestamptz | |
| released_at | timestamptz | NULL si activa |
| release_reason | text | 'conversion', 'expiration', 'manual', 'rollback' |
| locked | boolean | Para evitar doble liberación |
| integrity_hash | text | (Opc) hash(product_id||quantity||created_at) |

### Flujo Stock
1. Buyer crea oferta: NO se toca stock.
2. Supplier acepta: iniciar transacción:
	 - Verificar stock >= quantity y producto activo.
	 - `SELECT ... FOR UPDATE` sobre fila producto (o usar advisory lock por productid) para evitar carrera con otras ofertas u órdenes.
	 - Decrementar `products.productqty = productqty - quantity`.
	 - Insert en `stock_reservations` (con quantity).
	 - Marcar `offers.stock_reserved = true` y `reserved_quantity = quantity`.
3. Buyer convierte (compra): no volver a decrementar stock (pago/checkout debe detectar `offer_id` y omitir decremento). Liberación lógica: `released_at` con reason `conversion` (opcional; se puede considerar conversión como consumo final sin reponer). Podríamos no liberar (porque ya fue consumido) pero sí marcar reason para consistencia.
4. Expira ventana buyer o rechazada/caduca antes de aceptación? Casos:
	 - Rechazada antes de aceptación: no había reserva.
	 - Expira en pendiente: no había reserva.
	 - Expira tras aceptación sin compra: transacción revertir stock:
		 - `SELECT ... FOR UPDATE` producto
		 - `productqty = productqty + reserved_quantity`
		 - `stock_reservations.released_at = now(), release_reason='expiration'`.

## 6. Integración con Orders / Items

Actualmente `orders` almacena `items jsonb`. Se requiere distinguir ítems de oferta para:
- Mostrar tag “Ofertado” en: CartItem, PaymentMethod, BuyersOrders, MyOrdersPage, etc.
- Evitar doble descuento stock.

### Modificación Sugerida:
Agregar a cada item JSON estructura extendida:
```
{
	product_id: uuid,
	quantity: int,
	unit_price: numeric,
	subtotal: numeric,
	source: 'standard' | 'offer',
	offer_id: uuid | null,
	offer_snapshot: { unit_price, quantity_original, created_at, ... } -- opcional
}
```
Validaciones backend (Edge Function / RPC):
1. Si `source='offer'` → `offer_id` obligatorio.
2. Verificar `offers.status = 'accepted'` y dentro ventana (o ya `converted`), y buyer_id coincide.
3. Verificar `quantity <= reserved_quantity` EXACTO (idealmente debe ser igual; si se desea permitir compra parcial, complejiza reversion).
4. Transición de estado: `accepted -> converted` (set `converted_at`, `status='converted'`).
5. Marcar `orders.items[*].offer_id` y no alterar stock.

## 7. Timers y Expiraciones

### Opciones de Implementación
1. Procesos programados (Supabase cron) cada X minutos:
	 - Expirar ofertas `pending` con `pending_expires_at < now()`.
	 - Expirar ofertas `accepted` con `buyer_window_expires_at < now()` -> set `buyer_window_expired` y devolver stock.
2. Vistas Lógicas / Lazy Expiration: Cada vez que se lee, se evalúa; menos controlable para revertir stock.
3. Worker dedicado (Edge Function invocada por scheduler) → Recomendado.

### Pseudocódigo Expiración (Pending)
```
UPDATE offers
SET status='expired', updated_at=now()
WHERE status='pending' AND pending_expires_at < now();
```

### Pseudocódigo Expiración (Accepted → Buyer Window)
```
WITH to_expire AS (
	SELECT o.id, o.reserved_quantity, o.product_id
	FROM offers o
	WHERE o.status='accepted' AND o.buyer_window_expires_at < now()
)
UPDATE offers o
SET status='buyer_window_expired', buyer_window_expired_at=now(), updated_at=now()
FROM to_expire t
WHERE o.id = t.id;

-- Reponer stock
UPDATE products p
SET productqty = productqty + t.reserved_quantity
FROM to_expire t
WHERE p.productid = t.product_id;

UPDATE stock_reservations r
SET released_at=now(), release_reason='expiration'
FROM to_expire t
WHERE r.offer_id = t.id AND r.released_at IS NULL;
```

Incluir todo en una transacción o usar locks por producto para evitar race con conversión simultánea.

## 8. Concurrencia y Race Conditions

Casos críticos:
1. Dos ofertas aceptadas simultáneamente que sobrepasan stock.
	 - Solución: `SELECT ... FOR UPDATE` sobre la fila de producto al aceptar; validar stock restante.
2. Conversión y expiración corriendo en paralelo.
	 - Estrategia: Al iniciar conversión (`checkout`), re-leer oferta con `FOR UPDATE`, verificar `status='accepted' AND now() <= buyer_window_expires_at`. Si pasa validación, continuar; expirador verá lock y esperará→ luego `status` será `converted` y no se revertirá stock.
3. Reintentos de pago fallidos con reserva. Si el pago no se confirma pero se generó la orden, definir rollback manual o un estado de pago pendiente dentro del ciclo normal de órdenes (preferible no revertir oferta una vez convertida).
4. Partial purchase (no recomendado inicialmente). Mantener simple: buyer debe comprar exactamente la `quantity` acordada.

## 9. Política de Stock y Consistencia

Agregar (si no existe) tabla `product_stock_movements` para auditoría unificada:
```
id uuid PK
product_id uuid
movement_type text CHECK (movement_type IN ('offer_reserve','offer_release','offer_conversion','order_purchase','manual_adjust','restore'))
delta integer (negativo o positivo)
related_offer_id uuid NULL
related_order_id uuid NULL
created_at timestamptz default now()
meta jsonb
```
Permite reconstruir inventario teórico y detectar desbalances.

## 10. UI/UX Consideraciones

BuyerOffer.jsx:
- Lista con: estado, timer (48h si pending; 24h si accepted), badge “Ofertado”.
- Acción “Cancelar” (opcional) mientras `pending`.
- Acción “Agregar al Carrito” sólo en `accepted` + dentro de ventana.

SupplierOffer.jsx:
- Estados visibles: pending (acciones: accept / reject), accepted (sin timer), rejected, expired, buyer_window_expired, converted.
- Mostrar marca si la oferta ya expiró del lado buyer (`buyer_window_expired`).

AddToCartModal.jsx:
- Cuando se abre desde oferta aceptada, forzar quantity fija (no editable) y precio inmutable.

Cart / Checkout:
- Separar ítems “Ofertado” visualmente (línea, badge, agrupación). No mezclar cantidades en la misma fila de producto standard.

Orders (Buyer & Supplier views):
- Mostrar ítems de oferta con badge.
- Link back a la oferta (opcional) para auditoría.

## 11. Lógica de Validación Backend (Resumen Contractual)

Operación: Create Offer
Entradas: buyer_id, product_id, quantity, proposed_price
Validaciones:
1. Producto activo, no soft-deleted.
2. quantity > 0 y <= product.max_quantity (si definida).
3. quantity <= product.productqty (stock disponible) → Nota: No reservamos aún; es un snapshot de disponibilidad.
4. No exceder número máximo de ofertas activas simultáneas por buyer/product (anti-spam) – parámetro tunable.

Operación: Accept Offer (Supplier)
1. status='pending'.
2. now() <= pending_expires_at.
3. Lock producto, verificar stock >= quantity.
4. Descontar stock + crear reserva + actualizar oferta a accepted.

Operación: Reject Offer
1. status='pending'.
2. Marcar `rejected`.

Operación: Add Offer Item to Cart / Convert
1. status='accepted'.
2. now() <= buyer_window_expires_at.
3. quantity exacta.
4. Insertar en items JSON con source='offer'.
5. Marcar oferta converted.

Operación: Expire Pending
1. status='pending' y tiempo vencido.
2. status='expired'.

Operación: Expire Buyer Window
1. status='accepted' y tiempo vencido.
2. Reponer stock y status='buyer_window_expired'.

## 12. Auditoría de Cambios de Estado

Tabla: `offer_events`
```
id uuid PK
offer_id uuid FK offers
prev_status text
new_status text
actor_id uuid NULL (system o user)
actor_role text NULL ('buyer','supplier','system')
event_type text CHECK (event_type IN ('create','accept','reject','expire_pending','expire_buyer_window','convert','cancel','invalidate'))
payload jsonb
created_at timestamptz default now()
```
Índice: (offer_id, created_at).

## 13. Seguridad / RLS (Supabase)

RLS para `offers`:
- Buyer: SELECT sus ofertas; INSERT; UPDATE sólo si `status='pending'` y cambia a `cancelled_by_buyer` (si se permite).
- Supplier: SELECT ofertas donde `supplier_id=auth.uid()`. UPDATE para aceptar/rechazar.
- System (edge functions/service role): puede ejecutar expiraciones y conversiones.

RLS para `stock_reservations` y `offer_events`: en general sólo service role / lectura audit limitada.

## 14. Estrategia de Migraciones

1. Crear enums (opcional) o CHECK constraints.
2. Crear tablas `offers`, `stock_reservations`, `offer_events`, `product_stock_movements`.
3. Añadir índices.
4. Añadir políticas RLS (si activado en schema público) y habilitarlas.
5. Actualizar lógica Edge Functions (checkout / khipu) para detectar `offer_id`.
6. UI consume endpoints nuevos (RPCs o REST) para flujos aceptar/rechazar/convertir.

## 15. SQL Propuesto (Esquema Base)

```sql
-- 1. Tabla principal de ofertas
CREATE TABLE public.offers (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id uuid NOT NULL REFERENCES public.products(productid),
	buyer_id uuid NOT NULL REFERENCES public.users(user_id),
	supplier_id uuid NOT NULL REFERENCES public.users(user_id),
	unit_price numeric NOT NULL CHECK (unit_price >= 0),
	currency text NOT NULL DEFAULT 'CLP',
	quantity integer NOT NULL CHECK (quantity > 0),
	status text NOT NULL CHECK (status IN (
		'pending','rejected','accepted','converted',
		'expired','buyer_window_expired','cancelled_by_buyer','invalidated'
	)),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	pending_expires_at timestamptz NOT NULL,
	buyer_window_expires_at timestamptz,
	accepted_at timestamptz,
	converted_at timestamptz,
	rejected_at timestamptz,
	buyer_window_expired_at timestamptz,
	cancelled_at timestamptz,
	cancelled_reason text,
	product_snapshot jsonb,
	stock_reserved boolean NOT NULL DEFAULT false,
	reserved_quantity integer,
	reservation_id uuid,
	order_id uuid REFERENCES public.orders(id),
	items_hash_at_creation text,
	meta jsonb NOT NULL DEFAULT '{}'::jsonb,
	audit_version integer NOT NULL DEFAULT 1
);

CREATE INDEX idx_offers_buyer_id_created_at ON public.offers (buyer_id, created_at DESC);
CREATE INDEX idx_offers_supplier_id_status ON public.offers (supplier_id, status);
CREATE INDEX idx_offers_status_pending_expires_at ON public.offers (status, pending_expires_at) WHERE status='pending';
CREATE INDEX idx_offers_status_buyer_window_expires ON public.offers (status, buyer_window_expires_at) WHERE status='accepted';
CREATE UNIQUE INDEX idx_offers_order_id ON public.offers (order_id) WHERE order_id IS NOT NULL;

-- 2. Reservas de stock
CREATE TABLE public.stock_reservations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id uuid NOT NULL REFERENCES public.products(productid),
	offer_id uuid UNIQUE REFERENCES public.offers(id),
	quantity integer NOT NULL CHECK (quantity > 0),
	created_at timestamptz NOT NULL DEFAULT now(),
	released_at timestamptz,
	release_reason text CHECK (release_reason IN ('conversion','expiration','manual','rollback')),
	locked boolean NOT NULL DEFAULT false,
	integrity_hash text,
	meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_stock_reservations_product_id ON public.stock_reservations (product_id);
CREATE INDEX idx_stock_reservations_active ON public.stock_reservations (product_id) WHERE released_at IS NULL;

-- 3. Eventos de oferta
CREATE TABLE public.offer_events (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
	prev_status text,
	new_status text,
	actor_id uuid,
	actor_role text,
	event_type text NOT NULL CHECK (event_type IN (
		'create','accept','reject','expire_pending','expire_buyer_window','convert','cancel','invalidate'
	)),
	payload jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_offer_events_offer_id_created_at ON public.offer_events (offer_id, created_at);

-- 4. Movimientos de stock (si no existe ya algo similar)
CREATE TABLE public.product_stock_movements (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id uuid NOT NULL REFERENCES public.products(productid),
	movement_type text NOT NULL CHECK (movement_type IN (
		'offer_reserve','offer_release','offer_conversion','order_purchase','manual_adjust','restore'
	)),
	delta integer NOT NULL,
	related_offer_id uuid REFERENCES public.offers(id),
	related_order_id uuid REFERENCES public.orders(id),
	created_at timestamptz NOT NULL DEFAULT now(),
	meta jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_product_stock_movements_product_id ON public.product_stock_movements (product_id, created_at DESC);
```

## 16. Triggers Recomendados

1. `offers_set_updated_at` BEFORE UPDATE ON offers → `NEW.updated_at = now()`.
2. `offers_status_event_logger` AFTER UPDATE/INSERT → Inserta en `offer_events` (comparando estado previo vs nuevo). Para INSERT usar `prev_status = NULL, event_type='create'`.
3. (Opcional) `offer_stock_movement_logger` en cambios que implican reserva/liberación.

## 17. Edge Functions / RPCs Requeridos

1. `create_offer(product_id, quantity, unit_price)` → retorna oferta.
2. `supplier_accept_offer(offer_id)` → maneja transacción reserva.
3. `supplier_reject_offer(offer_id, reason)`.
4. `buyer_cancel_offer(offer_id, reason)` (si se habilita).
5. `convert_offer_to_cart(offer_id)` (o integrado en existing `add_to_cart`).
6. `cron_expire_offers()` → ejecutado por scheduler.

## 18. Integración con Pagos (Khipu)

- Al generar la orden para un offer, marcar `offer_id` en el item y saltar lógica de descuento adicional.
- Validar en webhook de pago que si el item tiene `source='offer'`, ya hay reserva; sólo registrar conversión final si no se hizo antes (idempotencia).
- Idempotencia: usar `order_id` como unique en `offers.order_id`.

## 19. Métricas y Observabilidad

KPIs:
1. Tasa de aceptación (accepted / pending).
2. Tasa de conversión (converted / accepted).
3. Tiempo medio de respuesta supplier.
4. Cantidad de expiraciones por falta de respuesta vs por falta de compra buyer.
5. Impacto en inventario (reservas activas / stock total).

## 20. Edge Cases y Errores Potenciales

| Caso | Mitigación |
|------|------------|
| Producto se desactiva mientras oferta está pending | Al aceptar validar `is_active=true`. Si no, rechazar con reason automático |
| Supplier cambia precio base | No afecta oferta (usamos unit_price ofertado + snapshot) |
| Buyer intenta convertir justo después de expirar | Lock + revalidación de tiempo antes de commit |
| Sobresuscripción de stock por múltiples aceptaciones | Locks + verificación antes de descontar |
| Oferta modificada manualmente (fraude) | Auditoría + `audit_version` + registro de eventos |
| Desfase horario (TZ) | Siempre usar `timestamptz` y `now()` DB |
| Reversión de stock fallida en expiración (error transaccional) | Reintentos en job + flag `locked` para evitar doble proceso |

## 21. Plan de Implementación Iterativo

Fase 1 (MVP): Tablas, creación oferta, aceptación, rechazo, expiración pending (cron), conversión (sin UI final pulida) + badge.
Fase 2: Ventana buyer 24h + expiración y reposición stock.
Fase 3: Auditoría extendida, métricas, movimientos stock, RLS robusta.
Fase 4: Optimización índices, throttling de ofertas, reportes.

## 22. Asunciones (Explícitas)

1. Una oferta es para un único producto y precio unitario lineal (no escalas). Si se requiere multi-product, se necesitaría tabla secundaria `offer_items`.
2. Compra parcial no soportada en MVP (debe comprar la cantidad completa ofertada).
3. Moneda única CLP por ahora.
4. Carrito soporta coexistencia de ítems estándar y ofertados.
5. Scheduler disponible (Supabase cron) cada 5-15 min (latencia aceptada para expiración). Para timers UI se usa countdown local basado en timestamps DB.

## 23. Posibles Extensiones Futuras

1. Counter-offers (negociación iterativa) → `offer_threads`.
2. Multi-currency o fijación de tipo de cambio snapshot.
3. Soporte de bundles (tabla `offer_items`).
4. Penalizaciones para buyers que dejan expirar ofertas.
5. Notificaciones push / email en cada transición (usar tabla `notifications`).
6. Reglas de pricing automático (aceptación automática bajo umbrales preconfigurados).

## 24. Resumen Ejecutivo

Se propone un modelo centrado en `offers` + `stock_reservations` + `offer_events` + `product_stock_movements` que garantiza:
- Integridad de stock via transacciones con locking.
- Trazabilidad completa de lifecycle.
- Separación semántica de ítems “Ofertado” en orders.
- Escalabilidad y extensibilidad futura (multi-product, negociación, analítica avanzada).

La solución minimiza riesgo de overselling y facilita análisis de performance comercial del canal de ofertas.

---

FIN DEL ANÁLISIS.

---

# Extensión de Análisis (Profundización Adicional)

> Sección agregada tras solicitud de profundizar aún más (componentes, riesgos, pruebas, seguridad, performance, fallback, edge cases avanzados, integración con ecosistema existente y gobernanza de datos). Numera a partir de 25 para no reenumerar lo previo.

## 25. Componentes Frontend: Responsabilidades y Contratos

### 25.1 OfferModal.jsx (Creación)
- Entradas: `productId`, `onSuccess(offer)`, `onClose()`.
- Estado interno: `quantity`, `unitPrice`, validaciones (min/max, stock disponible, formato monetario), loading para RPC.
- Validaciones UI previas a RPC:
	- `quantity <= productqty` (snapshot)
	- `quantity >= product.minimum_purchase` (si aplica)
	- `unitPrice > 0`
- Errores diferenciados (stock cambió, RLS denial, rate limit).
- Optimistic UI: mostrar oferta en lista buyer inmediatamente con flag `optimistic=true` (reemplazar al recibir server response).
- Accesibilidad: focus trap, teclado (Escape), labels aria.

### 25.2 BuyerOffer.jsx (Listado / Panel del Comprador)
- Funciones: listar ofertas paginadas o infinite scroll; filtros por estado (activos, convertidos, expirados); cron local para timers.
- Timer Rendering: calcular `remaining = expiresAt - nowClient + driftCompensation`; recalcular cada 1s/5s; pausar si pestaña oculta (Page Visibility API) para eficiencia (al reactivar recálculo inmediato).
- Acciones contextuales:
	- pending → (Cancelar?)
	- accepted → Agregar al carrito (solo mientras ventana activa)
	- buyer_window_expired → CTA deshabilitado + tooltip explicación
	- converted → link a Order
- Prevención de Falsos Timers: sincronizar cada N minutos con server para ajustar drift (guardar offset = serverNow - clientNow).

### 25.3 SupplierOffer.jsx (Panel Proveedor)
- Listado segmentado: `pending (primary)`, `recent decisions`, `accepted active`, `historical`.
- Acciones: Accept / Reject visibles solo para `pending` dentro de ventana.
- Indicadores: mostrar countdown 48h solo si se decide que el supplier también necesita ver tiempo restante para decidir (UX opcional; documento original: se pide timer en SupplierOffers.jsx para pending). Para `accepted` no mostrar segundo timer.
- Bulk Accept/Reject (futuro): UI para seleccionar múltiples pending (validar stock en batch → podría fallback a secuencial si fallos).

### 25.4 AddToCartModal.jsx (Conversión Oferta)
- Modo especial si `offerId` presente:
	- Quantity campo read-only.
	- Precio read-only.
	- Badge “Oferta Aceptada”.
	- Desactivar selección de tiers / negociación.
- Si ventana venció durante interacción → advertir y cerrar.

### 25.5 CartItem Component
- Nueva propiedad: `isOffer` (derivado de `source==='offer'`).
- Estilos diferenciados: borde, badge, tooltip con precio original (si se decide mostrar precio público vs negociado).
- Desactivar edición de cantidad para ítems ofertados (MVP) para evitar distorsiones.

### 25.6 PaymentMethod / Checkout Summary
- Agrupar: sección “Ítems Ofertados” + subtotal interno.
- Validación pre-submit: revisar si alguna oferta aceptada caducó (hacer mini RPC `validate_offers_in_cart(cartOfferIds[])`).

### 25.7 BuyersOrders / MyOrdersPage.jsx
- Render paralelo de ítems estándar y ofertados.
- Mostrar `offer_id` (para debugging interno – ocultable al usuario final) y icono/badge.
- Columna adicional (opcional) “Tipo” (Standard / Ofertado).

### 25.8 Notificaciones y Hooks React
- Hook `useOfferTimers(offers[])` centraliza cálculos y dispara re-renders throttled.
- Hook `useOfferActions()` encapsula llamadas RPC (aceptar, rechazar, convertir) + manejo de errores.
- Hook `useOfferSubscription()` → supabase realtime channel en tabla `offers` (escuchar cambios en `status`, `updated_at`) para UI reactiva.

## 26. Integración con Notificaciones Existentes

Estados generan notificaciones (tabla `notifications`):
1. `pending` (opcional → supplier) → type: `offer_created`.
2. `accepted` (buyer) → `offer_accepted` (incluye deadline buyer_window_expires_at).
3. `rejected` (buyer) → `offer_rejected` con reason.
4. `expired` (buyer + supplier) → `offer_expired_pending`.
5. `buyer_window_expired` (buyer) → `offer_expired_buyer_window`.
6. `converted` (supplier) → `offer_converted` (link a order).

Campos metadata sugeridos: `{ offer_id, product_id, quantity, unit_price, deadline }`.

## 27. Modelado Alternativo (Evaluado y Rechazado)

| Alternativa | Motivo rechazo |
|-------------|----------------|
| Reutilizar tabla `orders` con flag preliminar | Mezcla semánticas y complica métricas de conversión |
| Reservar stock al crear oferta | Riesgo de acaparamiento / desperdicio |
| Expiración lazy-only (sin job) | Stock retenido tras aceptación no liberado si buyer no abre app |
| Mutar `products` para embedder listas de ofertas | Escala pobre; acceso concurrente elevado |

## 28. Secuencias Críticas (Textual)

### 28.1 Creación → Aceptación
1. Buyer crea (pending, compute pending_expires_at).
2. Supplier acepta → lock product row → stock suficiente? → decremento → insertar reserva → update offer accepted + buyer_window_expires_at.
3. Emitir evento + notificación buyer.

### 28.2 Conversión
1. Buyer abre modal → valida tiempo.
2. Checkout RPC `convert_offer_to_order(offer_id)`:
	 - FOR UPDATE offer row.
	 - Verifica `status='accepted' AND now()< buyer_window_expires_at`.
	 - Crea order (o añade a existente en estado pending) con item marcado.
	 - Actualiza offer `converted` + `converted_at`.
	 - Marca stock_reservation released reason `conversion` (o deja sin release si se interpreta como consumo final; documentar escogencia).

### 28.3 Expiración buyer window vs conversión simultánea
1. Job expira: toma lista offers accepted vencidas FOR UPDATE SKIP LOCKED.
2. Si lock falla (conversión en curso) → omite (reintenta próximo ciclo).
3. Conversión confirmada → estado `converted` → job futuro la ignorará.

## 29. Idempotencia y Reintentos

Operaciones sensibles:
- Accept Offer: usar `status` guard + audit_version. Reintento con mismo input no debe duplicar reserva (UNIQUE constraint offer_id en `stock_reservations`).
- Convert Offer: order_id UNIQUE en offers. Si RPC se corta tras crear order pero antes de respuesta → reinvocación detecta `order_id` existente y devuelve éxito idempotente.

## 30. Estrategia de Rate Limiting / Anti-Abuso

Reglas:
- Máx N ofertas activas (`pending|accepted`) por buyer por producto (ej. 3).
- Máx M ofertas nuevas por hora por buyer global (ej. 20) → tabla `offer_throttle` o usar `edge_function_invocations` + filtro.
- Bloqueo si ratio rechazo > X% (analítica futura).

### 30.1 Reglas NUEVAS (Específicas Solicitadas)

1. Límite: Un comprador puede realizar como máximo 2 ofertas para el MISMO producto dentro de una ventana calendario de 1 mes (date_trunc('month', now())).
2. Límite: Un comprador puede tener como máximo 5 ofertas ACTIVAS (statuses: `pending`, `accepted`) por proveedor (supplier) simultáneamente.

Definiciones:
- "Ofertas activas" = estado ∈ {pending, accepted} (no incluye expired, rejected, buyer_window_expired, converted, cancelled_by_buyer, invalidated).
- Ventana mensual: se computa contra `created_at` de la oferta (`date_trunc('month', created_at) = date_trunc('month', now())`). Note: si se desea rolling window 30 días cambiar a `created_at >= now() - interval '30 days'`.

Implementación (Backend create_offer RPC):
```sql
-- Validar límite mensual por producto
SELECT count(*) INTO v_cnt
FROM offers
WHERE buyer_id = p_buyer_id
	AND product_id = p_product_id
	AND date_trunc('month', created_at) = date_trunc('month', now());
IF v_cnt >= 2 THEN
	RAISE EXCEPTION 'LIMIT_PRODUCT_MONTH'; -- mapear a mensaje UI
END IF;

-- Validar límite activo por proveedor
SELECT count(*) INTO v_cnt2
FROM offers
WHERE buyer_id = p_buyer_id
	AND supplier_id = v_supplier_id
	AND status IN ('pending','accepted');
IF v_cnt2 >= 5 THEN
	RAISE EXCEPTION 'LIMIT_ACTIVE_SUPPLIER';
END IF;
```

Optimización índices sugeridos:
```sql
CREATE INDEX IF NOT EXISTS idx_offers_buyer_product_month ON public.offers (buyer_id, product_id, date_trunc('month', created_at));
-- Nota: Postgres no puede indexar directamente date_trunc sin expresión; usar índice funcional:
CREATE INDEX IF NOT EXISTS idx_offers_buyer_product_month_func ON public.offers (buyer_id, product_id, (date_trunc('month', created_at)));

CREATE INDEX IF NOT EXISTS idx_offers_buyer_supplier_status ON public.offers (buyer_id, supplier_id, status)
	WHERE status IN ('pending','accepted');
```

Front-End (OfferModal.jsx) Pre-Check (Best-effort, no confiable para seguridad):
1. Fetch conteo histórico del mes para ese product (endpoint ligero / RPC `get_offer_stats(product_id)` → retorna `{count_this_month, active_by_supplier}`) para deshabilitar botón y mostrar mensaje "Límite mensual alcanzado".
2. Mostrar tooltip con: "Puedes hacer 2 ofertas por producto al mes. Ofertas activas por este proveedor: X/5".

Errores a mapear en UI:
| Código | Mensaje Recomendado |
|--------|---------------------|
| LIMIT_PRODUCT_MONTH | Ya alcanzaste el límite de 2 ofertas para este producto este mes. |
| LIMIT_ACTIVE_SUPPLIER | Alcanzaste el máximo de 5 ofertas activas con este proveedor. |

Alternativa Técnica (No recomendada): trigger BEFORE INSERT contando. Rechazada porque se requiere lógica condicional y control de mensajes + desacoplar de inserts directos (preferible centralizar en RPC). Si se mantiene abierto a inserts directos, entonces sí añadir trigger.

Invariante adicional:
`∀ buyer, product: count_month(buyer, product) ≤ 2`
`∀ buyer, supplier: active_count(buyer, supplier) ≤ 5`

Monitoreo métrica: porcentaje de errores LIMIT_* / ofertas creadas totales para detectar fricción UX.

## 31. Seguridad y Threat Model (Resumen STRIDE)

| Amenaza | Mitigación |
|---------|-----------|
| Spoofing (buyer intenta aceptar) | RLS + verificación supplier_id=auth.uid() |
| Tampering (modifica price en frontend) | Server-side valida unit_price no cambia tras creación (inmutable) |
| Repudiation | `offer_events` con actor + timestamps |
| Information Disclosure | Limitar SELECT a ofertas propias; usar columnas filtradas |
| DoS (crear muchas ofertas) | Rate limit + índices selectivos |
| Elevation (cambiar status arbitrario) | RPC controlado; UPDATE directo bloqueado por RLS |

## 32. RLS Ejemplos (Esbozo)
```sql
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_select_buyer ON public.offers
	FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY offers_select_supplier ON public.offers
	FOR SELECT USING (supplier_id = auth.uid());

CREATE POLICY offers_insert_buyer ON public.offers
	FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Updates sólo por supplier en pending (accept/reject)
CREATE POLICY offers_update_supplier ON public.offers
	FOR UPDATE USING (supplier_id = auth.uid() AND status='pending');

-- Cancel buyer (opcional)
CREATE POLICY offers_cancel_buyer ON public.offers
	FOR UPDATE USING (buyer_id = auth.uid() AND status='pending');
```

## 33. Migración y Rollout Seguro

1. Deploy tablas nuevas sin usar.
2. Backend: agregar RPCs / Edge Functions.
3. Feature Flag `offers_enabled` en config (DB o env) para UI.
4. Activar creación de ofertas a subset (beta testers) → RLS condicional (lista allowlist).
5. Monitorear métricas stock y reservas activas.
6. Expandir a todos.

Rollback: desactivar flag → no nuevas ofertas; existentes siguen flujo expiración natural.

## 34. Observabilidad y Logging Avanzado

- Incluir `offer_id` en structured logs de conversión y pagos.
- Dashboards: Promedio tiempo aceptación, ratio conversión, stock bloqueado (%), top productos ofertados.
- Alertas: stock reservado > X% del inventario total de un producto sobre umbral continuo 6h.

## 35. Performance / Escalabilidad

Consultas críticas indexadas: listados supplier por estado, expiraciones por deadline. Uso de índices parciales reduce bloat.
Estimación inicial: volúmenes moderados (<100k ofertas) → viabilidad con Postgres sin partición. Plan futuro: particionar `offers` por mes si supera ~5M filas.
Vacuum: altas tasas de updates (cambios de status) → autovacuum tuning (scale factor bajo). Minimizar updates innecesarios (no tocar fila salvo cambio real de status).

## 36. Testing Strategy (Pirámide)

### Unit
- Validadores de creación (precio, cantidad).
- Cálculo de expiraciones.

### Integration (DB + RPC)
- Accept while pending.
- Reject then attempt accept (debe fallar).
- Simultaneous accept de dos ofertas que exceden stock (una falla).
- Convert justo antes de buyer_window_expires.
- Expiration job re repone stock.

### E2E (Playwright / Cypress)
- Crear → aceptar → convertir → verificar badge en order.
- Crear → dejar expirar pending.
- Crear → aceptar → dejar expirar buyer window → stock vuelve.

### Property Tests (Opcional)
- Secuencias aleatorias de accept/reject/convert/expire sin romper invariantes (stock final >=0, suma movimientos = delta inicial - final).

## 37. Invariantes Formales

1. Para toda offer: si `status IN ('accepted','converted','buyer_window_expired')` entonces `stock_reserved=true`.
2. Suma de `product_stock_movements.delta` por producto + stock inicial = stock actual.
3. Offer `converted` implica `order_id IS NOT NULL` y item con `offer_id` presente en order.
4. `buyer_window_expires_at IS NOT NULL` ssi `accepted_at IS NOT NULL`.

## 38. Fallbacks y Recuperación de Errores

| Fallo | Fallback |
|-------|---------|
| Job expiración cae | Próxima corrida procesa backlog (usar índices) |
| Error al reponer stock en expiración | Log crítico + reintento con tabla de dead-letter (pending actions) |
| Conversión crea order pero no actualiza offer (timeout) | Reintento puede detectar order_id vía búsqueda por relation (transacción debe ser atómica idealmente) |
| Doble submit Accept | UNIQUE en reserva y verificación status evita duplicación |

## 39. Edge Cases Adicionales

1. Producto archivado tras aceptación (pero antes de conversión): permitir conversión (porque stock ya reservado) o bloquear? Recomendado permitir.
2. Supplier elimina producto completamente: prohibir mientras haya offers `accepted` no convertidas (usar FK ON DELETE RESTRICT).
3. Cambio de IVA / taxes: la oferta fija sólo precio unitario neto; recalcular impuestos en checkout; almacenar snapshot si se requiere fiscalización.
4. Migraciones de spec del producto: `product_snapshot` asegura integridad histórica.

## 40. Consistencia con `edge_function_invocations`

Registrar invocaciones clave: `create_offer`, `accept_offer`, `convert_offer`. Permite correlación tiempo de respuesta y SLA.

## 41. Internacionalización (i18n)

Mensajes de estado: map central `offerStatusLabels = { pending: 'Pendiente', ... }` para soportar futuro multi-idioma sin duplicar strings en componentes.

## 42. Feature Flags y Config Dinámica

Tabla `feature_flags` o uso de `public.settings` con pares clave valor: `offers.max_active_per_product`, `offers.pending_hours`, `offers.buyer_window_hours` para permitir tuning sin redeploy.

## 43. Política de Datos y Retención

Retención: Ofertas terminales > 18 meses → archivadas (mover a tabla histórica) para reducir tamaño índices.

## 44. Alternativa Event-Driven (Futuro)

Emitir eventos (NOTIFY / Webhook interno) `offer.accepted`, `offer.converted` para integraciones (analytics pipeline, CRM, email marketing).

## 45. Métricas de Calidad / Salud

| Métrica | Objetivo |
|---------|----------|
| % ofertas respondidas <12h | >90% |
| % accepted que convierten | >60% (ajustable) |
| Stock reservado inactivo (>2h post expiración) | 0 |
| Tasa errores RPC offers | <0.5% |

## 46. Consideraciones de Costo

Índices parciales minimizan almacenamiento. Eventos pueden crecer: rotar o comprimir (p.ej. migrar eventos > 6 meses a storage externo si volumen alto).

## 47. Checklist de Implementación Técnica (Detallado)

- [ ] Tablas núcleo creadas.
- [ ] Índices parciales creados.
- [ ] Triggers updated_at y eventos.
- [ ] RPC create / accept / reject / convert / expire.
- [ ] RLS estrictas + tests.
- [ ] UI componentes con flag feature.
- [ ] Hook timers centralizado.
- [ ] Notificaciones integradas.
- [ ] Khipu integración ajustada (no doble descuento).
- [ ] Tests unit + integration + E2E mínimos.
- [ ] Dashboard métricas básicas.
- [ ] Validaciones límites: 2 ofertas/mes/producto y 5 activas/proveedor implementadas en RPC + tests.
- [ ] Índices para soportar conteos de límites creados.
- [ ] Mensajería UI para límites y tooltips informativos.

## 48. Código Esbozo RPC (Fragmentos Simplificados)
```sql
CREATE OR REPLACE FUNCTION public.accept_offer(p_offer_id uuid)
RETURNS void AS $$
DECLARE
	v_offer RECORD;
	v_product RECORD;
BEGIN
	SELECT * INTO v_offer FROM offers WHERE id = p_offer_id FOR UPDATE;
	IF v_offer.status <> 'pending' THEN
		RAISE EXCEPTION 'Invalid status';
	END IF;
	IF now() > v_offer.pending_expires_at THEN
		RAISE EXCEPTION 'Offer expired';
	END IF;
	SELECT * INTO v_product FROM products WHERE productid = v_offer.product_id FOR UPDATE;
	IF v_product.productqty < v_offer.quantity THEN
		RAISE EXCEPTION 'Insufficient stock';
	END IF;
	UPDATE products SET productqty = productqty - v_offer.quantity WHERE productid = v_offer.product_id;
	INSERT INTO stock_reservations(product_id, offer_id, quantity) VALUES (v_offer.product_id, v_offer.id, v_offer.quantity);
	UPDATE offers SET status='accepted', accepted_at=now(), stock_reserved=true, reserved_quantity=quantity,
				 buyer_window_expires_at = now() + interval '24 hours'
		WHERE id = v_offer.id;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;
```
Nota: Ajustar SECURITY DEFINER / RLS según roles.

## 49. Riesgos Principales y Mitigaciones

| Riesgo | Severidad | Mitigación |
|--------|-----------|-----------|
| Overselling por carrera | Alta | Locks + verificación stock antes de aceptar |
| Stock no repuesto tras expiración | Media | Job retries + monitoreo métricas |
| Latencia alta en listado ofertas | Media | Índices + paginación keyset |
| Abuso (spam ofertas) | Media | Rate limit + límites activos |
| Inconsistencia JSON items | Media | Validación server y tests |

## 50. Conclusión Extendida

El diseño ampliado cubre capa de datos, lógica transaccional, seguridad, rendimiento, UX detallada, monitoreo y escalabilidad futura, reduciendo riesgos típicos (overselling, drift de temporizadores, abuso). Queda preparado para evoluciones como negociación iterativa y analítica avanzada sin refactor estructural mayor.

---
FIN DE LA EXTENSIÓN.


