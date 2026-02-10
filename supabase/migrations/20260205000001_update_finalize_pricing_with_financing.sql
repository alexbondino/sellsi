-- Migration: Update finalize_order_pricing to handle financing_amount
-- Date: 2026-02-05
-- Description: Modify finalize_order_pricing RPC to calculate payment fees AFTER subtracting
--              financing_amount, ensuring fees are only charged on the remaining amount to pay.
--              This ensures consistency between frontend calculations and backend pricing seal.

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
  v_subtotal numeric := 0;
  v_shipping numeric := 0;
  v_tax_included numeric := 0;
  v_total_base numeric := 0;
  v_financing_amount numeric := 0;
  v_remaining_to_pay numeric := 0;
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
  -- ⭐ CRÍTICO: Bypass RLS trigger para permitir actualizaciones
  PERFORM set_config('app.bypass_order_trigger', 'true', true);

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- Validar que la orden tenga items
  IF v_order.items IS NULL OR jsonb_typeof(v_order.items) != 'array' OR jsonb_array_length(v_order.items) = 0 THEN
    RAISE EXCEPTION 'INVALID_ORDER items array is empty or null'
    USING HINT = 'La orden debe contener al menos un producto';
  END IF;

  v_shipping := COALESCE(v_order.shipping,0);
  
  -- ⭐ NUEVO: Obtener financing_amount de la orden
  v_financing_amount := COALESCE(v_order.financing_amount, 0);

  FOR v_item IN
    SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_order.items)='array' THEN v_order.items ELSE '[]'::jsonb END)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id','')::uuid;
    v_offer_id := NULLIF(v_item->>'offer_id','')::uuid;
    v_qty := COALESCE(NULLIF(v_item->>'quantity','')::int,1);
    v_original_price := COALESCE(NULLIF(v_item->>'price_at_addition','')::numeric, NULLIF(v_item->>'price','')::numeric, 0);

    -- Validar que quantity sea positiva
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY product_id=% quantity=%',
        v_product_id, v_qty
      USING HINT = 'La cantidad debe ser mayor a 0';
    END IF;

    -- Todos los items DEBEN tener product_id válido
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'INVALID_ITEM missing product_id in item=%',
        v_item
      USING HINT = 'Todos los items deben tener un product_id válido';
    END IF;

    -- STOCK VALIDATION - Lock product row and verify availability + get supplier_id
    SELECT productqty, supplier_id 
    INTO v_stock, v_supplier_id
    FROM products 
    WHERE productid = v_product_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND product_id=%', v_product_id
      USING HINT = 'El producto no existe en la base de datos';
    END IF;
    
    IF v_stock IS NULL OR v_stock < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK product_id=% required=% available=%',
        v_product_id, v_qty, COALESCE(v_stock, 0)
      USING HINT = 'Stock insuficiente para completar la orden';
    END IF;
    
    -- ⚠️ CRÍTICO: Rechazar productos sin supplier_id asignado
    IF v_supplier_id IS NULL THEN
      RAISE EXCEPTION 'INVALID_PRODUCT product_id=% has no supplier_id assigned',
        v_product_id
      USING HINT = 'Todos los productos deben tener un proveedor asignado';
    END IF;

    -- Get tier pricing
    SELECT pqr.price::numeric, 'range:'||pqr.min_quantity||COALESCE('-'||pqr.max_quantity,'+')
      INTO v_effective_price, v_tier_band
    FROM public.product_quantity_ranges pqr
    WHERE pqr.product_id = v_product_id
      AND v_qty >= pqr.min_quantity
      AND (pqr.max_quantity IS NULL OR v_qty <= pqr.max_quantity)
    ORDER BY pqr.min_quantity DESC
    LIMIT 1;

    -- Fallback to base price if no tier found
    IF v_effective_price IS NULL THEN
      SELECT pr.price::numeric INTO v_effective_price FROM public.products pr WHERE pr.productid = v_product_id;
      v_tier_band := 'base';
    END IF;

    IF (v_effective_price IS NULL OR v_effective_price = 0) AND v_original_price > 0 THEN
      v_effective_price := v_original_price;
      v_tier_band := COALESCE(v_tier_band,'original');
    END IF;

    -- Offer override
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
    
    -- ⭐ MODIFICACIÓN: Excluir productos ofertados del cálculo de compra mínima
    -- Solo acumular totales si NO es un producto ofertado
    IF v_tier_band != 'offer' THEN
      -- Acumular totales por proveedor
      v_supplier_total := COALESCE(
        (v_supplier_totals->>v_supplier_id::text)::numeric,
        0
      );
      
      v_supplier_total := v_supplier_total + (COALESCE(v_effective_price,0) * v_qty);
      
      v_supplier_totals := jsonb_set(
        v_supplier_totals,
        ARRAY[v_supplier_id::text],
        to_jsonb(v_supplier_total)
      );
    END IF;
  END LOOP;

  -- VALIDAR COMPRA MÍNIMA POR PROVEEDOR
  FOR v_supplier_id, v_supplier_total IN
    SELECT 
      key::uuid as supplier_id,
      value::numeric as total
    FROM jsonb_each_text(v_supplier_totals)
  LOOP
    SELECT 
      u.user_nm,
      u.minimum_purchase_amount
    INTO v_supplier_name, v_minimum_purchase
    FROM users u
    WHERE u.user_id = v_supplier_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_SUPPLIER supplier_id=% not found in users table',
        v_supplier_id
      USING HINT = 'El proveedor especificado no existe en el sistema';
    END IF;
    
    IF v_minimum_purchase IS NOT NULL 
       AND v_minimum_purchase > 0 
       AND v_supplier_total < v_minimum_purchase THEN
      RAISE EXCEPTION 'MINIMUM_PURCHASE_NOT_MET supplier_id=% supplier_name=% required=% actual=% missing=%',
        v_supplier_id,
        COALESCE(v_supplier_name, 'Proveedor desconocido'),
        v_minimum_purchase,
        v_supplier_total,
        (v_minimum_purchase - v_supplier_total)
      USING HINT = 'El proveedor requiere una compra mínima que no se ha alcanzado';
    END IF;
  END LOOP;

  -- Tax calculation (IVA included)
  IF v_subtotal > 0 THEN
    v_tax_included := round(v_subtotal - (v_subtotal / 1.19));
  ELSE
    v_tax_included := 0;
  END IF;

  v_total_base := v_subtotal + v_shipping;

  -- ⭐ MODIFICACIÓN CRÍTICA: Calcular monto restante ANTES de calcular payment_fee
  -- Si el financiamiento cubre todo o más, el monto restante es 0
  v_remaining_to_pay := GREATEST(0, v_total_base - v_financing_amount);

  -- ⭐ MODIFICACIÓN CRÍTICA: Payment fee calculado sobre monto restante, no sobre total base
  -- Si remaining = 0 (100% financiado), no hay comisión de pago
  IF v_remaining_to_pay > 0 THEN
    IF v_order.payment_method = 'khipu' THEN
      v_payment_fee := 500;
    ELSIF v_order.payment_method = 'flow' THEN
      v_payment_fee := ROUND(v_remaining_to_pay * 0.038);
    ELSIF v_order.payment_method = 'bank_transfer' THEN
      v_payment_fee := ROUND(v_remaining_to_pay * 0.005);
    ELSE
      v_payment_fee := 0;
    END IF;
  ELSE
    v_payment_fee := 0;
  END IF;

  -- ⭐ MODIFICACIÓN CRÍTICA: Grand total = monto restante + fee
  -- (El financing_amount ya fue restado para calcular v_remaining_to_pay)
  v_grand_total := v_remaining_to_pay + v_payment_fee;

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

COMMENT ON FUNCTION public.finalize_order_pricing(uuid) IS 
  'Seal pricing with stock validation, minimum purchase enforcement (excludes offered products), and financing support: validates stock, enforces supplier minimums, calculates tiers/offers, derives tax, calculates payment fee on REMAINING amount after financing (ensuring 100% financed orders have $0 fee), generates items hash. Updated 2026-02-05 to support financing_amount and calculate fees correctly.';
