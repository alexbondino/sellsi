-- Habilitar RLS y políticas para public.users (user_id es uuid)
BEGIN;

-- 1) Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2) Trigger que evita cambios fuera de las columnas permitidas
CREATE OR REPLACE FUNCTION public.block_forbidden_user_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Compara las filas excluyendo las columnas permitidas a modificar.
    IF ( to_jsonb(NEW)
           - 'rut' - 'user_nm' - 'phone_nbr' - 'country' - 'logo_url' - 'descripcion_proveedor' - 'document_types'
         )
       <> 
       ( to_jsonb(OLD)
           - 'rut' - 'user_nm' - 'phone_nbr' - 'country' - 'logo_url' - 'descripcion_proveedor' - 'document_types'
       )
    THEN
      RAISE EXCEPTION 'Modificación no permitida: solo se pueden actualizar rut, user_nm, phone_nbr, country, logo_url, descripcion_proveedor, document_types';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Crear trigger (antes borrar si existiera)
DROP TRIGGER IF EXISTS enforce_users_update_restrictions ON public.users;
CREATE TRIGGER enforce_users_update_restrictions
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.block_forbidden_user_updates();

-- 4) POLÍTICAS RLS
-- El dialecto de PostgreSQL no soporta CREATE POLICY IF NOT EXISTS, por eso primero borramos si existen.
DROP POLICY IF EXISTS users_select_owner ON public.users;
DROP POLICY IF EXISTS users_insert_owner ON public.users;
DROP POLICY IF EXISTS users_update_owner ON public.users;
DROP POLICY IF EXISTS users_delete_none ON public.users;

-- SELECT: usuario autenticado puede leer sólo su fila
CREATE POLICY users_select_owner
  ON public.users
  FOR SELECT
  USING ( auth.uid()::uuid = user_id );

-- INSERT: permitir insertar solo si user_id = auth.uid()
CREATE POLICY users_insert_owner
  ON public.users
  FOR INSERT
  WITH CHECK ( auth.uid()::uuid = user_id );

-- UPDATE: permitir UPDATE sólo sobre la fila propia;
-- el trigger se encargará de bloquear cambios en columnas no permitidas
CREATE POLICY users_update_owner
  ON public.users
  FOR UPDATE
  USING ( auth.uid()::uuid = user_id )
  WITH CHECK ( auth.uid()::uuid = user_id );

-- DELETE: no permitir delete por parte de usuarios autenticados
CREATE POLICY users_delete_none
  ON public.users
  FOR DELETE
  USING ( false );

COMMIT;