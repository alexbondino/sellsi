-- Migration: unify order status model (orders table becomes canonical lifecycle source)
-- Timestamp: 2025-08-13 22:30:00 (UTC approximation)
-- Safe, idempotent-ish (uses IF NOT EXISTS / conditional logic). Review before production.

-- 1. Add new lifecycle / audit columns if they do not exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status text; -- optional secondary dimension (logística)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispatched_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rejection_reason text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- 2. Backfill legacy statuses (observed: pending, paid, completed)
-- Map: paid -> accepted (financially approved), completed -> delivered (will derive completed later if needed)
WITH orig AS (
  SELECT id, status AS old_status FROM public.orders
)
UPDATE public.orders o
SET status = CASE orig.old_status
               WHEN 'completed' THEN 'delivered'
               WHEN 'paid'      THEN 'accepted'
               ELSE orig.old_status
             END,
    accepted_at = CASE
                    WHEN orig.old_status = 'paid' AND o.accepted_at IS NULL THEN COALESCE(o.accepted_at, o.updated_at, o.created_at)
                    ELSE o.accepted_at
                  END,
    delivered_at = CASE
                     WHEN orig.old_status = 'completed' AND o.delivered_at IS NULL THEN COALESCE(o.delivered_at, o.updated_at, o.created_at)
                     ELSE o.delivered_at
                   END
FROM orig
WHERE o.id = orig.id
  AND orig.old_status IN ('paid','completed');

-- 3. (Optional) Normalize any accidental Spanish labels if they exist (defensive)
UPDATE public.orders SET status = 'pending'    WHERE status ILIKE 'pendiente';
UPDATE public.orders SET status = 'accepted'   WHERE status ILIKE 'aceptado';
UPDATE public.orders SET status = 'rejected'   WHERE status ILIKE 'rechazado';
UPDATE public.orders SET status = 'in_transit' WHERE status ILIKE 'en transito' OR status ILIKE 'en tránsito';
UPDATE public.orders SET status = 'delivered'  WHERE status ILIKE 'entregado';
UPDATE public.orders SET status = 'cancelled'  WHERE status ILIKE 'cancelado';

-- 4. Add CHECK constraint for canonical set (include 'completed' only if you plan separate terminal state)
-- First drop existing constraint if it was previously created with a different name (safe try)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_allowed'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_allowed;
  END IF;
END$$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_allowed
  CHECK (status IN ('pending','accepted','in_transit','delivered','completed','cancelled','rejected'));

-- 5. Indexes to speed filters
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON public.orders(fulfillment_status);

-- 6. Trigger to auto timestamp lifecycle transitions
CREATE OR REPLACE FUNCTION public.orders_status_audit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN
      NEW.accepted_at := now();
    ELSIF NEW.status = 'in_transit' AND NEW.dispatched_at IS NULL THEN
      NEW.dispatched_at := now();
    ELSIF NEW.status = 'delivered' AND NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    ELSIF NEW.status = 'cancelled' AND NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_audit ON public.orders;
CREATE TRIGGER trg_orders_status_audit
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.orders_status_audit();

-- 7. Derived view (optional) to know if an order is fully completed financially & logísticamente
CREATE OR REPLACE VIEW public.orders_enriched AS
SELECT
  o.*,
  (o.status = 'delivered' AND o.payment_status = 'paid') AS is_completed_financially
FROM public.orders o;

-- 8. (Optional) Future: migrate fulfilment_status separately if you decide to split dimensions.
-- For now we leave fulfillment_status NULL. You could later backfill: UPDATE public.orders SET fulfillment_status = status WHERE fulfillment_status IS NULL;

-- 9. Safety report (rows with non-canonical status AFTER migration) - returns 0 rows ideally
-- SELECT status, COUNT(*) FROM public.orders GROUP BY status HAVING status NOT IN ('pending','accepted','in_transit','delivered','completed','cancelled','rejected');

-- END OF MIGRATION
