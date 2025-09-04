## Análisis profundo: Por qué en un caso mono-proveedor se actualizó `supplier_parts_meta` (parte) y no la columna global `status`

### Contexto del incidente
Pedido (ejemplo en `Documentacion/order.json`):
- `id`: 96a6febc-a43c-4702-946a-8da236bf44c7
- `supplier_ids`: ["20e7a348-66b6-4824-b059-2c67c5e6a49c"] (sólo 1 proveedor → caso mono supplier)
- `status` global de la orden (columna `orders.status`): `pending`
- `supplier_parts_meta` (JSONB) contiene:
```json
{
	"20e7a348-66b6-4824-b059-2c67c5e6a49c": {
		"status": "accepted",
		"history": [
			{ "at": "2025-08-22T04:39:11.985Z", "to": "pending", "from": null },
			{ "at": "2025-08-22T04:39:53.038Z", "to": "accepted", "from": "pending" }
		]
	}
}
```
Se observa: la “parte” pasó a `accepted`, pero la columna global `status` permaneció en `pending`.

### Expectativa funcional declarada por negocio
En modo MONO supplier (1 proveedor involucrado) los botones de acción (aceptar / rechazar / despachar…) deberían mutar SOLO `status` global y NO utilizar la semántica de partes (`supplier_parts_meta`). La columna `supplier_parts_meta` debería emplearse únicamente cuando existe MULTI supplier (2+ proveedores en la misma orden de pago) para trackear estados independientes.

### Estado actual de la implementación (código revisado)
1. Migración `20250821120000_supplier_parts_meta.sql` introduce la columna JSONB sin default (correcto para distinguir `NULL`).
2. El webhook `process-khipu-webhook` inicializa siempre `supplier_parts_meta` si la orden tiene al menos un supplier (aunque sea 1). No discrimina entre mono y multi: cualquier lista `supplier_ids` no vacía genera meta con nodo(s) en `pending`.
3. La función edge `update-supplier-part-status` permite al proveedor mutar el nodo JSON de su supplier y NO toca la columna `orders.status`.
4. El servicio `orderService.updateSupplierPartStatus` (cliente) siempre invoca la edge function cuando el feature (Supplier Parts) está integrado en la UI de proveedor, sin condicionar por cardinalidad de suppliers.
5. El helper `splitOrderBySupplier` aplica un “overlay” de estados: si hay exactamente una clave en `supplier_parts_meta` y sólo un grupo de supplier, usa el status del nodo para la parte mostrada (lo que en UI oculta que `orders.status` quedó rezagado).

### Cadena causal detallada
| Paso | Componente | Qué sucede |
|------|------------|------------|
| 1 | Checkout + Pago | Se crea la fila `orders` con `status='pending'` y `supplier_ids=[<único>]`. |
| 2 | Webhook Khipu (`process-khipu-webhook`) | Inicializa `supplier_parts_meta` porque detecta suppliers (>=1). No verifica si es multi. Resultado: meta con un nodo en `pending`. |
| 3 | Proveedor accede UI | El listado usa `orderService.getOrdersForSupplier` → obtiene `orders.status` (still `pending`) y `supplier_parts_meta`. |
| 4 | UI muestra acciones | La lógica de acciones del proveedor (no incluida en attachments, pero inferida) decide usar `updateSupplierPartStatus` (edge function) para transicionar. No detecta “mono” para degradar a la ruta legacy `UpdateOrderStatus`. |
| 5 | Edge function `update-supplier-part-status` | Valida transición `pending -> accepted` dentro del nodo JSON y actualiza `supplier_parts_meta`. No actualiza `orders.status`. |
| 6 | Refresco UI | `splitOrderBySupplier` overlay toma el valor `accepted` del JSON y lo muestra como estado visible. La discrepancia (`orders.status` sigue en `pending`) queda silenciosa a menos que se inspeccione la fila sin overlay. |

### Resultado
En modo mono supplier se usó el flujo multi supplier (partes) provocando divergencia de fuentes de verdad: estado real del pago/orden vs estado parcial único. Esto contradice la regla de negocio deseada para MONO.

### Por qué ocurrió (5 Whys)
1. ¿Por qué `status` global no cambió? Porque se mutó sólo `supplier_parts_meta` vía edge function.
2. ¿Por qué se usó la edge function? Porque la UI no diferencia mono vs multi antes de elegir el mecanismo de actualización.
3. ¿Por qué la UI no diferencia? Falta de una capa de decisión (feature flag + cardinalidad) centralizada; se asumió nuevo modelo universal.
4. ¿Por qué se asumió universal? El diseño de Option A 2.0 buscó unificar flujos y el webhook inicializa meta aun con 1 supplier (no existió condición “>=2”).
5. ¿Por qué el webhook inicializa siempre? Para simplificar idempotencia e implementación sin introducir bifurcación temprana, posponiendo la política mono/multi (que no se implementó después).

### Riesgos de mantener la divergencia
1. Consultas analíticas / dashboards que lean `orders.status` subestimarán avance (creerán pedidos pendientes cuando están aceptados y enviados según parte única).
2. Lógica futura de derivación (ej. marcar delivered global cuando todos delivered) puede producir estados inconsistentes (el global nunca progresa si nunca se sincroniza mono).
3. Reprocesamientos / backfills que dependan de `status` para disparar notificaciones duplicarán acciones (porque “parece” que sigue pending).
4. Posibles confusiones de Soporte / Admin al auditar (audit logs vs vista proveedor).

### Evidencias en código que confirman el flujo
* `process-khipu-webhook`: bloque “Inicializar supplier_parts_meta si NULL” no filtra por número de suppliers → siempre inicializa.
* `update-supplier-part-status`: sólo actualiza JSON, jamás `orders.status`.
* `splitOrderBySupplier`: overlay explicito para mono (`if (supplierMeta && Object.keys(supplierMeta).length === 1)` aplica). Oculta inconsistencia.
* `order.json`: muestra mismatch real (`status='pending'` vs parte `accepted`).

### Opciones de corrección
#### Opción 1 (Recomendada): Rama de decisión mono/multi en capa de acciones
1. Determinar número de suppliers reales: `supplier_ids.length` (o derivar de items únicos).
2. Si `length === 1` → usar comando legacy (ej. `UpdateOrderStatus`) y NO llamar a `updateSupplierPartStatus`.
3. Si `length > 1` → usar edge function parcial.
4. Mantener inicialización universal de meta pero ignorarla (o sincronizarla) en mono.
	 - Al actualizar global en mono, también (opcional) reflejar el cambio en el nodo JSON para consistencia visual (o dejar meta como overlay redundante con mismo estado).

Ventajas: mínima refactorización, preserva infraestructura multi.

#### Opción 2: Cambiar política de inicialización en webhook
1. Sólo inicializar `supplier_parts_meta` si hay >=2 suppliers.
2. Para órdenes históricas mono que ya tienen meta, hacer backfill: propagar el estado global actual al nodo y luego NULLificar la columna cuando `Object.keys(meta).length === 1` (arriesga pérdidas de historial).

Riesgo: Necesita migración correctiva y limpieza de datos (más complejidad operativa).

#### Opción 3: Sincronización automática global<->parte para cardinalidad 1
1. Trigger (o edge function) que ante UPDATE de `supplier_parts_meta` con cardinalidad 1 propague `status` del nodo a `orders.status`.
2. También al revés: cambios globales replican nodo.

Riesgo: más caminos de actualización, potencial de bucles si no se controla origen (recomendado usar columna de marca `last_part_sync_at`).

### Recomendación concreta
Aplicar Opción 1 inmediatamente (cambio en UI / capa de servicio) + script de sincronización puntual:
1. Sincronizar datos existentes (pseudo SQL):
```sql
UPDATE public.orders o
SET status = (meta.value ->> 'status')::text
FROM LATERAL jsonb_each(o.supplier_parts_meta) meta
WHERE o.supplier_parts_meta IS NOT NULL
	AND jsonb_typeof(o.supplier_parts_meta) = 'object'
	AND (SELECT count(*) FROM jsonb_object_keys(o.supplier_parts_meta)) = 1
	AND o.status != (meta.value ->> 'status');
```
2. Ajustar `orderService.updateSupplierPartStatus` (o el lugar donde se decide) para que, si la orden es mono supplier, llame al flujo global (ya existente `UpdateOrderStatus`).
3. (Opcional) Después de estabilizar, decidir si mantenemos meta redundante en mono. Mantenerla simplifica evoluciones futuras (no borrar por ahora).

### Hook de decisión (pseudo código sugerido)
```js
async function transitionOrder(order, supplierId, toStatus) {
	const suppliers = order.supplier_ids || deriveSuppliers(order.items);
	if (suppliers.length === 1) {
		// caso mono
		await orderService.updateOrderStatus(order.id, toStatus);
		// (opcional) reflejar en meta si existe
		if (order.supplier_parts_meta?.[supplierId]) {
			await orderService.updateSupplierPartStatus(order.id, supplierId, toStatus, { mirrorOnly: true }); // flag interno
		}
	} else {
		await orderService.updateSupplierPartStatus(order.id, supplierId, toStatus);
	}
}
```

### Validación posterior (QA)
Casos a probar:
1. Mono supplier: aceptar → `orders.status` pasa a `accepted`; `supplier_parts_meta` opcionalmente sincronizado; no queda divergencia.
2. Mono supplier: rechazar tras pending → global `rejected` y nodo igual.
3. Multi supplier (2 proveedores): aceptar de uno sólo → `orders.status` permanece `pending` (o “estado pago”) y sólo nodo #1 cambia; nodo #2 sigue `pending`.
4. Multi supplier: ambos aceptan → nodos `accepted`; si se implementa derivación global, verificar coherencia.
5. Reintentos de webhook no rompen sincronización mono.

### Métricas / Monitoreo sugerido (detección temprana)
Query de divergencias (alerting temporal):
```sql
SELECT id, status, supplier_parts_meta
FROM public.orders
WHERE supplier_parts_meta IS NOT NULL
	AND (SELECT count(*) FROM jsonb_object_keys(supplier_parts_meta)) = 1
	AND status != (SELECT (val->>'status') FROM jsonb_each(supplier_parts_meta) LIMIT 1);
```

### Conclusión
El comportamiento observado no es un bug aislado sino la consecuencia directa de haber aplicado el modelo “parts” de forma universal (>=1 supplier) sin introducir la rama de decisión mono vs multi exigida por negocio. La solución óptima es introducir esa rama en la capa de acciones y reconciliar el backlog histórico mediante una sincronización puntual, evitando cambios invasivos en el webhook. Esto restablece la fuente de verdad única (`orders.status`) para casos mono y conserva la escalabilidad multi proveedor ya implementada.

### Validación técnica adicional (segunda pasada detallada)
Profundizando en más archivos para confirmar que el análisis previo es correcto:

1. Hook de acciones proveedor `useSupplierPartActions.js`:
	- Siempre llama `orderService.updateSupplierPartStatus(orderId, part.supplier_id, newStatus, ...)` sin ninguna lógica condicional sobre `supplier_ids.length` (línea 17+). No existe fallback a `updateOrderStatus`.
2. Página `MyOrdersPage.jsx`:
	- Obtiene `partActions = useSupplierPartActions(supplierId)` (línea ~175) y en cada `switch(type)` ejecuta métodos `accept/reject/dispatch/deliver` → todos terminan en la edge function parcial. No hay rama mono.
3. Generación de “parts” en backend cliente `orderService.getOrdersForSupplier`:
	- Llama `splitOrderBySupplier` y para caso single supplier crea un solo part (still `is_supplier_part: false`) pero ya overlayea `status` con la clave única de `supplier_parts_meta` si existe (splitOrderBySupplier.js líneas 104–123). Esto provoca que la UI reciba un `status` ya transformado a display, ocultando la discrepancia global.
4. Doble traducción de estado:
	- `splitOrderBySupplier` convierte `accepted` -> `Aceptado` (display) al ponerlo en `part.status`.
	- Luego `ordersStore.fetchOrders` vuelve a ejecutar `orderService.getStatusDisplayName(order.status)` sobre algo que ya está en display; esa función devuelve el mismo string (porque no encuentra key), manteniendo consistencia aparente.
5. Ausencia de sincronización inversa:
	- No hay búsqueda que modifique `orders.status` al actualizar `supplier_parts_meta` (grep sobre `update({ status:` no muestra coincidencias asociadas a edge function parcial). Únicas rutas que tocan `orders.status`: comando `UpdateOrderStatus` y potencialmente procesos legacy (no usados por hook supplier parts).
6. Webhook `process-khipu-webhook` (líneas ~223–249):
	- Inicializa meta si `meta == null` y hay *al menos* un supplier en items. No filtra `supplier_ids.length > 1`.
7. Trigger/migración `supplier_ids` confirma que `supplier_ids` siempre refleja los suppliers del JSON de items (migración `20250821001000_add_supplier_ids_trigger.sql`). Esto garantiza que lógica de cardinalidad (si se implementa) puede confiar en el array.
8. Machine de estados global `OrderStatusService.js` se aplica sólo cuando se llama `UpdateOrderStatus` (no es llamada por la edge function parcial). Por tanto el control de transición global queda bypassed para mono cuando se usa el flujo parcial.
9. No existe política de derivación global (no encontramos tarea que derive global a partir de partes). Por eso el global permanece congelado en `pending`.
10. Riesgo secundario verificado: El chip de estado en `TableRows.jsx` se alimenta de `order.status` (ya overlay). Cualquier reporte que consulte directamente la tabla `orders` sin overlay verá otra realidad.

Conclusión de la segunda pasada: No emergió evidencia que contradiga el análisis original; las rutas de código confirman que el origen del problema es (a) inicialización universal de `supplier_parts_meta` + (b) ausencia de rama condicional mono/multi al invocar la función de transición + (c) overlay UI que enmascara la divergencia.

### Checklist de verificación (todo pasa)
- [x] Edge function sólo muta JSON → confirmado.
- [x] UI supplier nunca llama `UpdateOrderStatus` → confirmado.
- [x] Webhook inicializa meta en mono → confirmado.
- [x] No hay sincronización global←→parte para cardinalidad 1 → confirmado.
- [x] Overlay oculta divergencia → confirmado.
- [x] Datos concretos (order.json) muestran mismatch → confirmado.

No se identificaron errores en la explicación previa; se refuerza la recomendación propuesta.

---
Documento generado: 2025-08-22
Responsable análisis: AI Assist
