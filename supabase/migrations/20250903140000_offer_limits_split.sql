-- =====================================================
-- Migration: Split offer_limits into product/supplier tables (robusta)
-- Date: 2025-09-03
-- Rationale:
--   * El esquema anterior mezclaba conteos por producto y por proveedor en una sola fila
--     generando ambigüedad y bloqueando uso de dos UNIQUE simultáneos.
--   * Esta migración crea dos tablas normalizadas:
--       - offer_limits_product(buyer_id, product_id, month_year, offers_count)
--       - offer_limits_supplier(buyer_id, supplier_id, month_year, offers_count)
--     permitiendo múltiples productos para el mismo supplier sin colisiones.
--   * Reemplaza lógica de create_offer y validate_offer_limits.
--   * Mantiene la tabla legacy offer_limits intacta (solo lectura / rollback) hasta limpieza futura.
-- =====================================================

BEGIN;

-- 1. Crear nuevas tablas si no existen
CREATE TABLE IF NOT EXISTS public.offer_limits_product (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.users(user_id),
  product_id uuid NOT NULL REFERENCES public.products(productid),
  month_year text NOT NULL,
  offers_count integer NOT NULL DEFAULT 1 CHECK (offers_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, product_id, month_year)
);

CREATE TABLE IF NOT EXISTS public.offer_limits_supplier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.users(user_id),
  supplier_id uuid NOT NULL REFERENCES public.users(user_id),
  month_year text NOT NULL,
  offers_count integer NOT NULL DEFAULT 1 CHECK (offers_count >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, supplier_id, month_year)
);

-- 2. Índices (adicionales a UNIQUE) para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_offer_limits_product_lookup ON public.offer_limits_product (buyer_id, product_id, month_year);
CREATE INDEX IF NOT EXISTS idx_offer_limits_supplier_lookup ON public.offer_limits_supplier (buyer_id, supplier_id, month_year);

-- 3. Recalcular datos históricos desde offers (fuente de verdad) evitando inconsistencias legacy
--    (Se ignoran filas futuras/old months sin offers)
WITH prod AS (
  SELECT buyer_id, product_id, to_char(created_at,'YYYY-MM') AS month_year, COUNT(*) AS c
  FROM public.offers
  GROUP BY 1,2,3
)
INSERT INTO public.offer_limits_product (buyer_id, product_id, month_year, offers_count)
SELECT p.buyer_id, p.product_id, p.month_year, p.c
FROM prod p
ON CONFLICT (buyer_id, product_id, month_year) DO UPDATE
  SET offers_count = EXCLUDED.offers_count, updated_at = now();

-- Recalcular agregados por proveedor en una segunda sentencia WITH (cada WITH aplica a una sola sentencia)
WITH supp AS (
  SELECT buyer_id, supplier_id, to_char(created_at,'YYYY-MM') AS month_year, COUNT(*) AS c
  FROM public.offers
  GROUP BY 1,2,3
)
INSERT INTO public.offer_limits_supplier (buyer_id, supplier_id, month_year, offers_count)
SELECT s.buyer_id, s.supplier_id, s.month_year, s.c
FROM supp s
ON CONFLICT (buyer_id, supplier_id, month_year) DO UPDATE
  SET offers_count = EXCLUDED.offers_count, updated_at = now();

-- 4. Trigger para updated_at (reutilizar si ya existe función update_updated_at_column)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_offer_limits_product_updated ON public.offer_limits_product;
CREATE TRIGGER trg_offer_limits_product_updated
  BEFORE UPDATE ON public.offer_limits_product
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_offer_limits_supplier_updated ON public.offer_limits_supplier;
CREATE TRIGGER trg_offer_limits_supplier_updated
  BEFORE UPDATE ON public.offer_limits_supplier
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Reemplazar validate_offer_limits para usar nuevas tablas
CREATE OR REPLACE FUNCTION validate_offer_limits(
  p_buyer_id uuid,
  p_supplier_id uuid,
  p_product_id uuid
) RETURNS jsonb AS $$
DECLARE
  current_month text := to_char(now(),'YYYY-MM');
  product_count integer := 0;
  supplier_count integer := 0;
  product_limit integer := 3;      -- Mantener 3 (alineado con frontend/tests actuales)
  supplier_limit integer := 5;     -- Límite proveedor (extensible)
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

-- 6. Reemplazar create_offer para actualizar nuevas tablas
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
  current_month text := to_char(now(),'YYYY-MM');
  expires_at_time timestamptz := now() + interval '48 hours';
BEGIN
  -- Validar límites
  SELECT validate_offer_limits(p_buyer_id, p_supplier_id, p_product_id) INTO limits_check;
  IF NOT (limits_check->>'allowed')::boolean THEN
    RETURN json_build_object('success', false, 'error', limits_check->>'reason', 'error_type', 'limit_exceeded');
  END IF;

  -- Validar precio contra tiers (si existe función)
  BEGIN
    SELECT validate_offer_against_tiers(p_product_id, p_offered_quantity, p_offered_price) INTO price_check;
    IF price_check ? 'is_valid' AND NOT (price_check->>'is_valid')::boolean THEN
      RETURN json_build_object(
        'success', false,
        'error', COALESCE(price_check->>'message','Precio inválido'),
        'error_type', 'invalid_price',
        'details', price_check
      );
    END IF;
  EXCEPTION WHEN undefined_function THEN
    -- Continuar si la función aún no existe en entorno
    price_check := json_build_object();
  END;

  -- Insertar oferta
  INSERT INTO public.offers (
    buyer_id, supplier_id, product_id, offered_price, offered_quantity, message,
    expires_at, base_price_at_offer, tier_price_at_offer
  ) VALUES (
    p_buyer_id, p_supplier_id, p_product_id, p_offered_price, p_offered_quantity, p_message,
    expires_at_time,
    NULLIF(price_check->>'base_price','')::numeric,
    NULLIF(price_check->>'tier_price','')::numeric
  ) RETURNING id INTO new_offer_id;

  -- Upsert conteo producto
  INSERT INTO public.offer_limits_product (buyer_id, product_id, month_year, offers_count)
  VALUES (p_buyer_id, p_product_id, current_month, 1)
  ON CONFLICT (buyer_id, product_id, month_year)
  DO UPDATE SET offers_count = public.offer_limits_product.offers_count + 1, updated_at = now();

  -- Upsert conteo supplier
  INSERT INTO public.offer_limits_supplier (buyer_id, supplier_id, month_year, offers_count)
  VALUES (p_buyer_id, p_supplier_id, current_month, 1)
  ON CONFLICT (buyer_id, supplier_id, month_year)
  DO UPDATE SET offers_count = public.offer_limits_supplier.offers_count + 1, updated_at = now();

  RETURN json_build_object(
    'success', true,
    'offer_id', new_offer_id,
    'expires_at', expires_at_time,
    'price_validation', price_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentarios
COMMENT ON TABLE public.offer_limits_product IS 'Límites de ofertas por (buyer, product, mes)';
COMMENT ON TABLE public.offer_limits_supplier IS 'Límites de ofertas por (buyer, supplier, mes)';
COMMENT ON FUNCTION validate_offer_limits(uuid,uuid,uuid) IS 'Valida límites usando tablas separadas de conteo';
COMMENT ON FUNCTION create_offer(uuid,uuid,uuid,numeric,integer,text) IS 'Crear oferta y actualizar límites normalizados';

COMMIT;
