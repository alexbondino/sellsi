# Análisis Profundo `BuyerOrders.jsx` / `MyOrdersPage.jsx` y Ecosistema de Orders

Fecha: 2025-09-02
Objetivo: Mapear exhaustivamente estados, efectos, dependencias, transiciones y superficies de prueba para construir una batería de tests (unitarios + integración global) que validen el dominio de pedidos desde ambas perspectivas (Buyer / Supplier) y la nueva capa `ordersStore` + `orderService` + `useBuyerOrders` + `useSupplierPartActions`.

---
## 1. Componentes / Hooks Clave

| Artefacto | Tipo | Rol | Eventos / Acciones | Efectos secundarios |
|-----------|------|-----|--------------------|---------------------|
| `BuyerOrders.jsx` | Page React | Render de historial buyer (payment orders + supplier parts virtuales) | Paginación, highlight pago reciente, descarga de factura, apertura ContactModal | Suscripción realtime (orders + invoices), polling fallback, enriquecimiento de facturas, glow chips estado |
| `useBuyerOrders(buyerId)` | Hook | Fetch + split + enrich + realtime + polling | `fetchOrders`, actualizaciones `payment_status`, inserción facturas | Supabase channel, timers, merges inmutables |
| `MyOrdersPage.jsx` | Page React | Gestión de pedidos por supplier (vista operacional) | Filtro estado, apertura modales (accept / reject / dispatch / deliver), subida PDF factura (en dispatch) | Inicializa store Zustand, suscripciones realtime (store), banner feedback, validación fechas |
| `useOrdersStore` | Zustand store | Fuente de verdad de supplier: pedidos + filtros + stats | `initializeWithSupplier`, `fetchOrders`, `refreshOrders`, `updateOrderStatus`, `searchOrders`, selectores | Llama `orderService.getOrdersForSupplier`, normaliza estados display, cálculo `isLate`, debounced realtime refresh |
| `useSupplierPartActions` | Hook | Abstracción para transiciones por parte de supplier (mono vs multi) | `accept`,`reject`,`dispatch`,`deliver`,`cancel` | Decide entre `updateOrderStatus` vs edge function `updateSupplierPartStatus` |
| `orderService` | Servicio | Acceso datos + commands + queries + edge functions | Varios métodos listados | Import dinámico de use cases, invocación edge function, enrichment items |

---
## 2. Flujo Buyer (`BuyerOrders.jsx` + `useBuyerOrders`)

### 2.1 Cadena de Carga
1. Montaje: `useBuyerOrders` ejecuta `fetchOrders()` (si `buyerId` UUID válido) → `orderService.getPaymentOrdersForBuyer`.
2. Resultado: Lista de payment orders (estado pagado + maybe pending) → `mergeAndSplit` → `splitOrderBySupplier` genera parts virtuales.
3. Enrichment: Tabla `invoices_meta` → asigna `invoice_path` deduplicado por supplier/order.
4. Estado final: `orders` = array de parts (cada part representa relación supplier-buyer dentro de payment order).

### 2.2 Realtime & Polling
- Canal realtime `subscribeToBuyerPaymentOrders`: UPDATE → actualiza `payment_status` in-place; INSERT → refetch completo.
- Canal realtime `invoices_meta` INSERT → injerta `invoice_path` en items afectados.
- Polling (cada 15s) si existen payment orders con `payment_status !== 'paid'` AND no eventos realtime recientes (umbral 2 intervalos).

### 2.3 Normalizaciones / Edge Cases
- Fallback ETA: Si part no trae `estimated_delivery_date` hereda de payment base.
- Documentos tributarios agrupados por supplier (no por item) → `InvoiceDownload` multi-limit (throttling localStorage).
- Highlight “Pago Confirmado” temporal (12s) mediante `recentlyPaid` Set.
- Cancelación: Si `cancelled_at` o `status === 'cancelled'` fuerza chips a bloque de rechazo.
- Chips: Etapas lineales (Pago -> Aceptado -> En Transito -> Entregado) + Rechazado/Cancelado override.

### 2.4 Riesgos
- Duplicación de parts mitigada por mapa (`parent_order_id-supplier_id`).
- Race conditions: Enriquecimiento de invoices puede llegar después del render inicial → UI reactiva.
- Potencial memory leak si canales no se desuscriben (cleanup implementado).

---
## 3. Flujo Supplier (`MyOrdersPage.jsx` + `useOrdersStore` + `useSupplierPartActions`)

### 3.1 Inicialización
1. Autenticación asincrónica `supabase.auth.getUser()` → fija `supplierId` / `authResolved`.
2. `initializeWithSupplier` → set supplierId → `fetchOrders()` + `subscribeRealtime()`.
3. `fetchOrders`: `orderService.getOrdersForSupplier` con filtros → parts (cada part ya es contexto del supplier). Enrich: dirección, productos, display status, SLA derivado.

### 3.2 Realtime
- Dos canales: `orders` (filtra `supplier_ids`) y `supplier_orders` (tabla parts) → ambos disparan `__debouncedRefresh()` → `refreshOrders()` (timeout 1s debounced) para minimizar tempestades de updates.

### 3.3 Acciones Modales
| Acción | Handler | Servicio Final | Efectos | Validaciones |
|--------|---------|----------------|---------|-------------|
| Accept | `partActions.accept` | `updateOrderStatus` (mono) o `updateSupplierPartStatus` (multi) | Banner success | N/A |
| Reject | `partActions.reject` | idem | Banner, requiere reason (opcional backend) | N/A |
| Dispatch | `partActions.dispatch` | idem | Banner, subida PDF (opcional/condicional), validación rango fecha (>= hoy, <= límite) | Fecha + PDF size/type |
| Deliver | `partActions.deliver` | idem | Banner success | N/A |

### 3.4 Validaciones de Fechas
- Input `deliveryDate` comparado usando `parseYMD` evitando timezone shifts.
- Auto-asignación +3 días si usuario no selecciona fecha (con banner informativo).
- Máximo permitido: `estimated_delivery_date` original (Fecha Entrega Límite)

### 3.5 Documentos Tributarios
- `supplierDocTypes` consultado desde `users.document_types` (filtra `ninguno`).
- En acción `dispatch` se puede subir PDF (<= 500KB, MIME `application/pdf`).
- Edge: error de upload no bloquea dispatch, solo warning.

### 3.6 Estados / Display
- Store convierte backend → display (e.g. `in_transit` → `En Transito`).
- Filtro UI compara backend via mapa inverso.
- `isLate` = (now > estimated_delivery_date && status !∈ terminales).

---
## 4. Mapa de Estados y Transiciones (Supplier Perspective)

```
pending ──accept──> accepted ──dispatch──> in_transit ──deliver──> delivered
	│  ╲reject                                   │
	│   └───────────> rejected/cancelled <───────┘ (cancel path o rollback externo)
```

Reglas:
- `dispatch` puede establecer/ajustar `estimated_delivery_date` (ETA) dentro de rango.
- `isLate` recalculado en cada actualización de estado.
- Cancelación externa (buyer) puede llegar via realtime → forzar banner en capa futura (no implementado aún en `MyOrdersPage`).

---
## 5. Superficie de Test (Cobertura Objetivo)

### 5.1 Unit Tests (futuros archivos `unit/` dentro de `orders/`):
1. `ordersStore` reducers / acciones puras:
	- `initializeWithSupplier` fija `supplierId` y dispara fetch.
	- `setStatusFilter` y selector `getFilteredOrders` (incluye casos: Todos, Atrasado, cada estado, edge mismatch display/backend).
	- `updateOrderStatus` optimistic update + revert on failure.
	- `calculateIsLate` a través de pedidos simulados.
2. `useSupplierPartActions` decisión mono vs multi supplier (mock supabase + orderService methods spy).
3. `mergeAndSplit` (aislado mediante import del hook, pasando fixtures de payment orders con supplier meta) — validar dedupe y overrides de status.
4. Utilidades de fecha `parseYMD`, `toLocalYYYYMMDD`, `todayLocalISO` (podemos exponer extract temporalmente vía refactor light o test indirecto con dispatch logic).
5. `InvoiceDownload` throttle: permitir <5 descargas, bloquear a partir de 6 dentro de ventana.

### 5.2 Integration Tests (en `orders/integration/`):
Escenario Global 1 (Supplier Lifecycle):
	- Mock `supabase.auth.getUser` → supplier UUID.
	- Mock `orderService.getOrdersForSupplier` → 1 order `pending` + meta multi-supplier (2 suppliers) y una mono-supplier.
	- Aceptar order mono-supplier → assert `updateOrderStatus` llamado.
	- Despachar part multi-supplier → assert edge `updateSupplierPartStatus` called con ETA válida.
	- Subir PDF invalido (>500KB) → muestra error helperText; subir válido → se permite submit.
	- Fecha fuera de rango (< hoy o > límite) → bloquea con banner error.
	- Entregar → estado final y recalculo `isLate=false`.

Escenario Global 2 (Buyer View Cohesión):
	- Mock `orderService.getPaymentOrdersForBuyer` → payment order con 2 suppliers, uno accepted+in_transit con ETA heredada, otro pending.
	- Simular realtime UPDATE a `payment_status='paid'` → highlight chip pago.
	- Insert invoice via channel → items reflejan `invoice_path` (solo chips visuales de doc tributario (no botón) manteniéndose).
	- Ver chips progresivos y override cuando `cancelled_at` llega via segundo UPDATE.

Escenario Global 3 (Cross Sync Buyer ↔ Supplier):
	- (Mock orchestrated) Supplier dispatch actualiza ETA → Buyer refetch (forzado) refleja ETA en part correspondiente.
	- Cancelación comprador (simulate) → Supplier store refresh → pedido display status `Cancelado` y filtrable.

### 5.3 Edge / Error Paths
- Falla `updateSupplierPartStatus` → revert optimistic (verificamos re-fetch natural o manual mock rejection).
- Falla enrich `invoices_meta` (throw) → test que UI no rompe y sigue mostrando pedidos.
- Polling: Simular ausencia realtime → avanza `payment_status` tras polling.

---
## 6. Fixtures Propuestos

```js
// supplierFixtures.js
export const paymentOrderMulti = ({ now = new Date() } = {}) => ({
  id: 'order-1', order_id: 'order-1', status: 'pending', payment_status: 'paid', created_at: now.toISOString(),
  supplier_ids: ['sup-A','sup-B'], accepted_at: null, estimated_delivery_date: null,
  items: [
	 { product_id: 'p1', quantity: 2, price_at_addition: 1000, product: { name: 'Prod A', supplier_id: 'sup-A' }},
	 { product_id: 'p2', quantity: 1, price_at_addition: 5000, product: { name: 'Prod B', supplier_id: 'sup-B' }},
  ],
  supplier_parts_meta: { 'sup-A': { status: 'accepted' }, 'sup-B': { status: 'pending' } }
});
```

---
## 7. Mock Strategy

- Centralizar mock de `orderService` en `__tests__/orders/mocks/orderServiceMock.js` exportando funciones jest.fn.
- Mock parcial de `supabase` (auth + channel stub + from().select().eq() chain minimal).
- Para realtime: exponer `triggerOrdersUpdate(payload)` desde mock que invoca callback registrado.
- Evitar dependencia en timers reales: usar `jest.useFakeTimers()` para highlight & polling.

---
## 8. Métricas de Cobertura Objetivo
- Ramas críticas de `useSupplierPartActions` (mono vs multi) 100%.
- Ramas de validación fecha dispatch (valida, < hoy, > límite) 100%.
- Path de error upload PDF y success.
- Polling branch (ejecutada) + realtime branch (ejecutada) en `useBuyerOrders`.
- Detección de cancelación vs rechazo en chips Buyer.

---
## 9. Riesgos de Flakiness y Mitigación
| Riesgo | Mitigación |
|--------|-----------|
| Tiempos asincrónicos reales (setTimeout 12s highlight) | Fake timers + avance manual |
| Dependencia de Date.now | Congelar fecha con `jest.setSystemTime` |
| Re-renders StrictMode | Evitar assertions reorder-sensibles, usar `findBy...` con timeout razonable |
| JSON parse dinámico en meta | Fixtures ya normalizados para tests unit |

---
## 10. Roadmap Incremental
1. Añadir mocks base + fixtures.
2. Tests unit `ordersStore` (filtros, update optimistic revert).
3. Tests unit `useSupplierPartActions` (mono/multi routing).
4. Tests integration Escenario Global 1 (supplier lifecycle).
5. Tests integration Escenario Global 2 (buyer realtime + invoices).
6. Tests integration Escenario Global 3 (cross sync) — opcional si tiempo.
7. Ajustar README tests global para documentar nueva suite.

---
## 11. Checklist de Casos (Vivirá junto a desarrollo de tests)

| ID | Caso | Estado |
|----|------|--------|
| S-1 | Filtro estado `Atrasado` | Pendiente |
| S-2 | Optimistic accept revert error | Pendiente |
| S-3 | Dispatch fecha auto + validación rango | Pendiente |
| S-4 | Upload PDF inválido (tipo/tamaño) | Pendiente |
| S-5 | Mono vs Multi supplier routing | Pendiente |
| B-1 | Highlight pago (recentlyPaid) | Pendiente |
| B-2 | Chips cancelado vs rechazado | Pendiente |
| B-3 | Realtime invoice insert | Pendiente |
| B-4 | Polling fallback actualiza status | Pendiente |
| X-1 | ETA se propaga buyer tras dispatch supplier | Pendiente |
| X-2 | Cancel buyer refleja supplier (status Cancelado filtrable) | Pendiente |

---
## 12. Notas Finales
- No se tocan implementaciones productivas antes de cubrir tests base.
- Si se requiere exponer utilidades internas (fecha) se evaluará micro-refactor no disruptivo.
- Prioridad: Integración Supplier Lifecycle (riesgo mayor de regresión operativa).

Fin del análisis profundo inicial.

---
## 13. Extensión: Pedidos con Items Ofertados ("Ofertado")

Esta sección responde a la pregunta: ¿El análisis y plan de tests contemplan la llegada de pedidos que contienen productos provenientes del sistema de ofertas (offer_id, offered_price, isOffered)? Ahora sí.

### 13.1 Origen de los datos
Cuando una oferta aceptada se agrega al carrito (flujo descrito en `analisix.md`), el item viaja con metadatos:
```
item = {
	product_id,
	quantity: offered_quantity,
	price_at_addition: offered_price (fijo),
	offered_price,          // redundante pero usado en varias capas
	offer_id,               // identifica la oferta
	isOffered: true,        // bandera directa (o dentro de metadata)
	metadata: {
		isOffered: true,
		offer_id
	}
}
```
Al consolidarse la order/payment order, estas propiedades terminan dentro de `orders.items`. Ni `useBuyerOrders` ni `orderService.getOrdersForSupplier` alteran hoy la semántica salvo enriquecimientos (supplier_id, invoice_path). Por tanto la distinción “Ofertado” debe realizarse en la capa de UI (BuyerOrders / MyOrdersPage) o en un paso de normalización previo que aún NO existe.

### 13.2 Estado Actual de la UI
`BuyerOrders.jsx` y `MyOrdersPage.jsx` no muestran aún:
- Tag / Chip "Ofertado".
- Diferenciación visual entre dos líneas con mismo `product_id` una ofertada y otra no.
- Precio fijado vs variable: se usa `price_at_addition` pero no se informa el origen (oferta).

### 13.3 Riesgos
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Mezcla visual de items regulares y ofertados | Confusión en buyer/supplier para soporte | Añadir chip + sufijo nombre (e.g. `(Ofertado)`) |
| Precio recalculado erróneo (tiers) | Sobre / subcobro | Forzar que items con `isOffered` ignoren lógica de tiers posteriores (verificación en checkout) |
| Agrupación / fusión accidental (misma key) | Pérdida de línea ofertada | Clave de render debe incluir `offer_id` cuando exista |

### 13.4 Recomendación de Ajustes de Implementación (pequeños)
1. En BuyerOrders: Al mapear `order.items`, derivar:
	 ```js
	 const isOffered = item.isOffered || item.metadata?.isOffered || !!item.offer_id;
	 ```
	 y renderizar `<Chip label="Ofertado" color="primary" size="small" />` + quizá aplicar borde/tono.
2. Key única por item: `item.cart_items_id || (order.order_id + '-' + (item.offer_id || item.product_id) + '-' + index)`.
3. Mostrar precio línea: si `isOffered` usar `offered_price ?? price_at_addition` y un caption "Precio ofertado (fijo)".
4. En MyOrders (supplier): similar, para que proveedores identifiquen por qué no pueden alterar precio.

### 13.5 Ajustes a la Superficie de Test
Nuevos casos añadidos a la checklist:
| ID | Caso | Estado |
|----|------|--------|
| O-1 | BuyerOrders muestra chip "Ofertado" | Pendiente |
| O-2 | Dos items mismo product_id (regular + ofertado) se renderizan por separado | Pendiente |
| O-3 | Precio ofertado inmutable (no se recalcula por tiers) | Pendiente |
| O-4 | Supplier ve item ofertado claramente (chip) | Pendiente |
| O-5 | Invoice grouping no fusiona items ofertados | Pendiente |

### 13.6 Estrategia de Tests
1. Fixture extendido: `paymentOrderWithOffer()` que incluye dos items mismo `product_id` (uno con `isOffered:true`, `offer_id`, `offered_price` menor, otro normal) y al menos segundo proveedor para validar split.
2. Integration Buyer (Escenario Global 2) se ampliará para incluir verificación de ambos items y chip.
3. Integration Supplier (Escenario Global 1) incluirá un pedido con un part que contiene item ofertado y se validará que no cambie al aceptar/dispatch (precio permanece expuesto igual).
4. Unit: Pequeño test de generador de keys (si se abstrae) o snapshot del array de items mapeados marcando offered flag.
5. Edge: offered item + invoice_path debe seguir deduplicación por supplier sin perder etiqueta.

### 13.7 Gap Actual (Technical Debt)
Los componentes aún no implementan la visualización. Se etiquetará test como `it.skip` hasta aplicar parche UI para evitar falsos rojos en pipeline.

### 13.8 Próximo Paso Concreto
Agregar test placeholder `offeredItems.separation.test.js` (skipped) y fixture base, luego parche rápido UI en BuyerOrders/MyOrdersPage.

---
## 14. Checklist Actualizada (Resumen)
Se agregan IDs O-* para ofertas:

| ID | Caso | Estado |
|----|------|--------|
| S-1 | Filtro estado `Atrasado` | Pendiente |
| S-2 | Optimistic accept revert error | Pendiente |
| S-3 | Dispatch fecha auto + validación rango | Pendiente |
| S-4 | Upload PDF inválido (tipo/tamaño) | Pendiente |
| S-5 | Mono vs Multi supplier routing | Pendiente |
| B-1 | Highlight pago (recentlyPaid) | Pendiente |
| B-2 | Chips cancelado vs rechazado | Pendiente |
| B-3 | Realtime invoice insert | Pendiente |
| B-4 | Polling fallback actualiza status | Pendiente |
| X-1 | ETA se propaga buyer tras dispatch supplier | Pendiente |
| X-2 | Cancel buyer refleja supplier | Pendiente |
| O-1 | Chip "Ofertado" Buyer | Pendiente |
| O-2 | Separación regular vs ofertado | Pendiente |
| O-3 | Precio ofertado inmutable | Pendiente |
| O-4 | Chip "Ofertado" Supplier | Pendiente |
| O-5 | Invoice grouping preserva items ofertados | Pendiente |

