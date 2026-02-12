-- ============================================================================
-- MIGRACIÓN: Modelo de deuda con amount_used acumulado y amount_paid acumulado
-- Fecha: 2026-02-12
-- Objetivo:
-- 1) Mantener amount_used como "monto total utilizado" (acumulado)
-- 2) Acumular pagos en amount_paid
-- 3) Deuda pendiente = amount_used - amount_paid
-- ============================================================================

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
