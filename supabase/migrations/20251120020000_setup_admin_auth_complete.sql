-- ================================================
-- CONFIGURACIÓN COMPLETA DE AUTENTICACIÓN ADMIN
-- ================================================
-- Fecha: 2025-11-20
-- Propósito: Crear funciones bcrypt y usuario admin funcional

-- 1. Asegurar que pgcrypto esté habilitado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Crear función para generar hash de contraseña con bcrypt
CREATE OR REPLACE FUNCTION generate_password_hash(p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN crypt(p_password, gen_salt('bf', 10));
END;
$$;

-- 3. Crear función para verificar contraseña
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
  SELECT password_hash INTO v_password_hash
  FROM control_panel_users
  WHERE id = p_admin_id AND is_active = true;
  
  IF v_password_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar si es hash bcrypt (empieza con $2)
  IF v_password_hash LIKE '$2%' THEN
    v_is_valid := (v_password_hash = crypt(p_password, v_password_hash));
  ELSE
    -- Si es base64 u otro formato, retornar false
    v_is_valid := FALSE;
  END IF;
  
  RETURN v_is_valid;
END;
$$;

-- 4. Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION generate_password_hash(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_password_hash(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_password_hash(TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION verify_admin_password(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_admin_password(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_password(UUID, TEXT) TO service_role;

-- 5. Crear o actualizar usuario admin con contraseña bcrypt
DO $$
DECLARE
  v_admin_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Generar hash bcrypt para la contraseña 'Sellsi2025xd!95'
  v_password_hash := crypt('Sellsi2025xd!95', gen_salt('bf', 10));
  
  -- Verificar si el usuario admin ya existe
  SELECT id INTO v_admin_id
  FROM control_panel_users
  WHERE usuario = 'admin';
  
  IF v_admin_id IS NULL THEN
    -- Crear nuevo usuario admin
    INSERT INTO control_panel_users (
      usuario,
      email,
      full_name,
      password_hash,
      role,
      is_active,
      twofa_required,
      twofa_configured,
      needs_password_change,
      created_at,
      updated_at
    ) VALUES (
      'admin',
      'admin@sellsi.com',
      'Administrador Principal',
      v_password_hash,
      'superadmin',
      true,
      false,
      false,
      false,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Usuario admin creado exitosamente';
  ELSE
    -- Actualizar contraseña del admin existente
    UPDATE control_panel_users
    SET 
      password_hash = v_password_hash,
      needs_password_change = false,
      is_active = true,
      updated_at = NOW()
    WHERE id = v_admin_id;
    
    RAISE NOTICE 'Contraseña del admin actualizada a bcrypt';
  END IF;
END $$;

-- 6. Verificar que todo funcionó
DO $$
DECLARE
  v_admin_id UUID;
  v_test_result BOOLEAN;
BEGIN
  -- Obtener ID del admin
  SELECT id INTO v_admin_id
  FROM control_panel_users
  WHERE usuario = 'admin';
  
  -- Probar verificación de contraseña
  v_test_result := verify_admin_password(v_admin_id, 'Sellsi2025xd!95');
  
  IF v_test_result THEN
    RAISE NOTICE '✅ Verificación de contraseña funcionando correctamente';
  ELSE
    RAISE WARNING '❌ Error: La verificación de contraseña falló';
  END IF;
END $$;
