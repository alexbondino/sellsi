-- Migration: offers status automation (reserved & paid transitions)
-- Description:
-- 1. When a cart_items row is inserted with offer_id, transition offer status approved/accepted -> reserved.
-- 2. When an order's payment_status becomes 'paid', transition linked offers to 'paid'.
-- 3. Backfill existing data (offers with order paid but not marked paid; offers in cart but still approved/accepted).
--
-- Assumptions (adjust if schema differs in production):
-- * Table public.offers has columns: id uuid PK, status text, order_id uuid, updated_at timestamptz, purchase_deadline timestamptz (optional).
-- * Table public.cart_items has offer_id uuid nullable.
-- * Table public.orders has id uuid PK, payment_status text.
-- * Allowed statuses include: pending, approved, accepted (legacy), reserved, paid, cancelled, rejected, expired.
--
-- Safety: Functions created IF NOT EXISTS pattern via DO blocks.
-- Idempotent updates guarded by status filters.

-- 1) FUNCTION: reserve offer on cart add
-- Create or replace function that marks an offer as reserved when it's added to cart
CREATE OR REPLACE FUNCTION public.fn_offer_mark_reserved_on_cart_insert()
RETURNS trigger AS $$
BEGIN
  IF NEW.offer_id IS NOT NULL THEN
    UPDATE public.offers
       SET status = 'reserved',
           updated_at = NOW()
     WHERE id = NEW.offer_id
       AND status IN ('approved','accepted');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (idempotent: drop if exists then create)
DROP TRIGGER IF EXISTS tr_offer_mark_reserved_on_cart_insert ON public.cart_items;
CREATE TRIGGER tr_offer_mark_reserved_on_cart_insert
AFTER INSERT ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_offer_mark_reserved_on_cart_insert();

-- 2) FUNCTION: mark offers paid when order paid
-- Create or replace function that marks offers as paid when the related order becomes paid
CREATE OR REPLACE FUNCTION public.fn_offers_mark_paid_on_order_paid()
RETURNS trigger AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    UPDATE public.offers
       SET status = 'paid',
           updated_at = NOW()
     WHERE order_id = NEW.id
       AND status IN ('reserved','approved','accepted');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for orders (drop if exists then create)
DROP TRIGGER IF EXISTS tr_offers_mark_paid_on_order_paid ON public.orders;
CREATE TRIGGER tr_offers_mark_paid_on_order_paid
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_offers_mark_paid_on_order_paid();

-- 3) BACKFILL: offers linked to paid orders but not marked paid
-- 3) Ensure CHECK constraint for known statuses includes 'paid' (idempotent)
ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_status_check;
ALTER TABLE public.offers
  ADD CONSTRAINT offers_status_check CHECK (status = ANY (ARRAY['pending','approved','accepted','reserved','paid','cancelled','rejected','expired']));

-- 4) BACKFILL: offers linked to paid orders but not marked paid
UPDATE public.offers o
SET status = 'paid', updated_at = NOW()
FROM public.orders ord
WHERE o.order_id = ord.id
  AND ord.payment_status = 'paid'
  AND o.status IN ('reserved','approved','accepted');

-- 4b) (Optional) BACKFILL reserved: offers already in cart_items but still approved/accepted
-- We infer "in cart" by presence of cart_items.offer_id
UPDATE public.offers o
SET status = 'reserved', updated_at = NOW()
WHERE o.status IN ('approved','accepted')
  AND EXISTS (
    SELECT 1 FROM public.cart_items ci WHERE ci.offer_id = o.id
  );

-- 5) COMMENT docs
COMMENT ON FUNCTION public.fn_offer_mark_reserved_on_cart_insert IS 'Sets offer.status=reserved when added to cart (offer_id on cart_items insert)';
COMMENT ON FUNCTION public.fn_offers_mark_paid_on_order_paid IS 'Sets offer.status=paid when related order.payment_status becomes paid';
