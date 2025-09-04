-- =====================================================
-- Migration: Add legacy create_offer wrapper to satisfy clients calling 8-arg overload
-- Date: 2025-09-04
-- Purpose:
--   Some clients still call a legacy overloaded create_offer with the signature:
--     create_offer(uuid, text, numeric, integer, numeric, uuid, integer, uuid)
--   (reported in logs as p_buyer_id, p_message, p_offered_price, p_offered_quantity, p_price, p_product_id, p_quantity, p_supplier_id)
--   This migration adds a wrapper with that signature which normalizes args and delegates
--   to the canonical 6-arg create_offer(buyer, supplier, product, offered_price, offered_quantity, message).
--   The wrapper tries sensible fallbacks: prefer the explicit offered_price/offered_quantity params,
--   otherwise use p_price/p_quantity.
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.create_offer(
  p_buyer_id uuid,
  p_message text,
  p_offered_price numeric,
  p_offered_quantity integer,
  p_price numeric,
  p_product_id uuid,
  p_quantity integer,
  p_supplier_id uuid
) RETURNS jsonb AS $$
DECLARE
  effective_price numeric;
  effective_quantity integer;
  result jsonb;
BEGIN
  -- Prefer explicit offered_* params, fallback to legacy p_price/p_quantity
  effective_price := COALESCE(p_offered_price, p_price);
  effective_quantity := COALESCE(p_offered_quantity, p_quantity);

  -- Validate required fields early (fail-fast)
  IF p_buyer_id IS NULL OR p_supplier_id IS NULL OR p_product_id IS NULL THEN
    RAISE EXCEPTION 'create_offer (legacy wrapper): missing buyer/supplier/product';
  END IF;
  IF effective_price IS NULL THEN
    RAISE EXCEPTION 'create_offer (legacy wrapper): missing price';
  END IF;
  IF effective_quantity IS NULL THEN
    RAISE EXCEPTION 'create_offer (legacy wrapper): missing quantity';
  END IF;

  -- Delegate to canonical function (6-arg)
  result := public.create_offer(
    p_buyer_id,
    p_supplier_id,
    p_product_id,
    effective_price,
    effective_quantity,
    p_message
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_offer(uuid,text,numeric,integer,numeric,uuid,integer,uuid) TO authenticated;

COMMENT ON FUNCTION public.create_offer(uuid,text,numeric,integer,numeric,uuid,integer,uuid) IS 'Legacy wrapper mapping 8-arg legacy calls to canonical create_offer (added 20250904)';

COMMIT;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
