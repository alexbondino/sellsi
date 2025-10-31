-- =====================================================
-- Migration: 20250904160000_offers_phase1_deadline_sync.sql
-- Phase 1 adjustments: sync expires_at after acceptance and expire purchased past deadline.
-- =====================================================

-- 1. Update accept_offer_simple to also sync expires_at
CREATE OR REPLACE FUNCTION accept_offer_simple(p_offer_id uuid)
RETURNS jsonb AS $$
DECLARE
  offer_record record;
  available_stock integer;
  purchase_deadline_time timestamptz;
BEGIN
  SELECT * INTO offer_record FROM offers WHERE id = p_offer_id AND status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Oferta no encontrada o no está pendiente');
  END IF;
  IF now() > offer_record.expires_at THEN
    UPDATE offers SET status='expired', expired_at=now(), updated_at=now() WHERE id=p_offer_id;
    RETURN json_build_object('success', false, 'error', 'La oferta ha expirado');
  END IF;
  SELECT productqty INTO available_stock FROM products WHERE productid = offer_record.product_id;
  IF available_stock < offer_record.offered_quantity THEN
    RETURN json_build_object('success', false, 'error', 'Stock insuficiente para aceptar la oferta');
  END IF;
  purchase_deadline_time := now() + interval '24 hours';
  UPDATE offers SET
    status='accepted',
    accepted_at=now(),
    purchase_deadline=purchase_deadline_time,
    expires_at=purchase_deadline_time, -- sync for legacy UI
    stock_reserved=true,
    reserved_at=now(),
    updated_at=now()
  WHERE id=p_offer_id;
  UPDATE products SET productqty = productqty - offer_record.offered_quantity WHERE productid = offer_record.product_id;
  RETURN json_build_object('success', true, 'offer_id', p_offer_id, 'purchase_deadline', purchase_deadline_time, 'reserved_quantity', offer_record.offered_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Extend expire_offers_automatically to also expire purchased past deadline (Phase 1 safety)
CREATE OR REPLACE FUNCTION expire_offers_automatically()
RETURNS jsonb AS $$
DECLARE
  expired_pending_count integer := 0;
  expired_accept_like_count integer := 0; -- accepted + purchased expired
  restored_stock_total integer := 0;
  rec record;
BEGIN
  UPDATE offers SET status='expired', expired_at=now(), updated_at=now()
  WHERE status='pending' AND expires_at < now();
  GET DIAGNOSTICS expired_pending_count = ROW_COUNT;

  FOR rec IN 
    SELECT id, product_id, offered_quantity, status FROM offers
    WHERE status IN ('accepted','purchased')
      AND purchase_deadline IS NOT NULL
      AND purchase_deadline < now()
      AND stock_reserved = true
  LOOP
    UPDATE products SET productqty = productqty + rec.offered_quantity WHERE productid = rec.product_id;
    UPDATE offers SET status='expired', expired_at=now(), stock_reserved=false, updated_at=now() WHERE id = rec.id;
    restored_stock_total := restored_stock_total + rec.offered_quantity;
    expired_accept_like_count := expired_accept_like_count + 1;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'expired_pending', expired_pending_count,
    'expired_accept_or_purchased', expired_accept_like_count,
    'total_stock_restored', restored_stock_total,
    'processed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill sync for existing accepted offers (one-time)
UPDATE offers SET expires_at = purchase_deadline
WHERE status IN ('accepted','purchased') AND purchase_deadline IS NOT NULL AND abs(extract(epoch from (expires_at - purchase_deadline))) > 300;

-- End Phase 1 migration
