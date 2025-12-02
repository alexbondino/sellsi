-- Migration: Add hidden_by_buyer column to orders table and create RPC function
-- Purpose: Allow buyers to "delete" (hide) expired payment orders from their view
-- Pattern: Following mark_offer_hidden from offers table

BEGIN;

-- ============================================================================
-- 1. ADD COLUMN hidden_by_buyer TO orders TABLE
-- ============================================================================
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS hidden_by_buyer boolean DEFAULT false;

-- Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_orders_hidden_by_buyer 
ON public.orders(hidden_by_buyer) 
WHERE hidden_by_buyer = false OR hidden_by_buyer IS NULL;

-- ============================================================================
-- 2. CREATE RPC FUNCTION mark_order_hidden_by_buyer
-- ============================================================================
-- This function allows a buyer to hide an expired payment order from their list.
-- Uses SECURITY DEFINER to bypass RLS restrictions on UPDATE.
-- Only allows hiding orders with payment_status = 'expired'.

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
  -- Validate input
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'p_order_id is required';
  END IF;

  -- Get order and verify it exists
  SELECT id, user_id, payment_status, hidden_by_buyer 
  INTO v_order 
  FROM public.orders 
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- Verify ownership: only the buyer who placed the order can hide it
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF auth.uid() <> v_order.user_id THEN
    RAISE EXCEPTION 'Not authorized: you are not the owner of this order';
  END IF;

  -- Only allow hiding orders with expired payment status
  IF v_order.payment_status <> 'expired' THEN
    RAISE EXCEPTION 'Only orders with expired payment can be hidden. Current status: %', v_order.payment_status;
  END IF;

  -- Check if already hidden
  IF COALESCE(v_order.hidden_by_buyer, false) = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'updated', false,
      'message', 'Order was already hidden'
    );
  END IF;

  -- Update the order to mark it as hidden
  UPDATE public.orders 
  SET 
    hidden_by_buyer = true, 
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

-- ============================================================================
-- 3. GRANT PERMISSIONS
-- ============================================================================
DO $$ 
BEGIN
  BEGIN 
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.mark_order_hidden_by_buyer(uuid) TO authenticated'; 
  EXCEPTION WHEN others THEN 
    NULL; 
  END;
END $$;

-- ============================================================================
-- 4. ADD COMMENT FOR DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION public.mark_order_hidden_by_buyer(uuid) IS 
'Allows a buyer to hide an expired payment order from their "Mis Pedidos" list. 
Only works for orders with payment_status = ''expired''. 
The order is not deleted, just marked as hidden_by_buyer = true for metrics/audit purposes.';

COMMENT ON COLUMN public.orders.hidden_by_buyer IS 
'When true, the order is hidden from the buyer''s order list. Used for expired payment orders that the buyer wants to remove from view.';

COMMIT;
