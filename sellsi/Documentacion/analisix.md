# Análisis Profundo Flujo Orden de Pago Única + Pedidos por Proveedor

## Objetivo de Negocio
Un comprador paga un carrito completo (8 ítems de distintos proveedores) generando:
- 1 Orden de Pago (Payment Order) = nivel carrito (único ID de pago externo Khipu + UUID interno `orders.id`).
- N Pedidos por Proveedor (Order Parts) = agrupaciones de ítems por `supplier_id` para seguimiento logístico y estados independientes.

Ejemplo:
- Orden de pago: #K4153FC (representa totalidad del carrito)
- Pedidos derivados:
  - Proveedor A: #C239A3DC (2 ítems)
  - Proveedor B: #C919A3DC (3 ítems)
  - Proveedor C: #C749A3DX (3 ítems)

Actualmente el sistema ya tiene:
- Tabla `orders` (parent) con los ítems completos y campos de pago Khipu.
- Código que DERIVA dinámicamente partes (split) en frontend (`splitOrderBySupplier.js`).
- Tabla `supplier_orders` existente, pero el pipeline de materialización fue simplificado (Edge `process-khipu-webhook` ya NO crea supplier_orders).

## Situación Actual (Código / Infra)
| Componente | Estado | Observación |
|------------|--------|-------------|
| `orders` | Activo | Guarda todos los ítems y el `khipu_payment_id`.
| `supplier_orders` | Existe (persistencia) | Ya no se materializa en webhook; consultas la usan si existen filas legacy.
| Split por proveedor | Dinámico en frontend | `splitOrderBySupplier(order)` genera partes virtuales en memoria.
| Shipping prorrateado | Sí (en split virtual) | Distribuye shipping entre partes por proporción de subtotal.
| Integridad de precios | Sí | `finalize_order_pricing` sella y `items_hash` asegura integridad.
| Idempotencia inventario | Sí | Campo `inventory_processed_at`.
| Asociación pago → orden | Sí | Guardado en `orders.khipu_payment_id`.
| Asociación orden → partes | Virtual | No se generan IDs únicos independientes persistidos para cada parte.

## Gap vs Flujo Deseado
Requisito | ¿Cumplido? | Detalle
----------|-----------|--------
ID legible para Orden de Pago (#K4153FC) | Parcial | Se tiene UUID + `khipu_payment_id`. Falta formatear un "display code" estable.
IDs legibles para cada Pedido por Proveedor (#C239A3DC, etc.) | No (virtual sin código) | Split genera `synthetic_id` (parent + supplier) pero no un código human-friendly.
Persistencia de estados independientes por proveedor | Parcial | Front muestra partes, pero status cambia TODOS los ítems (status está en `orders`). `supplier_orders` permitiría granularidad si se re-activa.
Notificaciones / tracking por proveedor | Parcial | Algunos servicios referencian `supplier_orders` (legacy) y `notificationService` contempla `supplier_orders` context_section.
Re-intentos / conciliación pagos multi-proveedor | No necesario hoy | Un solo pago cubre todo (OK).

## Opciones de Implementación (Minimalista vs Persistente)
### Opción A: Mantener Split Virtual (Mínimo Esfuerzo)
Añadir sólo metadatos de presentación y derivación de estados.
1. Generar códigos display deterministas:
   - Para Payment Order: hash corto de UUID (ej. base32/CRC recortado) => `display_code`.
   - Para cada parte: hash(parent_uuid + supplier_id) => `part_display_code`.
   - Se puede generar en frontend sin tocar BD para evitar migraciones.
2. Estados independientes simulados: NO (seguiría un único estado global). Se mostrará mismo estado en cada parte.
3. Ventaja: Cero migraciones / menos complejidad.
4. Desventaja: No se puede aceptar / rechazar parcialmente ni tener SLA distinto real a nivel proveedor.

### Opción B: Reactivar Persistencia `supplier_orders` (Granular)
1. En `process-khipu-webhook` después de verificar integridad:
   - Agrupar items por `supplier_id`.
   - Insertar filas en `supplier_orders` si no existen (idempotencia por `parent_order_id+supplier_id`).
   - Calcular `subtotal`, `shipping_amount` prorrateado, `total`.
2. Crear tabla puente para items: (ya existe `supplier_order_items`). Insertar cada ítem con metadata.
3. Estados: `UpdateOrderStatus` ya contempla supplier_orders (verifica si el id provisto existe en esa tabla primero). Activar UI para cambiar estado por parte.
4. Generar códigos display persistidos (columna nueva en `supplier_orders`, ej. `display_code text UNIQUE`).
5. Ventaja: tracking y lifecycle por proveedor reales.
6. Desventaja: + lógica en webhook, migraciones y posibles conflictos en refactor futuro.

### Opción C: Híbrido
- Persistir sólo una tabla liviana `order_parts` (id, parent_order_id, supplier_id, subtotal, shipping_alloc, status, display_code) sin duplicar items (items siguen sólo en JSON de parent). Menos escritura.

## Recomendación según tu consigna ("lo justo y necesario")
Si hoy no necesitas estados divergentes por proveedor (p.ej. Proveedor A aceptó, B rechazó), implementa Opción A ahora y planifica Opción B sólo cuando la operación lo requiera.

## Implementación Concreta Opción A (Plan Corto)
Paso | Acción | Archivo(s)
-----|--------|----------
1 | Crear helper para generar código corto (base36/substring hash) | `src/domains/orders/shared/codeGen.js`
2 | En `splitOrderBySupplier`, adjuntar `display_code` y `part_display_code` (derivados) | `splitOrderBySupplier.js`
3 | En hook `useBuyerOrders`, exponer esos códigos para UI | `useBuyerOrders.js`
4 | En BuyersOrders.jsx (pendiente) mostrar jerarquía: Payment Order > Partes | (UI)
5 | Documentar convención en `Documentacion/analisix.md` | (listo)

Ejemplo de generación simple (determinista):
```js
function shortCode(uuid, prefix='') {
  // Quitar guiones, tomar primeros 10 chars, convertir base16→base36 para compactar
  const raw = uuid.replace(/-/g,'').slice(0,10);
  const num = parseInt(raw,16); // cuidado: cabe en JS (hasta 52 bits) con 10 hex ~ 40 bits
  return prefix + num.toString(36).toUpperCase();
}
```
Para partes: `shortCode(parent_id.slice(0,16) + supplier_id.slice(0,4), 'C')` (o hash con FNV/XXHash si quieres menor colisión — probablemente innecesario ahora).

Riesgo de colisiones: Muy bajo con 40 bits → si deseas <1e-9 probabilidad se puede usar 12 hex (~48 bits) o concatenar checksum simple (mod 97).

## Implementación Concreta Opción B (Resumen Técnico)
(Por si decides granularidad real a corto plazo)
1. Migración SQL:
   - UNIQUE (parent_order_id, supplier_id) en `supplier_orders`.
   - Añadir columna `display_code text` (index).
2. Webhook: después de pago:
```ts
// agrupar items
const parts = groupBySupplier(items);
for (const p of parts) {
  upsert supplier_orders({ parent_order_id, supplier_id, subtotal, shipping_amount, total, display_code });
  upsert supplier_order_items([...]);
}
```
3. UI: Detectar si existen filas en `supplier_orders` → usar persistido; si no, fallback a virtual split.
4. Estados: `UpdateOrderStatus` ya funciona (prioriza `supplier_orders`).

## Consideraciones de Integridad
Aspecto | Medida Actual | Ajuste sugerido
--------|---------------|----------------
Hash items (`items_hash`) | Verificación en webhook | Mantener; si se materializa, NO regenerar items distintos.
Idempotencia inventario | `inventory_processed_at` | Si re-materializas partes, marca también `parts_materialized_at` para debug.
Pago parcial | No soportado | Requiere motor de conciliación; fuera de alcance actual.
Cancelaciones parciales | No soportado | Sólo con Opción B.

## Qué Falta para Tu Ejemplo Exacto
Elemento | Status | Acción mínima
---------|--------|--------------
Código tipo #K4153FC | Falta | Derivado local de `orders.id` y mostrado en UI.
Códigos parte (#C239A3DC, etc.) | Falta | Derivados (parent+supplier) en split virtual.
Separador visual Payment vs Partes | Falta | Componente BuyersOrders.jsx (no existe ahora) debe iterar Payment Orders -> luego parts.

## Próximos Pasos Sugeridos (Secuencia)
1. Añadir helper `codeGen.js` + actualizar `splitOrderBySupplier` (Opción A). 
2. Crear/editar BuyersOrders.jsx mostrando estructura jerárquica.
3. QA: Carrito con 2+ proveedores, verificar códigos estables tras refresh.
4. Si se requiere granularidad de estados → planificar Opción B.

## Señales para saber que necesitas Opción B
- Proveedores piden confirmar o rechazar sólo su parte.
- Requerimientos de SLA distintos por proveedor en la misma orden.
- Métricas operativas (fill rate por proveedor) sobre partes confirmadas.

## Resumen Ejecutivo
Tu arquitectura ya soporta 1 pago → N vistas de partes derivadas sin costo extra (split virtual). Para el objetivo actual (visualizar pedidos por proveedor) sólo necesitas generar y mostrar códigos legibles y mantener la orden principal como fuente de verdad de pago. No implementes persistencia adicional hasta que surja la necesidad de estados divergentes o reporting avanzado.

---
(Documento generado automáticamente — ajustar ejemplos de formato de código según estilo de tu UI)

## Opción B – Análisis de Esfuerzo Profundo (Materializar supplier_orders)

### 1. Alcance Exacto
Materializar (persistir) una fila por proveedor dentro de una orden pagada y opcionalmente las filas de ítems por parte, para permitir:
- Estados independientes por proveedor (aceptar / rechazar / in_transit / delivered) sin afectar a otros.
- SLAs diferenciados (`estimated_delivery_date` por parte).
- Métricas (revenue, fill rate) por proveedor sobre datos persistidos.
- Notificaciones y suscripciones realtime más precisas.

### 2. Componentes a Tocar
Área | Cambios | Complejidad
-----|---------|-----------
Edge Function `process-khipu-webhook` | Añadir bloque de materialización post pago (agrupación, upsert) | Media
Esquema DB | Índices + constraint + (opcional) nuevas columnas display_code | Baja
Repositorios Front (`SupplierOrdersRepository`) | Preferir persistido si existe; fallback virtual | Baja
Hook Buyer (`useBuyerOrders`) | Detectar existencia partes persistidas para no duplicar virtual | Baja
Hook Supplier (MyOrdersPage) | Mostrar partes persistidas | Baja
Comandos de estado (`UpdateOrderStatus`) | Ya soporta; revisar validaciones de transición si se añaden nuevos estados | Baja
Notificaciones | Asegurar uso de `supplier_orders` id para contexto, no sólo parent | Media
Scripts backfill | Script único para órdenes históricas (opcional) | Media
Observabilidad | Métricas: número de partes, tiempo creación, colisiones | Baja

### 3. Cambios en Base de Datos
SQL mínimo (Postgres / Supabase):
```sql
-- 1. Asegurar unicidad parent+supplier (idempotencia)
ALTER TABLE public.supplier_orders
  ADD CONSTRAINT supplier_orders_parent_supplier_key UNIQUE (parent_order_id, supplier_id);

-- 2. (Opcional) Código legible
ALTER TABLE public.supplier_orders ADD COLUMN IF NOT EXISTS display_code text;
CREATE INDEX IF NOT EXISTS supplier_orders_display_code_idx ON public.supplier_orders(display_code);

-- 3. (Opcional) Marcar materialización
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS parts_materialized_at timestamptz;
```
(Colisión: revisar si constraint ya existe antes de aplicar.)

### 4. Lógica Webhook (Pseudo-código)
```ts
if (payment_status pasa a paid && parts no materializadas) {
  const items = parse(order.items);
  const groups = groupBy(items, supplier_id);
  const alloc = allocateShipping(order.shipping, groups); // reutilizar algoritmo actual
  for (g of groups) {
    upsert supplier_orders ({
      parent_order_id: order.id,
      supplier_id: g.id,
      subtotal: g.subtotal,
      shipping_amount: alloc[g.id],
      total: g.subtotal + alloc[g.id],
      status: 'pending',
      payment_status: 'paid',
      estimated_delivery_date: deriveSLA(g.items, order.created_at) (opcional),
      display_code: genPartCode(order.id, g.id)
    }) on conflict (parent_order_id, supplier_id) do update set ... (solo campos derivables si faltan)

    batchInsert supplier_order_items (product_id, quantity, unit_price, price_at_addition, document_type, supplier_order_id)
    (usar delete+insert si quieres idempotencia simple; O bien upsert con onConflict sobre (supplier_order_id, product_id))
  }
  update orders set parts_materialized_at = now() where id = order.id and parts_materialized_at is null;
}
```

### 5. Idempotencia y Seguridad
Punto | Estrategia
------|----------
Múltiples webhooks (retries) | Constraint UNIQUE + `parts_materialized_at` para saltar segunda ejecución.
Cambio posterior de ítems | No soportado tras sello (hash); abortar si `items_hash` mismatch.
Inserciones parciales fallidas | Usar transacción (si se mueve a RPC o trigger) o secuencia defensiva con reintentos.
Rollback parcial | Si falla en items luego de crear la parte, intentar limpiar supplier_order o reintentar idempotente.

### 6. Generación de Códigos Display
Requisito | Opción | Esfuerzo
----------|--------|---------
Predictible + corto | base36(hash(parent + supplier)) | Muy bajo
Difícil de adivinar | base32(HMAC_SHA256(parent+supplier, SALT)).slice(0,8) | Bajo (requiere SALT opcional)

### 7. Plan de Backfill (Órdenes Históricas)
Escenario: Tienes órdenes `paid` sin partes.
Procedimiento:
1. Query: `SELECT id, items, shipping FROM orders WHERE payment_status='paid' AND parts_materialized_at IS NULL;`
2. Script Node o SQL DO que recorra y aplique la misma lógica de agrupación.
3. Registrar métricas (#orders procesadas, #partes creadas, #conflictos).
4. Ejecutar en ventana controlada (bajo tráfico) — volumen estimado bajo → riesgo mínimo.

### 8. Cambios Frontend (Detalle)
Archivo | Cambio
--------|-------
`SupplierOrdersRepository.js` | Añadir método `listPersistedByBuyer` que hace join implícito (ya existente listByBuyerParentOrders sirve — reutilizar).
`useBuyerOrders.js` | Paso previo: llamar un endpoint para ver si hay al menos una `supplier_orders` fila; si >0, usar persistidas; si 0, fallback virtual.
`splitOrderBySupplier.js` | Sin cambio para modo persistido; conservar como fallback.
UI BuyersOrders | Agrupar mostrando Payment Order (parent) y debajo partes persistidas (por `supplier_id`).
`UpdateOrderStatus.js` | SIN cambio (ya prioriza supplier_orders). Documentar que ahora se usarán estados independientes.
Notificaciones | Al crear partes, opcionalmente emitir notificación inicial ("Pedido creado") por proveedor.

### 9. Testing (Plan Mínimo)
Nivel | Casos
------|------
Unit (función agrupar) | 1 proveedor, multi proveedor, ítems sin supplier_id (ignorar), shipping=0, shipping redondeo.
Edge Webhook | Repetir webhook → no duplica partes; hash mismatch → aborta; orden ya materializada → idempotente OK.
Integration (DB) | Crear orden mock, simular pago, verificar filas supplier_orders + supplier_order_items correctas.
Front | Mostrar partes persistidas vs virtual Fallback; cambio de estado de una parte no afecta otra.
Backfill | Ejecutar script en dataset de prueba (N=5 órdenes) — resultados deterministas.

### 10. Riesgos y Mitigaciones
Riesgo | Impacto | Mitigación
-------|---------|-----------
Duplicados por race (dos webhooks simultáneos) | Constraint violation | UNIQUE + capturar error y continuar.
Inflado de writes (muchos ítems) | Ligeramente mayor latencia | Insert batch (multi-row) en vez de loop individual.
Estados inconsistentes (parent vs parte) | Confusión UI | Definir regla: parent.status = máximo avance común (o mantener como espejo inicial y no actualizar automáticamente).
Shipping prorrateo diferente a UI previa | Diferencia centavos | Reutilizar misma fórmula + test unidad.

### 11. Estimación de Esfuerzo (Orden de Magnitud)
Bloque | Horas (focus) | Comentario
-------|---------------|-----------
DB migration + feature flag | 0.5 | SQL simple
Webhook refactor + test local | 3 | Incluye agrupación + upsert + idempotencia
Repos + hooks frontend ajustes | 1.5 | Detección y fallback
UI representación (códigos, listas) | 1 | Tabla/lista simple
Notificaciones partes (opcional) | 1 | Condicional
Backfill script + ejecución | 2 | Incluye validación
QA manual + edge cases | 2 | Multi proveedores / idempotencia
Total mínimo | ~11 horas | Sin extras
Total con extras (notifs, SLA per supplier, código display SALT, métricas) | 14–16 horas | Buffer razonable

### 12. Roadmap de Despliegue Seguro
Fase | Acción | Criterio Go/No-Go
-----|--------|------------------
1 | Deploy migrations + código webhook detrás de flag (FLAG=disabled) | Build OK
2 | Activar flag sólo en staging, probar órdenes multi proveedor | Partes creadas correctamente
3 | Backfill staging, verificar UI | Sin errores ni duplicados
4 | Activar flag producción para nuevas órdenes (no backfill) | Errores < umbral
5 | Ejecutar backfill producción | Métricas OK, sin conflictos
6 | Quitar fallback virtual (opcional) | >95% órdenes con partes

### 13. Métricas Recomendadas
Nombre | Descripción
-------|------------
parts_created_count | Número de partes creadas
parts_per_order_distribution | Histograma (#proveedores por orden)
materialization_latency_ms | Tiempo desde `paid_at` hasta creación partes
idempotent_skips | Webhooks saltados por parts_materialized_at
constraint_conflicts | Violaciones UNIQUE atrapadas

### 14. Decisiones Pendientes (Definir Antes de Implementar)
Pregunta | Opciones
---------|---------
¿Estados parent se derivan de partes? | (a) No (independiente) (b) Sí (agregación mínima)
¿Actualizar shipping en parent si hay rounding diff? | (a) Ignorar (b) Ajustar último supplier
¿Generar display_code persistido ahora? | (a) Sí (b) Diferir (frontend-only primero)
¿Feature flag nombre? | `FEATURE_SUPPLIER_PARTS` u otro

### 15. Recomendación Final
Implementar faseada con flag + métricas. No introducir lógica de derivación de estado parent todavía; mantener parent como "Payment Container" y partes como unidades operativas. Añadir derivación más adelante (complejidad se duplica si sincronizas ambos sentidos de estado ahora).

---
