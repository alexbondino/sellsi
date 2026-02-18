-- P0 remediation for thumbnail_url deprecation readiness (non-destructive)
-- Scope: remove active SQL dependencies on product_images.thumbnail_url / product_thumbnail_url in core functions/views
-- NOTE: This migration intentionally does not use BEGIN/COMMIT because it includes
-- CREATE INDEX CONCURRENTLY, which is not allowed inside a transaction block.

-- 1) Function: request_delete_product_v1
-- Remove dependency on products.tiny_thumbnail_url (no writes to legacy field)
CREATE OR REPLACE FUNCTION public.request_delete_product_v1(
  p_product_id uuid,
  p_supplier_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM 1 FROM public.products
   WHERE productid = p_product_id
     AND supplier_id = p_supplier_id
     AND deletion_status = 'active'
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No existe, no es tuyo o ya eliminado');
  END IF;

  DELETE FROM public.cart_items               WHERE product_id = p_product_id;
  DELETE FROM public.product_delivery_regions WHERE product_id = p_product_id;
  DELETE FROM public.product_quantity_ranges  WHERE product_id = p_product_id;
  DELETE FROM public.product_images           WHERE product_id = p_product_id;

  BEGIN
    DELETE FROM public.products WHERE productid = p_product_id;
    RETURN jsonb_build_object('success', true, 'action', 'deleted');
  EXCEPTION WHEN foreign_key_violation THEN
    UPDATE public.products
      SET is_active = false,
          deletion_status = 'pending_delete',
          deletion_requested_at = now(),
          safe_delete_after = now() + interval '90 days'
    WHERE productid = p_product_id;

    RETURN jsonb_build_object('success', true, 'action', 'soft_deleted');
  END;
END;
$$;

-- 2) Function: replace_product_images_preserve_thumbs
-- Keep thumbnails/signature preservation without using thumbnail_url legacy column
CREATE OR REPLACE FUNCTION public.replace_product_images_preserve_thumbs(
  p_product_id uuid,
  p_supplier_id uuid,
  p_image_urls text[]
) RETURNS SETOF public.product_images
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_url text;
  v_idx integer := 0;
  v_old_main record;
  v_new_main_basename text;
  v_old_basename text;
  v_preserve boolean := false;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_product_id::text)::bigint);

  SELECT id, image_url, thumbnails, thumbnail_signature
    INTO v_old_main
    FROM public.product_images
   WHERE product_id = p_product_id
     AND image_order = 0;

  IF array_length(p_image_urls, 1) IS NOT NULL AND array_length(p_image_urls, 1) > 0 THEN
    v_new_main_basename := regexp_replace(
      split_part(p_image_urls[1], '/', array_length(string_to_array(p_image_urls[1], '/'), 1)),
      '\\?.*$',
      ''
    );
  END IF;

  IF v_old_main IS NOT NULL AND v_old_main.thumbnail_signature IS NOT NULL THEN
    v_old_basename := regexp_replace(
      split_part(v_old_main.image_url, '/', array_length(string_to_array(v_old_main.image_url, '/'), 1)),
      '\\?.*$',
      ''
    );

    IF v_old_basename = v_new_main_basename THEN
      v_preserve := true;
    END IF;
  END IF;

  DELETE FROM public.product_images
   WHERE product_id = p_product_id;

  FOREACH v_url IN ARRAY p_image_urls LOOP
    INSERT INTO public.product_images(
      product_id,
      image_url,
      image_order,
      created_at,
      updated_at,
      thumbnails,
      thumbnail_signature
    )
    VALUES (
      p_product_id,
      v_url,
      v_idx,
      now(),
      now(),
      CASE WHEN v_preserve THEN v_old_main.thumbnails ELSE NULL END,
      CASE WHEN v_preserve THEN v_old_main.thumbnail_signature ELSE NULL END
    );

    v_idx := v_idx + 1;
  END LOOP;

  RETURN QUERY
    SELECT *
    FROM public.product_images
    WHERE product_id = p_product_id
    ORDER BY image_order;
END;
$$;

COMMENT ON FUNCTION public.replace_product_images_preserve_thumbs(uuid, uuid, text[])
IS 'Reemplaza imágenes preservando thumbnails/signature de la imagen principal sin depender de thumbnail_url legacy.';

-- 3) View: offers_with_details
-- Keep legacy product_thumbnail_url for compatibility in this phase
CREATE OR REPLACE VIEW public.offers_with_details AS
SELECT
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
  p.productnm AS product_name,
  p.price AS current_product_price,
  p.productqty AS current_stock,
  pi.image_url AS product_image,
  buyer.user_nm AS buyer_name,
  buyer.email AS buyer_email,
  supplier.user_nm AS supplier_name,
  supplier.email AS supplier_email,
  CASE
    WHEN o.status = 'pending' THEN EXTRACT(EPOCH FROM (o.expires_at - now()))
    WHEN o.status = 'accepted' THEN EXTRACT(EPOCH FROM (o.purchase_deadline - now()))
    ELSE 0
  END AS seconds_remaining,
  CASE
    WHEN o.status = 'pending' AND now() > o.expires_at THEN true
    WHEN o.status = 'accepted' AND now() > o.purchase_deadline THEN true
    ELSE false
  END AS is_expired,
  pi.thumbnails AS product_thumbnails,
  COALESCE(pi.thumbnails ->> 'desktop', pi.thumbnail_url) AS product_thumbnail_url
FROM public.offers o
JOIN public.products p ON o.product_id = p.productid
JOIN public.users buyer ON o.buyer_id = buyer.user_id
JOIN public.users supplier ON o.supplier_id = supplier.user_id
LEFT JOIN public.product_images pi ON p.productid = pi.product_id AND pi.image_order = 0;

-- 4) View: marketplace_products_daily
-- IMPORTANT: no-op in this migration phase.
-- This view has environment-dependent column ordering and CREATE OR REPLACE VIEW can fail
-- with column rename conflicts in remote DBs. Keep current deployed definition unchanged.

-- 5) View: product_price_summary
-- Keep tiny_thumbnail_url for compatibility in this phase
DROP VIEW IF EXISTS public.product_price_summary;

CREATE VIEW public.product_price_summary AS
SELECT
  p.productid,
  p.productid AS product_id,
  p.price AS base_price,
  COALESCE(MIN(r.price), p.price) AS min_price,
  COALESCE(MAX(r.price), p.price) AS max_price,
  COUNT(r.product_qty_id) AS tiers_count,
  (
    COUNT(r.product_qty_id) > 0
    AND (
      COALESCE(MIN(r.price), p.price) <> COALESCE(MAX(r.price), p.price)
      OR COALESCE(MIN(r.price), p.price) <> p.price
    )
  ) AS has_variable_pricing,
  p.supplier_id,
  p.productnm,
  p.category,
  p.product_type,
  p.productqty,
  p.minimum_purchase,
  p.negotiable,
  p.is_active,
  p.tiny_thumbnail_url
FROM public.products p
LEFT JOIN public.product_quantity_ranges r
  ON r.product_id = p.productid
GROUP BY
  p.productid,
  p.price,
  p.supplier_id,
  p.productnm,
  p.category,
  p.product_type,
  p.productqty,
  p.minimum_purchase,
  p.negotiable,
  p.is_active,
  p.tiny_thumbnail_url;

CREATE INDEX IF NOT EXISTS idx_product_quantity_ranges_product_id_price
  ON public.product_quantity_ranges (product_id, price);

-- 6) Index remediation for product_images main image lookup
CREATE INDEX IF NOT EXISTS idx_product_images_main_include_phase2
ON public.product_images (product_id)
INCLUDE (thumbnails, thumbnail_signature)
WHERE image_order = 0;

DROP INDEX IF EXISTS idx_product_images_main_include_phase1;

COMMENT ON INDEX idx_product_images_main_include_phase2 IS
'P0 remediation: main image include index without thumbnail_url legacy dependency.';
