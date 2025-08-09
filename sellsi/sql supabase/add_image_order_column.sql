-- Agregar columna para mantener orden de imágenes
ALTER TABLE public.product_images 
ADD COLUMN image_order INTEGER DEFAULT 0;

-- Actualizar imágenes existentes con orden basado en la URL (temporal)
UPDATE public.product_images 
SET image_order = (
  SELECT ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY image_url) - 1
  FROM (
    SELECT DISTINCT product_id, image_url 
    FROM public.product_images
  ) AS ordered_images 
  WHERE ordered_images.product_id = product_images.product_id 
    AND ordered_images.image_url = product_images.image_url
);

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_product_images_order 
ON public.product_images(product_id, image_order);
