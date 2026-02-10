-- ============================================================================
-- MIGRACIÓN: Corregir admin_pause_financing y admin_unpause_financing
-- ============================================================================
-- Fecha: 2026-02-10
-- Módulo: Financiamiento - Admin Pause/Unpause
-- 
-- PROBLEMA DETECTADO:
-- 1. Ambas funciones usan auth.uid() que es NULL en control panel (opera como anon)
-- 2. Insertan en columna "financing_id" que NO EXISTE
-- 3. No tienen parámetro p_admin_id
--
-- SOLUCIÓN:
-- 1. Agregar p_admin_id como parámetro
-- 2. Usar p_admin_id en lugar de auth.uid()
-- 3. Eliminar financing_id del INSERT (solo usar financing_request_id)
-- 4. Agregar GRANT TO anon para que control panel pueda ejecutarlas
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 0: Eliminar versiones viejas de las funciones (evitar sobrecarga)
-- ============================================================================

-- Drop función vieja con signature antigua
DROP FUNCTION IF EXISTS public.admin_pause_financing(uuid, text);
DROP FUNCTION IF EXISTS public.admin_unpause_financing(uuid);

-- ============================================================================
-- PARTE 1: Recrear admin_pause_financing con p_admin_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_pause_financing(
  p_financing_id uuid, 
  p_reason text,
  p_admin_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_admin uuid;
  v_paused_at timestamptz;
BEGIN
  -- Usar p_admin_id directamente (control panel opera como anon, sin sesión Supabase Auth)
  v_admin := p_admin_id;
  
  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'p_admin_id es requerido');
  END IF;

  -- Validar admin activo
  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_admin AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin inválido o inactivo');
  END IF;

  -- Verificar que el financiamiento exista y esté en estado aprobado
  IF NOT EXISTS(SELECT 1 FROM public.financing_requests WHERE id = p_financing_id AND status = 'approved_by_sellsi') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Financiamiento no encontrado o no en estado aprobado');
  END IF;

  -- Permitir pausar sólo si no está ya pausado
  UPDATE public.financing_requests
  SET paused = true,
      paused_reason = p_reason,
      paused_at = now(),
      paused_by = v_admin,
      updated_at = now()
  WHERE id = p_financing_id
    AND (paused IS DISTINCT FROM true)
    AND status = 'approved_by_sellsi'
  RETURNING paused_at INTO v_paused_at;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'El financiamiento ya está pausado o no se pudo actualizar');
  END IF;

  -- ✅ FIX: Registrar transacción SIN financing_id (solo financing_request_id)
  INSERT INTO public.financing_transactions (
    financing_request_id, 
    type, 
    amount, 
    metadata, 
    is_automatic,
    created_at
  )
  VALUES (
    p_financing_id, 
    'pause', 
    0, 
    jsonb_build_object('reason', p_reason, 'admin', v_admin), 
    false,
    now()
  );

  -- Auditoría admin (si existe la función)
  BEGIN
    PERFORM public.log_admin_audit(
      v_admin, 
      'FINANCING_PAUSE', 
      p_financing_id, 
      jsonb_build_object('reason', p_reason), 
      NULL, 
      NULL
    );
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', true, 'paused', true, 'paused_at', v_paused_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar GRANT para que control panel (anon) pueda ejecutar
GRANT EXECUTE ON FUNCTION public.admin_pause_financing(uuid, text, uuid) TO authenticated, anon, service_role;

-- ============================================================================
-- PARTE 2: Recrear admin_unpause_financing con p_admin_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_unpause_financing(
  p_financing_id uuid,
  p_admin_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_admin uuid;
  v_unpaused_at timestamptz;
BEGIN
  -- Usar p_admin_id directamente
  v_admin := p_admin_id;
  
  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'p_admin_id es requerido');
  END IF;

  -- Validar admin activo
  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_admin AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin inválido o inactivo');
  END IF;

  -- Permitir reanudar sólo si estaba pausado
  UPDATE public.financing_requests
  SET paused = false,
      unpaused_at = now(),
      unpaused_by = v_admin,
      updated_at = now()
  WHERE id = p_financing_id
    AND paused = true
  RETURNING unpaused_at INTO v_unpaused_at;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'El financiamiento no está pausado o no se encontró');
  END IF;

  -- ✅ FIX: Registrar transacción SIN financing_id
  INSERT INTO public.financing_transactions (
    financing_request_id, 
    type, 
    amount, 
    metadata, 
    is_automatic,
    created_at
  )
  VALUES (
    p_financing_id, 
    'unpause', 
    0, 
    jsonb_build_object('admin', v_admin), 
    false,
    now()
  );

  -- Auditoría admin (si existe)
  BEGIN
    PERFORM public.log_admin_audit(
      v_admin, 
      'FINANCING_UNPAUSE', 
      p_financing_id, 
      jsonb_build_object(), 
      NULL, 
      NULL
    );
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;

  RETURN jsonb_build_object('success', true, 'paused', false, 'unpaused_at', v_unpaused_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar GRANT para que control panel (anon) pueda ejecutar
GRANT EXECUTE ON FUNCTION public.admin_unpause_financing(uuid, uuid) TO authenticated, anon, service_role;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN (ejecutar en SQL Editor):
-- ============================================================================
-- SELECT 
--   p.proname,
--   pg_get_function_arguments(p.oid) as arguments,
--   pg_get_functiondef(p.oid) LIKE '%p_admin_id%' as has_admin_id,
--   pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%' as no_auth_uid,
--   pg_get_functiondef(p.oid) NOT LIKE '%financing_id,%' as no_financing_id_insert
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
--   AND p.proname IN ('admin_pause_financing', 'admin_unpause_financing');
