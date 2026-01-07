-- Migration: Allow buyers to hide orders with payment_status = 'rejected'
-- Purpose: Update mark_order_hidden_by_buyer RPC to allow hiding orders whose payment_status is 'rejected' in addition to 'expired'

BEGIN;

-- Replace RPC with a version that accepts 'expired' or 'rejected'
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

  -- Allow hiding orders with expired OR rejected payment status
  IF v_order.payment_status NOT IN ('expired', 'rejected') THEN
    RAISE EXCEPTION 'Only orders with expired or rejected payment can be hidden. Current status: %', v_order.payment_status;
  END IF;

  IF COALESCE(v_order.hidden_by_buyer, false) = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'updated', false,
      'message', 'Order was already hidden'
    );
  END IF;

  -- Ensure trigger validation is bypassed for this trusted RPC so the buyer can mark hidden_by_buyer
  PERFORM set_config('app.bypass_order_trigger', 'true', true);

  -- Mark as hidden (does not delete)
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

-- Ensure authenticated users can execute the RPC
DO $$
BEGIN
  BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.mark_order_hidden_by_buyer(uuid) TO authenticated';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;

COMMENT ON FUNCTION public.mark_order_hidden_by_buyer(uuid) IS
  'Allows a buyer to hide an order with payment_status ''expired'' or ''rejected'' from their "Mis Pedidos" list. The order is not deleted, only marked hidden_by_buyer = true.';

COMMIT;
