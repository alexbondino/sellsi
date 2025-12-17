-- ================================================
-- Migration: Fix admin user operations (verify/ban)
-- ================================================
-- Problem: Trigger blocks admin columns (verified, banned, etc.)
-- Solution: 
--   1. Update trigger to allow admin ops via session variable
--   2. Update admin functions to set that variable
-- ================================================

BEGIN;

-- ================================================
-- PART 1: Update trigger to allow admin operations
-- ================================================
CREATE OR REPLACE FUNCTION public.block_forbidden_user_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Skip validation if this is an admin operation
    IF current_setting('app.admin_operation', true) = 'true' THEN
      RETURN NEW;
    END IF;
    
    -- Regular users can only update these columns
    IF ( to_jsonb(NEW)
           - 'rut' - 'user_nm' - 'phone_nbr' - 'country' - 'logo_url' 
           - 'descripcion_proveedor' - 'document_types' - 'main_supplier' 
           - 'updatedt' - 'last_ip'
         )
       <> 
       ( to_jsonb(OLD)
           - 'rut' - 'user_nm' - 'phone_nbr' - 'country' - 'logo_url' 
           - 'descripcion_proveedor' - 'document_types' - 'main_supplier' 
           - 'updatedt' - 'last_ip'
       )
    THEN
      RAISE EXCEPTION 'Modificación no permitida: solo se pueden actualizar rut, user_nm, phone_nbr, country, logo_url, descripcion_proveedor, document_types, main_supplier, updatedt, last_ip';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ================================================
-- PART 2: Update admin functions to set session variable
-- ================================================

-- VERIFY USER
CREATE OR REPLACE FUNCTION public.verify_user(
  target_user_id uuid,
  admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.admin_operation', 'true', true);
  
  UPDATE public.users
  SET 
    verified = true,
    verified_at = now(),
    verified_by = admin_user_id,
    updatedt = now()
  WHERE user_id = target_user_id
    AND verified = false;
  
  RETURN FOUND;
END;
$$;

ALTER FUNCTION public.verify_user(uuid, uuid) OWNER TO postgres;

-- UNVERIFY USER
CREATE OR REPLACE FUNCTION public.unverify_user(
  target_user_id uuid,
  admin_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.admin_operation', 'true', true);
  
  UPDATE public.users
  SET 
    verified = false,
    verified_at = NULL,
    verified_by = NULL,
    updatedt = now()
  WHERE user_id = target_user_id
    AND verified = true;
  
  RETURN FOUND;
END;
$$;

ALTER FUNCTION public.unverify_user(uuid, uuid) OWNER TO postgres;

-- BAN USER
CREATE OR REPLACE FUNCTION public.ban_user(
  target_user_id uuid,
  admin_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.admin_operation', 'true', true);
  
  UPDATE public.users
  SET 
    banned = true,
    banned_at = now(),
    banned_reason = admin_reason,
    updatedt = now()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$;

ALTER FUNCTION public.ban_user(uuid, text) OWNER TO postgres;

-- UNBAN USER
CREATE OR REPLACE FUNCTION public.unban_user(
  target_user_id uuid,
  admin_reason text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('app.admin_operation', 'true', true);
  
  UPDATE public.users
  SET 
    banned = false,
    banned_at = NULL,
    banned_reason = NULL,
    updatedt = now()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$;

ALTER FUNCTION public.unban_user(uuid, text) OWNER TO postgres;

COMMIT;
