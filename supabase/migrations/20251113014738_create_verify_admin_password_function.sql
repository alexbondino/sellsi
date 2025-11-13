-- Crear función RPC para verificar contraseña admin con bcrypt
-- Esta función permite verificar contraseñas desde Edge Functions sin necesidad de bcrypt nativo
CREATE OR REPLACE FUNCTION verify_admin_password(
  p_admin_id UUID,
  p_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Verificar contraseña usando crypt de PostgreSQL (bcrypt nativo)
  v_is_valid := (v_password_hash = crypt(p_password, v_password_hash));
  
  RETURN v_is_valid;
END;
$$;

-- Dar permisos a anon para ejecutar la función (necesario para login sin autenticación previa)
GRANT EXECUTE ON FUNCTION verify_admin_password(UUID, TEXT) TO anon;

-- Dar permisos a authenticated también por seguridad
GRANT EXECUTE ON FUNCTION verify_admin_password(UUID, TEXT) TO authenticated;

-- Comentario para documentación
COMMENT ON FUNCTION verify_admin_password IS 'Verifica la contraseña de un administrador usando bcrypt. Retorna true si es válida, false si no.';
