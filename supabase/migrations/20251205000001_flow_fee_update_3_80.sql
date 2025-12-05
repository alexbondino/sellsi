-- Migration: Update Flow Fee from 3.19% to 3.80%
-- Date: 2024-12-05
-- Description: Flow changed their commission from 3.19% to 3.80%

-- Replace function to update Flow fee calculation from 3.19% to 3.80%
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
  v_offer_id uuid;
  v_offer_price numeric;
  v_offer_status text;
  v_subtotal numeric := 0;        -- ASSUMED GROSS (IVA incluido)
  v_shipping numeric := 0;        -- ASSUMED GROSS if provided as such
  v_tax_included numeric := 0;    -- IVA derivado incluido en v_subtotal
  v_total_base numeric := 0;      -- subtotal (gross) + shipping (gross)
  v_payment_fee numeric := 0;     -- fee según método de pago
  v_grand_total numeric := 0;     -- total_base + fee
  v_hash text;
  v_allow_pending boolean := coalesce(current_setting('app.offer_allow_pending', true)::text, '0') = '1';
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  v_shipping := COALESCE(v_order.shipping,0);

  FOR v_item IN
    SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_order.items)='array' THEN v_order.items ELSE '[]'::jsonb END)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id','')::uuid;
    v_offer_id := NULLIF(v_item->>'offer_id','')::uuid;
    v_qty := COALESCE(NULLIF(v_item->>'quantity','')::int,1);
    v_original_price := COALESCE(NULLIF(v_item->>'price_at_addition','')::numeric, NULLIF(v_item->>'price','')::numeric, 0);

    IF v_product_id IS NOT NULL THEN
      SELECT pqr.price::numeric, 'range:'||pqr.min_quantity||COALESCE('-'||pqr.max_quantity,'+')
        INTO v_effective_price, v_tier_band
      FROM public.product_quantity_ranges pqr
      WHERE pqr.product_id = v_product_id
        AND v_qty >= pqr.min_quantity
        AND (pqr.max_quantity IS NULL OR v_qty <= pqr.max_quantity)
      ORDER BY pqr.min_quantity DESC
      LIMIT 1;

      IF v_effective_price IS NULL THEN
        SELECT pr.price::numeric INTO v_effective_price FROM public.products pr WHERE pr.productid = v_product_id;
        v_tier_band := 'base';
      END IF;
    ELSE
      v_effective_price := v_original_price;
      v_tier_band := 'unknown';
    END IF;

    IF (v_effective_price IS NULL OR v_effective_price = 0) AND v_original_price > 0 THEN
      v_effective_price := v_original_price;
      v_tier_band := COALESCE(v_tier_band,'original');
    END IF;

    -- Offer override (pending allowed by GUC when enabled)
    IF v_offer_id IS NOT NULL THEN
      SELECT offered_price::numeric, status INTO v_offer_price, v_offer_status FROM public.offers WHERE id = v_offer_id;
      IF v_offer_price IS NOT NULL AND v_offer_price > 0 THEN
        IF v_offer_status IN ('accepted','reserved') OR (v_allow_pending AND v_offer_status = 'pending') THEN
          IF v_offer_price < v_effective_price THEN
            v_effective_price := v_offer_price;
            v_tier_band := 'offer';
          END IF;
        END IF;
      END IF;
    END IF;

    v_subtotal := v_subtotal + (COALESCE(v_effective_price,0) * v_qty);

    v_items := v_items || jsonb_build_array(
      v_item || jsonb_build_object(
        'unit_price_original', v_original_price,
        'unit_price_effective', v_effective_price,
        'tier_band_used', v_tier_band
      )
    );
  END LOOP;

  -- IVA incluido: derivar porción incluida (no sumar de nuevo al total)
  IF v_subtotal > 0 THEN
    v_tax_included := round(v_subtotal - (v_subtotal / 1.19));
  ELSE
    v_tax_included := 0;
  END IF;

  -- Total base no re-suma IVA (ya viene incluido en v_subtotal)
  v_total_base := v_subtotal + v_shipping;

  -- ============================================================================
  -- Payment fee según método de pago
  -- ============================================================================
  IF v_order.payment_method = 'khipu' THEN
    -- Khipu: comisión fija de $500 CLP
    v_payment_fee := 500;
  ELSIF v_order.payment_method = 'flow' THEN
    -- Flow: comisión de 3.80% sobre el total base (subtotal + shipping)
    -- Actualizado 2024-12-05: cambió de 3.19% a 3.80%
    v_payment_fee := ROUND(v_total_base * 0.038);
  ELSE
    v_payment_fee := 0;
  END IF;

  v_grand_total := v_total_base + v_payment_fee;

  SELECT encode(digest(convert_to(v_items::text,'UTF8'),'sha256'),'hex') INTO v_hash;

  UPDATE public.orders
  SET items = v_items,
      subtotal = v_subtotal,
      tax = v_tax_included,
      total = v_total_base,
      payment_fee = v_payment_fee,
      grand_total = v_grand_total,
      pricing_verified_at = now(),
      items_hash = v_hash,
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

COMMENT ON FUNCTION public.finalize_order_pricing(uuid) IS 'Seal pricing (gross): tiers, offers, derive included tax, add fee (Khipu $500 / Flow 3.80%), hash. Updated 2024-12-05.';
