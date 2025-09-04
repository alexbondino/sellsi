-- =====================================================
-- Migración: 20250903120000_offer_limits_refactor.sql
-- Propósito: Refactor de offer_limits para evitar colisiones
--            y duplicaciones por doble INSERT en create_offer.
--            Se separan los conteos por producto y por proveedor
--            usando filas distintas:
--              * Fila por producto: product_id NOT NULL
--              * Fila agregada proveedor: product_id NULL
--            Esto elimina la condición de carrera entre dos
--            INSERT que chocaban contra el UNIQUE
--            (buyer_id, supplier_id, month_year).
-- =====================================================

-- 1. Hacer product_id nullable (permite filas agregadas por proveedor)
ALTER TABLE public.offer_limits
  ALTER COLUMN product_id DROP NOT NULL;

-- 2. Eliminar constraints únicos antiguos (si existen)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.offer_limits'::regclass
      AND conname = 'offer_limits_buyer_id_product_id_month_year_key'
  ) THEN
    ALTER TABLE public.offer_limits
      DROP CONSTRAINT offer_limits_buyer_id_product_id_month_year_key;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.offer_limits'::regclass
      AND conname = 'offer_limits_buyer_id_supplier_id_month_year_key'
  ) THEN
    ALTER TABLE public.offer_limits
      DROP CONSTRAINT offer_limits_buyer_id_supplier_id_month_year_key;
  END IF;
END $$;

-- 3. Crear índice parcial único para fila agregada proveedor
CREATE UNIQUE INDEX IF NOT EXISTS ux_offer_limits_supplier
  ON public.offer_limits(buyer_id, supplier_id, month_year)
  WHERE product_id IS NULL;

-- Asegurar constraint UNIQUE para (buyer, product, month) incluso con product_id nullable
-- (permite múltiples filas product_id NULL porque NULL != NULL en constraint estándar)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='ux_offer_limits_product') THEN
    DROP INDEX IF EXISTS ux_offer_limits_product; -- limpiamos índice previo parcial redundante
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.offer_limits'::regclass
      AND conname='offer_limits_buyer_product_month'
  ) THEN
    ALTER TABLE public.offer_limits
      ADD CONSTRAINT offer_limits_buyer_product_month UNIQUE (buyer_id, product_id, month_year);
  END IF;
END $$;

-- 4. Poblar filas agregadas proveedor (product_id NULL) si no existen (insert condicional)
WITH agg AS (
  SELECT buyer_id, supplier_id, to_char(created_at,'YYYY-MM') AS month_year, COUNT(*) AS supplier_offers_count
  FROM public.offers
  GROUP BY buyer_id, supplier_id, to_char(created_at,'YYYY-MM')
)
INSERT INTO public.offer_limits (id, buyer_id, product_id, supplier_id, month_year,
  product_offers_count, supplier_offers_count, created_at, updated_at)
SELECT gen_random_uuid(), a.buyer_id, NULL, a.supplier_id, a.month_year,
       0, a.supplier_offers_count, now(), now()
FROM agg a
LEFT JOIN public.offer_limits l
  ON l.buyer_id = a.buyer_id
 AND l.supplier_id = a.supplier_id
 AND l.month_year = a.month_year
 AND l.product_id IS NULL
WHERE l.id IS NULL;

-- 5. (Opcional) Normalizar filas existentes "fusionadas" (donde se intentó
--    llevar ambos conteos en una sola fila). Si una fila tiene product_id NOT NULL
--    y supplier_offers_count > 0 siempre conservamos tal cual (conteo producto).
--    Los conteos proveedor ya se regeneran en las filas NULL creadas arriba.
--    Ajustamos supplier_offers_count de filas producto para evitar doble conteo.
UPDATE public.offer_limits
SET supplier_offers_count = 0
WHERE product_id IS NOT NULL
  AND supplier_offers_count > 0;

-- 6. Reemplazar función validate_offer_limits
CREATE OR REPLACE FUNCTION validate_offer_limits(
  p_buyer_id uuid,
  p_supplier_id uuid,
  p_product_id uuid
) RETURNS jsonb AS $$
DECLARE
  current_month text;
  product_count integer;
  supplier_count integer;
  result jsonb;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');

  SELECT COALESCE(product_offers_count, 0) INTO product_count
  FROM offer_limits
  WHERE buyer_id = p_buyer_id
    AND product_id = p_product_id
    AND month_year = current_month;

  IF product_count IS NULL THEN product_count := 0; END IF;

  SELECT COALESCE(supplier_offers_count, 0) INTO supplier_count
  FROM offer_limits
  WHERE buyer_id = p_buyer_id
    AND supplier_id = p_supplier_id
    AND product_id IS NULL
    AND month_year = current_month;

  IF supplier_count IS NULL THEN supplier_count := 0; END IF;

  result := json_build_object(
    'allowed', true,
    'product_count', product_count,
    'supplier_count', supplier_count,
    'product_limit_reached', product_count >= 2,
    'supplier_limit_reached', supplier_count >= 5,
    'reason', NULL
  );

  IF product_count >= 2 THEN
    result := jsonb_set(result, '{allowed}', 'false');
    result := jsonb_set(result, '{reason}', '"Ya has hecho 2 ofertas para este producto este mes"');
  ELSIF supplier_count >= 5 THEN
    result := jsonb_set(result, '{allowed}', 'false');
    result := jsonb_set(result, '{reason}', '"Ya has hecho 5 ofertas a este proveedor este mes"');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Reemplazar función create_offer (misma signatura) con nuevo upsert robusto
CREATE OR REPLACE FUNCTION create_offer(
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
  current_month text;
  expires_at_time timestamptz;
BEGIN
  SELECT validate_offer_limits(p_buyer_id, p_supplier_id, p_product_id) INTO limits_check;
  IF NOT (limits_check->>'allowed')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', limits_check->>'reason',
      'error_type', 'limit_exceeded'
    );
  END IF;

  SELECT validate_offer_against_tiers(p_product_id, p_offered_quantity, p_offered_price) INTO price_check;
  IF NOT (price_check->>'is_valid')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', price_check->>'message',
      'error_type', 'invalid_price',
      'details', price_check
    );
  END IF;

  expires_at_time := now() + interval '48 hours';
  current_month := to_char(now(), 'YYYY-MM');

  INSERT INTO offers (
    buyer_id, supplier_id, product_id, offered_price, offered_quantity, message,
    expires_at, base_price_at_offer, tier_price_at_offer
  ) VALUES (
    p_buyer_id, p_supplier_id, p_product_id, p_offered_price, p_offered_quantity, p_message,
    expires_at_time,
    (price_check->>'base_price')::numeric,
    (price_check->>'tier_price')::numeric
  ) RETURNING id INTO new_offer_id;

  -- Upsert conteo producto
  INSERT INTO offer_limits (buyer_id, product_id, supplier_id, month_year, product_offers_count, supplier_offers_count)
  VALUES (p_buyer_id, p_product_id, p_supplier_id, current_month, 1, 0)
  ON CONFLICT (buyer_id, product_id, month_year)
  DO UPDATE SET product_offers_count = offer_limits.product_offers_count + 1, updated_at = now();

  -- Upsert conteo proveedor (fila product_id NULL) con retry en caso de carrera
  PERFORM 1 FROM offer_limits
   WHERE buyer_id = p_buyer_id
     AND supplier_id = p_supplier_id
     AND product_id IS NULL
     AND month_year = current_month;

  IF FOUND THEN
    UPDATE offer_limits SET supplier_offers_count = supplier_offers_count + 1, updated_at = now()
    WHERE buyer_id = p_buyer_id AND supplier_id = p_supplier_id AND product_id IS NULL AND month_year = current_month;
  ELSE
    BEGIN
      INSERT INTO offer_limits (buyer_id, product_id, supplier_id, month_year, product_offers_count, supplier_offers_count)
      VALUES (p_buyer_id, NULL, p_supplier_id, current_month, 0, 1);
    EXCEPTION WHEN unique_violation THEN
      -- Otro proceso la insertó; incrementamos
      UPDATE offer_limits SET supplier_offers_count = supplier_offers_count + 1, updated_at = now()
      WHERE buyer_id = p_buyer_id AND supplier_id = p_supplier_id AND product_id IS NULL AND month_year = current_month;
    END;
  END IF;

  RETURN json_build_object(
    'success', true,
    'offer_id', new_offer_id,
    'expires_at', expires_at_time,
    'price_validation', price_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. (Opcional) Reemplazar comentario tabla
COMMENT ON TABLE public.offer_limits IS 'Control de límites mensual: filas por producto y fila agregada proveedor (product_id NULL).';

-- 9. Grants (re-aplicar por seguridad)
GRANT SELECT, INSERT, UPDATE ON public.offer_limits TO authenticated;
GRANT EXECUTE ON FUNCTION validate_offer_limits(uuid,uuid,uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_offer(uuid,uuid,uuid,numeric,integer,text) TO authenticated;

-- FIN MIGRACIÓN
