# 📦 MyOrders (Mis Órdenes) - Estado actual y backend

## 1. Estado actual
- El módulo "Mis Órdenes" para proveedores está completamente integrado con backend (Supabase) usando `orderService` y un store Zustand (`ordersStore.js`).
- Permite obtener, filtrar, buscar, actualizar y refrescar pedidos reales desde el backend.
- Soporta actualización de estado de pedidos (aceptar, rechazar, despachar, entregar) y refresco automático tras cada acción.
- El frontend de "Mis Órdenes" para compradores aún usa datos mock (no está conectado a backend real).
- El backend espera tablas `orders`, `order_items` y opcionalmente `order_status_history`, `order_documents`.

## 2. Funciones implementadas
- `fetchOrders`, `refreshOrders`, `updateOrderStatus`, `searchOrders`, `getFilteredOrders`, `getOrderById`, `getStatusSummary`.
- Actualización optimista de estado y sincronización con backend tras cada cambio.
- Filtros por estado, búsqueda textual y resumen de estados.
- Obtención de estadísticas del proveedor y manejo de adjuntos/documentos (si el backend lo soporta).

## 3. Alcances
- Gestión completa de pedidos para proveedores: ver, filtrar, actualizar estado, ver historial y estadísticas.
- Integración con Supabase para persistencia y consulta de pedidos reales.
- Soporte para adjuntar documentos y ver historial de cambios (si el backend lo soporta).
- Actualización de estado con feedback visual y refresco automático de la UI.

## 4. Limitaciones
- El frontend de "Mis Órdenes" para compradores aún no está conectado a backend real (usa mock data).
- No hay tests unitarios ni integración CI/CD aún.
- Falta manejo avanzado de errores y edge cases (ej: rollback en caso de error en backend, validaciones de negocio avanzadas).
- No se soporta aún la edición de pedidos ni la gestión avanzada de devoluciones/cambios.

## 5. Pendientes
- Conectar "Mis Órdenes" de compradores a backend real (reemplazar mock data por endpoints reales).
- Mejorar feedback de errores y validaciones en UI.
- Escribir tests unitarios y mocks para lógica de órdenes.
- Documentar endpoints y flujos de negocio para onboarding de nuevos devs.
- Soporte para historial de cambios y adjuntos/documentos en pedidos (si el backend lo permite).

## 6. Ejemplo de flujo actual (proveedor)
1. El proveedor accede a "Mis Órdenes" y ve la lista de pedidos reales desde Supabase.
2. Puede filtrar por estado, buscar pedidos, ver detalles y estadísticas.
3. Puede actualizar el estado de un pedido (aceptar, rechazar, despachar, entregar) y la UI se refresca automáticamente.
4. Si ocurre un error en backend, se revierte el cambio y se muestra feedback.

## 7. Endpoints esperados (orderService)
- `getOrdersForSupplier(supplierId, filters)`
- `updateOrderStatus(orderId, newStatus, additionalData)`
- `getOrderStats(supplierId, period)`
- `searchOrders(supplierId, searchText)`
- (Opcional) `attachDocument(orderId, file)`

## 8. Notas técnicas
- El store está preparado para migración futura a SSR/Next.js.
- Modularización permite testeo y mantenimiento independiente de cada feature.
- El código está listo para integración avanzada (cache invalidation, optimistic updates, etc).
- La estructura de tablas y endpoints puede adaptarse según necesidades del negocio.

---

> Última actualización: 18/06/2025
