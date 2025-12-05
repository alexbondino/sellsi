-- ============================================================
-- FIX: Índice único para prevenir carritos activos duplicados
-- Fecha: 2024-12-03
-- Descripción: Crea un índice único parcial que garantiza 
-- máximo UN carrito activo por usuario
-- IMPORTANTE: Ejecutar DESPUÉS de fix-duplicate-carts.sql
-- ============================================================

-- Crear índice único parcial
-- Solo aplica donde status = 'active'
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_cart_per_user 
ON carts(user_id) 
WHERE status = 'active';

-- Verificar que el índice existe
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'carts'
AND indexname = 'idx_one_active_cart_per_user';
