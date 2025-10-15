-- ============================================
-- 🔐 MIGRACIÓN DE SEGURIDAD: Contraseñas Admin
-- ============================================
-- Fecha: 15 de Octubre de 2025
-- Propósito: Migrar contraseñas de base64 a bcrypt
-- Prioridad: CRÍTICA
-- ============================================

-- 1. Agregar columna para marcar usuarios que necesitan cambio de contraseña
ALTER TABLE public.control_panel_users 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;

-- 2. Comentario de documentación
COMMENT ON COLUMN public.control_panel_users.needs_password_change IS 
'Indica si el usuario debe cambiar su contraseña en el próximo login (para migración de base64 a bcrypt)';

-- 3. Marcar TODOS los usuarios actuales que tienen contraseñas en base64
-- (cualquier password_hash que NO empiece con $2 es base64)
UPDATE public.control_panel_users
SET needs_password_change = TRUE
WHERE password_hash IS NOT NULL 
  AND NOT password_hash LIKE '$2%'
  AND is_active = TRUE;

-- 4. Función para cambiar contraseña (será llamada desde Edge Function)
CREATE OR REPLACE FUNCTION public.admin_change_password(
  p_admin_id UUID,
  p_new_password_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que el hash es bcrypt (empieza con $2a$, $2b$, o $2y$)
  IF p_new_password_hash NOT LIKE '$2%' THEN
    RAISE EXCEPTION 'Password hash must be bcrypt format';
  END IF;
  
  -- Actualizar contraseña y desmarcar needs_password_change
  UPDATE public.control_panel_users
  SET 
    password_hash = p_new_password_hash,
    needs_password_change = FALSE,
    updated_at = NOW()
  WHERE id = p_admin_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin user not found or inactive';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- 5. Permisos para la función (solo service_role puede ejecutarla)
REVOKE ALL ON FUNCTION public.admin_change_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_change_password(UUID, TEXT) TO service_role;

-- 6. Registrar en auditoría cuando se cambia contraseña
CREATE OR REPLACE FUNCTION public.audit_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo registrar si el password_hash cambió
  IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
    INSERT INTO public.admin_audit_log (admin_id, action, details)
    VALUES (
      NEW.id,
      'password_changed',
      jsonb_build_object(
        'changed_at', NOW(),
        'was_forced_change', OLD.needs_password_change,
        'is_bcrypt', NEW.password_hash LIKE '$2%'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Crear trigger para auditoría automática
DROP TRIGGER IF EXISTS trigger_audit_password_change ON public.control_panel_users;
CREATE TRIGGER trigger_audit_password_change
  AFTER UPDATE OF password_hash ON public.control_panel_users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_password_change();

-- 8. Índice para consultas rápidas de usuarios que necesitan cambio
CREATE INDEX IF NOT EXISTS idx_control_panel_users_needs_password_change
  ON public.control_panel_users(needs_password_change)
  WHERE needs_password_change = TRUE AND is_active = TRUE;

-- 9. Política RLS para la función (asegurar que solo admins pueden cambiar su propia contraseña)
-- Nota: Las funciones SECURITY DEFINER ya tienen sus propios permisos

-- ============================================
-- ROLLBACK (en caso de necesitar revertir)
-- ============================================
-- DROP INDEX IF EXISTS idx_control_panel_users_needs_password_change;
-- DROP TRIGGER IF EXISTS trigger_audit_password_change ON public.control_panel_users;
-- DROP FUNCTION IF EXISTS public.audit_password_change();
-- DROP FUNCTION IF EXISTS public.admin_change_password(UUID, TEXT);
-- ALTER TABLE public.control_panel_users DROP COLUMN IF EXISTS needs_password_change;

-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================
-- Verificar cuántos usuarios necesitan cambio de contraseña:
-- SELECT COUNT(*) FROM public.control_panel_users 
-- WHERE needs_password_change = TRUE AND is_active = TRUE;

-- Ver usuarios afectados:
-- SELECT id, usuario, email, needs_password_change, password_hash LIKE '$2%' as is_bcrypt
-- FROM public.control_panel_users
-- WHERE is_active = TRUE;
