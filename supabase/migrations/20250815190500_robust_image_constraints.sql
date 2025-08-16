-- Robustecimiento de manejo de imágenes (robust_image_constraints)
-- 1) Eliminar duplicados exactos (mismo product_id + image_url)
WITH dups AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY product_id, image_url ORDER BY created_at, id) AS rn
  FROM public.product_images
)
DELETE FROM public.product_images
WHERE id IN (SELECT id FROM dups WHERE rn > 1);

-- 2) Re-normalizar image_order secuencial por producto (0..n)
WITH reordered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY COALESCE(image_order, 0), created_at, id) - 1 AS new_order
  FROM public.product_images
)
UPDATE public.product_images p
SET image_order = r.new_order
FROM reordered r
WHERE p.id = r.id AND p.image_order IS DISTINCT FROM r.new_order;

-- 3) Asegurar que sólo exista una imagen principal (image_order = 0) por producto
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_images_main
  ON public.product_images(product_id)
  WHERE image_order = 0;

-- 4) Constraint única (product_id, image_url) para evitar duplicados exactos a nivel DB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_images_unique_product_url'
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_unique_product_url UNIQUE (product_id, image_url);
  END IF;
END$$;

-- 5) Función transaccional para reemplazar todas las imágenes de un producto de forma atómica.
--    Usa pg_advisory_xact_lock para serializar por product_id y evita races entre clientes.
CREATE OR REPLACE FUNCTION public.replace_product_images(
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
BEGIN
  -- Lock por product_id para evitar condiciones de carrera en reemplazos simultáneos
  PERFORM pg_advisory_xact_lock(hashtext(p_product_id::text)::bigint);

  -- Borrar las filas existentes del producto
  DELETE FROM public.product_images WHERE product_id = p_product_id;

  -- Insertar las nuevas URLs respetando el orden recibido (0..n)
  FOREACH v_url IN ARRAY p_image_urls LOOP
    INSERT INTO public.product_images(product_id, image_url, image_order, created_at, updated_at)
    VALUES (p_product_id, v_url, v_idx, now(), now());
    v_idx := v_idx + 1;
  END LOOP;

  -- Devolver las filas insertadas para que el caller RPC tenga la lista
  RETURN QUERY
    SELECT * FROM public.product_images WHERE product_id = p_product_id ORDER BY image_order;
END;$$;

COMMENT ON FUNCTION public.replace_product_images(uuid, uuid, text[]) IS
  'Reemplaza TODAS las imágenes de un producto de forma atómica asignando image_order secuencial (0..n).';
