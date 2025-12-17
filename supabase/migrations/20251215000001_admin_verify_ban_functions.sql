-- ================================================
-- Migration: Admin User Verification and Ban Functions
-- ================================================
-- Creates SECURITY DEFINER functions to allow admin panel to:
-- 1. Verify/unverify users
-- 2. Ban/unban users (updating existing functions)
--
-- These functions bypass RLS restrictions on the users table
-- allowing authenticated admins to modify user status.
-- ================================================

BEGIN;

-- ================================================
-- DROP existing functions if they exist
-- ================================================
DROP FUNCTION IF EXISTS public.verify_user(uuid, uuid);
DROP FUNCTION IF EXISTS public.unverify_user(uuid, uuid);
DROP FUNCTION IF EXISTS public.ban_user(uuid, text);
DROP FUNCTION IF EXISTS public.unban_user(uuid, text);

-- ================================================
-- VERIFY USER
-- ================================================
-- Marks a user as verified
-- @param target_user_id - UUID of the user to verify
-- @param admin_user_id - UUID of the admin performing the action
-- @returns boolean - TRUE if successful, FALSE if user not found
-- ================================================
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
  UPDATE public.users
  SET 
    verified = true,
    verified_at = now(),
    verified_by = admin_user_id,
    updatedt = now()
  WHERE user_id = target_user_id
    AND verified = false;  -- Only verify if not already verified
  
  RETURN FOUND;
END;
$$;

ALTER FUNCTION public.verify_user(uuid, uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.verify_user(uuid, uuid) IS 
'Admin function to verify a user. Bypasses RLS restrictions.';

-- ================================================
-- UNVERIFY USER
-- ================================================
-- Removes verification status from a user
-- @param target_user_id - UUID of the user to unverify
-- @param admin_user_id - UUID of the admin performing the action
-- @returns boolean - TRUE if successful, FALSE if user not found
-- ================================================
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
  UPDATE public.users
  SET 
    verified = false,
    verified_at = NULL,
    verified_by = NULL,
    updatedt = now()
  WHERE user_id = target_user_id
    AND verified = true;  -- Only unverify if currently verified
  
  RETURN FOUND;
END;
$$;

ALTER FUNCTION public.unverify_user(uuid, uuid) OWNER TO postgres;

COMMENT ON FUNCTION public.unverify_user(uuid, uuid) IS 
'Admin function to remove verification from a user. Bypasses RLS restrictions.';

-- ================================================
-- BAN USER (updated with SECURITY DEFINER)
-- ================================================
-- Bans a user from the platform
-- @param target_user_id - UUID of the user to ban
-- @param admin_reason - Reason for the ban
-- @returns boolean - TRUE if successful, FALSE if user not found
-- ================================================
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

COMMENT ON FUNCTION public.ban_user(uuid, text) IS 
'Admin function to ban a user. Bypasses RLS restrictions.';

-- ================================================
-- UNBAN USER (updated with SECURITY DEFINER)
-- ================================================
-- Removes ban status from a user
-- @param target_user_id - UUID of the user to unban
-- @param admin_reason - Reason for removing the ban (for audit trail)
-- @returns boolean - TRUE if successful, FALSE if user not found
-- ================================================
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

COMMENT ON FUNCTION public.unban_user(uuid, text) IS 
'Admin function to unban a user. Bypasses RLS restrictions.';

COMMIT;
