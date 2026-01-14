# 🚀 Análisis de Performance y Plan de Refactorización - Supabase

**Fecha:** 10 de Enero, 2026
**Objetivo:** Optimizar tiempos de respuesta y reducir carga en la base de datos (CPU/IO).
**Contexto:** Refactorización de Marketplace B2B.

---

## 1. Diagnóstico General

Basado en métricas de `pg_stat_statements` y análisis de esquema, se han detectado tres áreas críticas:

1.  **Falta de Indexación en Relaciones (FK):** Tablas con alta concurrencia (`orders`, `requests`, `notifications`) están realizando "Sequential Scans" (lectura completa de tabla) al filtrar por usuario o proveedor.
2.  **Exceso de Ejecución en Lógica de Negocio:** La función `cancel_stale_payment_orders` consume el ~70% del tiempo de cómputo de la base de datos debido a una frecuencia de ejecución excesiva.
3.  **Redundancia de Lectura en Frontend:** Se detectó un patrón de "Over-fetching" en la carga del perfil de usuario (`users` + `bank_info` + `shipping`), solicitándose más de 100k veces, probablemente en cada cambio de ruta.

---

## 2. Optimización SQL (Índices Faltantes)

**Prioridad:** Crítica (Impacto inmediato).
**Acción:** Ejecutar el siguiente bloque SQL en el Editor de Supabase.
**Nota:** Se utiliza `CONCURRENTLY` para no bloquear la base de datos en producción mientras se crean los índices.

```sql
/* ======================================================
   BLOQUE 1: CORE & USUARIOS
   Optimiza: Carga de perfiles, direcciones y validaciones
   ====================================================== */
-- Acelera la búsqueda de facturación por usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_meta_user_id ON public.invoices_meta (user_id);
-- Acelera la vista de documentos para proveedores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_meta_supplier_id ON public.invoices_meta (supplier_id);
-- Vital para el historial de transacciones del usuario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_user_id ON public.sales (user_id);

/* ======================================================
   BLOQUE 2: SOLICITUDES Y PEDIDOS (MARKETPLACE)
   Optimiza: Flujos de compra, carritos y listados "Mis Pedidos"
   ====================================================== */
-- Acelera "Mis Solicitudes" (Filtro por comprador)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_buyer_id ON public.requests (buyer_id);
-- Acelera los JOINS al ver el detalle de una solicitud
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_request_products_request_id ON public.request_products (request_id);
-- Acelera analíticas de "Qué productos se solicitan más"
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_request_products_product_id ON public.request_products (product_id);
-- Acelera la carga del panel de notificaciones del proveedor
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_supplier_id ON public.notifications (supplier_id);
-- Acelera auditoría de órdenes revisadas por administración
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_payment_reviewed_by ON public.orders (payment_reviewed_by);

/* ======================================================
   BLOQUE 3: PAGOS Y LIBERACIONES DE FONDOS
   Optimiza: Panel de administración financiera
   ====================================================== */
-- Acelera consultas de pagos liberados por un admin específico
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_releases_released_by ON public.payment_releases (released_by_admin_id);
-- Acelera historial de pagos liberados hacia un comprador
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payment_releases_buyer_id ON public.payment_releases (buyer_id);

/* ======================================================
   BLOQUE 4: SEGURIDAD Y ADMIN PANEL
   Optimiza: Logs de auditoría y seguridad
   ====================================================== */
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log (admin_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_sessions_admin_id ON public.admin_sessions (admin_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_banned_ips_banned_by ON public.banned_ips (banned_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_control_panel_procesado_por ON public.control_panel (procesado_por);


3. Análisis de Lógica de Negocio (cancel_stale_payment_orders)
Problema Detectado: La función cancel_stale_payment_orders() se ha ejecutado 16,107 veces recientemente, consumiendo 9.21 minutos de tiempo total de DB.

Causa Probable:

Se está ejecutando mediante pg_cron con una frecuencia demasiado alta (ej. cada minuto).

O se está disparando via Trigger en eventos muy comunes.

Solución Recomendada:

Reducir Frecuencia: Si es un Cron Job, cambiar el intervalo a 15 o 30 minutos. La expiración de órdenes de pago (Khipu/Flow) no requiere precisión de segundos.

Optimizar Query Interna: Revisar el código de la función. Asegurarse de que usa índices en la columna status y created_at (o khipu_expires_at).

Debe buscar: WHERE status = 'pending' AND khipu_expires_at < NOW()

Si falta índice: CREATE INDEX CONCURRENTLY idx_orders_status_expires ON public.orders (status, khipu_expires_at);

4. Análisis de Frontend (React)
Problema Detectado: La consulta que une users + bank_info + shipping_info tiene 109,564 llamadas. Aunque es rápida (0.43ms), el volumen es excesivo.

Diagnóstico: El frontend está solicitando el perfil completo del usuario en cada navegación o re-renderizado de un componente principal (ej. Layout, Navbar o Sidebar).

Plan de Acción (React Refactor):

Implementar Caching: Usar TanStack Query (React Query) o SWR con un staleTime alto (ej. 5-10 minutos). Los datos del usuario (banco, dirección) cambian muy poco.

Estado Global: Cargar el usuario una sola vez al inicio de la sesión y persistirlo en un Contexto o Store (Zustand/Redux), actualizándolo solo si el usuario edita su perfil.
```
