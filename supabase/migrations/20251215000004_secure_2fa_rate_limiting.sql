-- Migration: Secure 2FA Rate Limiting
-- Description: Adds table and functions to handle rate limiting for admin authentication securely in the database.

BEGIN;

-- 1. Create table for tracking auth attempts
CREATE TABLE IF NOT EXISTS public.admin_auth_attempts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id uuid NOT NULL REFERENCES public.control_panel_users(id) ON DELETE CASCADE,
    attempted_at timestamptz DEFAULT now(),
    success boolean NOT NULL,
    ip_address text,
    action text DEFAULT '2fa_verify'
);

-- 2. Index for fast lookups (critical for performance)
CREATE INDEX IF NOT EXISTS idx_admin_auth_attempts_admin_time 
ON public.admin_auth_attempts(admin_id, attempted_at);

-- 3. Function to check rate limit
-- Returns JSON to be easily consumed by Edge Function
CREATE OR REPLACE FUNCTION public.check_admin_rate_limit(
    p_admin_id uuid,
    p_ip_address text,
    p_action text DEFAULT '2fa_verify'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_failures_admin_ip int;
    v_failures_ip int;
    v_window interval := interval '15 minutes';
    v_limit int := 5;
BEGIN
    -- Fail-secure on missing IP
    IF p_ip_address IS NULL OR length(trim(p_ip_address)) = 0 THEN
        RETURN json_build_object('allowed', false, 'error', 'Rate limit check requires IP');
    END IF;

    -- Count failed attempts for this admin+ip
    SELECT COUNT(*) INTO v_failures_admin_ip
    FROM public.admin_auth_attempts
    WHERE admin_id = p_admin_id
      AND success = false
      AND action = p_action
      AND ip_address = p_ip_address
      AND attempted_at > now() - v_window;

    -- Count failed attempts for this IP across admins (basic bot defense)
    SELECT COUNT(*) INTO v_failures_ip
    FROM public.admin_auth_attempts
    WHERE success = false
      AND action = p_action
      AND ip_address = p_ip_address
      AND attempted_at > now() - v_window;

    IF v_failures_admin_ip >= v_limit OR v_failures_ip >= (v_limit * 5) THEN
        RETURN json_build_object(
            'allowed', false,
            'error', 'Rate limit exceeded'
        );
    END IF;

    RETURN json_build_object('allowed', true);
END;
$$;

-- 4. Function to log attempt
CREATE OR REPLACE FUNCTION public.log_admin_auth_attempt(
    p_admin_id uuid,
    p_success boolean,
    p_ip_address text,
    p_action text DEFAULT '2fa_verify'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.admin_auth_attempts (admin_id, success, ip_address, action)
    VALUES (p_admin_id, p_success, p_ip_address, p_action);
END;
$$;

-- 5. Grant permissions
-- Only service_role should call these (Edge Function uses SUPABASE_SERVICE_ROLE_KEY)
GRANT EXECUTE ON FUNCTION public.check_admin_rate_limit(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_admin_auth_attempt(uuid, boolean, text, text) TO service_role;

COMMIT;
