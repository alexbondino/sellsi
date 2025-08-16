-- CONSOLIDATED MIGRATION: adds column thumbnail_signature + function replace_product_images_preserve_thumbs
-- Previous separate files: add_thumbnail_signature.sql + replace_product_images_preserve_thumbs.sql
-- Idempotent where possible.

BEGIN;

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS thumbnail_signature text; -- basename de la imagen principal (image_order=0)

COMMENT ON COLUMN public.product_images.thumbnail_signature IS 'Basename (filename) de la imagen principal usado para validar si los thumbnails corresponden a la versión actual.';

-- Function: replace_product_images_preserve_thumbs
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
  v_preserve boolean := false;
  v_old_basename text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_product_id::text)::bigint);

  SELECT id, image_url, thumbnails, thumbnail_url, thumbnail_signature
    INTO v_old_main
    FROM public.product_images
   WHERE product_id = p_product_id AND image_order = 0;

  IF array_length(p_image_urls,1) IS NOT NULL AND array_length(p_image_urls,1) > 0 THEN
    v_new_main_basename := regexp_replace(split_part(p_image_urls[1], '/', array_length(string_to_array(p_image_urls[1], '/'),1)), '\?.*$', '');
  END IF;

  IF v_old_main IS NOT NULL AND v_old_main.thumbnail_signature IS NOT NULL THEN
    -- Extraer basename viejo
    v_old_basename := regexp_replace(split_part(v_old_main.image_url, '/', array_length(string_to_array(v_old_main.image_url, '/'),1)), '\?.*$', '');
    IF v_old_basename = v_new_main_basename THEN
      v_preserve := true; -- misma imagen principal (basename)
    END IF;
  END IF;

  DELETE FROM public.product_images WHERE product_id = p_product_id;

  FOREACH v_url IN ARRAY p_image_urls LOOP
    INSERT INTO public.product_images(product_id, image_url, image_order, created_at, updated_at,
      thumbnails, thumbnail_url, thumbnail_signature)
    VALUES (
      p_product_id, v_url, v_idx, now(), now(),
      CASE WHEN v_preserve THEN v_old_main.thumbnails ELSE NULL END,
      CASE WHEN v_preserve THEN v_old_main.thumbnail_url ELSE NULL END,
      CASE WHEN v_preserve THEN v_old_main.thumbnail_signature ELSE NULL END
    );
    v_idx := v_idx + 1;
  END LOOP;

  RETURN QUERY
    SELECT * FROM public.product_images WHERE product_id = p_product_id ORDER BY image_order;
END;$$;

COMMENT ON FUNCTION public.replace_product_images_preserve_thumbs(uuid, uuid, text[]) IS 'Reemplaza imágenes preservando thumbnails/signature si la nueva main comparte basename con la anterior.';

COMMIT;

-- Rollback manual steps:
--   DROP FUNCTION IF EXISTS public.replace_product_images_preserve_thumbs(uuid, uuid, text[]);
--   ALTER TABLE public.product_images DROP COLUMN IF EXISTS thumbnail_signature;
