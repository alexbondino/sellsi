-- 20260126120000_add_financing_pause_fields_and_admin_rpcs.sql
-- Añadir soporte de "pause" (con metadata, índices y RPCs admin) para financiamientos
-- Fecha/Version: 2026-01-26 12:00:00
-- Autor: GitHub Copilot (generado)

BEGIN;

-- 1) Añadir columnas idempotentes para pausa/rehabilitación
ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paused_reason text,
  ADD COLUMN IF NOT EXISTS paused_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_by uuid,
  ADD COLUMN IF NOT EXISTS unpaused_at timestamptz,
  ADD COLUMN IF NOT EXISTS unpaused_by uuid;

-- 1b) Backfill seguro (asegura valor por defecto en filas antiguas)
UPDATE public.financing_requests
SET paused = false
WHERE paused IS NULL;

-- 2) Índices - facilitar consultas de disponibilidad y auditoría
-- Asegurar que la columna `expires_at` exista antes de crear índices que la referencien (idempotente)
ALTER TABLE public.financing_requests ADD COLUMN IF NOT EXISTS expires_at timestamptz;
-- Backfill seguro desde `due_date` si existe (no sobrescribe valores ya presentes)
UPDATE public.financing_requests
SET expires_at = due_date::timestamptz
WHERE expires_at IS NULL AND due_date IS NOT NULL;

-- Asegurar columnas de montos que usan las funciones (idempotente)
ALTER TABLE public.financing_requests ADD COLUMN IF NOT EXISTS amount_used numeric DEFAULT 0;
ALTER TABLE public.financing_requests ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE public.financing_requests ADD COLUMN IF NOT EXISTS amount_refunded numeric DEFAULT 0;
-- Backfill segura: establecer 0 donde sean NULL (evita errores en cálculos posteriores)
UPDATE public.financing_requests SET amount_used = 0 WHERE amount_used IS NULL;
UPDATE public.financing_requests SET amount_paid = 0 WHERE amount_paid IS NULL;
UPDATE public.financing_requests SET amount_refunded = 0 WHERE amount_refunded IS NULL;

CREATE INDEX IF NOT EXISTS idx_financing_requests_paused ON public.financing_requests (paused);
CREATE INDEX IF NOT EXISTS idx_financing_requests_paused_at ON public.financing_requests (paused_at);
-- Índice para lookup de checkout (si la tabla es muy grande, crear CONCURRENTLY fuera de transacción en mantenimiento)
CREATE INDEX IF NOT EXISTS idx_financing_available_for_checkout ON public.financing_requests (buyer_id, supplier_id, expires_at)
  WHERE status = 'approved_by_sellsi' AND paused = false;
-- NOTE: If the table is large, creating this index WITH CONCURRENTLY is recommended in production to avoid long locks:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_financing_available_for_checkout ON public.financing_requests (buyer_id, supplier_id, expires_at) WHERE status = 'approved_by_sellsi' AND paused = false;
-- Run the CONCURRENTLY command outside of a transaction in a maintenance window.

-- 3) RPC: admin_pause_financing
-- Valida admin, transición válida y registra auditoría + transacción de tipo 'pause'
CREATE OR REPLACE FUNCTION public.admin_pause_financing(
  p_financing_id uuid,
  p_reason text
) RETURNS jsonb AS $$
DECLARE
  v_admin uuid := auth.uid()::uuid;
  v_found boolean;
  v_paused_at timestamptz;
BEGIN
  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin no autenticado');
  END IF;

  -- Validar admin activo
  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_admin AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin inválido o inactivo');
  END IF;

  -- Verificar que el financiamiento exista y esté en estado aprobable (solo los aprobados por Sellsi pueden pausarse)
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

  -- Registrar transacción de tipo 'pause' (para trazabilidad interna)
  -- Insertar tanto en `financing_id` como en `financing_request_id` para compatibilidad con esquemas previos
  INSERT INTO public.financing_transactions (financing_id, financing_request_id, type, amount, metadata, created_at)
  VALUES (p_financing_id, p_financing_id, 'pause', 0, jsonb_build_object('reason', p_reason, 'admin', v_admin), now());

  -- Auditoría admin (usa la función log_admin_audit si está disponible)
  PERFORM public.log_admin_audit(v_admin, 'FINANCING_PAUSE', p_financing_id, jsonb_build_object('reason', p_reason), NULL, NULL);

  RETURN jsonb_build_object('success', true, 'paused', true, 'paused_at', v_paused_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_pause_financing(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_pause_financing(uuid, text) TO service_role;

-- 4) RPC: admin_unpause_financing
CREATE OR REPLACE FUNCTION public.admin_unpause_financing(
  p_financing_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_admin uuid := auth.uid()::uuid;
  v_found boolean;
  v_unpaused_at timestamptz;
BEGIN
  IF v_admin IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin no autenticado');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_admin AND is_active = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin inválido o inactivo');
  END IF;

  -- Permitir reanudar sólo si estaba pausado
  UPDATE public.financing_requests
  SET paused = false,
      -- conservar paused_reason (histórico) pero setear unpaused meta
      unpaused_at = now(),
      unpaused_by = v_admin,
      updated_at = now()
  WHERE id = p_financing_id
    AND paused = true
  RETURNING unpaused_at INTO v_unpaused_at;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'El financiamiento no está pausado o no se encontró');
  END IF;

  -- Registrar transacción de tipo 'unpause' (trazabilidad)
  -- Insertar tanto en `financing_id` como en `financing_request_id` para compatibilidad con esquemas previos
  INSERT INTO public.financing_transactions (financing_id, financing_request_id, type, amount, metadata, created_at)
  VALUES (p_financing_id, p_financing_id, 'unpause', 0, jsonb_build_object('admin', v_admin), now());

  PERFORM public.log_admin_audit(v_admin, 'FINANCING_UNPAUSE', p_financing_id, jsonb_build_object(), NULL, NULL);

  RETURN jsonb_build_object('success', true, 'paused', false, 'unpaused_at', v_unpaused_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_unpause_financing(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unpause_financing(uuid) TO service_role;

-- 5) Utility RPC: obtener financiamientos disponibles para checkout (filtra paused = false)
CREATE OR REPLACE FUNCTION public.get_available_financings_for_checkout(
  p_buyer_id uuid,
  p_supplier_id uuid
) RETURNS SETOF public.financing_requests AS $$
  SELECT fr.* FROM public.financing_requests fr
  WHERE fr.buyer_id = p_buyer_id
    AND fr.supplier_id = p_supplier_id
    AND fr.status = 'approved_by_sellsi'
    AND fr.paused = false
    AND (fr.expires_at IS NULL OR fr.expires_at > now())
    AND (COALESCE(fr.amount,0) - COALESCE(fr.amount_used,0)) > 0;
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION public.get_available_financings_for_checkout(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_financings_for_checkout(uuid, uuid) TO service_role;

-- 6) Nota sobre políticas: preferimos que la lógica de disponibilidad se haga en RPCs/queries que usen `paused = false`.
-- Si fuera necesario, se puede añadir una policy que bloquee SELECT en determinadas rutas, pero dejamos visible el financiamiento a buyer/supplier para que puedan ver el estado y el motivo de la pausa.

-- ============================================================================
-- RLS: Proteger campos de pausa (buyers/suppliers no pueden modificar campos de pausa)
-- ============================================================================
-- Reemplazamos políticas amplias por políticas más finas para evitar que buyers/suppliers
-- alteren campos de control administrativo (paused, paused_reason, paused_at, paused_by, ...)

-- Buyers: SELECT / INSERT / UPDATE (con WITH CHECK que protege campos de pausa para no-admins)
DROP POLICY IF EXISTS "buyer_access_financing" ON public.financing_requests;

DROP POLICY IF EXISTS "buyer_select_financing" ON public.financing_requests;
CREATE POLICY "buyer_select_financing" ON public.financing_requests
  FOR SELECT
  USING (buyer_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin');

DROP POLICY IF EXISTS "buyer_insert_financing" ON public.financing_requests;
CREATE POLICY "buyer_insert_financing" ON public.financing_requests
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin');

DROP POLICY IF EXISTS "buyer_update_financing" ON public.financing_requests;
CREATE POLICY "buyer_update_financing" ON public.financing_requests
  FOR UPDATE
  USING (buyer_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin')
  WITH CHECK (
    auth.role() = 'admin' OR (
      COALESCE(paused,false) = false
      AND paused_reason IS NULL
      AND paused_at IS NULL
      AND paused_by IS NULL
      AND unpaused_at IS NULL
      AND unpaused_by IS NULL
    )
  );

-- Suppliers: SELECT / UPDATE protection
DROP POLICY IF EXISTS "supplier_access_financing" ON public.financing_requests;

DROP POLICY IF EXISTS "supplier_select_financing" ON public.financing_requests;
CREATE POLICY "supplier_select_financing" ON public.financing_requests
  FOR SELECT
  USING (supplier_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin');

DROP POLICY IF EXISTS "supplier_update_financing" ON public.financing_requests;
CREATE POLICY "supplier_update_financing" ON public.financing_requests
  FOR UPDATE
  USING (supplier_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin')
  WITH CHECK (
    auth.role() = 'admin' OR (
      COALESCE(paused,false) = false
      AND paused_reason IS NULL
      AND paused_at IS NULL
      AND paused_by IS NULL
      AND unpaused_at IS NULL
      AND unpaused_by IS NULL
    )
  );

-- Nota: admin_all policy (admin completo) permanece vigente y no se modifica aquí.

-- ============================================================================
-- Tests manuales / smoke tests (comentados): ejecutar en STAGING con sesión admin/buyer/supplier
-- ============================================================================
-- Preparar fixtures:
-- INSERT INTO public.buyer (id, name, email) VALUES ('00000000-0000-0000-0000-000000000010'::uuid, 'Test Buyer Pause', 'tbpause@example.com') ON CONFLICT (id) DO NOTHING;
-- INSERT INTO public.supplier (id, name) VALUES ('00000000-0000-0000-0000-000000000020'::uuid, 'Test Supplier Pause') ON CONFLICT (id) DO NOTHING;
-- INSERT INTO public.control_panel_users (id, email, name, is_active) VALUES ('00000000-0000-0000-0000-0000000000AA'::uuid, 'admin_pause@example.com', 'Admin Pause Test', true) ON CONFLICT (id) DO NOTHING;
-- INSERT INTO public.financing_requests (id, buyer_id, supplier_id, amount, available_amount, status)
-- VALUES ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000020'::uuid, 100000, 100000, 'approved_by_sellsi') ON CONFLICT (id) DO NOTHING;

-- 1) Pausa (ejecutar como admin):
-- SELECT public.admin_pause_financing('11111111-1111-1111-1111-111111111111'::uuid, 'Prueba de pausa');
-- SELECT id, paused, paused_reason, paused_at, paused_by FROM public.financing_requests WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;
-- SELECT id, financing_id, financing_request_id, type, metadata, created_at FROM public.financing_transactions WHERE financing_id = '11111111-1111-1111-1111-111111111111'::uuid AND type = 'pause' ORDER BY created_at DESC LIMIT 5;

-- 2) Intentar pausar como BUYER/SUPPLIER -> debe FALLAR debido a RLS (WITH CHECK)
-- 3) Reanudar (ejecutar como admin): SELECT public.admin_unpause_financing('11111111-1111-1111-1111-111111111111'::uuid);
-- 4) Verificar get_available_financings_for_checkout excluye pausados:
-- SELECT public.admin_pause_financing('11111111-1111-1111-1111-111111111111'::uuid, 'Prueba exclusion');
-- SELECT * FROM public.get_available_financings_for_checkout('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000020'::uuid);

COMMIT;
