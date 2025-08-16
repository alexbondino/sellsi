-- Robustecimiento de manejo de imágenes (copied, new timestamp)
-- 1. Eliminar duplicados existentes (misma URL por producto)
WITH dups AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY product_id, image_url ORDER BY created_at, id) AS rn
  FROM public.product_images
)
DELETE FROM public.product_images
WHERE id IN (SELECT id FROM dups WHERE rn > 1);

-- 2. (Opcional) Re-normalizar image_order secuencial por producto
WITH reordered AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY image_order, created_at, id) - 1 AS new_order
  FROM public.product_images
)
UPDATE public.product_images p
SET image_order = r.new_order
FROM reordered r
WHERE p.id = r.id AND p.image_order <> r.new_order;

-- 3. Índice único para asegurar un solo main (image_order=0) por producto
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_images_main
  ON public.product_images(product_id)
  WHERE image_order = 0;

-- 4. Constraint única (producto + URL) para evitar duplicados exactos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_images_unique_product_url'
  ) THEN
    ALTER TABLE public.product_images
      ADD CONSTRAINT product_images_unique_product_url UNIQUE (product_id, image_url);
  END IF;
END$$;

-- 5. Función transaccional para reemplazar todas las imágenes de un producto
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
  -- SERIALIZAR por product_id usando advisory lock para evitar carreras entre clientes
  PERFORM pg_advisory_xact_lock(hashtext(p_product_id::text)::bigint);

  -- Borrar existentes de forma transaccional (la función corre dentro de una transacción)
  DELETE FROM public.product_images WHERE product_id = p_product_id;

  -- Insertar nuevas en orden
  FOREACH v_url IN ARRAY p_image_urls LOOP
    INSERT INTO public.product_images(product_id, image_url, image_order, created_at, updated_at)
    VALUES (p_product_id, v_url, v_idx, now(), now());
    v_idx := v_idx + 1;
  END LOOP;

  -- Devolver filas insertadas en orden para compatibilidad con RPC callers
  RETURN QUERY
    SELECT * FROM public.product_images WHERE product_id = p_product_id ORDER BY image_order;
END;$$;

-- Nota: Esta función se creó con SECURITY DEFINER para que pueda ejecutarse aun cuando exista RLS
-- en la tabla `product_images`. Asegúrate que el owner/role de la función tenga permisos
-- adecuados (p.e. rol admin) y que las políticas RLS permitan la operación si no se desea usar
-- SECURITY DEFINER. Si prefieres no usar SECURITY DEFINER, elimina esa clausula y asegúrate
-- de añadir políticas RLS que permitan a los suppliers manipular sus propias filas.

-- 6. Comentario para documentación
COMMENT ON FUNCTION public.replace_product_images(uuid, uuid, text[]) IS 'Reemplaza TODAS las imágenes de un producto de forma atómica asignando image_order secuencial (0..n)';
