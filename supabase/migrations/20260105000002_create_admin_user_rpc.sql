-- ========================================
-- MIGRACIÓN: Función RPC para crear usuarios admin
-- Fecha: 2026-01-05
-- Propósito: Permitir creación segura de admins desde frontend
-- ========================================

-- Crear función RPC para crear usuarios admin de forma segura
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
SET search_path = public
AS $$
DECLARE
  v_admin_count INTEGER;
BEGIN
  -- Contar admins existentes
  SELECT COUNT(*) INTO v_admin_count
  FROM control_panel_users
  WHERE role = 'admin' AND is_active = true;

  -- Si hay admins existentes, validar que el creador es admin
  IF v_admin_count > 0 THEN
    IF p_creator_id IS NULL THEN
      RAISE EXCEPTION 'Se requiere autenticación de administrador para crear nuevos usuarios';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM control_panel_users 
      WHERE id = p_creator_id 
        AND role = 'admin' 
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Solo administradores activos pueden crear nuevos usuarios';
    END IF;
  END IF;

  -- Validar que el email no exista
  IF EXISTS (SELECT 1 FROM control_panel_users WHERE email = p_email) THEN
    RAISE EXCEPTION 'El email ya está registrado';
  END IF;

  -- Validar que el username no exista
  IF EXISTS (SELECT 1 FROM control_panel_users WHERE usuario = p_username) THEN
    RAISE EXCEPTION 'El usuario ya está registrado';
  END IF;

  -- Insertar nuevo usuario con password hasheado con bcrypt y retornar directamente
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
    crypt(p_password, gen_salt('bf', 10)),
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

-- Comentario
COMMENT ON FUNCTION create_admin_user IS 'Crea un nuevo usuario administrador con password hasheado usando bcrypt. Valida que solo admins existentes puedan crear nuevos usuarios (excepto el primer admin).';

-- Grant necesario
GRANT EXECUTE ON FUNCTION create_admin_user TO anon, authenticated;
