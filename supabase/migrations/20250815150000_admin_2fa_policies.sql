-- 20250815150000_admin_2fa_policies.sql
-- Políticas RLS para soporte de 2FA administrativo seguro.
-- Asegura que cada administrador sólo pueda leer / actualizar su propia fila.
-- NOTA: Requiere que el email de control_panel_users coincida con auth.email().

-- 1. Habilitar RLS en tablas relevantes (idempotente)
ALTER TABLE public.control_panel_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Políticas control_panel_users
DROP POLICY IF EXISTS cp_select_self ON public.control_panel_users;
CREATE POLICY cp_select_self ON public.control_panel_users
  FOR SELECT TO authenticated
  USING (email IS NOT NULL AND lower(email) = lower(auth.email()));

-- Permitir UPDATE sólo sobre la propia fila (column-level se controla en la capa aplicación / revisiones)
DROP POLICY IF EXISTS cp_update_2fa_self ON public.control_panel_users;
CREATE POLICY cp_update_2fa_self ON public.control_panel_users
  FOR UPDATE TO authenticated
  USING (email IS NOT NULL AND lower(email) = lower(auth.email()))
  WITH CHECK (email IS NOT NULL AND lower(email) = lower(auth.email()));

-- (Opcional futuro) INSERT restringido (administradores se crean vía service role / migraciones)
-- No se crea policy INSERT para evitar auto-elevación.

-- 3. Políticas admin_audit_log
DROP POLICY IF EXISTS admin_audit_select_self ON public.admin_audit_log;
CREATE POLICY admin_audit_select_self ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (admin_id IN (
    SELECT id FROM public.control_panel_users cpu
    WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
  ));

DROP POLICY IF EXISTS admin_audit_insert_self ON public.admin_audit_log;
CREATE POLICY admin_audit_insert_self ON public.admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (admin_id IN (
    SELECT id FROM public.control_panel_users cpu
    WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
  ));

-- 4. Políticas admin_sessions
DROP POLICY IF EXISTS admin_sessions_select_self ON public.admin_sessions;
CREATE POLICY admin_sessions_select_self ON public.admin_sessions
  FOR SELECT TO authenticated
  USING (admin_id IN (
    SELECT id FROM public.control_panel_users cpu
    WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
  ));

DROP POLICY IF EXISTS admin_sessions_insert_self ON public.admin_sessions;
CREATE POLICY admin_sessions_insert_self ON public.admin_sessions
  FOR INSERT TO authenticated
  WITH CHECK (admin_id IN (
    SELECT id FROM public.control_panel_users cpu
    WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
  ));

-- 5. Comentarios / seguridad adicional
COMMENT ON POLICY cp_select_self ON public.control_panel_users IS 'Admin sólo puede ver su propia fila (email match).';
COMMENT ON POLICY cp_update_2fa_self ON public.control_panel_users IS 'Admin actualiza únicamente su propia fila para 2FA (twofa_secret, twofa_configured, last_login, updated_at).';
COMMENT ON POLICY admin_audit_select_self ON public.admin_audit_log IS 'Admin ve solo sus eventos de auditoría.';
COMMENT ON POLICY admin_audit_insert_self ON public.admin_audit_log IS 'La función edge inserta auditoría usando el email autenticado.';
COMMENT ON POLICY admin_sessions_select_self ON public.admin_sessions IS 'Admin ve sus sesiones.';
COMMENT ON POLICY admin_sessions_insert_self ON public.admin_sessions IS 'Admin (función) crea su propia sesión.';

-- 6. (Opcional) Revocar PUBLIC (precaución: service role ignora RLS pero se pueden ajustar grants)
-- REVOKE ALL ON public.control_panel_users FROM PUBLIC;
-- REVOKE ALL ON public.admin_audit_log FROM PUBLIC;
-- REVOKE ALL ON public.admin_sessions FROM PUBLIC;

-- Verificación rápida (manual post-deploy):
-- SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename='control_panel_users';
