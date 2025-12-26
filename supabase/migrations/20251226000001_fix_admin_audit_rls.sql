-- 20251226000001_fix_admin_audit_rls.sql
-- FIX: Permitir inserción en admin_audit_log durante el proceso de login
-- cuando el usuario aún no está autenticado en Supabase Auth

-- ============================================================================
-- PROBLEMA REAL IDENTIFICADO:
-- ============================================================================
-- El frontend (token ANON) llama directamente a admin_audit_log.insert()
-- pero la política RLS requiere auth.email() que NO EXISTE durante el login
-- porque el admin se autentica contra control_panel_users, NO contra auth.users
--
-- EVIDENCIA: logz.md línea 1
-- fetch(".../rest/v1/admin_audit_log", {
--   "authorization": "Bearer ...role:anon..."  <-- Token ANON, no authenticated
-- })
--
-- SOLUCIÓN: Función RPC con SECURITY DEFINER que bypasea RLS
-- ============================================================================

-- 1. Crear función RPC para insertar auditoría con privilegios elevados
CREATE OR REPLACE FUNCTION public.log_admin_audit(
  p_admin_id UUID,
  p_action TEXT,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER  -- ← CLAVE: Se ejecuta con permisos del propietario (postgres), bypasea RLS
SET search_path = public
AS $$
BEGIN
  -- Validación básica
  IF p_admin_id IS NULL OR p_action IS NULL THEN
    RAISE EXCEPTION 'admin_id y action son requeridos';
  END IF;

  -- Verificar que el admin existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM public.control_panel_users
    WHERE id = p_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin no encontrado o inactivo';
  END IF;

  -- Insertar en admin_audit_log (bypasea RLS gracias a SECURITY DEFINER)
  INSERT INTO public.admin_audit_log (
    admin_id,
    action,
    target_id,
    details,
    timestamp,
    ip_address,
    user_agent
  ) VALUES (
    p_admin_id,
    p_action,
    p_target_id,
    p_details,
    NOW(),
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- 2. Otorgar permisos de ejecución a roles relevantes
GRANT EXECUTE ON FUNCTION public.log_admin_audit(UUID, TEXT, UUID, JSONB, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.log_admin_audit(UUID, TEXT, UUID, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_audit(UUID, TEXT, UUID, JSONB, TEXT, TEXT) TO service_role;

-- 3. Comentarios de documentación
COMMENT ON FUNCTION public.log_admin_audit IS 
  'Registra eventos de auditoría administrativa con SECURITY DEFINER para bypasear RLS. 
   Permite que el frontend con token ANON registre auditoría durante el login cuando 
   el admin aún no está autenticado en Supabase Auth.';

-- 4. Mantener políticas RLS restrictivas (solo para queries directos no via RPC)
DROP POLICY IF EXISTS admin_audit_insert_self ON public.admin_audit_log;

-- Bloquear INSERT directo desde anon (solo permitir via RPC)
CREATE POLICY admin_audit_no_direct_insert ON public.admin_audit_log
  FOR INSERT
  TO anon
  WITH CHECK (false);  -- Fuerza uso de la función RPC

-- Permitir INSERT para authenticated que coincida con su email
CREATE POLICY admin_audit_insert_authenticated ON public.admin_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id IN (
      SELECT id FROM public.control_panel_users cpu
      WHERE cpu.email IS NOT NULL AND lower(cpu.email) = lower(auth.email())
    )
  );

-- Service role siempre puede insertar (para Edge Functions)
CREATE POLICY admin_audit_insert_service_role ON public.admin_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMENT ON POLICY admin_audit_no_direct_insert ON public.admin_audit_log IS 
  'Bloquea INSERT directo desde anon - deben usar log_admin_audit() RPC';

COMMENT ON POLICY admin_audit_insert_authenticated ON public.admin_audit_log IS 
  'Permite INSERT para usuarios autenticados vía Supabase Auth (raro en este sistema)';

COMMENT ON POLICY admin_audit_insert_service_role ON public.admin_audit_log IS 
  'Edge Functions con service_role pueden insertar libremente';
