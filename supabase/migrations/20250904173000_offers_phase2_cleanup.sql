-- Phase 2 Cleanup: Remove legacy 'purchased' usage and introduce reserve_offer alias
BEGIN;

-- 1. Create new reserve_offer function (idempotent definition)
CREATE OR REPLACE FUNCTION public.reserve_offer(
  p_offer_id uuid,
  p_order_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offer_record record;
BEGIN
  SELECT * INTO offer_record FROM offers WHERE id = p_offer_id AND status = 'accepted' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oferta no encontrada o no está aceptada');
  END IF;
  IF offer_record.purchase_deadline IS NOT NULL AND now() > offer_record.purchase_deadline THEN
    RETURN jsonb_build_object('success', false, 'error', 'El plazo para reservar esta oferta ha expirado');
  END IF;
  UPDATE offers SET
    status = 'reserved',
    reserved_at = now(),
    updated_at = now()
  WHERE id = p_offer_id;
  RETURN jsonb_build_object(
    'success', true,
    'offer_id', p_offer_id,
    'reserved_at', now(),
    'order_id', p_order_id
  );
END;$$;

-- 2. Deprecate mark_offer_as_purchased -> delegate to reserve_offer
CREATE OR REPLACE FUNCTION public.mark_offer_as_purchased(
  p_offer_id uuid,
  p_order_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Deprecated alias, use reserve_offer
  RETURN reserve_offer(p_offer_id, p_order_id);
END;$$;

-- 3. Update comment on offers.status (remove purchased, document reserved/paid)
COMMENT ON COLUMN public.offers.status IS 'Estados: pending (48h), accepted (24h para pagar), reserved (en carrito), paid (pago confirmado), rejected, expired';

-- 4. Drop legacy compatibility view if exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name='offers_legacy_status' AND table_schema='public') THEN
    DROP VIEW public.offers_legacy_status;
  END IF;
END $$;

COMMIT;
