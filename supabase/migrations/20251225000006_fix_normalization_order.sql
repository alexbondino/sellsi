-- FIX CRÍTICO: Orden correcto de normalización
-- Problema: LOWER(REGEXP_REPLACE()) elimina TODO porque mayúsculas no están en [a-z]
-- Solución: REGEXP_REPLACE(LOWER()) - primero minúsculas, luego eliminar caracteres

DROP FUNCTION IF EXISTS find_supplier_by_short_id(TEXT, TEXT);

CREATE OR REPLACE FUNCTION find_supplier_by_short_id(
  short_id TEXT,
  expected_name_slug TEXT DEFAULT NULL
)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized_slug TEXT;
  v_result users%ROWTYPE;
BEGIN
  -- FIX: Primero LOWER, luego REGEXP_REPLACE
  -- INCORRECTO: LOWER(REGEXP_REPLACE(text, '[^a-z0-9]', '', 'g')) → elimina mayúsculas
  -- CORRECTO:   REGEXP_REPLACE(LOWER(text), '[^a-z0-9]', '', 'g') → convierte primero
  v_normalized_slug := REGEXP_REPLACE(LOWER(COALESCE(expected_name_slug, '')), '[^a-z0-9]', '', 'g');

  -- Strategy 1: Try exact UUID match first (for full URLs)
  BEGIN
    FOR v_result IN
      SELECT *
      FROM users u
      WHERE u.user_id::TEXT = short_id
        AND u.main_supplier = true
        AND u.verified = true
        AND (
          expected_name_slug IS NULL OR
          REGEXP_REPLACE(LOWER(u.user_nm), '[^a-z0-9]', '', 'g') = v_normalized_slug
        )
      LIMIT 1
    LOOP
      RETURN NEXT v_result;
      RETURN;
    END LOOP;
  EXCEPTION WHEN OTHERS THEN
    -- Continue to next strategy
  END;

  -- Strategy 2: Try prefix match on user_id
  FOR v_result IN
    SELECT *
    FROM users u
    WHERE u.user_id::TEXT LIKE short_id || '%'
      AND u.main_supplier = true
      AND (
        expected_name_slug IS NULL OR
        REGEXP_REPLACE(LOWER(u.user_nm), '[^a-z0-9]', '', 'g') = v_normalized_slug
      )
    ORDER BY u.verified DESC, u.user_id ASC
    LIMIT 1
  LOOP
    RETURN NEXT v_result;
    RETURN;
  END LOOP;

  -- Strategy 3: Try to find via products table
  FOR v_result IN
    SELECT u.*
    FROM users u
    WHERE u.user_id IN (
      SELECT p.supplier_id
      FROM products p
      WHERE p.supplier_id::TEXT LIKE short_id || '%'
        AND p.is_active = true
      ORDER BY p.createddt DESC
      LIMIT 1
    )
      AND u.main_supplier = true
      AND u.verified = true
      AND (
        expected_name_slug IS NULL OR
        REGEXP_REPLACE(LOWER(u.user_nm), '[^a-z0-9]', '', 'g') = v_normalized_slug
      )
    LIMIT 1
  LOOP
    RETURN NEXT v_result;
    RETURN;
  END LOOP;

  -- No match found
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION find_supplier_by_short_id(TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION find_supplier_by_short_id IS 'Finds supplier by short ID with correct normalization order: REGEXP_REPLACE(LOWER()) not LOWER(REGEXP_REPLACE())';
