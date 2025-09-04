-- =====================================================
-- Migración: 20250903110000_offers_write_support.sql
-- Objetivo:
--  * Añadir función count_monthly_offers requerida por el frontend (validateOfferLimits)
--  * Alinear create_offer con parámetros legacy (p_price, p_quantity) enviados por el cliente
--  * Proveer alias accept_offer que delega a accept_offer_simple usado en el store
-- Notas:
--  * No se modifica la lógica de negocio existente (límites y validaciones siguen en create_offer)
--  * Se agregan parámetros opcionales para compatibilidad evitando error "could not find function ..."
-- =====================================================

-- 1. Función count_monthly_offers (devuelve sólo el contador de ofertas del mes actual por buyer+product)
--    El store usa este número para validar límite local (3) antes de llamar create_offer.
CREATE OR REPLACE FUNCTION public.count_monthly_offers(
  p_buyer_id uuid,
  p_product_id uuid,
  p_supplier_id uuid DEFAULT NULL  -- actualmente ignorado, se mantiene por compatibilidad de llamada
) RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM public.offers o
    WHERE o.buyer_id = p_buyer_id
      AND o.product_id = p_product_id
      AND date_trunc('month', o.created_at) = date_trunc('month', now())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.count_monthly_offers IS 'Cuenta ofertas del mes actual para (buyer, product). Usado por frontend para validación local.';

-- 2. Redefinir create_offer agregando parámetros legacy p_price / p_quantity (ignorados si ya vienen p_offered_*)
--    Se elimina la versión previa para evitar conflicto de firma al agregar parámetros nuevos.
DO $$
BEGIN
  -- Intentar eliminar la versión anterior (6 params) si existe
  BEGIN
    EXECUTE 'DROP FUNCTION IF EXISTS public.create_offer(uuid, uuid, uuid, numeric, integer, text)';
  EXCEPTION WHEN undefined_function THEN
    -- ignorar
  END;
END;$$;

CREATE FUNCTION public.create_offer(
  p_buyer_id uuid,
  p_supplier_id uuid,
  p_product_id uuid,
  p_offered_price numeric,
  p_offered_quantity integer,
  p_message text DEFAULT NULL,
  p_price numeric DEFAULT NULL,      -- legacy, opcional
  p_quantity integer DEFAULT NULL    -- legacy, opcional
) RETURNS jsonb AS $$
DECLARE
  limits_check jsonb;
  price_check jsonb;
  new_offer_id uuid;
  current_month text;
  expires_at_time timestamptz;
  result jsonb;
  effective_price numeric := COALESCE(p_offered_price, p_price);
  effective_quantity integer := COALESCE(p_offered_quantity, p_quantity);
BEGIN
  -- Salvaguardas básicas (el frontend ya valida, pero evitamos NULLs si vienen sólo legacy)
  IF effective_price IS NULL OR effective_price <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Precio inválido', 'error_type', 'invalid_price');
  END IF;
  IF effective_quantity IS NULL OR effective_quantity <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Cantidad inválida', 'error_type', 'invalid_quantity');
  END IF;

  -- Validar límites (usa lógica existente si está definida)
  SELECT validate_offer_limits(p_buyer_id, p_supplier_id, p_product_id) INTO limits_check;
  IF NOT (limits_check->>'allowed')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', limits_check->>'reason',
      'error_type', 'limit_exceeded'
    );
  END IF;

  -- Validar precio contra tiers
  SELECT validate_offer_against_tiers(p_product_id, effective_quantity, effective_price) INTO price_check;
  IF NOT (price_check->>'is_valid')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', price_check->>'message',
      'error_type', 'invalid_price',
      'details', price_check
    );
  END IF;

  -- Calcular expiración (48h)
  expires_at_time := now() + interval '48 hours';
  current_month := to_char(now(), 'YYYY-MM');

  -- Insertar oferta
  INSERT INTO public.offers (
    buyer_id,
    supplier_id,
    product_id,
    offered_price,
    offered_quantity,
    message,
    expires_at,
    base_price_at_offer,
    tier_price_at_offer
  ) VALUES (
    p_buyer_id,
    p_supplier_id,
    p_product_id,
    effective_price,
    effective_quantity,
    p_message,
    expires_at_time,
    (price_check->>'base_price')::numeric,
    (price_check->>'tier_price')::numeric
  ) RETURNING id INTO new_offer_id;

  -- Actualizar offer_limits (producto)
  INSERT INTO public.offer_limits (
    buyer_id, product_id, supplier_id, month_year, product_offers_count, supplier_offers_count
  ) VALUES (
    p_buyer_id, p_product_id, p_supplier_id, current_month, 1, 1
  ) ON CONFLICT (buyer_id, product_id, month_year)
  DO UPDATE SET product_offers_count = public.offer_limits.product_offers_count + 1, updated_at = now();

  -- Actualizar offer_limits (proveedor)
  INSERT INTO public.offer_limits (
    buyer_id, product_id, supplier_id, month_year, product_offers_count, supplier_offers_count
  ) VALUES (
    p_buyer_id, p_product_id, p_supplier_id, current_month, 0, 1
  ) ON CONFLICT (buyer_id, supplier_id, month_year)
  DO UPDATE SET supplier_offers_count = public.offer_limits.supplier_offers_count + 1, updated_at = now();

  RETURN json_build_object(
    'success', true,
    'offer_id', new_offer_id,
    'expires_at', expires_at_time,
    'price_validation', price_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_offer IS 'Función principal para crear ofertas (compatibilidad extendida con parámetros legacy p_price/p_quantity).';

-- 3. Alias accept_offer que delega a accept_offer_simple (usado por el frontend)
CREATE OR REPLACE FUNCTION public.accept_offer(p_offer_id uuid)
RETURNS jsonb AS $$
BEGIN
  RETURN accept_offer_simple(p_offer_id);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.accept_offer IS 'Alias que delega en accept_offer_simple para compatibilidad con el frontend.';

-- 4. Grants (ejecución por rol authenticated)
DO $$
BEGIN
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.count_monthly_offers(uuid, uuid, uuid) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_offer(uuid, uuid, uuid, numeric, integer, text, numeric, integer) TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION public.accept_offer(uuid) TO authenticated';
EXCEPTION WHEN undefined_object THEN
  -- Ignorar si el rol o funciones no existen todavía
END;$$;

-- =====================================================
-- FIN MIGRACIÓN
-- =====================================================
