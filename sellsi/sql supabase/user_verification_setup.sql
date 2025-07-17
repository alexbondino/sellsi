-- Script para agregar la funcionalidad de verificación de usuarios
-- Ejecutar este script después de crear la tabla users

-- Agregar columnas para la verificación de usuarios
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS verified_by uuid;

-- Crear índice para búsquedas rápidas por estado de verificación
CREATE INDEX IF NOT EXISTS idx_users_verified ON public.users(verified);
CREATE INDEX IF NOT EXISTS idx_users_verified_at ON public.users(verified_at);

-- Comentarios para documentar las columnas
COMMENT ON COLUMN public.users.verified IS 'Indica si el usuario ha sido verificado por el equipo de Sellsi';
COMMENT ON COLUMN public.users.verified_at IS 'Fecha y hora cuando el usuario fue verificado';
COMMENT ON COLUMN public.users.verified_by IS 'ID del administrador que verificó al usuario';

-- Crear función para actualizar automáticamente updatedt cuando se modifica verified
CREATE OR REPLACE FUNCTION update_user_updatedt()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updatedt = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updatedt automáticamente
DROP TRIGGER IF EXISTS trigger_update_user_updatedt ON public.users;
CREATE TRIGGER trigger_update_user_updatedt
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_updatedt();

-- Políticas de seguridad para RLS (Row Level Security)
-- Permitir que todos los usuarios puedan ver el estado de verificación
CREATE POLICY IF NOT EXISTS "Users can view verification status" ON public.users
    FOR SELECT USING (true);

-- Solo administradores pueden modificar el estado de verificación
-- (Esta política se debe ajustar según el sistema de autenticación de admins)
CREATE POLICY IF NOT EXISTS "Only admins can modify verification" ON public.users
    FOR UPDATE USING (
        -- TODO: Ajustar esta condición según el sistema de autenticación de admins
        auth.uid() IN (
            SELECT user_id FROM public.control_panel_users WHERE is_active = true
        )
    );

-- Estadísticas iniciales (opcional)
-- Ver cuántos usuarios están verificados
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_users,
    COUNT(CASE WHEN verified = false THEN 1 END) as unverified_users,
    ROUND(
        COUNT(CASE WHEN verified = true THEN 1 END) * 100.0 / COUNT(*), 2
    ) as verification_percentage
FROM public.users;
