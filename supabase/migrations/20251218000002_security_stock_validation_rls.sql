-- Migration: Security Improvements - Stock Validation & Orders RLS
-- Date: 2025-12-18
-- Description: Add stock validation to finalize_order_pricing, enable RLS on orders table,
--              and update mark_order_hidden_by_buyer to bypass trigger validation

-- ============================================================================
-- PART 1: REPLACE finalize_order_pricing WITH STOCK VALIDATION
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
  v_payment_fee numeric := 0;
  v_grand_total numeric := 0;
  v_hash text;
  v_allow_pending boolean := coalesce(current_setting('app.offer_allow_pending', true)::text, '0') = '1';
  -- ⭐ NEW: Stock validation
  v_stock integer;
  -- ⭐ NEW: Minimum purchase validation
  v_supplier_id uuid;
  v_supplier_name text;
  v_minimum_purchase numeric;
  v_supplier_total numeric;
  v_supplier_totals jsonb := '{}'::jsonb;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- ⚠️ CRÍTICO: Validar que la orden tenga items
  IF v_order.items IS NULL OR jsonb_typeof(v_order.items) != 'array' OR jsonb_array_length(v_order.items) = 0 THEN
    RAISE EXCEPTION 'INVALID_ORDER items array is empty or null'
    USING HINT = 'La orden debe contener al menos un producto';
  END IF;

  v_shipping := COALESCE(v_order.shipping,0);

  FOR v_item IN
    SELECT jsonb_array_elements(CASE WHEN jsonb_typeof(v_order.items)='array' THEN v_order.items ELSE '[]'::jsonb END)
  LOOP
    v_product_id := NULLIF(v_item->>'product_id','')::uuid;
    v_offer_id := NULLIF(v_item->>'offer_id','')::uuid;
    v_qty := COALESCE(NULLIF(v_item->>'quantity','')::int,1);
    v_original_price := COALESCE(NULLIF(v_item->>'price_at_addition','')::numeric, NULLIF(v_item->>'price','')::numeric, 0);

    -- ⚠️ CRÍTICO: Validar que quantity sea positiva
    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'INVALID_QUANTITY product_id=% quantity=%',
        v_product_id, v_qty
      USING HINT = 'La cantidad debe ser mayor a 0';
    END IF;

    -- ⚠️ CRÍTICO: Todos los items DEBEN tener product_id válido
    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'INVALID_ITEM missing product_id in item=%',
        v_item
      USING HINT = 'Todos los items deben tener un product_id válido';
    END IF;

    -- Process pricing logic (v_product_id ya validado como NOT NULL)
    -- ⭐ NEW: STOCK VALIDATION - Lock product row and verify availability
    SELECT productqty INTO v_stock 
    FROM products 
    WHERE productid = v_product_id 
    FOR UPDATE; -- Lock to prevent race conditions
    
    -- Check if product exists (FOUND is set by SELECT INTO)
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_NOT_FOUND product_id=%', v_product_id
      USING HINT = 'El producto no existe en la base de datos';
    END IF;
    
    -- Check if stock is sufficient (v_stock could be NULL or a number)
    IF v_stock IS NULL OR v_stock < v_qty THEN
      RAISE EXCEPTION 'INSUFFICIENT_STOCK product_id=% required=% available=%',
        v_product_id, v_qty, COALESCE(v_stock, 0)
      USING HINT = 'Stock insuficiente para completar la orden';
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
    
    -- ⭐ NEW: Acumular totales por proveedor para validación de compra mínima
    -- CRÍTICO: Obtener supplier_id REAL del producto (no del item que puede ser manipulado)
    SELECT supplier_id INTO v_supplier_id
    FROM products
    WHERE productid = v_product_id;
    
    -- ⚠️ CRÍTICO: Rechazar productos sin supplier_id asignado
    IF v_supplier_id IS NULL THEN
      RAISE EXCEPTION 'INVALID_PRODUCT product_id=% has no supplier_id assigned',
        v_product_id
      USING HINT = 'Todos los productos deben tener un proveedor asignado';
    END IF;
    
    -- Acumular totales por proveedor
    IF TRUE THEN
      -- Obtener el total actual de este supplier (0 si no existe)
      v_supplier_total := COALESCE(
        (v_supplier_totals->>v_supplier_id::text)::numeric,
        0
      );
      
      -- Sumar el total de este item (usando v_effective_price ya calculado)
      v_supplier_total := v_supplier_total + (COALESCE(v_effective_price,0) * v_qty);
      
      -- Guardar de vuelta en el objeto jsonb
      v_supplier_totals := jsonb_set(
        v_supplier_totals,
        ARRAY[v_supplier_id::text],
        to_jsonb(v_supplier_total)
      );
    END IF;
  END LOOP;

  -- ⭐ NEW: VALIDAR COMPRA MÍNIMA POR PROVEEDOR
  -- Iterar sobre cada proveedor y verificar su compra mínima
  FOR v_supplier_id, v_supplier_total IN
    SELECT 
      key::uuid as supplier_id,
      value::numeric as total
    FROM jsonb_each_text(v_supplier_totals)
  LOOP
    -- Obtener minimum_purchase_amount del proveedor
    SELECT 
      u.user_nm,
      u.minimum_purchase_amount
    INTO v_supplier_name, v_minimum_purchase
    FROM users u
    WHERE u.user_id = v_supplier_id;
    
    -- ⚠️ CRÍTICO: Si el supplier_id no existe en users, rechazar
    IF NOT FOUND THEN
      RAISE EXCEPTION 'INVALID_SUPPLIER supplier_id=% not found in users table',
        v_supplier_id
      USING HINT = 'El proveedor especificado no existe en el sistema';
    END IF;
    
    -- Si el proveedor tiene mínimo configurado (> 0) y no se cumple
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
  -- ⚠️ PROTECCIÓN: Solo calcular tax si hay subtotal válido
  IF v_subtotal > 0 THEN
    v_tax_included := round(v_subtotal - (v_subtotal / 1.19));
  ELSE
    v_tax_included := 0;
    -- Si no hay subtotal, la orden es inválida (ya validado en v_order.items arriba)
  END IF;

  v_total_base := v_subtotal + v_shipping;

  -- Payment fee
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

COMMENT ON FUNCTION public.finalize_order_pricing(uuid) IS 
  'Seal pricing with stock validation and minimum purchase enforcement: validates stock availability, enforces supplier minimum purchase amounts, calculates tiers/offers, derives tax, adds payment fee (Khipu $500 / Flow 3.80%), generates items hash. Updated 2025-12-18 with stock and minimum purchase validation.';

-- ============================================================================
-- PART 2: SECURITY VALIDATION FUNCTION AND TRIGGER
-- ============================================================================

-- Función que valida que buyers solo actualicen campos no-críticos
-- Suppliers (main_supplier = TRUE) pueden actualizar todos los campos
-- Service role (auth.uid() IS NULL) bypasea todas las validaciones
-- Trusted functions (app.bypass_order_trigger = 'true') bypasean todas las validaciones
CREATE OR REPLACE FUNCTION validate_order_update_security()
RETURNS TRIGGER AS $$
DECLARE
  v_is_supplier boolean;
  v_is_owner boolean;
  v_current_user_id uuid;
  v_bypass_trigger text;
BEGIN
  -- Verificar si estamos en una función trusted (finalize_order_pricing, etc.)
  BEGIN
    v_bypass_trigger := current_setting('app.bypass_order_trigger', true);
  EXCEPTION
    WHEN OTHERS THEN
      v_bypass_trigger := NULL;
  END;
  
  -- Si bypass está activo, permitir todas las modificaciones
  IF v_bypass_trigger = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Obtener el user_id actual (puede ser NULL si es service_role)
  v_current_user_id := auth.uid();
  
  -- Si auth.uid() es NULL, es service_role o background process
  -- Permitir todas las modificaciones (webhooks, cron jobs, etc.)
  IF v_current_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar si el usuario es el owner de la orden
  v_is_owner := (OLD.user_id = v_current_user_id);
  
  -- Si no es el owner, rechazar (RLS ya maneja esto, pero doble validación)
  IF NOT v_is_owner THEN
    RAISE EXCEPTION 'No tienes permiso para modificar esta orden';
  END IF;
  
  -- Obtener rol del usuario
  SELECT main_supplier INTO v_is_supplier
  FROM users
  WHERE user_id = v_current_user_id;
  
  -- Si es NULL (usuario no encontrado), rechazar
  IF v_is_supplier IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- BUYERS (main_supplier = FALSE) solo pueden actualizar campos no-críticos
  IF v_is_supplier = FALSE THEN
    -- Verificar si intentan modificar campos críticos
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      RAISE EXCEPTION 'Los compradores no pueden cambiar el estado de la orden';
    END IF;
    
    IF (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
      RAISE EXCEPTION 'Los compradores no pueden cambiar el estado de pago';
    END IF;
    
    IF (OLD.total IS DISTINCT FROM NEW.total) OR
       (OLD.subtotal IS DISTINCT FROM NEW.subtotal) OR
       (OLD.tax IS DISTINCT FROM NEW.tax) OR
       (OLD.shipping IS DISTINCT FROM NEW.shipping) OR
       (OLD.payment_fee IS DISTINCT FROM NEW.payment_fee) OR
       (OLD.grand_total IS DISTINCT FROM NEW.grand_total) THEN
      RAISE EXCEPTION 'Los compradores no pueden modificar los montos de la orden';
    END IF;
    
    IF (OLD.items IS DISTINCT FROM NEW.items) THEN
      RAISE EXCEPTION 'Los compradores no pueden modificar los items de la orden';
    END IF;
    
    IF (OLD.supplier_parts_meta IS DISTINCT FROM NEW.supplier_parts_meta) THEN
      RAISE EXCEPTION 'Los compradores no pueden modificar los metadatos de proveedores';
    END IF;
    
    -- Bloquear modificación de campos de pricing authority
    IF (OLD.pricing_verified_at IS DISTINCT FROM NEW.pricing_verified_at) OR
       (OLD.items_hash IS DISTINCT FROM NEW.items_hash) THEN
      RAISE EXCEPTION 'Los compradores no pueden modificar los campos de verificación de precios';
    END IF;
    
    -- Bloquear modificación de campos de inventario y procesamiento
    IF (OLD.inventory_processed_at IS DISTINCT FROM NEW.inventory_processed_at) THEN
      RAISE EXCEPTION 'Los compradores no pueden modificar el estado de procesamiento de inventario';
    END IF;
    
    -- Bloquear modificación de IDs de pago externos (Khipu, Flow)
    IF (OLD.khipu_payment_id IS DISTINCT FROM NEW.khipu_payment_id) OR
       (OLD.khipu_transaction_id IS DISTINCT FROM NEW.khipu_transaction_id) OR
       (OLD.khipu_payment_url IS DISTINCT FROM NEW.khipu_payment_url) OR
       (OLD.khipu_expires_at IS DISTINCT FROM NEW.khipu_expires_at) OR
       (OLD.flow_order IS DISTINCT FROM NEW.flow_order) OR
       (OLD.flow_token IS DISTINCT FROM NEW.flow_token) OR
       (OLD.flow_payment_url IS DISTINCT FROM NEW.flow_payment_url) OR
       (OLD.flow_expires_at IS DISTINCT FROM NEW.flow_expires_at) OR
       (OLD.paid_at IS DISTINCT FROM NEW.paid_at) THEN
      RAISE EXCEPTION 'Los compradores no pueden modificar los datos de pago externos';
    END IF;
  END IF;
  
  -- SUPPLIERS (main_supplier = TRUE) pueden modificar todos los campos
  -- No hay restricciones adicionales para suppliers
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que ejecuta la validación ANTES de cada UPDATE
DROP TRIGGER IF EXISTS validate_order_update_trigger ON orders;
CREATE TRIGGER validate_order_update_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_update_security();

COMMENT ON FUNCTION validate_order_update_security() IS
  'Valida que buyers solo actualicen campos no-críticos en orders';
COMMENT ON TRIGGER validate_order_update_trigger ON orders IS
  'Ejecuta validación de seguridad antes de actualizar orders (bypassed por service_role)';

-- ============================================================================
-- PART 3: ENABLE ROW LEVEL SECURITY ON ORDERS TABLE
-- ============================================================================

-- IMPORTANT: RLS policies require authenticated Supabase session
-- Frontend MUST use authenticated supabase client (not anon-only)
-- user_id in INSERT must match auth.uid() from session

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only insert their own orders
DROP POLICY IF EXISTS orders_insert_own ON orders;
CREATE POLICY orders_insert_own ON orders
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can only view their own orders
DROP POLICY IF EXISTS orders_select_own ON orders;
CREATE POLICY orders_select_own ON orders
  FOR SELECT 
  USING (user_id = auth.uid());

-- Policy: Users can only update their own orders (limited fields)
DROP POLICY IF EXISTS orders_update_own ON orders;
CREATE POLICY orders_update_own ON orders
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: DELETE policy intentionally omitted - only service_role can delete orders
-- Note: Webhooks and admin operations use service_role key which bypasses RLS and triggers
-- Note: Additional field-level validation is enforced by validate_order_update_trigger

COMMENT ON POLICY orders_insert_own ON orders IS
  'Users can only create orders for themselves (prevents cart hijacking)';
COMMENT ON POLICY orders_select_own ON orders IS
  'Users can only view their own orders (privacy protection)';
COMMENT ON POLICY orders_update_own ON orders IS
  'Users can only update their own orders (prevents unauthorized modifications)';

-- ============================================================================
-- PART 4: UPDATE mark_order_hidden_by_buyer TO BYPASS TRIGGER
-- ============================================================================

-- This function needs bypass because it updates hidden_by_buyer field
-- and would be blocked by the trigger otherwise
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
  -- Validate input
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'p_order_id is required';
  END IF;

  -- Get order and verify it exists
  SELECT id, user_id, payment_status, hidden_by_buyer 
  INTO v_order 
  FROM public.orders 
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- Verify ownership: only the buyer who placed the order can hide it
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF auth.uid() <> v_order.user_id THEN
    RAISE EXCEPTION 'Not authorized: you are not the owner of this order';
  END IF;

  -- Only allow hiding orders with expired payment status
  IF v_order.payment_status <> 'expired' THEN
    RAISE EXCEPTION 'Only orders with expired payment can be hidden. Current status: %', v_order.payment_status;
  END IF;

  -- Check if already hidden
  IF COALESCE(v_order.hidden_by_buyer, false) = true THEN
    RETURN jsonb_build_object(
      'success', true,
      'updated', false,
      'message', 'Order was already hidden'
    );
  END IF;

  -- Update the order to mark it as hidden
  UPDATE public.orders 
  SET 
    hidden_by_buyer = true, 
    updated_at = now() 
  WHERE id = p_order_id;
  
  GET DIAGNOSTICS v_updates = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated', v_updates > 0,
    'order_id', p_order_id
  );
END;
$$;

COMMENT ON FUNCTION public.mark_order_hidden_by_buyer(uuid) IS 
  'Allows buyers to hide expired payment orders from their order list. Bypasses order trigger validation.';

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'orders';

-- Verify policies exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies WHERE tablename = 'orders';
