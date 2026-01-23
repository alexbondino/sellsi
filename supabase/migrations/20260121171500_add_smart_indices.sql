-- 20260121171500_add_smart_indices.sql
-- Objetivo: Añadir índices optimizados faltantes para mejorar checkout, crons y consultas de auditoría
-- Fecha/Version: 2026-01-21 17:15:00
-- Nota: Idempotente - usa CREATE INDEX IF NOT EXISTS

BEGIN;

-- 1) Índice para Checkout rápido (consulta compuesta buyer+supplier+due_date)
CREATE INDEX IF NOT EXISTS idx_financing_checkout_lookup 
ON public.financing_requests (buyer_id, supplier_id, due_date)
WHERE status = 'approved_by_sellsi';

-- 2) Índice para Cron Job de Mora (filtrado por status = 'expired')
-- Nota: la tabla actual no tiene amount_used/amount_paid; usamos status='expired' para filtrar filas de interés
CREATE INDEX IF NOT EXISTS idx_financing_buyer_overdue_check 
ON public.financing_requests (buyer_id)
WHERE status = 'expired';

-- 3) Índice para Reposiciones / Refunds (tipo de transacción = 'refund')
-- Nota: el código actual inserta transacciones de tipo 'refund' para reposiciones; indexamos esa clave.
CREATE INDEX IF NOT EXISTS idx_ftx_refund 
ON public.financing_transactions (type)
WHERE type = 'refund';

-- 4) Índice para búsqueda por supplier_order_id (joins/lookup)
-- Solo crear si la columna supplier_order_id existe en la tabla (algunas instalaciones antiguas no la tienen)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financing_transactions' AND column_name = 'supplier_order_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ftx_supplier_order ON public.financing_transactions (supplier_order_id)';
  END IF;
END;
$$;

COMMIT;

-- Rollback (manual): DROP INDEX IF EXISTS idx_financing_checkout_lookup, idx_financing_buyer_overdue_check, idx_ftx_reposiciones, idx_ftx_supplier_order;