

---

# Opción A 2.0 – Estados por Proveedor SIN Materializar Tablas Nuevas

Objetivo: Mantener una sola fila en `orders` (pago, integridad, hash) y habilitar que cada proveedor de la misma orden pueda aceptar / rechazar / despachar / entregar de forma independiente, además de tener una fecha estimada (SLA) propia. Sin crear `supplier_orders` ni duplicar ítems.

---
## Resumen
Elemento | Decisión
---------|---------
Persistencia estados por proveedor | Columna JSONB `supplier_parts_meta` en `orders`
Duplicación de items | No (se siguen leyendo de `orders.items`)
Inventario adicional por parte | No (inventario ya descontado al pagar)
Estados independientes | Sí (por supplier_id dentro del JSON)
SLA (fecha estimada entrega parcial) | Campo opcional dentro de cada nodo supplier
Historial simple | Array `history` pequeño (máx 10 eventos) opcional
Derivar estado global | Inicialmente NO (parent actúa como contenedor de pago)
Feature flag | Opcional `FEATURE_SUPPLIER_PART_STATES`

---
## Migración Mínima
```sql
-- 1) Agregar columna SIN default para poder distinguir NULL (no inicializada) de objeto vacío
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS supplier_parts_meta jsonb;

-- 2) Índice (agregar sólo cuando necesites filtrar por supplier dentro del JSON)
--    Comienza simple; jsonb_path_ops no es necesario de inicio.
-- CREATE INDEX IF NOT EXISTS idx_orders_supplier_parts_meta ON public.orders USING GIN (supplier_parts_meta);
```
Razonamiento: Sin DEFAULT '{}' simplificamos la condición idempotente en el webhook / endpoint. Si ya existe un DEFAULT previo en producción, puedes normalizar con:
```sql
ALTER TABLE public.orders ALTER COLUMN supplier_parts_meta DROP DEFAULT;
UPDATE public.orders SET supplier_parts_meta = NULL WHERE supplier_parts_meta = '{}'::jsonb;
```

---
## Estructura JSON Propuesta
```json
{
  "<SUPPLIER_UUID>": {
    "status": "pending",             // required
    "estimated_delivery_date": "2025-08-28", // opcional (ISO date)
    "dispatched_at": null,            // timestamp cuando pasa a in_transit
    "delivered_at": null,             // timestamp cuando pasa a delivered
    "rejected_reason": null,          // texto si rejected
    "code": "POA-XYZ12",            // opcional: identificador corto mostrable
    "eta": "2025-08-28",            // alias corto opcional (si prefieres separar de estimated_delivery_date)
    "notes": "",                    // observaciones internas / proveedor
    "history": [                      // opcional, eventos recientes (FIFO, máx 10)
      { "at": "2025-08-21T10:00:00Z", "from": null, "to": "pending" },
      { "at": "2025-08-21T11:05:00Z", "from": "pending", "to": "accepted" }
    ]
  }
}
```

Reglas:
- Clave = `supplier_id` (UUID)
- Campo obligatorio mínimo: `status`
- `history[0].from` puede ser `null` (evento inicial)
- Limitar `history` a los últimos 10 eventos (FIFO)
- Campos opcionales (`code`, `eta`, `notes`) sólo si agregan valor; se pueden omitir sin romper el flujo.

---
## Estados Permitidos y Transiciones
Actual | Permitidos -> | Efectos
-------|----------------|--------
`pending` | `accepted`, `rejected` | Si pasa a `accepted` puedes calcular ETA si falta
`accepted` | `in_transit`[, `rejected`]* | `in_transit` set `dispatched_at`
`in_transit` | `delivered`, `cancelled` | `delivered` set `delivered_at`
`rejected` | (terminal) | Sin cambios posteriores
`delivered` | (terminal) | Sin cambios posteriores
`cancelled` | (terminal) | Sin cambios posteriores

*La transición `accepted -> rejected` es opcional. Elimínala si el negocio considera que un proveedor no puede revertir después de aceptar. En producción inicial se recomienda NO permitirla para evitar disputas salvo que haya un caso claro.*

Validación en código (ejemplo JS):
```js
const allowedTransitions = {
  pending: new Set(['accepted','rejected']),
  accepted: new Set(['in_transit'/*,'rejected'*/]), // activar 'rejected' si negocio lo aprueba
  in_transit: new Set(['delivered','cancelled']),
  delivered: new Set(),
  rejected: new Set(),
  cancelled: new Set()
};
function canTransition(from, to){ return allowedTransitions[from]?.has(to); }
```

---
## Flujo de Creación Inicial (Webhook Pago)
1. Webhook valida pago y `items_hash`.
2. Obtiene `supplier_ids` únicos desde `orders.items`.
3. Si `supplier_parts_meta` es NULL (no inicializado) crear objeto nuevo con cada supplier en `pending`.
4. Si existe y faltan claves para algún supplier nuevo (raro, pero idempotente) añadir sólo las ausentes.
4. Opcional: calcular `estimated_delivery_date` por supplier (p.ej. máximo `delivery_days` de sus ítems) e insertarla.
5. UPDATE único a la fila `orders` (condición `supplier_parts_meta IS NULL` para no sobrescribir cambios previos).

SQL idempotente (patrón):
```sql
-- Ejemplo para inicialización: (pseudo, normalmente harías esto en edge function)
UPDATE public.orders
SET supplier_parts_meta = <json_con_parts>
WHERE id = :order_id
  AND (supplier_parts_meta IS NULL OR supplier_parts_meta = '{}'::jsonb);
```

Pseudo (JS) inicialización:
```js
const now = new Date().toISOString();
let meta = order.supplier_parts_meta; // puede ser null
if (!meta || Object.keys(meta).length === 0) meta = {};
for (const sid of supplierIds) {
  if (!meta[sid]) meta[sid] = { status: 'pending', history:[{at: now, from: null, to: 'pending'}] };
}
if (!order.supplier_parts_meta) {
  await updateOrder({ supplier_parts_meta: meta }); // condición a nivel SQL: IS NULL
}
```

### Orden de inicialización vs inventory_processed_at
La inicialización debe realizarse ANTES de evaluar early-return por `inventory_processed_at` para garantizar que reintentos idempotentes no salten la creación de meta. Patrón:
1. Marcar pago (payment_status=paid) si aplica.
2. Inicializar `supplier_parts_meta` si NULL.
3. Si `inventory_processed_at` existe → return (idempotente) sin reprocesar inventario.
4. Procesar inventario / ventas.
5. Marcar `inventory_processed_at`.

---
## Actualización de Estado Parcial
Se expone una Edge Function / RPC `update_supplier_part_status`.
Entradas: `order_id`, `supplier_id`, `new_status`, opcional `estimated_delivery_date`, `rejected_reason`.
Pasos:
1. Autenticar (rol proveedor) y verificar que `supplier_id` pertenece al usuario loggeado.
2. Leer fila `orders`: obtener objeto meta.
3. Validar transición (tabla anterior).
4. Mutar campos (timestamps cuando corresponda).
5. Añadir evento a `history` (recortar >10).
6. Guardar con `jsonb_set` (o re-escribir blob completo si se hace en backend). Evitar condiciones de carrera (rápido y atómico).

Ejemplo aproximado (JS antes de persistir):
```js
const meta = order.supplier_parts_meta || {};
const part = meta[supplierId] || { status: 'pending' };
validateTransition(part.status, newStatus);
const now = new Date().toISOString();
const history = (part.history || []).concat({ at: now, from: part.status, to: newStatus }).slice(-10);
if (newStatus === 'in_transit' && !part.dispatched_at) part.dispatched_at = now;
if (newStatus === 'delivered' && !part.delivered_at) part.delivered_at = now;
if (newStatus === 'rejected' && rejectedReason) part.rejected_reason = rejectedReason;
part.status = newStatus;
part.history = history;
meta[supplierId] = part;
updateOrder({ supplier_parts_meta: meta });
```

*(Si se requiere pure SQL, usar `jsonb_set` anidado, pero la versión JS es más clara dado que se hace en una función server.)*

---
## UI (Buyer / Supplier)
- El split actual (`splitOrderBySupplier`) se mantiene.
- Para cada parte:
  - `partStatus = supplier_parts_meta[supplier_id]?.status || order.status`
  - `partETA = supplier_parts_meta[supplier_id]?.estimated_delivery_date || order.estimated_delivery_date`
  - Mostrar botones de acción sólo si usuario=proveedor dueño.
- Estados globales (parent) pueden ignorarse o mostrarse como “Estado general del pago”.

### Nota caso mono-supplier (legacy)
Si `splitOrderBySupplier` devuelve una sola parte donde `supplier_id` es `null` pero `supplier_parts_meta` tiene exactamente una clave, se puede usar el status de esa única clave para la parte (overlay) conservando compatibilidad.

### Acciones Proveedor
Botones contextuales según estado actual:
- pending: Aceptar / Rechazar
- accepted: Marcar En Tránsito / Rechazar (si negocio lo permite)
- in_transit: Marcar Entregado / Cancelar (si se soporta)
- delivered / rejected / cancelled: sin acciones

---
## Notificaciones (Opcional, lightweight)
Al cambiar estado parcial:
- Insertar notification `type='supplier_part_status'`, `context_section='supplier_part'`, `metadata={ supplier_id, new_status }`.
- Buyer y proveedor pueden ver timeline.

---
## Estrategia de Derivación (Diferida)
(Solo si luego quieres que el parent refleje progreso general)
- delivered si todas las partes delivered
- rejected si todas rejected (o mezcla de rejected + canceladas)
- in_transit si al menos una in_transit y ninguna pending
Implementar después de validación de negocio real.

---
## Métricas Futuras (Opcionales)
Clave | Cálculo
-----|--------
part_accept_latency | accepted_at - paid_at
part_delivery_latency | delivered_at - dispatched_at
accept_rate | accepted / total parts
rejection_reasons_top | agregación sobre rejected_reason

---
## Ventajas de Esta Aproximación
- Cambios mínimos (1 migración + pequeño parche webhook + endpoint update status).
- No duplica filas ni complica integridad (items_hash intacto). 
- Idempotente: si webhook re-ejecuta, simplemente re-mergea nodes (no daña estados existentes).
- Evoluciona a tabla dedicada sin migración destructiva (se puede exportar el JSON a filas luego).

## Limitaciones Aceptadas
- Query directa “todas las partes pending del proveedor X” necesita escanear orders (optimizable con índice GIN si escala).
- Historial inline simple (no auditoría exhaustiva). Si se requiere auditoría legal → tabla events.

---
## Backlog Futuro (Sólo si aparece necesidad)
Item | Motivo
-----|-------
Tabla `order_part_states` | Escalar reporting / filtros masivos
Auditoría eventos normalizada | Cumplimiento / analytics avanzados
Índice GIN sobre supplier_parts_meta | Rendimiento en dashboard proveedores
WebSocket updates por supplier_id | Realtime granular

---
## Estimación de Trabajo
Bloque | h
-------|--
Migración + webhook patch | 1
Endpoint update status (Edge) | 1
UI ajustes buyer + supplier | 2
Validaciones transición + notifs (opc) | 1
QA multi supplier | 1
Total | 5–6

---
## Checklist Implementación
[x] Migración columna JSONB (sin DEFAULT) + índice opcional
[x] Parche webhook: inicialización idempotente meta
[x] Overlay en `splitOrderBySupplier` (status / ETA por supplier + códigos display/part)
[x] Edge function / RPC `update_supplier_part_status`
[x] Validar transiciones (allowedTransitions centralizado en función)
[x] UI buyer refleja status parcial (chips usan status de la parte)
[x] UI supplier: hook acciones (`useSupplierPartActions`) + integración en MyOrdersPage
[ ] (Opc) Notificaciones por cambio de estado (versión básica incluida, revisar UI consumo)
[ ] QA: multi-proveedor, idempotencia, mono-supplier legacy

---
## Backfill Órdenes Existentes
Para órdenes ya pagadas (o en tránsito) anteriores a la migración:
```sql
UPDATE public.orders o
SET supplier_parts_meta = (
  SELECT jsonb_object_agg(sid::text, jsonb_build_object(
    'status','pending',
    'history', jsonb_build_array(jsonb_build_object('at', now(), 'from', null, 'to','pending'))
  ))
  FROM unnest(o.supplier_ids) sid
)
WHERE payment_status='paid'
  AND supplier_ids IS NOT NULL
  AND array_length(supplier_ids,1) > 0
  AND (supplier_parts_meta IS NULL OR supplier_parts_meta='{}'::jsonb);
```
Si la orden ya avanzó (ej. entregada globalmente) y quieres reflejarlo en todas las partes iniciales, reemplaza `'pending'` por el estado global relevante.

---
## Seguridad / RLS / Superficie de Escritura
- Preferir una Edge Function (service role) para mutar estados; NO exponer actualización directa de `supplier_parts_meta` desde el cliente.
- Si activas RLS en `orders`, crear política que permita UPDATE sólo al dueño (buyer) para campos no críticos; los proveedores no deben poder cambiar toda la fila. En cambio, la edge function valida `(auth.uid() = supplier_id objetivo)` antes de aplicar transición.
- Validar que `supplier_id` objetivo aparece en `supplier_ids` de la orden antes de mutar.

Pseudocheck en función update:
```js
if (!order.supplier_ids.includes(supplierId)) throw new Error('SUPPLIER_NOT_IN_ORDER');
```

---
## Invariantes Clave
1. `orders.items` y `items_hash` son inmutables tras `finalize_order_pricing` (salvo refactor explícito con resellado).
2. Cada clave de `supplier_parts_meta` ∈ `supplier_ids`.
3. Transiciones sólo permitidas según `allowedTransitions`.
4. `history` máx 10 eventos (recorte FIFO).
5. `inventory_processed_at` se marca una única vez; meta debe existir antes del early-return.
6. No se calculan montos parciales dentro de meta (evita discrepancias contables).

---
## Concurrencia / Locks
Usar `SELECT ... FOR UPDATE` sobre la fila de `orders` en la función de actualización parcial antes de leer/modificar meta para prevenir lost updates.

---
## Observabilidad Sugerida
- Log inicialización: `initialized_supplier_parts_meta order=<id> suppliers=<n>`.
- Log transición: `supplier_part_transition order=<id> supplier=<sid> from=<old> to=<new>`.
- Métrica conteo transiciones exitosas vs fallidas (por validación) para detectar abuso.

---
## Nota sobre ETA vs estimated_delivery_date
Se prefiere usar únicamente `estimated_delivery_date` (mantener `eta` como alias opcional si ya está en uso). Si ambos existen en un nodo, UI prioriza `estimated_delivery_date`.

---
## Fallback Sanitizer (Opcional)
Job periódico que asegura meta presente:
```sql
UPDATE public.orders o
SET supplier_parts_meta = '{}'::jsonb
WHERE supplier_parts_meta IS NULL
  AND payment_status='paid';
-- Luego un proceso reinyecta claves faltantes según supplier_ids.
```

---
## TL;DR
Agrega `supplier_parts_meta` a `orders` y úsalo como mini state machine por proveedor. Logras aceptación / rechazo / despacho independientes sin crear tablas nuevas ni duplicar ítems. Escalas a modelo persistido más rico solo si las métricas/reportes lo exigen.