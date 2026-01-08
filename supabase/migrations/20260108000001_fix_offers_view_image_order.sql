-- Fix: Corregir image_order en offers_with_details
-- Las imágenes principales usan image_order = 0, no 1
-- Date: 2026-01-08

BEGIN;

CREATE OR REPLACE VIEW offers_with_details AS
SELECT
  -- Campos explícitos de offers (21 campos de la tabla real)
  o.id,
  o.buyer_id,
  o.supplier_id,
  o.product_id,
  o.offered_price,
  o.offered_quantity,
  o.message,
  o.status,
  o.created_at,
  o.expires_at,
  o.accepted_at,
  o.purchase_deadline,
  o.purchased_at,
  o.rejected_at,
  o.expired_at,
  o.tier_price_at_offer,
  o.base_price_at_offer,
  o.stock_reserved,
  o.reserved_at,
  o.rejection_reason,
  o.updated_at,
  -- Información del producto
  p.productnm as product_name,
  p.price as current_product_price,
  p.productqty as current_stock,
  -- Campo de imagen existente
  pi.image_url as product_image,
  -- Información del comprador
  buyer.user_nm as buyer_name,
  buyer.email as buyer_email,
  -- Información del proveedor
  supplier.user_nm as supplier_name,
  supplier.email as supplier_email,
  -- Cálculos útiles
  CASE
    WHEN o.status = 'pending' THEN
      EXTRACT(EPOCH FROM (o.expires_at - now()))
    WHEN o.status = 'accepted' THEN
      EXTRACT(EPOCH FROM (o.purchase_deadline - now()))
    ELSE 0
  END as seconds_remaining,
  -- Estados calculados
  CASE
    WHEN o.status = 'pending' AND now() > o.expires_at THEN true
    WHEN o.status = 'accepted' AND now() > o.purchase_deadline THEN true
    ELSE false
  END as is_expired,
  -- Nuevos campos al final
  pi.thumbnails as product_thumbnails,
  pi.thumbnail_url as product_thumbnail_url
FROM offers o
JOIN products p ON o.product_id = p.productid
JOIN users buyer ON o.buyer_id = buyer.user_id
JOIN users supplier ON o.supplier_id = supplier.user_id
LEFT JOIN product_images pi ON p.productid = pi.product_id AND pi.image_order = 0;

COMMIT;
