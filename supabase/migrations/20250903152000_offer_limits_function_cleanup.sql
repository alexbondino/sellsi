-- =====================================================
-- Migration: Cleanup create_offer overloads & keep single split version
-- Date: 2025-09-03
-- Purpose:
--   Remove legacy overloaded versions of create_offer (including 8-param version)
--   that reference legacy offer_limits logic, causing ON CONFLICT errors.
--   Recreate only the 6-parameter implementation targeting
--   offer_limits_product / offer_limits_supplier with explicit ON CONSTRAINT.
-- =====================================================

BEGIN;

-- 1. Drop ALL existing public.create_offer overloads (defensive)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'public.'||p.proname||'('||oidvectortypes(p.proargtypes)||')' AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE p.proname='create_offer' AND n.nspname='public'
  LOOP
    RAISE NOTICE 'Dropping %', r.sig;
    EXECUTE 'DROP FUNCTION '||r.sig;
  END LOOP;
END $$;

-- 2. Recreate canonical function (6 params)
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
  SELECT validate_offer_limits(p_buyer_id, p_supplier_id, p_product_id) INTO limits_check;
  IF NOT (limits_check->>'allowed')::boolean THEN
    RETURN json_build_object('success', false, 'error', limits_check->>'reason', 'error_type', 'limit_exceeded');
  END IF;

  BEGIN
    SELECT validate_offer_against_tiers(p_product_id, p_offered_quantity, p_offered_price) INTO price_check;
  EXCEPTION WHEN undefined_function THEN
    price_check := json_build_object();
  END;

  INSERT INTO public.offers(
    buyer_id, supplier_id, product_id, offered_price, offered_quantity, message,
    expires_at, base_price_at_offer, tier_price_at_offer
  ) VALUES (
    p_buyer_id, p_supplier_id, p_product_id, p_offered_price, p_offered_quantity, p_message,
    expires_at_time,
    NULLIF(price_check->>'base_price','')::numeric,
    NULLIF(price_check->>'tier_price','')::numeric
  ) RETURNING id INTO new_offer_id;

  INSERT INTO public.offer_limits_product (buyer_id, product_id, month_year, offers_count)
  VALUES (p_buyer_id, p_product_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_product_buyer_product_month_unique
  DO UPDATE SET offers_count = offer_limits_product.offers_count + 1, updated_at = now();

  INSERT INTO public.offer_limits_supplier (buyer_id, supplier_id, month_year, offers_count)
  VALUES (p_buyer_id, p_supplier_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_supplier_buyer_supplier_month_unique
  DO UPDATE SET offers_count = offer_limits_supplier.offers_count + 1, updated_at = now();

  RETURN json_build_object(
    'success', true,
    'offer_id', new_offer_id,
    'expires_at', expires_at_time,
    'price_validation', price_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) TO authenticated;

COMMENT ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) IS 'create_offer single canonical implementation (cleanup migration 20250903152000)';

COMMIT;

-- 3. (Out-of-transaction) Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
