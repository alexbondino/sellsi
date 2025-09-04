-- Migration: Pricing Authority Phase 2 (add columns + RPC finalize_order_pricing)
-- Adds pricing_verified_at & items_hash columns on orders.
-- Adds (if not present) pgcrypto extension for digest hashing (already added in base schema but guarded here).
-- Creates function finalize_order_pricing(p_order_id uuid) to recompute authoritative pricing based on product_quantity_ranges
-- and products base price; enriches each JSON item with unit_price_effective, unit_price_original, tier_band_used.
-- Idempotent: checks existence of columns & function.

DO $$
BEGIN
  -- Add columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='pricing_verified_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN pricing_verified_at timestamptz;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='items_hash'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN items_hash text;
  END IF;
END $$;

-- Ensure pgcrypto for digest
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop previous version (safe)
DROP FUNCTION IF EXISTS public.finalize_order_pricing(uuid);

CREATE OR REPLACE FUNCTION public.finalize_order_pricing(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_item jsonb;
  v_items jsonb := '[]'::jsonb;
  v_qty integer;
  v_product_id uuid;
  v_original_price numeric;
  v_effective_price numeric;
  v_tier_band text;
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_new_total numeric := 0;
  v_hash text;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  v_shipping := COALESCE(v_order.shipping,0);

  -- Iterate items
  FOR v_item IN
    SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_order.items)='array' THEN v_order.items ELSE '[]'::jsonb END)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id','')::uuid;
    v_qty := COALESCE(NULLIF(v_item->>'quantity','')::int,1);
    v_original_price := COALESCE(NULLIF(v_item->>'price_at_addition','')::numeric, NULLIF(v_item->>'price','')::numeric, 0);

    IF v_product_id IS NOT NULL THEN
      -- Try to find matching tier
      SELECT pqr.price::numeric, 'range:'||pqr.min_quantity||COALESCE('-'||pqr.max_quantity,'+') INTO v_effective_price, v_tier_band
      FROM public.product_quantity_ranges pqr
      WHERE pqr.product_id = v_product_id
        AND v_qty >= pqr.min_quantity
        AND (pqr.max_quantity IS NULL OR v_qty <= pqr.max_quantity)
      ORDER BY pqr.min_quantity DESC
      LIMIT 1;

      IF v_effective_price IS NULL THEN
        -- Fallback: base product price
        SELECT pr.price::numeric INTO v_effective_price FROM public.products pr WHERE pr.productid = v_product_id;
        v_tier_band := 'base';
      END IF;
    ELSE
      v_effective_price := v_original_price; -- cannot resolve product
      v_tier_band := 'unknown';
    END IF;

    -- Guard: never allow zero if we have an effective price
    IF (v_effective_price IS NULL OR v_effective_price = 0) AND v_original_price > 0 THEN
      v_effective_price := v_original_price; -- salvage original
      v_tier_band := COALESCE(v_tier_band,'original');
    END IF;

    v_subtotal := v_subtotal + (COALESCE(v_effective_price,0) * v_qty);

    -- Merge enriched fields
    v_items := v_items || jsonb_build_array(
      v_item || jsonb_build_object(
        'unit_price_original', v_original_price,
        'unit_price_effective', v_effective_price,
        'tier_band_used', v_tier_band
      )
    );
  END LOOP;

  v_new_total := v_subtotal + v_shipping;

  SELECT encode(digest(convert_to(v_items::text,'UTF8'),'sha256'),'hex') INTO v_hash;

  UPDATE public.orders
  SET items = v_items,
      subtotal = v_subtotal,
      total = v_new_total,
      pricing_verified_at = now(),
      items_hash = v_hash,
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

COMMENT ON FUNCTION public.finalize_order_pricing(uuid) IS 'Recalculate and seal authoritative pricing for an order (tiers + base price).';
