-- Migration: add offer metadata to cart_items
BEGIN;

ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS offer_id uuid NULL,
  ADD COLUMN IF NOT EXISTS offered_price numeric NULL,
  ADD COLUMN IF NOT EXISTS metadata jsonb NULL;

-- Index to speed up lookups by offer_id if needed
CREATE INDEX IF NOT EXISTS idx_cart_items_offer_id ON public.cart_items(offer_id);

COMMIT;
