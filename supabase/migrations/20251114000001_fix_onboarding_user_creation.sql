-- ============================================================================
-- Migration: Fix Onboarding - Asegurar creación de usuario en public.users
-- ============================================================================
-- Fecha: 2025-11-14
-- Descripción: Reactiva trigger para crear usuario en public.users cuando
--              se registra en auth.users, para evitar errores 406/400
-- ============================================================================

BEGIN;

-- 1. Recrear función si no existe (idempotente)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  meta JSONB;
BEGIN
  meta := NEW.raw_user_meta_data;
  
  -- Insertar en public.users con valores por defecto seguros
  INSERT INTO public.users (
    user_id,
    email,
    user_nm,
    main_supplier,
    phone_nbr,
    country,
    createdt,
    updatedt,
    document_types  -- Agregar con array vacío
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(meta->>'full_name', 'Usuario Nuevo'),  -- Valor temporal
    COALESCE((meta->>'proveedor')::BOOLEAN, FALSE),
    meta->>'phone',
    COALESCE(meta->>'pais', 'CL'),
    NOW(),
    NOW(),
    ARRAY[]::text[]  -- Array vacío por defecto
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Evitar duplicados
  
  RETURN NEW;
END;
$$;

-- 2. Crear trigger si no existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Comentario explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Crea automáticamente un registro en public.users cuando un usuario se registra en auth.users. Permite completar el perfil en Onboarding.';

COMMIT;
