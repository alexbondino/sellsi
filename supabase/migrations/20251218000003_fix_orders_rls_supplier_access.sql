-- Migration: Fix Orders RLS for Suppliers
-- Date: 2025-12-18
-- Fixes: Suppliers can view/update orders, trigger allows supplier updates, trusted functions bypass trigger

-- ============================================================================
-- PART 1: SUPPLIER RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS orders_select_supplier ON orders;
CREATE POLICY orders_select_supplier ON orders
  FOR SELECT USING (auth.uid() = ANY(supplier_ids));

DROP POLICY IF EXISTS orders_update_supplier ON orders;
CREATE POLICY orders_update_supplier ON orders
  FOR UPDATE
  USING (auth.uid() = ANY(supplier_ids))
  WITH CHECK (auth.uid() = ANY(supplier_ids));

-- ============================================================================
-- PART 2: FIX TRIGGER - Allow suppliers in supplier_ids to update
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_order_update_security()
RETURNS TRIGGER AS $$
DECLARE
  v_is_supplier boolean;
  v_is_owner boolean;
  v_is_order_supplier boolean;
  v_current_user_id uuid;
  v_bypass_trigger text;
BEGIN
  -- Check bypass flag (trusted functions set this)
  BEGIN
    v_bypass_trigger := current_setting('app.bypass_order_trigger', true);
  EXCEPTION WHEN OTHERS THEN
    v_bypass_trigger := NULL;
  END;
  
  IF v_bypass_trigger = 'true' THEN
    RETURN NEW;
  END IF;
  
  v_current_user_id := auth.uid();
  
  -- service_role (NULL uid) bypasses all
  IF v_current_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  v_is_owner := (OLD.user_id = v_current_user_id);
  v_is_order_supplier := (v_current_user_id = ANY(COALESCE(OLD.supplier_ids, ARRAY[]::uuid[])));
  
  IF NOT v_is_owner AND NOT v_is_order_supplier THEN
    RAISE EXCEPTION 'No tienes permiso para modificar esta orden';
  END IF;
  
  SELECT main_supplier INTO v_is_supplier FROM users WHERE user_id = v_current_user_id;
  IF v_is_supplier IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- SUPPLIER: Can update status, supplier_parts_meta, updated_at, estimated_delivery_date
  IF v_is_supplier = TRUE AND v_is_order_supplier THEN
    IF (OLD.total IS DISTINCT FROM NEW.total) OR
       (OLD.subtotal IS DISTINCT FROM NEW.subtotal) OR
       (OLD.tax IS DISTINCT FROM NEW.tax) OR
       (OLD.shipping IS DISTINCT FROM NEW.shipping) OR
       (OLD.payment_fee IS DISTINCT FROM NEW.payment_fee) OR
       (OLD.grand_total IS DISTINCT FROM NEW.grand_total) THEN
      RAISE EXCEPTION 'Suppliers cannot modify order amounts';
    END IF;
    
    IF (OLD.items IS DISTINCT FROM NEW.items) THEN
      RAISE EXCEPTION 'Suppliers cannot modify items';
    END IF;
    
    IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
      RAISE EXCEPTION 'Suppliers cannot modify payment_status';
    END IF;
    
    IF (OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
      RAISE EXCEPTION 'Cannot change order owner';
    END IF;
    
    IF (OLD.pricing_verified_at IS DISTINCT FROM NEW.pricing_verified_at) OR
       (OLD.items_hash IS DISTINCT FROM NEW.items_hash) THEN
      RAISE EXCEPTION 'Suppliers cannot modify pricing fields';
    END IF;
    
    IF (OLD.khipu_payment_id IS DISTINCT FROM NEW.khipu_payment_id) OR
       (OLD.khipu_transaction_id IS DISTINCT FROM NEW.khipu_transaction_id) OR
       (OLD.khipu_payment_url IS DISTINCT FROM NEW.khipu_payment_url) OR
       (OLD.khipu_expires_at IS DISTINCT FROM NEW.khipu_expires_at) OR
       (OLD.flow_order IS DISTINCT FROM NEW.flow_order) OR
       (OLD.flow_token IS DISTINCT FROM NEW.flow_token) OR
       (OLD.flow_payment_url IS DISTINCT FROM NEW.flow_payment_url) OR
       (OLD.flow_expires_at IS DISTINCT FROM NEW.flow_expires_at) OR
       (OLD.paid_at IS DISTINCT FROM NEW.paid_at) THEN
      RAISE EXCEPTION 'Suppliers cannot modify payment external fields';
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- BUYER: Can only update hidden_by_buyer, updated_at, and mark as expired/cancelled/pending
  IF v_is_supplier = FALSE AND v_is_owner THEN
    -- Allow buyer to mark order as cancelled (cleanup)
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      IF NEW.status NOT IN ('cancelled') THEN
        RAISE EXCEPTION 'Buyers can only cancel orders, not change to other statuses';
      END IF;
    END IF;
    
    -- Allow buyer to mark payment as expired (cleanup) or pending (checkout start)
    IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
      IF NEW.payment_status NOT IN ('expired', 'pending') THEN
        RAISE EXCEPTION 'Buyers can only mark payment as expired or pending, not change to other statuses';
      END IF;
    END IF;
    
    IF (OLD.total IS DISTINCT FROM NEW.total) OR
       (OLD.subtotal IS DISTINCT FROM NEW.subtotal) OR
       (OLD.tax IS DISTINCT FROM NEW.tax) OR
       (OLD.shipping IS DISTINCT FROM NEW.shipping) OR
       (OLD.payment_fee IS DISTINCT FROM NEW.payment_fee) OR
       (OLD.grand_total IS DISTINCT FROM NEW.grand_total) THEN
      RAISE EXCEPTION 'Buyers cannot modify order amounts';
    END IF;
    
    IF (OLD.items IS DISTINCT FROM NEW.items) THEN
      RAISE EXCEPTION 'Buyers cannot modify items';
    END IF;
    
    IF (OLD.supplier_parts_meta IS DISTINCT FROM NEW.supplier_parts_meta) THEN
      RAISE EXCEPTION 'Buyers cannot modify supplier_parts_meta';
    END IF;
    
    IF (OLD.pricing_verified_at IS DISTINCT FROM NEW.pricing_verified_at) OR
       (OLD.items_hash IS DISTINCT FROM NEW.items_hash) THEN
      RAISE EXCEPTION 'Buyers cannot modify pricing fields';
    END IF;
    
    IF (OLD.inventory_processed_at IS DISTINCT FROM NEW.inventory_processed_at) THEN
      RAISE EXCEPTION 'Buyers cannot modify inventory_processed_at';
    END IF;
    
    -- Allow Khipu/Flow fields update because checkoutService does it client-side
    -- But block paid_at
    IF (OLD.paid_at IS DISTINCT FROM NEW.paid_at) THEN
      RAISE EXCEPTION 'Buyers cannot modify paid_at';
    END IF;

    -- Block user_id and supplier_ids
    IF (OLD.user_id IS DISTINCT FROM NEW.user_id) THEN
      RAISE EXCEPTION 'Buyers cannot modify user_id';
    END IF;

    IF (OLD.supplier_ids IS DISTINCT FROM NEW.supplier_ids) THEN
      RAISE EXCEPTION 'Buyers cannot modify supplier_ids';
    END IF;
    
    RETURN NEW;
  END IF;
  
  RAISE EXCEPTION 'No permission to modify this order';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 3: FIX finalize_order_pricing - Add bypass flag
-- ============================================================================

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
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_tax_included numeric := 0;
  v_total_base numeric := 0;
  v_payment_fee numeric := 0;
  v_grand_total numeric := 0;
  v_hash text;
  v_allow_pending boolean := coalesce(current_setting('app.offer_allow_pending', true)::text, '0') = '1';
  v_stock integer;
  v_supplier_id uuid;
  v_supplier_name text;
  v_minimum_purchase numeric;
  v_supplier_total numeric;
  v_supplier_totals jsonb := '{}'::jsonb;
BEGIN
  PERFORM set_config('app.bypass_order_trigger', 'true', true);

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF v_order.items IS NULL OR jsonb_typeof(v_order.items) != 'array' OR jsonb_array_length(v_order.items) = 0 THEN
    RAISE EXCEPTION 'INVALID_ORDER items array is empty or null';
  END IF;

  v_shipping := COALESCE(v_order.shipping,0);

  FOR v_item IN SELECT jsonb_array_elements(v_order.items)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id','')::uuid;
    v_offer_id := NULLIF(v_item->>'offer_id','')::uuid;
    v_qty := COALESCE(NULLIF(v_item->>'quantity','')::int,1);
    v_original_price := COALESCE(NULLIF(v_item->>'price_at_addition','')::numeric, NULLIF(v_item->>'price','')::numeric, 0);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY product_id=% quantity=%', v_product_id, v_qty;
    END IF;

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'INVALID_ITEM missing product_id';
    END IF;

    SELECT productqty INTO v_stock FROM products WHERE productid = v_product_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND product_id=%', v_product_id;
    END IF;
    IF v_stock IS NULL OR v_stock < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK product_id=% required=% available=%', v_product_id, v_qty, COALESCE(v_stock, 0);
    END IF;

    SELECT pqr.price::numeric, 'range:'||pqr.min_quantity||COALESCE('-'||pqr.max_quantity,'+')
      INTO v_effective_price, v_tier_band
    FROM public.product_quantity_ranges pqr
    WHERE pqr.product_id = v_product_id
      AND v_qty >= pqr.min_quantity
      AND (pqr.max_quantity IS NULL OR v_qty <= pqr.max_quantity)
    ORDER BY pqr.min_quantity DESC LIMIT 1;

    IF v_effective_price IS NULL THEN
      SELECT pr.price::numeric INTO v_effective_price FROM public.products pr WHERE pr.productid = v_product_id;
      v_tier_band := 'base';
    END IF;

    IF (v_effective_price IS NULL OR v_effective_price = 0) AND v_original_price > 0 THEN
      v_effective_price := v_original_price;
      v_tier_band := COALESCE(v_tier_band,'original');
    END IF;

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
    
    SELECT supplier_id INTO v_supplier_id FROM products WHERE productid = v_product_id;
    IF v_supplier_id IS NULL THEN
      RAISE EXCEPTION 'INVALID_PRODUCT product_id=% has no supplier_id', v_product_id;
    END IF;
    
    v_supplier_total := COALESCE((v_supplier_totals->>v_supplier_id::text)::numeric, 0);
    v_supplier_total := v_supplier_total + (COALESCE(v_effective_price,0) * v_qty);
    v_supplier_totals := jsonb_set(v_supplier_totals, ARRAY[v_supplier_id::text], to_jsonb(v_supplier_total));
  END LOOP;

  FOR v_supplier_id, v_supplier_total IN
    SELECT key::uuid, value::numeric FROM jsonb_each_text(v_supplier_totals)
  LOOP
    SELECT u.user_nm, u.minimum_purchase_amount INTO v_supplier_name, v_minimum_purchase
    FROM users u WHERE u.user_id = v_supplier_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_SUPPLIER supplier_id=% not found', v_supplier_id;
    END IF;
    
    IF v_minimum_purchase IS NOT NULL AND v_minimum_purchase > 0 AND v_supplier_total < v_minimum_purchase THEN
      RAISE EXCEPTION 'MINIMUM_PURCHASE_NOT_MET supplier_id=% supplier_name=% required=% actual=%',
        v_supplier_id, COALESCE(v_supplier_name, '?'), v_minimum_purchase, v_supplier_total;
    END IF;
  END LOOP;

  IF v_subtotal > 0 THEN
    v_tax_included := round(v_subtotal - (v_subtotal / 1.19));
  ELSE
    v_tax_included := 0;
  END IF;

  v_total_base := v_subtotal + v_shipping;

  IF v_order.payment_method = 'khipu' THEN
    v_payment_fee := 500;
  ELSIF v_order.payment_method = 'flow' THEN
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

-- ============================================================================
-- PART 4: FIX mark_order_hidden_by_buyer - Add bypass flag
-- ============================================================================

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

  SELECT id, user_id, payment_status, hidden_by_buyer INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF auth.uid() <> v_order.user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_order.payment_status <> 'expired' THEN
    RAISE EXCEPTION 'Only expired orders can be hidden';
  END IF;

  IF COALESCE(v_order.hidden_by_buyer, false) = true THEN
    RETURN jsonb_build_object('success', true, 'updated', false);
  END IF;

  PERFORM set_config('app.bypass_order_trigger', 'true', true);

  UPDATE public.orders SET hidden_by_buyer = true, updated_at = now() WHERE id = p_order_id;
  GET DIAGNOSTICS v_updates = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'updated', v_updates > 0, 'order_id', p_order_id);
END;
$$;
