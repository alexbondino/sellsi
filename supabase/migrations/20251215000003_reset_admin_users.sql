-- Migration: Reset Admin Users
-- Description: Deletes all existing admin users and creates a new default admin user.
-- Handles foreign key constraints by cleaning up or nullifying references.

BEGIN;

-- 0. Ensure pgcrypto extension is available for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Clean up dependent tables that require admin_id (NOT NULL)
-- These tables store session and audit data which will be invalid without the user.
DELETE FROM public.admin_sessions;
DELETE FROM public.admin_audit_log;

-- 2. Nullify references in tables where admin_id is nullable
-- This preserves the records but removes the link to the deleted admin.
UPDATE public.banned_ips SET banned_by = NULL;
UPDATE public.payment_releases SET released_by_admin_id = NULL;
UPDATE public.control_panel SET procesado_por = NULL;

-- 3. Delete all existing admin users
-- Note: admin_trusted_devices has ON DELETE CASCADE, so it will be cleaned up automatically.
DELETE FROM public.control_panel_users;

-- 4. Insert the new admin user
-- Usuario: adminsellsi
-- Contraseña: Se115si9@K
INSERT INTO public.control_panel_users (
    usuario,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    twofa_required,
    twofa_configured,
    created_at,
    updated_at
) VALUES (
    'adminsellsi',
    'admin@sellsi.com',
    crypt('Se115si9@K', gen_salt('bf')),
    'Admin Sellsi',
    'admin',
    true,
    true,  -- Require 2FA setup on next login
    false, -- 2FA not yet configured
    now(),
    now()
);

COMMIT;
