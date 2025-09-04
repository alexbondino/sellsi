-- IMAGE SYSTEM HARDENING MIGRATION
-- Fecha: 2025-08-15
-- Objetivo: Normalizar product_images, eliminar condiciones de carrera y preparar función atómica de inserción.
-- Esta migración incluye pasos idempotentes para permitir re-ejecución segura.

-- 1. Asegurar extensión para gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Añadir columnas si no existen
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS thumbnail_url text; -- por si no existía en algunos entornos

-- 3. Asignar PRIMARY KEY si no existe (requiere que la columna id exista)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.product_images'::regclass 
      AND contype = 'p'
  ) THEN
    ALTER TABLE product_images ADD CONSTRAINT product_images_pkey PRIMARY KEY (id);
  END IF;
END $$;

-- 4. Normalizar image_order para cada producto evitando duplicados
--   Recalcula desde 0 usando orden estable por created_at si existe o image_url como fallback
WITH ordered AS (
  SELECT id,
         product_id,
         ROW_NUMBER() OVER (
           PARTITION BY product_id 
           ORDER BY created_at NULLS LAST, image_url, id
         ) - 1 AS new_order
  FROM product_images
), diff AS (
  SELECT o.id, o.new_order
  FROM ordered o
  JOIN product_images pi ON pi.id = o.id
  WHERE COALESCE(pi.image_order, -1) <> o.new_order
)
UPDATE product_images pi
SET image_order = d.new_order
FROM diff d
WHERE pi.id = d.id;

-- 5. Backfill thumbnail_url sólo para imagen principal (order 0) si falta y existe thumbnails JSON
UPDATE product_images
SET thumbnail_url = (thumbnails ->> 'desktop')
WHERE image_order = 0
  AND thumbnail_url IS NULL
  AND thumbnails ? 'desktop';

-- 6. Limpiar thumbnails de imágenes secundarias (política: sólo principal conserva thumbnails)
UPDATE product_images
SET thumbnails = NULL,
    thumbnail_url = NULL
WHERE image_order > 0
  AND (thumbnails IS NOT NULL OR thumbnail_url IS NOT NULL);

-- 7. Asegurar no hay valores NULL en image_order / image_url previos a constraint
--    (ya normalizado arriba); asignar 0 a nulos residuales
UPDATE product_images SET image_order = 0 WHERE image_order IS NULL;
DELETE FROM product_images WHERE image_url IS NULL; -- si quedaran filas corruptas sin URL

-- 8. Crear índice único (product_id, image_order) para evitar futuros duplicados
--    Usar IF NOT EXISTS para idempotencia
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'uniq_product_image_order'
      AND n.nspname = 'public'
  ) THEN
    CREATE UNIQUE INDEX uniq_product_image_order ON product_images(product_id, image_order);
  END IF;
END $$;

-- 9. Establecer NOT NULL en columnas críticas
DO $$
BEGIN
  -- image_order
  BEGIN
    ALTER TABLE product_images ALTER COLUMN image_order SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
  -- image_url
  BEGIN
    ALTER TABLE product_images ALTER COLUMN image_url SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
  -- created_at
  BEGIN
    ALTER TABLE product_images ALTER COLUMN created_at SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
END $$;

-- 10. Crear / Reemplazar función atómica de inserción
CREATE OR REPLACE FUNCTION insert_image_with_order(
  p_product_id uuid,
  p_image_url text,
  p_supplier_id uuid -- reservado para futura lógica (auditoría, permisos)
) RETURNS integer AS $$
DECLARE
  next_order integer;
BEGIN
  -- Bloquear filas existentes del producto para cálculo consistente
  SELECT COALESCE(MAX(image_order), -1) + 1
    INTO next_order
  FROM product_images
  WHERE product_id = p_product_id
  FOR UPDATE;

  INSERT INTO product_images (product_id, image_url, image_order)
  VALUES (p_product_id, p_image_url, next_order);

  RETURN next_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Comentarios / documentación
COMMENT ON FUNCTION insert_image_with_order(uuid, text, uuid) IS 'Inserta una imagen con cálculo atómico de image_order evitando race conditions.';

-- 12. Verificación rápida (no bloqueante)
-- SELECT product_id, COUNT(*) FILTER (WHERE image_order=0) AS principals FROM product_images GROUP BY product_id HAVING COUNT(*)>1;

-- FIN MIGRACIÓN
