 a-- Fix function return types to match actual database column types
-- The issue was TEXT vs CHARACTER VARYING mismatch

DROP FUNCTION IF EXISTS find_supplier_by_short_id(TEXT, TEXT);

CREATE OR REPLACE FUNCTION find_supplier_by_short_id(
  short_id TEXT,
  expected_name_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  user_nm CHARACTER VARYING,
  logo_url CHARACTER VARYING,
  main_supplier BOOLEAN,
  descripcion_proveedor CHARACTER VARYING,
  verified BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_normalized_slug TEXT;
BEGIN
  -- Normalize: lowercase + remove all non-alphanumeric (matches frontend)
  v_normalized_slug := LOWER(REGEXP_REPLACE(COALESCE(expected_name_slug, ''), '[^a-z0-9]', '', 'g'));

  -- Try exact UUID match first (for full URLs)
  BEGIN
    RETURN QUERY
    SELECT u.user_id, u.user_nm, u.logo_url, u.main_supplier, u.descripcion_proveedor, u.verified
    FROM users u
    WHERE u.user_id::TEXT = short_id
      AND u.main_supplier = true  -- Only suppliers
      AND u.verified = true        -- Only verified
      AND (
        expected_name_slug IS NULL OR  -- If no name provided, skip validation
        LOWER(REGEXP_REPLACE(u.user_nm, '[^a-z0-9]', '', 'g')) = v_normalized_slug
      )
    LIMIT 1;
    
    IF FOUND THEN
      RETURN;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- If exact match fails (invalid UUID format), continue to prefix search
  END;

  -- Try prefix match on user_id (cast to text for LIKE)
  -- CRITICAL: Also validate name slug to prevent collision mismatch
  RETURN QUERY
  SELECT u.user_id, u.user_nm, u.logo_url, u.main_supplier, u.descripcion_proveedor, u.verified
  FROM users u
  WHERE u.user_id::TEXT LIKE short_id || '%'
    AND u.main_supplier = true  -- Only suppliers
    AND (
      expected_name_slug IS NULL OR  -- If no name provided, skip validation
      LOWER(REGEXP_REPLACE(u.user_nm, '[^a-z0-9]', '', 'g')) = v_normalized_slug
    )
  ORDER BY 
    u.verified DESC,              -- Verified suppliers first
    u.user_id ASC                 -- Deterministic ordering (oldest UUID first)
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  -- Try to find via products table (for suppliers without direct match)
  RETURN QUERY
  SELECT u.user_id, u.user_nm, u.logo_url, u.main_supplier, u.descripcion_proveedor, u.verified
  FROM users u
  WHERE u.user_id IN (
    SELECT p.supplier_id
    FROM products p
    WHERE p.supplier_id::TEXT LIKE short_id || '%'
      AND p.is_active = true       -- Only active products
    ORDER BY p.createddt DESC       -- Most recent products first
    LIMIT 1
  )
    AND u.main_supplier = true
    AND u.verified = true
    AND (
      expected_name_slug IS NULL OR  -- If no name provided, skip validation
      LOWER(REGEXP_REPLACE(u.user_nm, '[^a-z0-9]', '', 'g')) = v_normalized_slug
    )
  LIMIT 1;

  RETURN;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION find_supplier_by_short_id(TEXT, TEXT) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION find_supplier_by_short_id IS 'Finds a supplier by short ID (4+ char prefix of UUID) with name validation. Uses simple normalization: lowercase + alphanumeric only. Fixed types to match database.';
