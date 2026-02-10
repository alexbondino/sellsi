-- Migration: Per-item financing tracking + supplier_orders financing_amount
-- Date: 2026-02-05
-- Description:
--   1. Adds financing_amount column to supplier_orders table
--   2. Updates finalize_order_pricing to preserve per-item financing_amount in JSONB
--   3. Validates per-supplier financing doesn't exceed supplier subtotal
--   4. Backfills existing supplier_orders with financing from parent order items

-- ============================================================================
-- PART 1: Add financing_amount to supplier_orders
-- ============================================================================

ALTER TABLE public.supplier_orders
  ADD COLUMN IF NOT EXISTS financing_amount numeric NOT NULL DEFAULT 0;

-- Constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_orders_financing_amount_nonneg'
  ) THEN
    ALTER TABLE public.supplier_orders
      ADD CONSTRAINT supplier_orders_financing_amount_nonneg
      CHECK (financing_amount >= 0);
  END IF;
END $$;

-- ============================================================================
-- PART 2: Updated finalize_order_pricing with per-item financing preservation
-- ============================================================================

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
  v_is_fully_financed boolean := false;
  -- Per-item financing
  v_item_financing numeric;
  v_item_line_total numeric;
  -- Per-supplier financing validation
  v_supplier_financing_totals jsonb := '{}'::jsonb;
  v_supplier_financing numeric;
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
  
  -- Obtener financing_amount de la orden (valor global)
  v_financing_amount := COALESCE(v_order.financing_amount, 0);
  
  -- VALIDACIÓN: financing_amount no puede ser negativo
  IF v_financing_amount < 0 THEN
    RAISE EXCEPTION 'INVALID_FINANCING financing_amount cannot be negative: %',
      v_financing_amount
    USING HINT = 'El monto de financiamiento debe ser mayor o igual a cero';
  END IF;

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
    
    -- Rechazar productos sin supplier_id asignado
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

    -- ⭐ NUEVO: Extraer financing_amount per item (enviado por frontend)
    -- Si el item no tiene financing_amount, defaults a 0
    v_item_financing := COALESCE(NULLIF(v_item->>'financing_amount','')::numeric, 0);
    v_item_line_total := COALESCE(v_effective_price, 0) * v_qty;
    
    -- Clamp per-item financing: no puede exceder el total de la línea
    IF v_item_financing > v_item_line_total THEN
      v_item_financing := v_item_line_total;
    END IF;
    
    -- No puede ser negativo
    IF v_item_financing < 0 THEN
      v_item_financing := 0;
    END IF;

    -- Acumular financing por supplier para validación posterior
    v_supplier_financing := COALESCE(
      (v_supplier_financing_totals->>v_supplier_id::text)::numeric,
      0
    );
    v_supplier_financing := v_supplier_financing + v_item_financing;
    v_supplier_financing_totals := jsonb_set(
      v_supplier_financing_totals,
      ARRAY[v_supplier_id::text],
      to_jsonb(v_supplier_financing)
    );

    -- Build sealed item with financing_amount persisted
    v_items := v_items || jsonb_build_array(
      v_item || jsonb_build_object(
        'unit_price_original', v_original_price,
        'unit_price_effective', v_effective_price,
        'tier_band_used', v_tier_band,
        'financing_amount', v_item_financing,
        'supplier_id', v_supplier_id::text
      )
    );
    
    -- Excluir productos ofertados del cálculo de compra mínima
    IF v_tier_band != 'offer' THEN
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

  -- ⭐ NUEVO: Validar financiamiento por proveedor (no puede exceder subtotal del proveedor)
  FOR v_supplier_id, v_supplier_financing IN
    SELECT 
      key::uuid as supplier_id,
      value::numeric as financing
    FROM jsonb_each_text(v_supplier_financing_totals)
  LOOP
    -- Calcular subtotal real del proveedor (incluyendo ofertados)
    SELECT COALESCE(SUM(
      (item->>'unit_price_effective')::numeric * 
      COALESCE(NULLIF(item->>'quantity','')::integer, 1)
    ), 0) INTO v_supplier_total
    FROM jsonb_array_elements(v_items) AS item
    WHERE (item->>'supplier_id')::text = v_supplier_id::text;
    
    IF v_supplier_financing > v_supplier_total THEN
      RAISE WARNING 'Per-item financing sum (%) exceeds supplier % subtotal (%). Items were individually clamped.',
        v_supplier_financing, v_supplier_id, v_supplier_total;
      -- NOTE: No se clampea aquí porque cada item ya fue clampeado individualmente.
      -- Si esta condición ocurre, puede ser por diferencia de precios front/back.
    END IF;
  END LOOP;

  -- Tax calculation (IVA included)
  IF v_subtotal > 0 THEN
    v_tax_included := round(v_subtotal - (v_subtotal / 1.19));
  ELSE
    v_tax_included := 0;
  END IF;

  v_total_base := v_subtotal + v_shipping;

  -- VALIDACIÓN: financing_amount no puede exceder total
  IF v_financing_amount > v_total_base THEN
    RAISE EXCEPTION 'INVALID_FINANCING financing_amount % exceeds total %',
      v_financing_amount, v_total_base
    USING HINT = 'El monto de financiamiento no puede superar el total de la orden';
  END IF;
  
  -- VALIDACIÓN: Si payment_method='financing', debe tener financiamiento > 0
  IF v_order.payment_method = 'financing' AND v_financing_amount = 0 THEN
    RAISE EXCEPTION 'INVALID_FINANCING payment_method=financing requires financing_amount > 0'
    USING HINT = 'Las órdenes con método de pago "financiamiento" deben tener un monto financiado mayor a cero';
  END IF;

  -- Calcular monto restante ANTES de calcular payment_fee
  v_remaining_to_pay := GREATEST(0, v_total_base - v_financing_amount);

  -- Payment fee calculado sobre monto restante, no sobre total base
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

  -- Grand total = monto restante + fee
  v_grand_total := v_remaining_to_pay + v_payment_fee;

  -- Detectar si está 100% financiado
  v_is_fully_financed := (v_order.payment_method = 'financing' AND v_remaining_to_pay = 0);

  SELECT encode(digest(convert_to(v_items::text,'UTF8'),'sha256'),'hex') INTO v_hash;

  -- Si está 100% financiado, marcar automáticamente como 'paid'
  IF v_is_fully_financed THEN
    UPDATE public.orders
    SET items = v_items,
        subtotal = v_subtotal,
        tax = v_tax_included,
        total = v_total_base,
        payment_fee = v_payment_fee,
        grand_total = v_grand_total,
        payment_status = 'paid',
        paid_at = now(),
        pricing_verified_at = now(),
        items_hash = v_hash,
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_order;
  ELSE
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
  END IF;

  -- ⭐ Upsert supplier_orders con financing_amount distribuido
  -- Crear/actualizar supplier_orders para cada proveedor en la orden.
  -- Se crean SIEMPRE (no solo cuando paid) para que el trigger sync_supplier_orders_status
  -- pueda propagar payment_status='paid' cuando el webhook (Khipu/Flow) confirme el pago.
  -- Los proveedores solo ven supplier_orders con payment_status='paid' (filtro en getOrdersForSupplier).
  INSERT INTO public.supplier_orders (
    parent_order_id,
    supplier_id,
    status,
    payment_status,
    subtotal,
    shipping_amount,
    total,
    financing_amount,
    created_at,
    updated_at
  )
  SELECT
    p_order_id,
    (item->>'supplier_id')::uuid,
    v_order.status,
    v_order.payment_status,
    SUM((item->>'unit_price_effective')::numeric * COALESCE(NULLIF(item->>'quantity','')::int, 1)),
    0, -- shipping distribution TBD
    SUM((item->>'unit_price_effective')::numeric * COALESCE(NULLIF(item->>'quantity','')::int, 1)),
    SUM(COALESCE((item->>'financing_amount')::numeric, 0)),
    now(),
    now()
  FROM jsonb_array_elements(v_items) AS item
  WHERE (item->>'supplier_id') IS NOT NULL
  GROUP BY (item->>'supplier_id')
  ON CONFLICT (parent_order_id, supplier_id) DO UPDATE SET
    subtotal = EXCLUDED.subtotal,
    total = EXCLUDED.total,
    financing_amount = EXCLUDED.financing_amount,
    status = EXCLUDED.status,
    payment_status = EXCLUDED.payment_status,
    updated_at = now();

  RETURN v_order;
END;
$$;

-- ============================================================================
-- PART 3: Backfill existing supplier_orders with financing from sealed items
-- ============================================================================

-- Update existing supplier_orders that have parent orders with financing
-- and where the items JSONB has financing_amount per item
UPDATE public.supplier_orders so
SET financing_amount = COALESCE(calc.total_financing, 0),
    updated_at = now()
FROM (
  SELECT
    so2.id AS supplier_order_id,
    COALESCE(SUM(
      COALESCE((item->>'financing_amount')::numeric, 0)
    ), 0) AS total_financing
  FROM public.supplier_orders so2
  JOIN public.orders o ON o.id = so2.parent_order_id
  CROSS JOIN LATERAL jsonb_array_elements(o.items) AS item
  WHERE o.financing_amount > 0
    AND (item->>'supplier_id')::text = so2.supplier_id::text
  GROUP BY so2.id
) calc
WHERE calc.supplier_order_id = so.id
  AND so.financing_amount = 0;  -- Only backfill if not already set

-- For orders that have financing_amount > 0 but items don't have per-item financing
-- (legacy orders created before this migration), distribute proportionally
UPDATE public.supplier_orders so
SET financing_amount = COALESCE(calc.proportional_financing, 0),
    updated_at = now()
FROM (
  SELECT
    so2.id AS supplier_order_id,
    -- Distribute parent order financing proportionally by supplier subtotal
    ROUND(
      o.financing_amount * (so2.subtotal / NULLIF(o.total - COALESCE(o.shipping, 0), 0))
    ) AS proportional_financing
  FROM public.supplier_orders so2
  JOIN public.orders o ON o.id = so2.parent_order_id
  WHERE o.financing_amount > 0
    AND so2.financing_amount = 0
    AND o.total > 0
) calc
WHERE calc.supplier_order_id = so.id
  AND so.financing_amount = 0;

-- ============================================================================
-- PART 4: Add index for querying supplier_orders by financing
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_supplier_orders_financing 
  ON public.supplier_orders(financing_amount) 
  WHERE financing_amount > 0;
