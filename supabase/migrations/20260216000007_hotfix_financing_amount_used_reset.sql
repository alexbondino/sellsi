-- ============================================================================
-- HOTFIX CRÍTICO: amount_used reiniciado a 0 en financiamientos activos
-- Fecha: 2026-02-16
--
-- 🐛 BUG #34 FIX:
-- - Asegura que process_financing_payment_success use modelo acumulado:
--   amount_used (utilizado acumulado) y amount_paid (pagado acumulado)
-- - Repara filas inconsistentes donde amount_used=0 pero available_amount<amount
--
-- 🐛 BUG #35 FIX:
-- - Evita doble reposición automática de financiamiento en órdenes expirada/canceladas
--   cuando coexisten trigger legacy de supplier_orders y rollback por parent order
-- - Alinea reposición legacy para disminuir amount_used además de subir available_amount
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION process_financing_payment_success(
  p_payment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_current_status TEXT;
  v_previous_amount_used NUMERIC;
  v_previous_amount_paid NUMERIC;
  v_new_amount_paid NUMERIC;
  v_available_before NUMERIC;
  v_available_after NUMERIC;
BEGIN
  UPDATE financing_payments
  SET payment_status = 'paid',
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payment_id
    AND payment_status = 'pending'
  RETURNING * INTO v_payment;

  IF NOT FOUND THEN
    SELECT payment_status INTO v_current_status
    FROM financing_payments
    WHERE id = p_payment_id;

    IF FOUND THEN
      RETURN jsonb_build_object('error', 'Payment already processed', 'current_status', v_current_status);
    ELSE
      RETURN jsonb_build_object('error', 'Payment not found');
    END IF;
  END IF;

  SELECT amount_used, COALESCE(amount_paid, 0)
  INTO v_previous_amount_used, v_previous_amount_paid
  FROM financing_requests
  WHERE id = v_payment.financing_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financing request % not found for payment %', v_payment.financing_request_id, p_payment_id;
  END IF;

  v_available_before := GREATEST(0, COALESCE(v_previous_amount_used, 0) - COALESCE(v_previous_amount_paid, 0));

  IF v_payment.amount > v_available_before THEN
    RAISE EXCEPTION 'Payment amount % exceeds available debt % for financing %', v_payment.amount, v_available_before, v_payment.financing_request_id;
  END IF;

  UPDATE financing_requests
  SET amount_paid = COALESCE(amount_paid, 0) + v_payment.amount,
      updated_at = NOW()
  WHERE id = v_payment.financing_request_id
  RETURNING amount_paid INTO v_new_amount_paid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update financing_request amount_paid for payment %', p_payment_id;
  END IF;

  v_available_after := GREATEST(0, COALESCE(v_previous_amount_used, 0) - COALESCE(v_new_amount_paid, 0));

  INSERT INTO financing_transactions (
    financing_request_id,
    financing_id,
    type,
    amount,
    metadata,
    created_at
  ) VALUES (
    v_payment.financing_request_id,
    v_payment.financing_request_id,
    'payment',
    v_payment.amount::numeric,
    jsonb_build_object(
      'description', 'Pago de deuda via ' || v_payment.payment_method,
      'payment_id', p_payment_id,
      'payment_method', v_payment.payment_method,
      'amount_used', v_previous_amount_used,
      'amount_paid_before', v_previous_amount_paid,
      'amount_paid_after', v_new_amount_paid,
      'available_before', v_available_before,
      'available_after', v_available_after
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'amount_paid', v_payment.amount,
    'amount_used', v_previous_amount_used,
    'previous_amount_paid', v_previous_amount_paid,
    'new_amount_paid', v_new_amount_paid,
    'available_before', v_available_before,
    'available_after', v_available_after
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_financing_payment_success(UUID) TO service_role;

CREATE TABLE IF NOT EXISTS public.financing_requests_amount_used_hotfix_20260216 (
  financing_request_id UUID PRIMARY KEY,
  financing_amount NUMERIC NOT NULL,
  old_available_amount NUMERIC NOT NULL,
  old_amount_used NUMERIC NOT NULL,
  expected_amount_used NUMERIC NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  repaired_at TIMESTAMPTZ
);

INSERT INTO public.financing_requests_amount_used_hotfix_20260216 (
  financing_request_id,
  financing_amount,
  old_available_amount,
  old_amount_used,
  expected_amount_used
)
SELECT
  fr.id,
  fr.amount,
  COALESCE(fr.available_amount, 0),
  COALESCE(fr.amount_used, 0),
  GREATEST(0, COALESCE(fr.amount, 0) - COALESCE(fr.available_amount, 0))
FROM financing_requests fr
WHERE COALESCE(fr.amount_used, 0) = 0
  AND COALESCE(fr.available_amount, 0) < COALESCE(fr.amount, 0)
ON CONFLICT (financing_request_id) DO NOTHING;

UPDATE financing_requests fr
SET amount_used = b.expected_amount_used,
    updated_at = NOW()
FROM public.financing_requests_amount_used_hotfix_20260216 b
WHERE fr.id = b.financing_request_id
  AND b.repaired_at IS NULL
  AND fr.amount_used = b.old_amount_used;

UPDATE public.financing_requests_amount_used_hotfix_20260216 b
SET repaired_at = NOW()
WHERE repaired_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM financing_requests fr
    WHERE fr.id = b.financing_request_id
      AND fr.amount_used = b.expected_amount_used
  );

CREATE OR REPLACE FUNCTION public.restore_financing_on_supplier_order_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fr_id uuid;
  refunded_amount numeric;
  v_refund_amount numeric;
  v_consumed_amount numeric;
  v_restored_amount numeric;
  v_parent_order_id uuid;
  v_parent_payment_status text;
  v_parent_status text;
BEGIN
  IF NOT (
    TG_OP = 'UPDATE'
    AND NEW.status IN ('cancelled', 'rejected')
    AND OLD.status NOT IN ('cancelled', 'rejected')
  ) THEN
    RETURN NEW;
  END IF;

  fr_id := NEW.financing_request_id;
  refunded_amount := COALESCE(NEW.amount, 0);
  v_parent_order_id := NEW.parent_order_id;

  IF fr_id IS NULL OR refunded_amount <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(ft.amount), 0)
  INTO v_consumed_amount
  FROM public.financing_transactions ft
  WHERE ft.type = 'consumo'
    AND ft.supplier_order_id = NEW.id
    AND COALESCE(ft.financing_id, ft.financing_request_id) = fr_id;

  SELECT COALESCE(SUM(ft.amount), 0)
  INTO v_restored_amount
  FROM public.financing_transactions ft
  WHERE ft.type = 'reposicion'
    AND ft.supplier_order_id = NEW.id
    AND COALESCE(ft.financing_id, ft.financing_request_id) = fr_id;

  v_refund_amount := LEAST(refunded_amount, GREATEST(0, v_consumed_amount - v_restored_amount));

  IF COALESCE(v_refund_amount, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  IF v_parent_order_id IS NOT NULL THEN
    SELECT o.payment_status, o.status
    INTO v_parent_payment_status, v_parent_status
    FROM public.orders o
    WHERE o.id = v_parent_order_id;

    IF COALESCE(v_parent_payment_status, '') IN ('expired', 'rejected', 'failed', 'cancelled')
       OR COALESCE(v_parent_status, '') = 'cancelled' THEN
      RETURN NEW;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.financing_transactions ft
      WHERE ft.type = 'reposicion'
        AND ft.is_automatic = true
        AND COALESCE(ft.financing_id, ft.financing_request_id) = fr_id
        AND ft.metadata->>'rollback_order_id' = v_parent_order_id::text
    ) THEN
      RETURN NEW;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.financing_transactions ft
    WHERE ft.type = 'reposicion'
      AND ft.is_automatic = true
      AND ft.supplier_order_id = NEW.id
      AND COALESCE(ft.financing_id, ft.financing_request_id) = fr_id
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.financing_requests
  SET amount_used = GREATEST(0, COALESCE(amount_used, 0) - v_refund_amount),
      available_amount = LEAST(
        COALESCE(amount, COALESCE(available_amount, 0) + v_refund_amount),
        COALESCE(available_amount, 0) + v_refund_amount
      ),
      updated_at = now()
  WHERE id = fr_id;

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
    fr_id,
    fr_id,
    'reposicion',
    v_refund_amount,
    NEW.id,
    jsonb_build_object(
      'order_id', NEW.id,
      'parent_order_id', v_parent_order_id,
      'consumed_amount_for_supplier_order', v_consumed_amount,
      'already_restored_for_supplier_order', v_restored_amount,
      'source', 'supplier_order_cancel_trigger'
    ),
    true,
    now()
  );

  RETURN NEW;
END;
$$;

COMMIT;
