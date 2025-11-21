-- Agregar política para permitir login (lectura sin autenticación)
-- Permite que el login funcione antes de tener sesión autenticada

-- Agregar política para SELECT anónimo (solo para login)
DROP POLICY IF EXISTS cp_anon_login_select ON public.control_panel_users;
CREATE POLICY cp_anon_login_select ON public.control_panel_users
  FOR SELECT TO anon
  USING (true);

-- Comentario
COMMENT ON POLICY cp_anon_login_select ON public.control_panel_users IS 'Permite login anónimo - lectura de usuarios para verificación de credenciales';
