# Refactor Plan: orderService.js

Última revisión: 2025-08-19

Autor del análisis: (AI) GitHub Copilot – basado en el estado actual del archivo `src/services/user/orderService.js`.

## 1. Contexto actual

`orderService.js` concentra la lógica de dos flujos coexistentes:

1. Flujo NUEVO (tabla `orders`) – pedidos provenientes del checkout con pago (Khipu / payment orders).
2. Flujo LEGACY (tabla `carts`) – carritos “cerrados” que funcionan como pedidos tradicionales.

Además mezcla otras responsabilidades:
* Acceso a datos (queries Supabase) para múltiples entidades (`orders`, `carts`, `users`, `shipping_info`, `products`).
* Normalización / mapping de estructuras a objetos de UI (MyOrdersPage / BuyerOrders, etc.).
* Cálculo de fechas de entrega (business days Chile).
* Normalización de estados y tipos de documento.
* Notificaciones (RPC `create_notification`).
* Estadísticas agregadas (método `getOrderStats`).
* Búsqueda textual.

Esto provoca alto acoplamiento y dificulta pruebas, evolución y deprecación del flujo legacy.

## 2. Importaciones actuales

```js
import { supabase } from '../supabase';
import { addBusinessDaysChile, toISODateOnly } from '../../utils/businessDaysChile';
```

Observaciones:
* `supabase` es una dependencia transversal; conviene encapsular llamadas en un “repository layer” para aislar cambios y manejar errores de forma consistente.
* `addBusinessDaysChile` y `toISODateOnly` se usan en DOS lugares casi duplicando lógica (cálculo de fecha límite). Se puede extraer un helper común `calculateEstimatedDeliveryDate(items, buyerRegion, createdAt, productDeliveryResolver)`.
* No hay import centralizado de constantes de estado ni de tipos de documento; se re-declaran localmente.

## 3. Principales Code Smells / Issues

| Categoría | Problema | Impacto | Ejemplo |
|-----------|----------|---------|---------|
| Complejidad | Clase gigante con > 600 líneas | Dificulta mantenimiento | Toda la clase | 
| Duplicación | Parsing de `items` (orders vs carts vs notificaciones) | Riesgo de divergencia | `getPaymentOrdersForSupplier`, `getPaymentOrdersForBuyer`, `_notifyOrderStatusChange` |
| Duplicación | Cálculo de `estimated_delivery_date` | Errores sutiles | Dos funciones casi iguales |
| Naming inconsistente | `delivery_address` y `deliveryAddress`, `order_id` vs `id` | Confusión en UI y tests | Mappers de supplier y buyer |
| Alias redundantes | `proveedor`, `supplierVerified`, `verified` | Hincha payload | Normalización de productos |
| Lógica mezclada | Domain + Infra + Presentación + Notificaciones | Aumenta acoplamiento | `updateOrderStatus` (incluye guardias, update, notificación) |
| Control de errores heterogéneo | Mezcla `throw error` y silencios (`catch(_) {}`) | Difícil depurar | Notificaciones / fallback shipping |
| Magic strings | Estados, nombres de tablas, campos select | Fragilidad ante cambios | Arrays in-line |
| Inconsistencia status | Guardia para avanzar estados sólo en tabla `orders` se repite inline | Riesgo de omitir en nuevo flujo | `updateOrderStatus` |
| Fallback shipping duplicado | Query a `shipping_info` repetida | Código repetido | Métodos supplier + payment supplier |
| Falta de tipado | JavaScript puro | Mayor riesgo runtime | Toda la clase |
| Cohesión baja | Métodos estadísticos y de búsqueda dentro del mismo servicio | Dificulta escalado | `getOrderStats`, `searchOrders` |
| Optimización DB | Para supplier se traen TODAS las órdenes y se filtra en memoria | Ineficiencia potencial | `getPaymentOrdersForSupplier` |
| Seguridad (query injection) | Uso de `.or()` con interpolación directa `searchText` | Riesgo (wildcards no escapados) | `searchOrders` |
| Document type normalization | Pequeña función local que podría reusarse globalmente | Riesgo divergencia | `normalizeDocumentType` |

## 4. Objetivos del Refactor

1. Separar responsabilidades (Single Responsibility Principle).
2. Reducir duplicación (DRY) y homogenizar mapeos.
3. Facilitar futura eliminación de flujo legacy (`carts`).
4. Mejorar consistencia de naming y shape de objetos devueltos.
5. Aislar capa de acceso a datos y permitir pruebas unitarias (mock repositorios).
6. Centralizar constantes, validaciones y parsing.
7. Mejorar robustez y observabilidad (errores categorizados, logging controlado por bandera).
8. Preparar migración a TypeScript progresiva sin romper API actual.
9. Optimizar queries (limit / pagination / filtering lado servidor donde posible).
10. Endurecer sanitización de entrada en búsqueda y validación de UUID.

## 5. Arquitectura Objetivo (High-Level)

Propuesta modular (capas dentro de `src/domains/orders` o `src/modules/orders`):

```
orders/
	domain/
		models/ (Order, OrderItem, DeliveryAddress, Supplier, Product)
		valueObjects/ (OrderId, UserId, Status, DocumentType)
		services/
			OrderStatusService.ts (reglas transición)
			DeliveryDateService.ts (cálculo SLA)
	infra/
		repositories/
			OrdersRepository.ts  (tabla orders)
			CartsRepository.ts   (legacy)
			ProductsRepository.ts
			UsersRepository.ts
			ShippingRepository.ts
		mappers/
			orderMapper.ts (DB -> Domain)
			orderViewMapper.ts (Domain -> DTO UI / compat actual)
	application/
		queries/
			GetSupplierOrders.ts
			GetBuyerOrders.ts
			GetOrderStats.ts
			SearchOrders.ts
		commands/
			UpdateOrderStatus.ts
			NotifyNewOrder.ts
	presentation-adapters/
		orderService.js (fachada legacy mantenida exportando mismas firmas)
	shared/
		constants.ts (STATUSES, ADVANCE_STATUSES, TABLES)
		parsing.ts (parseItems, normalizeDocumentType)
		validation.ts (isUUID)
```

La clase actual `OrderService` quedaría convertida en una FACHADA delgada que delega en casos de uso (application layer). Re-exportar las mismas funciones para no romper consumo inmediato.

## 6. Fases de Refactor (Iterativo y Seguro)

### Fase 0 – Preparación / Seguridad
* Añadir pruebas mínimas (snapshot de shape) para métodos públicos actuales (sin cambiar implementación todavía). Incluye: `getPaymentOrdersForSupplier`, `getPaymentOrdersForBuyer`, `getOrdersForSupplier`, `getOrdersForBuyer`, `updateOrderStatus`, `getOrderStats`, `searchOrders`.
* Introducir un `STATUS_CONSTANTS` y `DOCUMENT_TYPE_CONSTANTS` exportados sin cambiar lógica.
* Añadir bandera `ENABLE_ORDER_REFACTOR_V1` (feature flag) para activar nuevos mappers gradualmente.

### Fase 1 – Extract Helpers
* Extraer `isUUID`, `normalizeDocumentType`, `parseOrderItems`, `buildDeliveryAddress`, `calculateEstimatedDeliveryDate` a `shared/`.
* Reemplazar usos in-situ. Confirmar tests verdes.

### Fase 2 – Consolidar Cálculo de Fecha y Parsing
* Unificar lógica de deadline (evitar duplicación). Añadir memoización de `product_delivery_regions` por `product_id` en la función de cálculo.

### Fase 3 – Repositorios
* Crear `OrdersRepository` y `CartsRepository` con métodos: `findByBuyer`, `findAllForSupplier`, `updateStatus`, `listStatusesForBuyer`, etc.
* Mover selección de columnas y filtros (sin tocar transformaciones). `orderService` ahora orquesta repositorios y helpers.

### Fase 4 – Mappers / DTOs
* Crear mappers: `toSupplierOrderDTO(order, context)` y `toBuyerOrderDTO(order, context)` usando domain neutral.
* Normalizar naming: SOLO `delivery_address` (snake_case o camelCase consistente – decidir convención: preferible camelCase interno y map a snake sólo para compat). Mantener alias antiguos temporalmente (`deliveryAddress`) bajo flag.

### Fase 5 – Status & Transition Rules
* Extraer reglas de transición y guardia de pago en `OrderStatusService` (ej: `canTransition(current, next, paymentStatus)`).
* `updateOrderStatus` se simplifica a: validar inputs -> fetch row -> validate transition -> persist -> notificar.

### Fase 6 – Notificaciones
* Extraer `_notifyOrderStatusChange` y `notifyNewOrder` a `NotificationService` (inyectar repos / rpc). Añadir manejo centralizado de errores (log condicional, nunca throw salvo error crítico configurable).

### Fase 7 – Tipado Progresivo (TS)
* Renombrar archivo a `orderService.ts` bajo flag o crear paralelo. Añadir interfaces `OrderDTO`, `OrderItemDTO`.
* Generar tipos a partir de constantes (ej: `type OrderStatus = typeof STATUSES[number]`).

### Fase 8 – Optimización de Queries
* Añadir paginación (`limit`, `offset` o cursor) a `getPaymentOrdersForSupplier` en DB para evitar traer todas las órdenes y filtrar en memoria (alternativas: materializar vista `order_items` con `supplier_id`).
* Añadir índices recomendados: (si no existen) `orders (user_id, created_at DESC)`, `carts (user_id, status, created_at DESC)`, GIN sobre `orders.items` si se aplicará filtrado JSON (evaluar).

### Fase 9 – Sanitización & Seguridad
* `searchOrders`: escapar `%` y `_` en `searchText`; imponer mínimo de longitud para evitar scans completos.
* Unificar validación de UUID en middleware/helper.

### Fase 10 – Limpieza de Alias y Deprecación
* Marcar alias redundantes (`proveedor`, `supplierVerified`, `imagen`) con comentarios `@deprecated`.
* Añadir adaptador de compat: `legacyCompatibility(orderDTO)` que reinyecta alias sólo si flag activa.
* Comunicar plazo de eliminación a front.

### Fase 11 – Métricas / Observabilidad
* Integrar hook de logging estructurado (ej: `orderLogger.debug({...})`) controlado por bandera.
* Emitir métricas de: tiempo de query, conteo de órdenes transformadas, fallos de notificación.

### Fase 12 – Deprecación LEGACY
* Crear bandera `ENABLE_CARTS_FLOW`. Pruebas A/B para confirmar que UI funciona 100% con `orders`.
* Plan de migración de datos cierra carritos antiguos -> migrar a `orders` (script / función). Documentar.

## 7. Cambios Específicos a Realizar (Checklist Operativo)

- [x] Crear carpeta `src/domains/orders/shared`.
- [x] Mover helpers (constants, parsing, validation, delivery) – tests pendientes.
- [x] Introducir `constants.js` con: `ORDER_STATUSES`, `ADVANCE_STATUSES`, `DOCUMENT_TYPES`.
- [x] Refactor mínimo (fase 1) manteniendo firma pública (orderService actualizado a helpers).
- [x] Añadir tests snapshot de respuestas actuales (para detectar regresiones de shape) (smoke inicial vacío - ampliar luego con datos simulados).
- [x] Implementar repositorios (fase 3) PARCIAL: OrdersRepository + CartsRepository creados; sólo usado en métodos buyer (resto pendiente).
 - [x] Implementar repositorios (fase 3) PARCIAL: OrdersRepository + CartsRepository creados; integrado en buyer + supplier + stats + search + guardia status.
- [x] (Parcial) Implementar adapter legacy (`legacyUIAdapter.js`).
- [ ] Implementar mappers domain -> DTO antes de usar adapter internamente (fase 4).
 - [x] Implementar mappers domain -> DTO (mapSupplierOrderFromServiceObject / mapBuyerOrderFromServiceObject) y usar adapter internamente en métodos principales.
 - [x] Crear servicio de notificaciones (fase 6) y extraer lógica (NotificationService.js) + deprecado método interno.
 - [x] Crear servicio de transición de estados (OrderStatusService.js) (aplicado parcialmente en updateOrderStatus).
 - [x] Unificar cálculo estimated_delivery_date usando helper (removidas funciones locales duplicadas).
 - [x] Añadir paginación básica (limit/offset) en repositorios y métodos buyer/supplier.
 - [x] Introducir feature flags (ORDERS_USE_DOMAIN_ADAPTERS, ORDERS_EMIT_LEGACY_ALIASES, ORDERS_EMIT_DEPRECATED_PRODUCT_ALIASES).
 - [x] Limpieza condicional de aliases deprecated de producto (proveedor/verified/supplierVerified/imagen) vía flag.
 - [x] Hardening updateOrderStatus: validación de transición usando OrderStatusService con estado actual.
- [ ] Añadir pagination a métodos de listado.
- [ ] Sanitizar `searchText` + tests.
 - [x] Sanitizar `searchText` + (pendiente agregar tests específicos).
- [ ] Documentar flags y plan de eliminación de alias.

## 8. Modelo de Datos / Shapes Propuestos (DTO Canonical)

Canonical (interno) `OrderDTO`:
```ts
interface OrderDTO {
	id: string;               // order_id (alias externo)
	source: 'orders' | 'carts';
	buyerId: string;
	supplierId?: string;      // opcional (cuando se consulta por supplier se filtran items)
	status: OrderStatus;
	paymentStatus?: PaymentStatus; // sólo en flujo payment
	createdAt: string;
	updatedAt: string;
	estimatedDeliveryDate?: string;
	items: OrderItemDTO[];
	totals: {
		items: number;          // count items
		quantity: number;       // suma quantity
		amount: number;         // subtotal proveedor / comprador
		shippingAmount?: number;
		finalAmount?: number;
	};
	deliveryAddress?: DeliveryAddress;
	buyer?: BuyerSummary;
}
```

Adapter a legacy UI agregará alias: `order_id`, `delivery_address`, `deliveryAddress`, `total_items`, `total_quantity`, `total_amount`, etc.

## 9. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Regresión en shape consumido por componentes | Tests snapshot antes de refactor masivo + adapter de compat |
| Divergencia temporal entre legacy y nuevo | Feature flags y despliegue incremental |
| Error en cálculo de fecha de entrega unificado | Tests unitarios con casos de regiones con / sin coincidencia |
| Query más costosa al introducir repositorios | Medir tiempo antes/después, añadir índices si necesario |
| Sanitización rompe búsquedas previas | Comunicar y ajustar front (ej: mostrar tooltip de sintaxis) |

## 10. Métricas de Éxito

* Reducción líneas en `orderService.js` > 60%.
* Duplicación de lógica de fecha y parsing eliminada (0 funciones repetidas para la misma responsabilidad).
* Cobertura de pruebas para mappers y repos >= 80% líneas relevantes.
* Tiempo medio de `getPaymentOrdersForSupplier` con dataset real reducido (o estable) pese al refactor.
* Sin cambios de shape no esperados (todos los tests snapshot verdes).

## 11. Optimización Futuras (Post Refactor Principal)

1. Materializar tabla `order_items` (desnormalizada) para queries por `supplier_id` sin parsear JSON.
2. Implementar WebSocket/Realtime unificado para estado de items (no sólo orden completa).
3. Indizar `shipping_info(user_id)` y considerar cache en memoria para shipping repetido.
4. Añadir TTL a caché en cliente de productos (thumbnails) y fallback a CDN placeholder.
5. Reemplazar RPC `create_notification` por cola (e.g., supabase functions / edge / pq background workers) para desacoplar latencia de notificaciones.

## 12. Ejemplo de Refactor Inicial (Fase 1) – (Pseudocódigo)

```js
// shared/constants.js
export const ORDER_STATUSES = ['pending','accepted','rejected','in_transit','delivered','cancelled'];
export const ADVANCE_STATUSES = new Set(['accepted','in_transit','delivered']);
export const DOCUMENT_TYPES = ['boleta','factura','ninguno'];

// shared/parsing.js
export function parseOrderItems(raw) { ... }
export function normalizeDocumentType(v) { ... }

// shared/delivery.js
export function calculateEstimatedDeliveryDate(createdAt, items, buyerRegion, productLookup) { ... }
```

`orderService.js` (fase 1) sólo importaría estas utilidades y reemplazaría duplicaciones.

## 13. Estimación de Esfuerzo

| Fase | Días estimados (focus) |
|------|------------------------|
| 0 | 0.5 |
| 1 | 0.5 |
| 2 | 0.5 |
| 3 | 1.0 |
| 4 | 1.0 |
| 5 | 0.5 |
| 6 | 0.5 |
| 7 | 1.0 |
| 8 | 0.5 |
| 9 | 0.25 |
| 10 | 0.5 |
| Total aproximado | 6.75 días |

## 14. Próximos Pasos Inmediatos

1. Congelar archivo actual (commit baseline tests).
2. Implementar Fase 0 (constantes + tests shape).
3. Ejecutar Fase 1 (helpers + reemplazo duplicación). PR pequeño.
4. Revisar performance con logs cronometrados.

---

Este documento debe actualizarse al completar cada fase (agregar sección de progreso, decisiones de diseño emergentes y cambios en alcance si aparecen dependencias imprevistas).

---

## 15. Análisis Profundo de Dependencias (Segunda Pasada)

Objetivo: identificar todos los consumidores y puntos de acoplamiento del `orderService.js` (componentes React, hooks, stores Zustand, servicios de checkout y funciones Edge / Supabase Functions) para planear refactor sin romper contratos implícitos.

### 15.1 Mapa de Uso (Frontend)

| Consumidor | Archivo | Uso Principal | Campos Dependientes (ejemplos) |
|------------|---------|---------------|--------------------------------|
| Zustand Store Proveedor | `src/shared/stores/orders/ordersStore.js` | Obtiene y combina legacy + payment orders, transforma status a display | `order.order_id`, `order.items[*].product.name`, `delivery_address`/`deliveryAddress`, `status` (display), `estimated_delivery_date`, `total_amount` |
| Tabla de Órdenes Proveedor | `src/shared/components/display/tables/TableRows.jsx` | Render UI, acciones por estado, copia de datos | `order.order_id`, `order.status` (DISPLAY en español), `order.products` (derivado en store), `order.items` fallback, `order.deliveryAddress` (camelCase preferido), `order.delivery_address` fallback, `order.total_amount`, `item.product.delivery_regions` para shipping dinámico, `estimated_delivery_date`, `items[].document_type` |
| Página MyOrders Proveedor | `src/domains/supplier/pages/my-orders/MyOrdersPage.jsx` | Dispara `updateOrderStatus` con estados (‘accepted’, ‘rejected’, ‘in_transit’, ‘delivered’) | Usa `order_id` y shape compatible store |
| Hook Pedidos Buyer | `src/domains/buyer/hooks/orders/useBuyerOrders.js` | Solo carga `getOrdersForBuyer` (LEGACY carts) | Depende de `cart.cart_items[].product.*` con campos: `productid`, `thumbnail_url`, `thumbnails`, `price`, `supplier.users.verified` (ya mapeados) |
| Checkout Service | `src/domains/checkout/services/checkoutService.js` | Crea order (tabla `orders`) y luego invoca `orderService.notifyNewOrder` | Depende de que `notifyNewOrder` acepte fila sin transformación previa (usa campos originales) |
| Otros (Docs) | `services/README*.md` | Documentación (no runtime) | N/A |

### 15.2 Mapa de Uso (Backend / Edge Functions Supabase)

Las funciones Edge no importan `orderService` directamente, pero manipulan la misma tabla `orders`, por lo que cualquier normalización / esquema esperado debe permanecer consistente.

| Función | Archivo | Interacción | Campos Críticos |
|---------|--------|------------|------------------|
| process-khipu-webhook | `supabase/functions/process-khipu-webhook/index.ts` | Actualiza `payment_status='paid'`, setea `paid_at`, ejecuta materialización (split / legacy) | `orders.id`, `orders.items` (JSON flexible), `payment_status`, `shipping` |
| create-payment-khipu | `supabase/functions/create-payment-khipu/index.ts` | Actualiza orden existente agregando IDs de pago, normaliza items opcionalmente | `orders.items` (estructura laxa), campos khipu (`khipu_payment_id`, `khipu_transaction_id`, `khipu_payment_url`, `khipu_expires_at`) |
| khipu-webhook-handler (menor) | (referencia) | Similar/alias de webhook | Estado de pago |

### 15.3 Contratos Implícitos Detectados

1. Campo dual de dirección: consumidores prefieren `deliveryAddress` camelCase; servicio también expone `delivery_address` (snake). Ambos deben mantenerse temporalmente.
2. `status` que llega a la UI ya está traducido en el store a display. El servicio devuelve `status` en inglés normalizado; store aplica `getStatusDisplayName`. NO romper esto al introducir mappers nuevos.
3. Items para proveedor: store convierte `order.items` → `products` para la tabla. Si cambiamos la forma interna de items, necesitamos mantener `item.product.name`, `item.quantity`, `item.price_at_addition`.
4. Shipping estimation y fecha límite: componente Tabla vuelve a calcular costo de envío combinando `delivery_regions`. No depende de un campo normalizado de shipping; usar esto para posponer cambios en shipping hasta fase posterior.
5. Notificaciones per-item: `notifyNewOrder` y `_notifyOrderStatusChange` esperan que `orderRow.items` pueda ser Array o string JSON o wrapper objeto. Tras refactor, el adaptador debe conservar esta tolerancia de parsing mientras no se formalice un esquema estricto.
6. Document types: UI agrega resumen (`docTypeSummary`) con expectativa de `item.document_type` en minúscula normalizada (`boleta|factura|ninguno`). Debe preservarse.

### 15.4 Campos Sensibles a Cambios (High-Risk)

| Campo | Riesgo si cambia | Mitigación |
|-------|------------------|-----------|
| `order_id` (alias) | Tabla y store dependen de él para key y acciones | Mantener alias en adapter (derivado de `id`) |
| `items[].product.productid` | Hooks thumbnails & shipping derivado | Mantener y rellenar desde `id` si falta |
| `items[].product.delivery_regions` | Cálculo shipping en Tabla | No renombrar; si se sustituye por `product_delivery_regions`, duplicar campo |
| `estimated_delivery_date` | Indicador atraso + UI | Re-cálculo centralizado, no remover, fallback definido |
| `status` + display mapping | Estados en Tabla y store | No introducir display en servicio (evitar doble traducción) |
| `document_type` | Resumen docTypeSummary | Normalizar en helper único y testear |

### 15.5 Oportunidades de Aislamiento por Adaptadores

Propuesta: introducir en Fase 1.5 (antes de repositorios) un módulo `adapters/orderLegacyAdapter.js` que exporte funciones:

```js
export function toSupplierUIOrder(rawDomainOrder) { /* añade aliases */ }
export function toBuyerUIOrder(rawDomainOrder) { /* idem */ }
```

Esto permitirá que los componentes dependan de la capa de adapter (futuro PR) en lugar de depender del shape bruto del servicio— migración gradual: store y hook importan adapter en vez de `orderService` directo (o internamente el service usa adapter, manteniendo firma inicial).

### 15.6 Estrategia de No-Ruptura (Backward Compatibility)

1. Introducir Feature Flags:
	 * `ORDERS_REFACTOR_ADAPTERS=on` para activar adapters.
	 * `ORDERS_LEGACY_ALIASES=on` para seguir generando duplicados (`deliveryAddress` y `delivery_address`).
2. Durante 1 sprint mantener ambos; loggear WARN si adaptador detecta consumo de alias deprecated (telemetría).
3. Añadir util de verificación `assertUIShape(order)` en tests E2E que verifique presencia de campos claves para comprador y proveedor.
4. Publicar changelog interno enumerando alias a deprecate y fecha objetivo de remoción.

### 15.7 Normalización de Items (Caso Proveedor vs Comprador)

Actualmente dos pipelines casi paralelos generan items. Unificar pipeline base:

```
raw DB rows -> parseItems() -> enrichProducts() -> attachSupplierOrBuyerContext() -> buildOrderDTO() -> adapter legacy UI
```

Para LEGACY carts: `supplierItems` filtra en proveedor; para comprador se incluyen todos.

### 15.8 Integración con Edge Functions

Las funciones `process-khipu-webhook` y `create-payment-khipu` manipulan directamente estructura `orders.items` (laxa). Riesgos:
* Si se migra a un formato más estructurado (por ejemplo JSON con schema validado), edge functions deben sincronizar el parser.
* Opción incremental: agregar columna `items_canonical` (JSONB) mientras se sigue usando `items`; servicio lee `items_canonical` si existe, fallback a `items`.

### 15.9 Plan Extra de Observabilidad

Registrar en consola (o logger estructurado) diffs de shape antes/después cuando flag adapters está activa durante periodo de prueba:

```js
if (process.env.ORDERS_REFACTOR_DEBUG === 'on') {
	console.debug('[orders-refactor][diff]', diffKeys(oldShape, newShape));
}
```

### 15.10 Checklist Adicional Derivado de Dependencias

- [x] Crear adapter UI (supplier / buyer) sin cambiar firmas públicas aún (legacyUIAdapter.js).
- [ ] Añadir compat alias para dirección y totales (`total_items`, `total_quantity`, `total_amount`).
- [ ] Test: Tabla de órdenes proveedor sigue mostrando productos (snapshot DOM / testing-library).
- [ ] Test: Hook `useBuyerOrders` mantiene thumbnails y supplier verified.
- [ ] Test: `updateOrderStatus` flujo happy path + guardia de pago (mock supabase) conserva notificaciones.
- [ ] Test: `notifyNewOrder` parsea items en los 3 formatos (array, string JSON, objeto único).
- [ ] Edge Sync: Documentar en README de órdenes que `items` sigue laxa, plan para `items_canonical`.
- [ ] Sanitizar `.or()` en `searchOrders` (escape `%` y `_`).

### 15.11 Conclusión (Dependencias)

No hay consumidores que exijan lógica compleja adicional más allá de los campos enumerados; el refactor puede avanzar siempre que mantengamos alias clave y no inyectemos traducciones de estado dentro del service (delegado a store/hook). El mayor riesgo es la divergencia de items y dirección; mitigado por adapters y tests de snapshot.


