-- 20260120090001_financing_business_logic.sql
-- Módulo: Financiamiento - Business Logic
-- Fecha/Version: 2026-01-20 09:00:01
-- Autor: GitHub Copilot (generado)

BEGIN;

-- 1) Función: Restaurar financiación cuando una orden del supplier (supplier_orders)
-- es cancelada. Esta función asume que existe una tabla `supplier_orders` con
-- columnas: id, financing_request_id uuid, amount numeric, status text

CREATE OR REPLACE FUNCTION public.restore_financing_on_supplier_order_cancel()
RETURNS trigger AS $$
DECLARE
  fr_id uuid;
  refunded_amount numeric;
BEGIN
  -- Sólo actuar si cambió a 'cancelled'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status <> 'cancelled') THEN
    fr_id := NEW.financing_request_id;
    refunded_amount := COALESCE(NEW.amount, 0);

    IF fr_id IS NOT NULL AND refunded_amount > 0 THEN
      -- Aumentar available_amount y registrar transacción
      UPDATE public.financing_requests
      SET available_amount = available_amount + refunded_amount,
          updated_at = now()
      WHERE id = fr_id;

      INSERT INTO public.financing_transactions
      (financing_request_id, type, amount, metadata)
      VALUES (fr_id, 'refund', refunded_amount, jsonb_build_object('order_id', NEW.id));
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (sólo si tabla supplier_orders existe)
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

-- 2) Función: Actualizar flag de mora en buyer cuando financiamiento expira
CREATE OR REPLACE FUNCTION public.update_buyer_overdue_flag()
RETURNS trigger AS $$
DECLARE
  buyer_has_overdue boolean;
BEGIN
  -- Evitar ejecutar innecesariamente en UPDATE si el status no cambió
  IF TG_OP = 'UPDATE' AND (NEW.status IS NOT DISTINCT FROM OLD.status) THEN
    RETURN NEW;
  END IF;

  -- recalcular si el buyer tiene financiamientos expirados
  SELECT EXISTS (
    SELECT 1 FROM public.financing_requests fr
    WHERE fr.buyer_id = NEW.buyer_id AND fr.status = 'expired'
  ) INTO buyer_has_overdue;

  UPDATE public.buyer
  SET has_overdue_financing = buyer_has_overdue,
      updated_at = now()
  WHERE id = NEW.buyer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_buyer_overdue_flag ON public.financing_requests;
CREATE TRIGGER trg_update_buyer_overdue_flag
AFTER INSERT OR UPDATE ON public.financing_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_buyer_overdue_flag();

COMMIT;

-- ===== Tests manuales =====
-- 1) Simular cancelación de una orden (si existe supplier_orders):
-- UPDATE supplier_orders SET status = 'cancelled' WHERE id = '<order-id>';
-- 2) Simular expiración de financiamiento:
-- UPDATE public.financing_requests SET status = 'expired' WHERE id = '<financing-id>';

-- ===== Rollback =====
-- DROP TRIGGER IF EXISTS trg_restore_financing_on_supplier_order_cancel ON public.supplier_orders;
-- DROP FUNCTION IF EXISTS public.restore_financing_on_supplier_order_cancel();
-- DROP TRIGGER IF EXISTS trg_update_buyer_overdue_flag ON public.financing_requests;
-- DROP FUNCTION IF EXISTS public.update_buyer_overdue_flag();
