-- Harden expiration logic to handle NULL khipu_expires_at using COALESCE fallback
-- and add a safety check for excessively old pending payments (> 2 hours) regardless of expires.

BEGIN;

CREATE OR REPLACE FUNCTION public.cancel_stale_payment_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  UPDATE public.orders o
  SET payment_status = 'expired',
      status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
      cancellation_reason = COALESCE(cancellation_reason, 'payment window expired'),
      updated_at = now()
  WHERE o.payment_method = 'khipu'
    AND o.payment_status = 'pending'
    AND o.paid_at IS NULL
    AND (
      now() > COALESCE(o.khipu_expires_at, o.created_at + interval '20 minutes')
      OR now() > o.created_at + interval '2 hours'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o2 WHERE o2.id = o.id AND o2.payment_status IN ('paid','failed','expired')
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE LOG 'cancel_stale_payment_orders: % órdenes expiradas (COALESCE fallback active)', v_updated;
END;
$$;

-- Optional: reindex to ensure planner uses the index efficiently (noop if already exists)
-- Existing partial index might not cover NULL khipu_expires_at; create an expanded one.
-- Create an expression index to help planner choose rows with either explicit expires or fallback to created_at
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment_exp_coalesce ON public.orders
  USING btree (COALESCE(khipu_expires_at, created_at))
  WHERE payment_method = 'khipu' AND payment_status = 'pending' AND paid_at IS NULL;

COMMIT;
