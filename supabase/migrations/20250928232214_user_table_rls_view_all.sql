BEGIN;

-- Eliminar la política anterior de SELECT que era restrictiva
DROP POLICY IF EXISTS users_select_owner ON public.users;

-- Nueva política que permite ver a todos los usuarios autenticados
CREATE POLICY users_select_authenticated
  ON public.users
  FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Las demás políticas (insert, update, delete) se mantienen igual
-- para que solo el dueño pueda modificar sus datos

COMMIT;
