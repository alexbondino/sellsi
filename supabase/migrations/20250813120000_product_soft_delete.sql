-- Migration: product soft delete & robust deletion flow
-- Timestamp: 2025-08-13 12:00:00

-- 1. Columns (idempotent)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS deletion_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS safe_delete_after timestamptz,
  ADD COLUMN IF NOT EXISTS tiny_thumbnail_url text;

-- 2. Constraint (guard)
DO $$ BEGIN
  ALTER TABLE public.products
    ADD CONSTRAINT products_deletion_status_check
    CHECK (deletion_status IN ('active','pending_delete','archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Index for active products
CREATE INDEX IF NOT EXISTS idx_products_active
  ON public.products(productid, supplier_id)
  WHERE deletion_status = 'active' AND is_active = true;

-- 4. Trigger to prevent new sales for non-active products
CREATE OR REPLACE FUNCTION public.assert_product_active()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_status text; BEGIN
  SELECT deletion_status INTO v_status FROM public.products WHERE productid = NEW.product_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Producto % no existe', NEW.product_id;
  END IF;
  IF v_status <> 'active' THEN
    RAISE EXCEPTION 'Producto % no disponible (estado=%)', NEW.product_id, v_status;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assert_product_active ON public.product_sales;
CREATE TRIGGER trg_assert_product_active
BEFORE INSERT ON public.product_sales
FOR EACH ROW EXECUTE FUNCTION public.assert_product_active();

-- 5. RPC for deletion (v1)
CREATE OR REPLACE FUNCTION public.request_delete_product_v1(
  p_product_id uuid,
  p_supplier_id uuid
) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  v_has_sales boolean;
  v_has_requests boolean;
  v_has_orders boolean;
  v_thumb text;
BEGIN
  -- Lock & ownership
  PERFORM 1 FROM public.products
   WHERE productid = p_product_id
     AND supplier_id = p_supplier_id
     AND deletion_status = 'active'
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No existe o ya procesado');
  END IF;

  -- Blocking dependencies (carts intentionally ignored)
  SELECT EXISTS(SELECT 1 FROM public.product_sales WHERE product_id = p_product_id) INTO v_has_sales;
  SELECT EXISTS(SELECT 1 FROM public.request_products WHERE product_id = p_product_id) INTO v_has_requests;
  -- Optional: scan orders.items JSON (may be heavy). Using LIKE for simplicity.
  SELECT EXISTS(
    SELECT 1 FROM public.orders o
    WHERE o.items::text LIKE '%' || p_product_id::text || '%'
      AND o.status NOT IN ('cancelled','refunded','failed')
  ) INTO v_has_orders;

  IF NOT v_has_sales AND NOT v_has_requests AND NOT v_has_orders THEN
    -- Physical delete path
    DELETE FROM public.cart_items WHERE product_id = p_product_id; -- clear carts referencing the product
    DELETE FROM public.product_delivery_regions WHERE product_id = p_product_id;
    DELETE FROM public.product_quantity_ranges  WHERE product_id = p_product_id;
    -- Collect images (optional for edge cleanup) BEFORE delete (not stored here to keep function pure)
    DELETE FROM public.product_images          WHERE product_id = p_product_id;
    DELETE FROM public.products                WHERE productid   = p_product_id;
    RETURN jsonb_build_object('success', true, 'action', 'deleted');
  ELSE
    -- Soft delete path
    SELECT thumbnails->>'40x40'
      INTO v_thumb
    FROM public.product_images
    WHERE product_id = p_product_id
      AND thumbnails ? '40x40'
    ORDER BY image_order ASC
    LIMIT 1;

    UPDATE public.products
      SET is_active = false,
          deletion_status = 'pending_delete',
          deletion_requested_at = now(),
          safe_delete_after = now() + interval '90 days',
          tiny_thumbnail_url = COALESCE(v_thumb, tiny_thumbnail_url)
    WHERE productid = p_product_id;

    -- Remove ancillary data
    DELETE FROM public.product_delivery_regions WHERE product_id = p_product_id;
    DELETE FROM public.product_quantity_ranges  WHERE product_id = p_product_id;
    DELETE FROM public.product_images           WHERE product_id = p_product_id; -- all images purged (tiny stored in products)

    RETURN jsonb_build_object('success', true, 'action', 'soft_deleted');
  END IF;
END $$;

-- Grants (adjust roles as needed)
-- GRANT EXECUTE ON FUNCTION public.request_delete_product_v1(uuid, uuid) TO authenticated, service_role;
