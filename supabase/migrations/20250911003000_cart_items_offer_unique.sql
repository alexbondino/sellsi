-- ==========================================================================
-- Migration: Enforce single offered line per (cart_id, product_id, offer_id)
-- Date: 2025-09-11
-- Purpose: Business rule - una oferta no se puede añadir dos veces; si ya
--          existe la línea ofertada debe editarse su cantidad (o bloquearse).
-- Strategy: Partial UNIQUE index (offer_id IS NOT NULL).
-- Safety:   Abort if duplicates currently exist so we don't create a broken
--           index silently. Developer must resolve duplicates manually.
-- ==========================================================================

-- 1. Safety check: abort if duplicates exist
DO $$
DECLARE
  v_has_dups boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM (
      SELECT cart_id, product_id, offer_id, COUNT(*) AS c
      FROM public.cart_items
      WHERE offer_id IS NOT NULL
      GROUP BY 1,2,3 HAVING COUNT(*) > 1
    ) d
  ) INTO v_has_dups;

  IF v_has_dups THEN
    RAISE EXCEPTION 'Duplicated offered cart lines exist; clean them before applying unique index (cart_id, product_id, offer_id).';
  END IF;
END $$;

-- 2. Create partial unique index (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cart_items_cart_product_offer
  ON public.cart_items (cart_id, product_id, offer_id)
  WHERE offer_id IS NOT NULL;

COMMENT ON INDEX public.uniq_cart_items_cart_product_offer IS 'Guarantees one offered line per (cart_id, product_id, offer_id).';

-- Done.
