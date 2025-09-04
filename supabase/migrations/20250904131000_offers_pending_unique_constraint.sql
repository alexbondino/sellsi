-- =====================================================
-- Migration: Add unique pending-offer constraint per (buyer, product)
-- Date: 2025-09-04
-- Goal:
--   Evitar que un comprador genere más de una oferta con estado 'pending' para el mismo producto.
--   Cubre condiciones de carrera (dos tabs / doble submit rápido) que el front no puede garantizar.
-- Strategy:
--   * Crear índice único parcial sobre (buyer_id, product_id) WHERE status='pending'.
--   * Re-crear create_offer para capturar unique_violation y retornar JSON { success:false, error_type:'duplicate_pending' } en vez de excepción genérica.
-- Notes:
--   * No usamos CONCURRENTLY para simplificar (bloqueo breve acceptable dado volumen). Ajustar a CONCURRENTLY si tabla crece mucho.
--   * Nombre del índice: offers_pending_unique_buyer_product_idx
-- =====================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
      WHERE schemaname='public' 
        AND indexname='offers_pending_unique_buyer_product_idx'
  ) THEN
    -- Before creating the unique partial index, clean up existing duplicates
    -- Keep the most recent pending offer (by created_at) per buyer+product and mark others as expired
    DECLARE
      dup RECORD;
      keep_ids uuid[];
      remove_ids uuid[];
    BEGIN
      FOR dup IN
        SELECT buyer_id, product_id, array_agg(id ORDER BY created_at DESC)::uuid[] AS ids, count(*) AS cnt
        FROM public.offers
        WHERE status = 'pending'
        GROUP BY buyer_id, product_id
        HAVING count(*) > 1
      LOOP
        keep_ids := ARRAY[dup.ids[1]];
        IF array_length(dup.ids,1) > 1 THEN
          remove_ids := dup.ids[2:array_upper(dup.ids,1)];
          UPDATE public.offers
            SET status = 'expired', updated_at = now()
            WHERE id = ANY(remove_ids);
        END IF;
      END LOOP;
    END;

    -- Now create the unique partial index (no duplicates should remain)
    CREATE UNIQUE INDEX offers_pending_unique_buyer_product_idx
      ON public.offers (buyer_id, product_id)
      WHERE (status = 'pending');
  END IF;
END$$;

-- Recreate function with duplicate handling
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
    price_check := jsonb_build_object();
  END;

  -- 3. Resolver base & tier
  IF price_check ? 'base_price' THEN
    base_price := NULLIF(price_check->>'base_price','')::numeric;
  END IF;
  IF price_check ? 'tier_price' THEN
    tier_price := NULLIF(price_check->>'tier_price','')::numeric;
  END IF;
  IF base_price IS NULL THEN
    SELECT price INTO base_price FROM public.products WHERE productid = p_product_id FOR SHARE;
  END IF;
  IF base_price IS NULL THEN
    RAISE EXCEPTION 'offer_missing_base_price: product %', p_product_id;
  END IF;
  IF tier_price IS NULL THEN
    tier_price := base_price;
  END IF;

  -- 4. Validación de regla de precio
  IF price_check ? 'is_valid' AND NOT (price_check->>'is_valid')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', COALESCE(price_check->>'message','Precio inválido'),
      'error_type', 'invalid_price',
      'details', price_check
    );
  END IF;

  -- 5. Insertar oferta (manejo de duplicado pending)
  BEGIN
    INSERT INTO public.offers(
      buyer_id, supplier_id, product_id, offered_price, offered_quantity, message,
      expires_at, base_price_at_offer, tier_price_at_offer
    ) VALUES (
      p_buyer_id, p_supplier_id, p_product_id, p_offered_price, p_offered_quantity, p_message,
      expires_at_time,
      base_price,
      tier_price
    ) RETURNING id INTO new_offer_id;
  EXCEPTION WHEN unique_violation THEN
    -- Detectar si la violación corresponde al índice parcial de pending
    IF EXISTS (
      SELECT 1 FROM public.offers 
       WHERE buyer_id = p_buyer_id AND product_id = p_product_id AND status='pending'
    ) THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Ya existe una oferta pendiente para este producto',
        'error_type', 'duplicate_pending'
      );
    ELSE
      RAISE; -- otra violación no esperada
    END IF;
  END;

  -- 6. Actualizar contadores normalizados
  INSERT INTO public.offer_limits_product (buyer_id, product_id, month_year, offers_count)
  VALUES (p_buyer_id, p_product_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_product_buyer_product_month_unique
  DO UPDATE SET offers_count = public.offer_limits_product.offers_count + 1, updated_at = now();

  INSERT INTO public.offer_limits_supplier (buyer_id, supplier_id, month_year, offers_count)
  VALUES (p_buyer_id, p_supplier_id, current_month, 1)
  ON CONFLICT ON CONSTRAINT offer_limits_supplier_buyer_supplier_month_unique
  DO UPDATE SET offers_count = public.offer_limits_supplier.offers_count + 1, updated_at = now();

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

COMMENT ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) IS 'create_offer con guardas de precio + manejo de duplicado pending (migration 20250904131000)';

GRANT EXECUTE ON FUNCTION public.create_offer(uuid,uuid,uuid,numeric,integer,text) TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload schema';
