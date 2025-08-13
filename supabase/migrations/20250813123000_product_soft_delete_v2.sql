-- Migration: product soft delete function v2 with FK fallback
-- Only adds improved function; safe to re-run

CREATE OR REPLACE FUNCTION public.request_delete_product_v1(
  p_product_id uuid,
  p_supplier_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thumb text;
BEGIN
  -- Lock & ownership (only active products)
  PERFORM 1 FROM public.products
   WHERE productid = p_product_id
     AND supplier_id = p_supplier_id
     AND deletion_status = 'active'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No existe, no es tuyo o ya eliminado');
  END IF;

  -- Pre-capture tiny thumbnail candidate BEFORE removing images (store 40x40 derivative if present)
  SELECT thumbnails->>'40x40'
    INTO v_thumb
  FROM public.product_images
  WHERE product_id = p_product_id
    AND thumbnails ? '40x40'
  ORDER BY image_order ASC
  LIMIT 1;

  -- Remove ancillary data common to both hard & soft paths
  DELETE FROM public.cart_items              WHERE product_id = p_product_id; -- limpiar carritos
  DELETE FROM public.product_delivery_regions WHERE product_id = p_product_id;
  DELETE FROM public.product_quantity_ranges  WHERE product_id = p_product_id;
  DELETE FROM public.product_images           WHERE product_id = p_product_id; -- preservamos v_thumb

  -- Try HARD DELETE first
  BEGIN
    DELETE FROM public.products WHERE productid = p_product_id; -- will fail if FK (sales / requests)
    RETURN jsonb_build_object('success', true, 'action', 'deleted');
  EXCEPTION WHEN foreign_key_violation THEN
    -- FALLBACK SOFT DELETE (sales / requests present)
    UPDATE public.products
      SET is_active = false,
          deletion_status = 'pending_delete',
          deletion_requested_at = now(),
          safe_delete_after = now() + interval '90 days',
          tiny_thumbnail_url = COALESCE(v_thumb, tiny_thumbnail_url)
    WHERE productid = p_product_id;
    RETURN jsonb_build_object('success', true, 'action', 'soft_deleted');
  END;
END;
$$;

-- Optionally grant execute (adjust roles)
-- GRANT EXECUTE ON FUNCTION public.request_delete_product_v1(uuid, uuid) TO authenticated, service_role;
