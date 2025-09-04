-- =====================================================
-- Migration: Add robust price guards to create_offer (missing base_price fix)
-- Date: 2025-09-03
-- Root Cause:
--   Version 20250903152000 removed explicit validation of price_check->'is_valid'.
--   When validate_offer_against_tiers() returned an object without base_price (e.g. producto inactivo / no existe)
--   the INSERT attempted to write NULL into offers.base_price_at_offer (NOT NULL) => error 23502.
-- Strategy:
--   * Recreate create_offer with:
--       - Restored validation of price_check.is_valid (returns JSON error, not exception, for invalid price)
--       - Explicit fallback query to products table to obtain base price if missing in price_check
--       - Fail-fast EXCEPTION only if base price still cannot be resolved (consistent with chosen Option A)
--       - Guarantee non-null base_price_at_offer and tier_price_at_offer
--       - Preserve existing JSON response contract { success, offer_id, expires_at, price_validation }
--   * Keep limits logic intact (offer_limits_product / offer_limits_supplier)
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.create_offer(
  p_buyer_id uuid,
  p_supplier_id uuid,
  p_product_id uuid,
  p_offered_price numeric,
  p_offered_quantity integer,
  p_message text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  limits_check jsonb;
  price_check jsonb := jsonb_build_object();
  new_offer_id uuid;
  current_month text := to_char(now(),'YYYY-MM');
  expires_at_time timestamptz := now() + interval '48 hours';
  base_price numeric;
  tier_price numeric;
BEGIN
  -- 1. Límite de ofertas
  SELECT validate_offer_limits(p_buyer_id, p_supplier_id, p_product_id) INTO limits_check;
  IF NOT (limits_check->>'allowed')::boolean THEN
    RETURN json_build_object('success', false, 'error', limits_check->>'reason', 'error_type', 'limit_exceeded');
  END IF;

  -- 2. Validación de precio (si existe función)
  BEGIN
    SELECT validate_offer_against_tiers(p_product_id, p_offered_quantity, p_offered_price) INTO price_check;
  EXCEPTION WHEN undefined_function THEN
    -- Entorno aún no tiene la función; se construirá price_check manualmente luego
    price_check := jsonb_build_object();
  END;

  -- 3. Extraer / resolver base_price y tier_price
  IF price_check ? 'base_price' THEN
    base_price := NULLIF(price_check->>'base_price','')::numeric;
  END IF;
  IF price_check ? 'tier_price' THEN
    tier_price := NULLIF(price_check->>'tier_price','')::numeric;
  END IF;

  -- Fallback: consultar products si falta base_price
  IF base_price IS NULL THEN
    SELECT price INTO base_price FROM public.products WHERE productid = p_product_id FOR SHARE;
  END IF;

  -- Si sigue faltando, fail-fast (opción A escogida)
  IF base_price IS NULL THEN
    RAISE EXCEPTION 'offer_missing_base_price: product %', p_product_id;
  END IF;

  -- Si no hay tier_price, usar base_price
  IF tier_price IS NULL THEN
    tier_price := base_price;
  END IF;

  -- 4. Validación de regla de precio (si la función existía y trae is_valid)
  IF price_check ? 'is_valid' AND NOT (price_check->>'is_valid')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', COALESCE(price_check->>'message','Precio inválido'),
      'error_type', 'invalid_price',
      'details', price_check
    );
  END IF;

  -- 5. Insertar oferta (garantizando non-null base_price_at_offer)
  INSERT INTO public.offers(
    buyer_id, supplier_id, product_id, offered_price, offered_quantity, message,
    expires_at, base_price_at_offer, tier_price_at_offer
  ) VALUES (
    p_buyer_id, p_supplier_id, p_product_id, p_offered_price, p_offered_quantity, p_message,
    expires_at_time,
    base_price,
    tier_price
  ) RETURNING id INTO new_offer_id;

  -- 6. Actualizar contadores normalizados
  INSERT INTO public.offer_limits_product (buyer_id, product_id, month_year, offers_count)
  VALUES (p_buyer_id, p_product_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_product_buyer_product_month_unique
  DO UPDATE SET offers_count = public.offer_limits_product.offers_count + 1, updated_at = now();

  INSERT INTO public.offer_limits_supplier (buyer_id, supplier_id, month_year, offers_count)
  VALUES (p_buyer_id, p_supplier_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_supplier_buyer_supplier_month_unique
  DO UPDATE SET offers_count = public.offer_limits_supplier.offers_count + 1, updated_at = now();

  -- 7. Normalizar objeto de salida de validación de precio (añadir claves si faltan)
  price_check := price_check || jsonb_build_object(
    'base_price', base_price,
    'tier_price', tier_price,
    'offered_price', p_offered_price
  );

  RETURN json_build_object(
    'success', true,
    'offer_id', new_offer_id,
    'expires_at', expires_at_time,
    'price_validation', price_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) IS 'create_offer con guardas robustas de precio (migration 20250903153000)';

GRANT EXECUTE ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
