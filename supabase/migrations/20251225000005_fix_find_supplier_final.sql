-- FINAL FIX: Corregir nombres de parámetros Y errores en la lógica SQL
-- Problema: PostgREST requiere que los nombres de parámetros coincidan exactamente
-- Frontend llama con "short_id" y "expected_name_slug" (sin prefijo p_)

DROP FUNCTION IF EXISTS find_supplier_by_short_id(TEXT, TEXT);

CREATE OR REPLACE FUNCTION find_supplier_by_short_id(
  short_id TEXT,
  expected_name_slug TEXT DEFAULT NULL
)
RETURNS SETOF users
LANGUAGE plpgsql
SECURITY DEFINER  -- CRÍTICO: Permite que anon ejecute la función
AS $$
DECLARE
  v_normalized_slug TEXT;
  v_result users%ROWTYPE;
BEGIN
  -- Normalize: lowercase + remove all non-alphanumeric (matches frontend)
  v_normalized_slug := LOWER(REGEXP_REPLACE(COALESCE(expected_name_slug, ''), '[^a-z0-9]', '', 'g'));

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
          LOWER(REGEXP_REPLACE(u.user_nm, '[^a-z0-9]', '', 'g')) = v_normalized_slug
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
        LOWER(REGEXP_REPLACE(u.user_nm, '[^a-z0-9]', '', 'g')) = v_normalized_slug
      )
    ORDER BY u.verified DESC, u.user_id ASC
    LIMIT 1
  LOOP
    RETURN NEXT v_result;
    RETURN;
  END LOOP;

  -- Strategy 3: Try to find via products table
  -- FIX: Usar supplier_id (no user_id) y productid (no product_id)
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
        LOWER(REGEXP_REPLACE(u.user_nm, '[^a-z0-9]', '', 'g')) = v_normalized_slug
      )
    LIMIT 1
  LOOP
    RETURN NEXT v_result;
    RETURN;
  END LOOP;

  -- No match found - return empty set
  RETURN;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION find_supplier_by_short_id(TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION find_supplier_by_short_id IS 'Finds supplier by short ID (4 chars) with name validation to prevent collisions. Parameters: short_id, expected_name_slug (no p_ prefix)';
