-- =====================================================
-- Migration: 20251208000001_create_cancel_offer_function.sql
-- Objetivo: Crear función cancel_offer para que compradores puedan cancelar sus ofertas
-- Fecha: 2025-12-08
-- Estados válidos: pending, approved, accepted, reserved, paid, cancelled, rejected, expired
-- =====================================================

-- Función para que un comprador cancele su propia oferta
-- Solo puede cancelar ofertas en estado 'pending', 'approved', o 'accepted'
-- Si la oferta tiene stock reservado, lo repone al producto
CREATE OR REPLACE FUNCTION public.cancel_offer(
  p_offer_id uuid
) RETURNS jsonb AS $$
DECLARE
  offer_record record;
  v_buyer_id uuid;
BEGIN
  -- Obtener ID del usuario autenticado
  v_buyer_id := auth.uid();
  
  IF v_buyer_id IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'No autenticado',
      'error_type', 'unauthorized'
    );
  END IF;

  -- Obtener oferta con lock, verificando que pertenece al buyer
  -- Solo permitir cancelar ofertas en pending, approved o accepted
  -- No permitir cancelar ofertas que ya están reserved (en carrito), paid, cancelled, rejected o expired
  SELECT * INTO offer_record 
  FROM public.offers 
  WHERE id = p_offer_id 
    AND buyer_id = v_buyer_id
    AND status IN ('pending', 'approved', 'accepted')
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Oferta no encontrada o no se puede cancelar',
      'error_type', 'not_found'
    );
  END IF;
  
  -- Si la oferta tiene stock reservado, reponerlo al producto
  IF offer_record.stock_reserved = true THEN
    UPDATE public.products 
    SET productqty = productqty + offer_record.offered_quantity,
        updated_at = now()
    WHERE productid = offer_record.product_id;
  END IF;
  
  -- Cancelar la oferta
  UPDATE public.offers SET
    status = 'cancelled',
    updated_at = now(),
    stock_reserved = false  -- Asegurar que se marca como no reservado
  WHERE id = p_offer_id;
  
  RETURN json_build_object(
    'success', true, 
    'offer_id', p_offer_id,
    'cancelled_at', now(),
    'stock_restored', offer_record.stock_reserved
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario y permisos
COMMENT ON FUNCTION public.cancel_offer(uuid) IS 'Permite a un comprador cancelar su propia oferta (pending/approved/accepted). Repone stock si estaba reservado. No permite cancelar ofertas reserved, paid, cancelled, rejected o expired.';

GRANT EXECUTE ON FUNCTION public.cancel_offer(uuid) TO authenticated;
