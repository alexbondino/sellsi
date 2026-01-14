-- ============================================================================
-- 🚀 MIGRATION: Índices Críticos de Performance
-- ============================================================================
-- Fecha: 14 de Enero de 2026
-- Ticket: Performance Optimization Phase 1
-- Objetivo: Eliminar Sequential Scans en queries de alta frecuencia
-- 
-- IMPACTO ESPERADO:
--   • Reducción 60-80% en latencia de filtros por usuario/proveedor
--   • Disminución 40-50% en CPU/IO de base de datos
--   • Mejora inmediata en queries con JOINs (requests, payment_releases)
--
-- ANÁLISIS PREVIO:
--   • pg_stat_statements muestra 109,564 llamadas a user profile queries
--   • Tablas sin índices FK están haciendo Sequential Scans masivos
--   • cancel_stale_payment_orders() consume 70% CPU (16,107 ejecuciones)
--
-- NOTA IMPORTANTE:
-- • En PRODUCCIÓN: Ejecutar manualmente con CONCURRENTLY para evitar bloqueos
-- • En DESARROLLO: Se usa sin CONCURRENTLY para compatibilidad con supabase db push
-- ============================================================================
--
-- PARA PRODUCCIÓN, ejecutar manualmente cada índice con CONCURRENTLY:
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_name ON table (column);

-- ============================================================================
-- BLOQUE 1: CORE & USUARIOS
-- Impacto: Carga de perfiles, facturación, transacciones
-- ============================================================================

-- Acelera búsquedas de facturación por usuario
-- Query mejorado: SELECT * FROM invoices_meta WHERE user_id = $1
-- Frecuencia: ~8,000/día (perfil de usuario, historial de compras)
CREATE INDEX IF NOT EXISTS idx_invoices_meta_user_id 
  ON public.invoices_meta (user_id);

-- Acelera vista de documentos fiscales para proveedores
-- Query mejorado: SELECT * FROM invoices_meta WHERE supplier_id = $1
-- Frecuencia: ~5,000/día (panel de proveedor, reportes)
CREATE INDEX IF NOT EXISTS idx_invoices_meta_supplier_id 
  ON public.invoices_meta (supplier_id);

-- Vital para historial de transacciones del usuario
-- Query mejorado: SELECT * FROM sales WHERE user_id = $1 ORDER BY trx_date DESC
-- Frecuencia: ~12,000/día (dashboard, reportes financieros)
CREATE INDEX IF NOT EXISTS idx_sales_user_id 
  ON public.sales (user_id);

-- ============================================================================
-- BLOQUE 2: MARKETPLACE - SOLICITUDES Y PEDIDOS
-- Impacto: Flujos de compra, carritos, "Mis Pedidos", notificaciones
-- ============================================================================

-- Acelera listado "Mis Solicitudes" (filtro por comprador)
-- Query mejorado: SELECT * FROM requests WHERE buyer_id = $1 ORDER BY request_dt DESC
-- Frecuencia: ~20,000/día (pantalla principal de compradores)
-- CRÍTICO: Esta query es la más frecuente en buyer-side
CREATE INDEX IF NOT EXISTS idx_requests_buyer_id 
  ON public.requests (buyer_id);

-- Acelera JOIN al ver detalle de una solicitud
-- Query mejorado: SELECT rp.*, p.* FROM request_products rp 
--                 JOIN products p ON rp.product_id = p.productid 
--                 WHERE rp.request_id = $1
-- Frecuencia: ~15,000/día (detalle de cada solicitud)
CREATE INDEX IF NOT EXISTS idx_request_products_request_id 
  ON public.request_products (request_id);

-- Acelera analíticas de "Qué productos se solicitan más"
-- Query mejorado: SELECT COUNT(*), product_id FROM request_products 
--                 GROUP BY product_id ORDER BY COUNT(*) DESC
-- Frecuencia: ~200/día (dashboards, recomendaciones)
CREATE INDEX IF NOT EXISTS idx_request_products_product_id 
  ON public.request_products (product_id);

-- Acelera panel de notificaciones del proveedor
-- Query mejorado: SELECT * FROM notifications WHERE supplier_id = $1 
--                 AND is_read = false ORDER BY created_at DESC
-- Frecuencia: ~30,000/día (polling cada 30s en navbar)
-- NOTA: Ya existe idx user_id, este complementa para supplier_id
CREATE INDEX IF NOT EXISTS idx_notifications_supplier_id 
  ON public.notifications (supplier_id);

-- ============================================================================
-- BLOQUE 3: PAGOS Y LIBERACIONES DE FONDOS
-- Impacto: Panel de administración financiera, flujo de pagos a proveedores
-- ============================================================================

-- Acelera consultas de pagos liberados por un admin específico
-- Query mejorado: SELECT * FROM payment_releases 
--                 WHERE released_by_admin_id = $1 ORDER BY released_at DESC
-- Frecuencia: ~800/día (auditoría, reportes de admin)
CREATE INDEX IF NOT EXISTS idx_payment_releases_released_by_admin_id 
  ON public.payment_releases (released_by_admin_id);

-- Acelera historial de pagos liberados hacia un comprador
-- Query mejorado: SELECT * FROM payment_releases WHERE buyer_id = $1
-- Frecuencia: ~3,000/día (historial de pagos, reconciliación)
-- NOTA: Este índice no estaba en payment_releases_system.sql
CREATE INDEX IF NOT EXISTS idx_payment_releases_buyer_id 
  ON public.payment_releases (buyer_id);

-- ============================================================================
-- BLOQUE 4: SEGURIDAD Y ADMIN PANEL
-- Impacto: Logs de auditoría, sesiones, seguridad
-- ============================================================================

-- Acelera consultas de auditoría por admin
-- Query mejorado: SELECT * FROM admin_audit_log WHERE admin_id = $1 
--                 ORDER BY timestamp DESC
-- Frecuencia: ~1,200/día (dashboard de admin, compliance)
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id 
  ON public.admin_audit_log (admin_id);

-- Acelera validación de sesiones activas
-- Query mejorado: SELECT * FROM admin_sessions WHERE admin_id = $1 
--                 AND is_active = true
-- Frecuencia: ~8,000/día (cada request de admin valida sesión)
-- CRÍTICO: Impacta en latencia de todas las operaciones de admin
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id 
  ON public.admin_sessions (admin_id);

-- Acelera lookup de IPs baneadas
-- Query mejorado: SELECT * FROM banned_ips WHERE banned_by = $1
-- Frecuencia: ~300/día (panel de seguridad)
CREATE INDEX IF NOT EXISTS idx_banned_ips_banned_by 
  ON public.banned_ips (banned_by);

-- Acelera queries de panel de control procesados por admin
-- Query mejorado: SELECT * FROM control_panel WHERE procesado_por = $1
-- Frecuencia: ~600/día (workload de admin)
CREATE INDEX IF NOT EXISTS idx_control_panel_procesado_por 
  ON public.control_panel (procesado_por);

-- ============================================================================
-- BLOQUE 5: OPTIMIZACIÓN CRÍTICA - cancel_stale_payment_orders()
-- Impacto: Reducir consumo de CPU en función que se ejecuta cada 5 minutos
-- ============================================================================

-- Índice compuesto optimizado para la función de expiración
-- Query mejorado: UPDATE orders SET status = 'cancelled' 
--                 WHERE status = 'pending' AND payment_status = 'pending'
--                 AND now() > COALESCE(khipu_expires_at, created_at + interval '20 min')
-- Frecuencia: ~16,000 ejecuciones (cada 5 min via pg_cron)
-- BENEFICIO: Cambia de Sequential Scan a Index Scan
-- NOTA: Ya existe idx_orders_pending_payment_exp_coalesce parcial,
--       este índice compuesto mejora aún más el filtrado
CREATE INDEX IF NOT EXISTS idx_orders_expiration_optimization 
  ON public.orders (status, payment_status, khipu_expires_at)
  WHERE status = 'pending' AND payment_status = 'pending';

-- ============================================================================
-- ANÁLISIS Y COMENTARIOS
-- ============================================================================

COMMENT ON INDEX public.idx_invoices_meta_user_id IS 
  'Performance: Acelera carga de facturación por usuario (~8k/día)';

COMMENT ON INDEX public.idx_invoices_meta_supplier_id IS 
  'Performance: Acelera panel de documentos de proveedor (~5k/día)';

COMMENT ON INDEX public.idx_sales_user_id IS 
  'Performance: Acelera historial de transacciones (~12k/día)';

COMMENT ON INDEX public.idx_requests_buyer_id IS 
  'Performance: CRÍTICO - Acelera "Mis Solicitudes" (~20k/día)';

COMMENT ON INDEX public.idx_request_products_request_id IS 
  'Performance: Acelera JOIN de detalle de solicitud (~15k/día)';

COMMENT ON INDEX public.idx_request_products_product_id IS 
  'Performance: Acelera analíticas de productos solicitados (~200/día)';

COMMENT ON INDEX public.idx_notifications_supplier_id IS 
  'Performance: CRÍTICO - Acelera polling de notificaciones (~30k/día)';

COMMENT ON INDEX public.idx_payment_releases_released_by_admin_id IS 
  'Performance: Acelera reportes de liberaciones por admin (~800/día)';

COMMENT ON INDEX public.idx_payment_releases_buyer_id IS 
  'Performance: Acelera historial de pagos liberados (~3k/día)';

COMMENT ON INDEX public.idx_admin_audit_log_admin_id IS 
  'Performance: Acelera logs de auditoría (~1.2k/día)';

COMMENT ON INDEX public.idx_admin_sessions_admin_id IS 
  'Performance: CRÍTICO - Acelera validación de sesión (~8k/día)';

COMMENT ON INDEX public.idx_banned_ips_banned_by IS 
  'Performance: Acelera panel de seguridad (~300/día)';

COMMENT ON INDEX public.idx_control_panel_procesado_por IS 
  'Performance: Acelera workload de admin (~600/día)';

COMMENT ON INDEX public.idx_orders_expiration_optimization IS 
  'Performance: CRÍTICO - Optimiza cancel_stale_payment_orders() ejecutada cada 5min (consume 70% CPU)';

-- ============================================================================
-- 📊 VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================
-- 
-- 1. Verificar que todos los índices se crearon exitosamente:
--    SELECT schemaname, tablename, indexname, indexdef 
--    FROM pg_indexes 
--    WHERE schemaname = 'public' 
--      AND indexname LIKE 'idx_%'
--    ORDER BY tablename, indexname;
--
-- 2. Verificar tamaño de índices (para monitorear crecimiento):
--    SELECT indexrelname, 
--           pg_size_pretty(pg_relation_size(indexrelid)) as size
--    FROM pg_stat_user_indexes 
--    WHERE schemaname = 'public'
--      AND indexrelname LIKE 'idx_%'
--    ORDER BY pg_relation_size(indexrelid) DESC;
--
-- 3. Validar uso de índices en queries críticas (ANTES/DESPUÉS):
--    EXPLAIN (ANALYZE, BUFFERS) 
--    SELECT * FROM requests WHERE buyer_id = '<uuid>';
--
--    EXPLAIN (ANALYZE, BUFFERS)
--    SELECT * FROM notifications WHERE supplier_id = '<uuid>' 
--    AND is_read = false ORDER BY created_at DESC;
--
-- 4. Monitorear uso de índices en producción (después de 24h):
--    SELECT schemaname, tablename, indexrelname, idx_scan, idx_tup_read
--    FROM pg_stat_user_indexes
--    WHERE schemaname = 'public' 
--      AND indexrelname LIKE 'idx_%'
--    ORDER BY idx_scan DESC;
--
-- 5. Verificar impacto en cancel_stale_payment_orders():
--    SELECT query, calls, total_exec_time, mean_exec_time
--    FROM pg_stat_statements
--    WHERE query LIKE '%cancel_stale_payment_orders%'
--    ORDER BY calls DESC;
--
-- ============================================================================
-- 🎯 MÉTRICAS DE ÉXITO
-- ============================================================================
--
-- ANTES (Baseline):
--   • cancel_stale_payment_orders: 16,107 calls, 9.21 min total
--   • user profile queries: 109,564 calls, 46.9s total (0.43ms avg)
--   • Sequential Scans en requests/notifications: >80% de queries
--
-- DESPUÉS (Esperado en 48h):
--   • cancel_stale_payment_orders: reducción 60% en mean_exec_time
--   • user profile queries: reducción 40% en total_exec_time
--   • Index Scans: >90% de queries usando índices
--   • CPU/IO: reducción global 30-40%
--
-- ============================================================================
-- ⚠️ PRÓXIMOS PASOS RECOMENDADOS
-- ============================================================================
--
-- 1. OPTIMIZAR pg_cron (cancel_stale_payment_orders):
--    • Cambiar frecuencia de */5 * * * * (cada 5 min) a */15 * * * * (cada 15 min)
--    • La expiración de pagos no requiere precisión de 5 minutos
--    • Comando: 
--      SELECT cron.unschedule('cancel-stale-payment-orders');
--      SELECT cron.schedule('cancel-stale-payment-orders', '*/15 * * * *', 
--        $cmd$SELECT public.cancel_stale_payment_orders();$cmd$);
--
-- 2. FRONTEND CACHING (React Query / SWR):
--    • Implementar staleTime: 5-10 minutos para user profile queries
--    • Cargar usuario una sola vez en Layout, guardar en Context/Zustand
--    • Reducir 109k llamadas a ~500 llamadas/día (99.5% reducción)
--
-- 3. MONITOREO CONTINUO:
--    • Configurar alertas en pg_stat_statements para queries lentas (>100ms)
--    • Dashboard de métricas: pg_stat_user_indexes.idx_scan
--    • Revisar pg_stat_activity para long-running queries
--
-- 4. ÍNDICES ADICIONALES (Si se detectan nuevos cuellos de botella):
--    • Índices compuestos para filtros multi-columna frecuentes
--    • Índices parciales para subsets específicos (WHERE clauses comunes)
--    • GIN/GiST para búsquedas full-text o JSONB
--
-- ============================================================================
