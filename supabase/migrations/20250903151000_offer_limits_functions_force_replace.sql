-- =====================================================
-- Migration: Force re-create offer limit functions with explicit constraint targets
-- Date: 2025-09-03
-- Purpose:
--   Persistente error ON CONFLICT pese a existir índices UNIQUE según diagnóstico.
--   Potenciales causas:
--     * Versión antigua de create_offer todavía en catálogo.
--     * Firma distinta invocada por el cliente (otra sobrecarga) usando tablas legacy.
--     * Inconsistencia de plan / search_path.
--   Acción:
--     * Re-crear explícitamente validate_offer_limits y create_offer asegurando uso de tablas
--       offer_limits_product / offer_limits_supplier.
--     * Usar ON CONFLICT ON CONSTRAINT para eliminar ambigüedad.
--     * Añadir RAISE NOTICE de diagnóstico (pueden retirarse luego).
-- =====================================================

BEGIN;

-- 1. Re-create validate_offer_limits (idéntica lógica, sin cambios de negocio)
CREATE OR REPLACE FUNCTION public.validate_offer_limits(
  p_buyer_id uuid,
  p_supplier_id uuid,
  p_product_id uuid
) RETURNS jsonb AS $$
DECLARE
  current_month text := to_char(now(),'YYYY-MM');
  product_count integer := 0;
  supplier_count integer := 0;
  product_limit integer := 3;
  supplier_limit integer := 5;
  result jsonb;
BEGIN
  SELECT offers_count INTO product_count
  FROM public.offer_limits_product
  WHERE buyer_id = p_buyer_id AND product_id = p_product_id AND month_year = current_month;
  IF product_count IS NULL THEN product_count := 0; END IF;

  SELECT offers_count INTO supplier_count
  FROM public.offer_limits_supplier
  WHERE buyer_id = p_buyer_id AND supplier_id = p_supplier_id AND month_year = current_month;
  IF supplier_count IS NULL THEN supplier_count := 0; END IF;

  result := json_build_object(
    'allowed', (product_count < product_limit AND supplier_count < supplier_limit),
    'product_count', product_count,
    'supplier_count', supplier_count,
    'product_limit_reached', product_count >= product_limit,
    'supplier_limit_reached', supplier_count >= supplier_limit,
    'product_limit', product_limit,
    'supplier_limit', supplier_limit,
    'reason', null
  );

  IF product_count >= product_limit THEN
    result := jsonb_set(result,'{allowed}','false');
    result := jsonb_set(result,'{reason}', to_jsonb('Se alcanzó el límite mensual de ofertas para este producto'::text));
  ELSIF supplier_count >= supplier_limit THEN
    result := jsonb_set(result,'{allowed}','false');
    result := jsonb_set(result,'{reason}', to_jsonb('Se alcanzó el límite mensual de ofertas con este proveedor'::text));
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop older overloads (defensive)
DO $$ BEGIN
  -- 6 param version will be replaced below anyway
  -- Remove potential legacy 8-parameter version
  IF EXISTS (
    SELECT 1 FROM pg_proc
     WHERE proname='create_offer'
       AND pronargs=8
       AND oidvectortypes(proargtypes)='uuid,uuid,uuid,numeric,integer,text,numeric,integer'
  ) THEN
    EXECUTE 'DROP FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text,numeric,integer)';
  END IF;
END $$;

-- 3. Re-create create_offer with explicit constraint usage and notices
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
  price_check jsonb;
  new_offer_id uuid;
  current_month text := to_char(now(),'YYYY-MM');
  expires_at_time timestamptz := now() + interval '48 hours';
BEGIN
  RAISE NOTICE '[create_offer] start buyer=% pdt=% supp=%', p_buyer_id, p_product_id, p_supplier_id;

  SELECT validate_offer_limits(p_buyer_id, p_supplier_id, p_product_id) INTO limits_check;
  RAISE NOTICE '[create_offer] limits_check=%', limits_check;
  IF NOT (limits_check->>'allowed')::boolean THEN
    RETURN json_build_object('success', false, 'error', limits_check->>'reason', 'error_type', 'limit_exceeded');
  END IF;

  BEGIN
    SELECT validate_offer_against_tiers(p_product_id, p_offered_quantity, p_offered_price) INTO price_check;
  EXCEPTION WHEN undefined_function THEN
    price_check := json_build_object();
  END;
  RAISE NOTICE '[create_offer] price_check=%', price_check;

  INSERT INTO public.offers (
    buyer_id, supplier_id, product_id, offered_price, offered_quantity, message,
    expires_at, base_price_at_offer, tier_price_at_offer
  ) VALUES (
    p_buyer_id, p_supplier_id, p_product_id, p_offered_price, p_offered_quantity, p_message,
    expires_at_time,
    NULLIF(price_check->>'base_price','')::numeric,
    NULLIF(price_check->>'tier_price','')::numeric
  ) RETURNING id INTO new_offer_id;
  RAISE NOTICE '[create_offer] inserted offer id=%', new_offer_id;

  -- Upsert conteo producto (explicit constraint)
  INSERT INTO public.offer_limits_product (buyer_id, product_id, month_year, offers_count)
  VALUES (p_buyer_id, p_product_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_product_buyer_product_month_unique
  DO UPDATE SET offers_count = public.offer_limits_product.offers_count + 1, updated_at = now();
  RAISE NOTICE '[create_offer] upsert product done';

  -- Upsert conteo supplier (explicit constraint)
  INSERT INTO public.offer_limits_supplier (buyer_id, supplier_id, month_year, offers_count)
  VALUES (p_buyer_id, p_supplier_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_supplier_buyer_supplier_month_unique
  DO UPDATE SET offers_count = public.offer_limits_supplier.offers_count + 1, updated_at = now();
  RAISE NOTICE '[create_offer] upsert supplier done';

  RETURN json_build_object(
    'success', true,
    'offer_id', new_offer_id,
    'expires_at', expires_at_time,
    'price_validation', price_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) IS 'Crear oferta y actualizar límites (force replaced 20250903151000)';

GRANT EXECUTE ON FUNCTION public.validate_offer_limits(uuid,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) TO authenticated;

COMMIT;
