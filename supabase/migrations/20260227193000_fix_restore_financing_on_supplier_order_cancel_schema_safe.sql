-- Fix: restore_financing_on_supplier_order_cancel must not assume columns that do not exist on supplier_orders
-- Root cause observed in prod:
--   ERROR 42703: record "new" has no field "financing_request_id"
-- Context:
--   Trigger chain orders -> sync_supplier_orders_status -> supplier_orders update -> restore_financing_on_supplier_order_cancel
--
-- This migration makes the restore trigger schema-safe and idempotent:
-- 1) Never references NEW.financing_request_id / NEW.amount directly
-- 2) Calculates refund per financing from financing_transactions (consumo - reposicion)
-- 3) Prevents double restore via net calculation and rollback_order guard

BEGIN;

CREATE OR REPLACE FUNCTION public.restore_financing_on_supplier_order_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tx_group RECORD;
  refund_amount numeric;
BEGIN
  IF NOT (
    TG_OP = 'UPDATE'
    AND NEW.status IN ('cancelled', 'rejected')
    AND OLD.status NOT IN ('cancelled', 'rejected')
  ) THEN
    RETURN NEW;
  END IF;

  FOR tx_group IN
    SELECT
      COALESCE(ft.financing_id, ft.financing_request_id) AS fr_id,
      COALESCE(SUM(CASE WHEN ft.type = 'consumo' THEN ft.amount ELSE 0 END), 0) AS consumed_amount,
      COALESCE(SUM(CASE WHEN ft.type = 'reposicion' THEN ft.amount ELSE 0 END), 0) AS restored_amount
    FROM public.financing_transactions ft
    WHERE ft.supplier_order_id = NEW.id
      AND COALESCE(ft.financing_id, ft.financing_request_id) IS NOT NULL
    GROUP BY COALESCE(ft.financing_id, ft.financing_request_id)
  LOOP
    refund_amount := GREATEST(0, tx_group.consumed_amount - tx_group.restored_amount);

    IF COALESCE(refund_amount, 0) <= 0 THEN
      CONTINUE;
    END IF;

    IF NEW.parent_order_id IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM public.financing_transactions ft
         WHERE ft.type = 'reposicion'
           AND ft.is_automatic = true
           AND COALESCE(ft.financing_id, ft.financing_request_id) = tx_group.fr_id
           AND ft.metadata->>'rollback_order_id' = NEW.parent_order_id::text
       ) THEN
      CONTINUE;
    END IF;

    UPDATE public.financing_requests
    SET amount_used = GREATEST(0, COALESCE(amount_used, 0) - refund_amount),
        available_amount = LEAST(
          COALESCE(amount, COALESCE(available_amount, 0) + refund_amount),
          COALESCE(available_amount, 0) + refund_amount
        ),
        updated_at = now()
    WHERE id = tx_group.fr_id;

    INSERT INTO public.financing_transactions (
      financing_request_id,
      financing_id,
      type,
      amount,
      supplier_order_id,
      metadata,
      is_automatic,
      created_at
    )
    VALUES (
      tx_group.fr_id,
      tx_group.fr_id,
      'reposicion',
      refund_amount,
      NEW.id,
      jsonb_build_object(
        'supplier_order_id', NEW.id,
        'parent_order_id', NEW.parent_order_id,
        'rollback_order_id', NEW.parent_order_id,
        'reason', 'supplier_order_cancelled_auto_restore',
        'trigger_op', TG_OP
      ),
      true,
      now()
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'supplier_orders'
  ) THEN
    DROP TRIGGER IF EXISTS trg_restore_financing_on_supplier_order_cancel ON public.supplier_orders;

    CREATE TRIGGER trg_restore_financing_on_supplier_order_cancel
      AFTER UPDATE ON public.supplier_orders
      FOR EACH ROW
      WHEN (NEW.status IN ('cancelled', 'rejected') AND OLD.status NOT IN ('cancelled', 'rejected'))
      EXECUTE FUNCTION public.restore_financing_on_supplier_order_cancel();
  END IF;
END;
$$;

COMMIT;
