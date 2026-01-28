-- 20260121175000_financing_transactions_supplier_order_and_indices.sql
-- Combina: añadir supplier_order_id, backfill, actualizar trigger y crear índices
-- Fecha: 2026-01-21 17:50:00
-- Nota: Idempotente. Para entornos grandes, crear índices CONCURRENTLY en ventana de baja actividad.

BEGIN;

-- 1) Añadir columna supplier_order_id (idempotente)
ALTER TABLE IF EXISTS public.financing_transactions
  ADD COLUMN IF NOT EXISTS supplier_order_id uuid;

-- 2) Backfill seguro desde metadata->'order_id' cuando esté presente
UPDATE public.financing_transactions
SET supplier_order_id = (metadata->>'order_id')::uuid
WHERE supplier_order_id IS NULL AND metadata ? 'order_id';

-- 3) Actualizar función de reposición para insertar supplier_order_id y usar tipo 'reposicion' (robusta)
CREATE OR REPLACE FUNCTION public.restore_financing_on_supplier_order_cancel()
RETURNS trigger AS $$
DECLARE
  v_financing_tx RECORD;
BEGIN
  -- Ejecutar sólo cuando el status cambie a 'cancelled' o 'rejected'
  IF (TG_OP = 'UPDATE' AND NEW.status IN ('cancelled','rejected') AND OLD.status NOT IN ('cancelled','rejected')) THEN

    -- Buscar todas las transacciones de consumo relacionadas con esta orden
    FOR v_financing_tx IN
      SELECT ft.financing_request_id, ft.amount
      FROM public.financing_transactions ft
      WHERE ft.supplier_order_id = NEW.id AND ft.type = 'consumo'
    LOOP
      -- Reducir amount_used en el financiamiento correspondiente
      UPDATE public.financing_requests
      SET amount_used = GREATEST(0, amount_used - v_financing_tx.amount),
          updated_at = now()
      WHERE id = v_financing_tx.financing_request_id;

      -- Registrar transacción de reposición por cada consumo encontrado
      INSERT INTO public.financing_transactions
      (financing_request_id, type, amount, supplier_order_id, metadata, is_automatic, created_at)
      VALUES (v_financing_tx.financing_request_id, 'reposicion', v_financing_tx.amount, NEW.id, jsonb_build_object('order_id', NEW.id), true, now());
    END LOOP;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Re-crear trigger (si existe la tabla supplier_orders)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_orders') THEN
    DROP TRIGGER IF EXISTS trg_restore_financing_on_supplier_order_cancel ON public.supplier_orders;
    CREATE TRIGGER trg_restore_financing_on_supplier_order_cancel
    AFTER UPDATE ON public.supplier_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.restore_financing_on_supplier_order_cancel();
  END IF;
END;
$$;

-- 5) Crear índices idempotentes (nota: considerar CONCURRENTLY en prod)
CREATE INDEX IF NOT EXISTS idx_ftx_supplier_order
ON public.financing_transactions (supplier_order_id)
WHERE supplier_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ftx_reposiciones
ON public.financing_transactions (financing_request_id, created_at)
WHERE type = 'reposicion';

COMMIT;

-- Rollback (manual):
-- ALTER TABLE public.financing_transactions DROP COLUMN IF EXISTS supplier_order_id;
-- DROP INDEX IF EXISTS idx_ftx_supplier_order, idx_ftx_reposiciones;
-- Para restaurar la función anterior, ejecútala desde la copia de seguridad/rollback de migration previa.