-- Migration: rollback financing consumption + align payment-status compatibility
-- Date: 2026-02-13
-- Purpose:
--   1) In mixed financing + gateway orders, restore consumed financing when gateway fails/cancels/expires
--   2) Allow buyer hide RPC for failed/cancelled payment statuses
--   3) Expand orders.payment_status CHECK to include failed/cancelled

BEGIN;

CREATE OR REPLACE FUNCTION public.rollback_order_financing_on_payment_failure(
  p_order_id uuid,
  p_gateway text DEFAULT NULL,
  p_gateway_status text DEFAULT NULL,
  p_reason text DEFAULT 'payment_failed'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order RECORD;
  v_restored_total numeric := 0;
  v_rows integer := 0;
  v_now timestamptz := now();
  v_financing_id uuid;
  v_amount numeric;
BEGIN
  SELECT id, payment_status, financing_amount
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'ORDER_NOT_FOUND', 'order_id', p_order_id);
  END IF;

  IF COALESCE(v_order.financing_amount, 0) <= 0 THEN
    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'restored_amount', 0, 'reason', 'no_financing');
  END IF;

  IF COALESCE(v_order.payment_status, '') NOT IN ('failed', 'rejected', 'expired', 'cancelled') THEN
    RETURN jsonb_build_object(
      'error',
      'INVALID_PAYMENT_STATUS_FOR_ROLLBACK',
      'order_id',
      p_order_id,
      'current_status',
      v_order.payment_status
    );
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.financing_transactions ft
    WHERE ft.type = 'reposicion'
      AND ft.is_automatic = true
      AND ft.metadata->>'rollback_order_id' = p_order_id::text
  ) THEN
    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'already_processed', true);
  END IF;

  FOR v_financing_id, v_amount IN
    SELECT
      COALESCE(ft.financing_id, ft.financing_request_id)::uuid AS financing_id,
      SUM(COALESCE(ft.amount, 0))::numeric AS amount_to_restore
    FROM public.financing_transactions ft
    WHERE ft.type = 'consumo'
      AND ft.metadata->>'order_id' = p_order_id::text
    GROUP BY COALESCE(ft.financing_id, ft.financing_request_id)
  LOOP
    IF v_financing_id IS NULL OR COALESCE(v_amount, 0) <= 0 THEN
      CONTINUE;
    END IF;

    UPDATE public.financing_requests fr
    SET amount_used = GREATEST(0, COALESCE(fr.amount_used, 0) - v_amount),
        available_amount = COALESCE(fr.available_amount, 0) + v_amount,
        updated_at = v_now
    WHERE fr.id = v_financing_id;

    IF FOUND THEN
      INSERT INTO public.financing_transactions (
        financing_request_id,
        financing_id,
        type,
        amount,
        metadata,
        is_automatic,
        created_at
      )
      VALUES (
        v_financing_id,
        v_financing_id,
        'reposicion',
        v_amount,
        jsonb_build_object(
          'rollback_order_id', p_order_id,
          'gateway', p_gateway,
          'gateway_status', p_gateway_status,
          'reason', p_reason,
          'rollback_source', 'order_payment_failure',
          'rolled_back_from', 'consumo'
        ),
        true,
        v_now
      );

      v_restored_total := v_restored_total + v_amount;
      v_rows := v_rows + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'restored_amount', v_restored_total,
    'financing_rows', v_rows
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rollback_order_financing_on_payment_failure(uuid, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_order_hidden_by_buyer(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_updates int := 0;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'p_order_id is required';
  END IF;

  SELECT id, user_id, payment_status, hidden_by_buyer
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF auth.uid() <> v_order.user_id THEN
    RAISE EXCEPTION 'Not authorized: you are not the owner of this order';
  END IF;

  IF v_order.payment_status NOT IN ('expired', 'rejected', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Only orders with expired/rejected/failed/cancelled payment can be hidden. Current status: %', v_order.payment_status;
  END IF;

  IF COALESCE(v_order.hidden_by_buyer, false) = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'updated', false,
      'message', 'Order was already hidden'
    );
  END IF;

  PERFORM set_config('app.bypass_order_trigger', 'true', true);

  UPDATE public.orders
  SET hidden_by_buyer = true,
      updated_at = now()
  WHERE id = p_order_id;

  GET DIAGNOSTICS v_updates = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated', v_updates > 0,
    'order_id', p_order_id
  );
END;
$$;

COMMENT ON FUNCTION public.mark_order_hidden_by_buyer(uuid) IS
  'Allows a buyer to hide an order with payment_status expired/rejected/failed/cancelled from Mis Pedidos.';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'rejected', 'failed', 'expired', 'cancelled', 'refunded'));

COMMIT;
