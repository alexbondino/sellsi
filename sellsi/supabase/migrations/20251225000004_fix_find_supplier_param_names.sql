-- Fix parameter names to match frontend RPC calls
CREATE OR REPLACE FUNCTION find_supplier_by_short_id(
    short_id TEXT,
    expected_name_slug TEXT
) RETURNS SETOF users
LANGUAGE plpgsql
AS $$
DECLARE
    supplier_record users%ROWTYPE;
    normalized_name TEXT;
BEGIN
    -- Normalize the expected name the same way as frontend
    normalized_name := LOWER(REGEXP_REPLACE(expected_name_slug, '[^a-z0-9]', '', 'g'));
    
    -- Strategy 1: Try exact UUID match
    BEGIN
        SELECT * INTO supplier_record
        FROM users
        WHERE user_id::TEXT = short_id
            AND main_supplier = true
            AND LOWER(REGEXP_REPLACE(user_nm, '[^a-z0-9]', '', 'g')) = normalized_name;
        
        IF FOUND THEN
            RETURN NEXT supplier_record;
            RETURN;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Continue to next strategy
    END;
    
    -- Strategy 2: Try prefix match on user_id
    FOR supplier_record IN
        SELECT *
        FROM users
        WHERE user_id::TEXT LIKE short_id || '%'
            AND main_supplier = true
            AND LOWER(REGEXP_REPLACE(user_nm, '[^a-z0-9]', '', 'g')) = normalized_name
        LIMIT 1
    LOOP
        RETURN NEXT supplier_record;
        RETURN;
    END LOOP;
    
    -- Strategy 3: Find via products table
    FOR supplier_record IN
        SELECT DISTINCT u.*
        FROM products p
        INNER JOIN users u ON p.user_id = u.user_id
        WHERE p.product_id::TEXT LIKE short_id || '%'
            AND u.main_supplier = true
            AND LOWER(REGEXP_REPLACE(u.user_nm, '[^a-z0-9]', '', 'g')) = normalized_name
        LIMIT 1
    LOOP
        RETURN NEXT supplier_record;
        RETURN;
    END LOOP;
    
    -- No match found
    RETURN;
END;
$$;
