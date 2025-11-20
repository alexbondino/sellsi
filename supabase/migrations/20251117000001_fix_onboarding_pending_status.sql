-- ============================================================================
-- Migration: Fix Onboarding - Corregir valor pendiente para nuevos usuarios
-- ============================================================================
-- Fecha: 2025-11-17
-- Descripción: Cambia el valor por defecto de 'Usuario Nuevo' a 'pendiente'
--              para que sea consistente con la validación del frontend y
--              los usuarios sean redirigidos correctamente al onboarding.
-- ============================================================================

BEGIN;

-- 1. Actualizar función handle_new_user con valor correcto
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
    document_types
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(meta->>'full_name', 'pendiente'),  -- ✅ FIX: Consistente con frontend
    COALESCE((meta->>'proveedor')::BOOLEAN, FALSE),
    meta->>'phone',
    COALESCE(meta->>'pais', 'CL'),
    NOW(),
    NOW(),
    ARRAY[]::text[]
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Actualizar usuarios existentes que tengan 'Usuario Nuevo' a 'pendiente'
--    para que también sean redirigidos al onboarding
UPDATE public.users
SET 
  user_nm = 'pendiente'
WHERE 
  user_nm = 'Usuario Nuevo'
  AND verified = false;  -- Solo usuarios no verificados (probablemente incompletos)

-- 3. Actualizar comentario
COMMENT ON FUNCTION public.handle_new_user() IS 
  'Crea automáticamente un registro en public.users cuando un usuario se registra en auth.users. Usa user_nm=pendiente para forzar onboarding en el frontend.';

COMMIT;
