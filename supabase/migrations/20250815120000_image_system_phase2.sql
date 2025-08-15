-- IMAGE SYSTEM PHASE 2 (Advisory Lock + Constraints + updated_at)
-- Fecha: 2025-08-15
-- Objetivo: Implementar pasos 1 y 5 del plan (RPC con advisory lock, columna updated_at, trigger, CHECK, FK CASCADE).
-- Idempotente donde es factible.

-- 1. Columna updated_at (si no existe) con default para nuevas filas
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Función trigger para mantener updated_at
CREATE OR REPLACE FUNCTION set_product_images_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

-- 3. Re-crear trigger (garantizar nombre estándar)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_product_images_updated_at') THEN
    DROP TRIGGER trg_product_images_updated_at ON product_images;
  END IF;
  CREATE TRIGGER trg_product_images_updated_at
  BEFORE UPDATE ON product_images
  FOR EACH ROW EXECUTE FUNCTION set_product_images_updated_at();
END $$;

-- 4. Backfill updated_at en filas existentes (solo nulos)
UPDATE product_images SET updated_at = COALESCE(updated_at, created_at, now()) WHERE updated_at IS NULL;

-- 5. Constraint CHECK (image_order >= 0)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.product_images'::regclass
      AND contype = 'c'
      AND conname = 'chk_product_images_image_order_nonneg'
  ) THEN
    ALTER TABLE product_images
      ADD CONSTRAINT chk_product_images_image_order_nonneg CHECK (image_order >= 0);
  END IF;
END $$;

-- 6. Asegurar FK product_id tiene ON DELETE CASCADE (re-crear sólo si falta)
DO $$
DECLARE
  fk_name text;
  needs_change boolean := false;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'product_images'
    AND c.contype = 'f'
    AND pg_get_constraintdef(c.oid) LIKE 'FOREIGN KEY (product_id)%products%';

  IF fk_name IS NOT NULL THEN
    -- Correct alias usage (c2) to inspect existing FK definition
    SELECT NOT (pg_get_constraintdef(c2.oid) ILIKE '%ON DELETE CASCADE%')
      INTO needs_change
    FROM pg_constraint c2
    WHERE c2.conname = fk_name;
  END IF;

  IF fk_name IS NOT NULL AND needs_change THEN
    EXECUTE format('ALTER TABLE product_images DROP CONSTRAINT %I', fk_name);
  END IF;

  IF fk_name IS NULL OR needs_change THEN
    ALTER TABLE product_images
      ADD CONSTRAINT product_images_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES products(productid) ON DELETE CASCADE;
  END IF;
END $$;

-- 7. Reemplazar función insert_image_with_order con advisory lock
CREATE OR REPLACE FUNCTION insert_image_with_order(
  p_product_id uuid,
  p_image_url text,
  p_supplier_id uuid
) RETURNS integer AS $$
DECLARE
  v_next integer;
BEGIN
  -- Serializa concurrentes por product_id
  PERFORM pg_advisory_xact_lock(hashtext(p_product_id::text));

  SELECT COALESCE(MAX(image_order), -1) + 1
    INTO v_next
  FROM product_images
  WHERE product_id = p_product_id; -- FOR UPDATE no requerido con advisory lock

  INSERT INTO product_images (product_id, image_url, image_order)
  VALUES (p_product_id, p_image_url, v_next);

  RETURN v_next;
END;$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION insert_image_with_order(uuid, text, uuid) IS 'Inserta imagen con orden garantizando serialización vía advisory lock.';

-- 8. Asegurar updated_at NOT NULL tras backfill
DO $$
BEGIN
  BEGIN
    ALTER TABLE product_images ALTER COLUMN updated_at SET NOT NULL;
  EXCEPTION WHEN others THEN NULL; END;
END $$;

-- FIN FASE 2
