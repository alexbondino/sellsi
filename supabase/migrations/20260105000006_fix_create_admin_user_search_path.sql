-- ========================================
-- MIGRACIÓN: Corregir TODAS las funciones de bcrypt
-- Fecha: 2026-01-05
-- Propósito: Usar nombres de esquema explícitos (extensions.crypt, extensions.gen_salt)
-- ========================================
-- PROBLEMA: pgcrypto está en schema 'extensions', pero las funciones con
--           SET search_path = public no pueden ver ese esquema.
-- SOLUCIÓN: Usar extensions.crypt() y extensions.gen_salt() con esquema explícito.

-- 1. Corregir create_admin_user
CREATE OR REPLACE FUNCTION create_admin_user(
  p_username TEXT,
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT DEFAULT 'admin',
  p_notes TEXT DEFAULT NULL,
  p_creator_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  usuario TEXT,
  email TEXT,
  full_name TEXT,
  role TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Mantener search_path público para seguridad
AS $$
DECLARE
  v_admin_count INTEGER;
BEGIN
  -- Contar admins existentes (prefijos para evitar ambigüedad)
  SELECT COUNT(*) INTO v_admin_count
  FROM control_panel_users
  WHERE control_panel_users.role = 'admin' AND control_panel_users.is_active = true;

  -- Si hay admins existentes, validar que el creador es admin
  IF v_admin_count > 0 THEN
    IF p_creator_id IS NULL THEN
      RAISE EXCEPTION 'Se requiere autenticación de administrador para crear nuevos usuarios';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM control_panel_users 
      WHERE control_panel_users.id = p_creator_id 
        AND control_panel_users.role = 'admin' 
        AND control_panel_users.is_active = true
    ) THEN
      RAISE EXCEPTION 'Solo administradores activos pueden crear nuevos usuarios';
    END IF;
  END IF;

  -- Validar que el email no exista
  IF EXISTS (SELECT 1 FROM control_panel_users WHERE control_panel_users.email = p_email) THEN
    RAISE EXCEPTION 'El email ya está registrado';
  END IF;

  -- Validar que el username no exista
  IF EXISTS (SELECT 1 FROM control_panel_users WHERE control_panel_users.usuario = p_username) THEN
    RAISE EXCEPTION 'El usuario ya está registrado';
  END IF;

  -- Insertar nuevo usuario con password hasheado con bcrypt
  -- CRÍTICO: Usar extensions.crypt() y extensions.gen_salt() con esquema explícito
  RETURN QUERY
  INSERT INTO control_panel_users (
    usuario,
    email,
    password_hash,
    full_name,
    role,
    is_active,
    created_by,
    notes,
    twofa_required,
    twofa_configured,
    needs_password_change
  ) VALUES (
    p_username,
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),  -- ← ESQUEMA EXPLÍCITO
    p_full_name,
    p_role,
    true,
    p_creator_id,
    p_notes,
    false,
    false,
    false
  )
  RETURNING 
    control_panel_users.id,
    control_panel_users.usuario,
    control_panel_users.email,
    control_panel_users.full_name,
    control_panel_users.role,
    control_panel_users.is_active,
    control_panel_users.created_at;
END;
$$;

COMMENT ON FUNCTION create_admin_user IS 'Crea un nuevo usuario administrador con password hasheado usando bcrypt. Usa extensions.crypt() y extensions.gen_salt() con esquema explícito para evitar problemas de search_path.';

-- 2. Corregir generate_password_hash
CREATE OR REPLACE FUNCTION generate_password_hash(p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Usar extensions.crypt y extensions.gen_salt con esquema explícito
  RETURN extensions.crypt(p_password, extensions.gen_salt('bf', 10));
END;
$$;

COMMENT ON FUNCTION generate_password_hash IS 'Genera hash bcrypt de una contraseña usando extensions.crypt y extensions.gen_salt. Usada por admin-2fa Edge Function.';

-- 3. Corregir verify_admin_password
CREATE OR REPLACE FUNCTION verify_admin_password(
  p_admin_id UUID,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_password_hash TEXT;
  v_is_valid BOOLEAN;
BEGIN
  -- Obtener el hash de la contraseña del admin
  SELECT password_hash INTO v_password_hash
  FROM control_panel_users
  WHERE id = p_admin_id AND is_active = true;
  
  -- Si no existe el admin o no está activo, retornar false
  IF v_password_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si es hash bcrypt (empieza con $2)
  IF v_password_hash LIKE '$2%' THEN
    -- Usar extensions.crypt con esquema explícito
    v_is_valid := (v_password_hash = extensions.crypt(p_password, v_password_hash));
  ELSE
    -- Si es base64 u otro formato, retornar false
    v_is_valid := FALSE;
  END IF;
  
  RETURN v_is_valid;
END;
$$;

COMMENT ON FUNCTION verify_admin_password IS 'Verifica la contraseña de un administrador usando extensions.crypt. Retorna true si es válida, false si no.';
