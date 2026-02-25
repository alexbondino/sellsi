-- =====================================================
-- Migration: Block identical counteroffers
-- Date: 2026-02-25
-- =====================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.submit_counter_offer(
  p_offer_id uuid,
  p_actor text,
  p_offered_price numeric,
  p_offered_quantity integer,
  p_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.offers%ROWTYPE;
  v_auth_user uuid;
  v_actor text;
  v_next_turn text;
  v_tier_check jsonb;
  v_tier_price numeric;
  v_base_price numeric;
  v_current_stock integer;
  v_normalized_price integer;
  v_normalized_qty integer;
  v_next_expires_at timestamptz;
BEGIN
  v_actor := lower(trim(COALESCE(p_actor, '')));

  IF v_actor NOT IN ('buyer', 'supplier') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Actor inválido');
  END IF;

  IF p_offered_price IS NULL OR p_offered_quantity IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Precio y cantidad son requeridos');
  END IF;

  v_normalized_price := ROUND(p_offered_price);
  v_normalized_qty := p_offered_quantity;

  IF v_normalized_price <= 0 OR v_normalized_qty <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Precio y cantidad deben ser mayores a 0');
  END IF;

  v_auth_user := auth.uid();
  IF v_auth_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuario no autenticado');
  END IF;

  SELECT *
  INTO v_offer
  FROM public.offers
  WHERE id = p_offer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta no encontrada');
  END IF;

  IF v_offer.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo se puede contraofertar una oferta pendiente');
  END IF;

  IF v_actor = 'buyer' AND v_auth_user <> v_offer.buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autorizado para contraofertar como comprador');
  END IF;

  IF v_actor = 'supplier' AND v_auth_user <> v_offer.supplier_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No autorizado para contraofertar como proveedor');
  END IF;

  IF now() > v_offer.expires_at THEN
    UPDATE public.offers
    SET status = 'expired',
        expired_at = now(),
        updated_at = now()
    WHERE id = p_offer_id;

    RETURN jsonb_build_object('success', false, 'error', 'La oferta ha expirado');
  END IF;

  IF COALESCE(v_offer.current_turn, 'supplier') <> v_actor THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No es tu turno para contraofertar',
      'current_turn', COALESCE(v_offer.current_turn, 'supplier')
    );
  END IF;

  IF v_actor = 'buyer' AND COALESCE(v_offer.buyer_counteroffers_count, 0) >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Límite de contraofertas del comprador alcanzado');
  END IF;

  IF v_actor = 'supplier' AND COALESCE(v_offer.supplier_counteroffers_count, 0) >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Límite de contraofertas del proveedor alcanzado');
  END IF;

  IF
    v_offer.offered_price = v_normalized_price
    AND v_offer.offered_quantity = v_normalized_qty
  THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Debes modificar el precio o la cantidad para enviar una contraoferta'
    );
  END IF;

  SELECT p.productqty
  INTO v_current_stock
  FROM public.products p
  WHERE p.productid = v_offer.product_id;

  IF v_current_stock IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No se pudo validar stock del producto');
  END IF;

  IF v_normalized_qty > v_current_stock THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('La cantidad supera el stock disponible (%s)', v_current_stock),
      'current_stock', v_current_stock
    );
  END IF;

  v_tier_check := public.validate_offer_against_tiers(
    v_offer.product_id,
    v_normalized_qty,
    v_normalized_price
  );

  IF NOT COALESCE((v_tier_check->>'is_valid')::boolean, false) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', COALESCE(v_tier_check->>'reason', 'Precio inválido para el tramo del producto'),
      'price_validation', v_tier_check
    );
  END IF;

  v_tier_price := NULLIF(v_tier_check->>'tier_price', '')::numeric;
  v_base_price := NULLIF(v_tier_check->>'base_price', '')::numeric;
  v_next_turn := CASE WHEN v_actor = 'buyer' THEN 'supplier' ELSE 'buyer' END;
  v_next_expires_at := now() + interval '48 hours';

  UPDATE public.offers
  SET offered_price = v_normalized_price,
      offered_quantity = v_normalized_qty,
      message = NULLIF(trim(p_message), ''),
      tier_price_at_offer = v_tier_price,
      base_price_at_offer = COALESCE(v_base_price, v_offer.base_price_at_offer),
      current_turn = v_next_turn,
      supplier_counteroffers_count = COALESCE(v_offer.supplier_counteroffers_count, 0) + CASE WHEN v_actor = 'supplier' THEN 1 ELSE 0 END,
      buyer_counteroffers_count = COALESCE(v_offer.buyer_counteroffers_count, 0) + CASE WHEN v_actor = 'buyer' THEN 1 ELSE 0 END,
      expires_at = v_next_expires_at,
      counteroffer_updated_at = now(),
      updated_at = now()
  WHERE id = p_offer_id;

  SELECT *
  INTO v_offer
  FROM public.offers
  WHERE id = p_offer_id;

  RETURN jsonb_build_object(
    'success', true,
    'offer_id', v_offer.id,
    'next_turn', v_offer.current_turn,
    'expires_at', v_offer.expires_at,
    'supplier_counteroffers_count', v_offer.supplier_counteroffers_count,
    'buyer_counteroffers_count', v_offer.buyer_counteroffers_count,
    'counteroffer_cycle', GREATEST(v_offer.supplier_counteroffers_count, v_offer.buyer_counteroffers_count)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_counter_offer(uuid, text, numeric, integer, text) TO authenticated;

COMMENT ON FUNCTION public.submit_counter_offer(uuid, text, numeric, integer, text) IS
'Submit counteroffer with turn validation, limits, stock checks, and prevention of identical price+quantity submissions.';

COMMIT;
