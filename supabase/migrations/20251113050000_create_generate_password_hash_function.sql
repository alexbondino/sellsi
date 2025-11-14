-- Función para generar hash bcrypt de contraseñas
-- Usada por change_password en Edge Function admin-2fa

CREATE OR REPLACE FUNCTION generate_password_hash(p_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Generar hash bcrypt con 10 rounds (equilibrio seguridad/performance)
  RETURN crypt(p_password, gen_salt('bf', 10));
END;
$$;

-- Permisos
GRANT EXECUTE ON FUNCTION generate_password_hash(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION generate_password_hash(TEXT) TO authenticated;

COMMENT ON FUNCTION generate_password_hash IS 'Genera hash bcrypt de una contraseña. Usada por admin-2fa Edge Function.';
