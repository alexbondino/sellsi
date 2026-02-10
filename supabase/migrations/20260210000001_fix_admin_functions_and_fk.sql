-- ============================================================================
-- MIGRACIÓN UNIFICADA: Corregir funciones admin y agregar FK
-- ============================================================================
-- Fecha: 2026-02-10
-- Módulo: Financiamiento
-- 
-- PROBLEMA DETECTADO (verificado con queries al schema real):
-- 1. Columnas faltantes: restoration_reason, restored_by, is_automatic NO EXISTEN
--    (la migración 20260123090000 se aplicó parcialmente o falló)
-- 2. Las funciones admin_restore_financing_amount y admin_process_refund usan
--    la columna "financing_id" que NO EXISTE (solo existe financing_request_id)
-- 3. Falta FK financing_transactions.supplier_order_id -> supplier_orders.id
--    (por eso PostgREST no puede resolver JOINs en la query de movimientos)
--
-- ERRORES ACTUALES:
-- - admin_restore_financing_amount: "column financing_id does not exist"
-- - getFinancingTransactions: "Could not find a relationship between financing_transactions and supplier_order_id"
-- - pauseFinancing: PGRST116 "no rows returned" (por status inconsistency)
--
-- SOLUCIÓN:
-- 1. Crear columnas faltantes: restoration_reason, restored_by, is_automatic
-- 2. Recrear funciones admin SIN usar financing_id (usar solo financing_request_id)
-- 3. Agregar FK hacia supplier_orders para que PostgREST resuelva embedded resources
-- 4. UI ya corregida para ocultar botón "Movimientos" cuando status es pending_sellsi_approval
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: Crear columnas faltantes en financing_transactions
-- ============================================================================
-- La migración 20260123090000 NO se aplicó completamente, faltan estas columnas

-- 1A) Agregar columnas de auditoría y metadatos (idempotente)
ALTER TABLE public.financing_transactions 
  ADD COLUMN IF NOT EXISTS restoration_reason text;

ALTER TABLE public.financing_transactions 
  ADD COLUMN IF NOT EXISTS restored_by uuid REFERENCES public.control_panel_users(id);

ALTER TABLE public.financing_transactions 
  ADD COLUMN IF NOT EXISTS is_automatic boolean DEFAULT false;

-- ============================================================================
-- PARTE 2: Corregir funciones admin (eliminar referencias a financing_id)
-- ============================================================================

-- 2A) admin_restore_financing_amount - versión SIN financing_id
CREATE OR REPLACE FUNCTION public.admin_restore_financing_amount(
  p_financing_id uuid, 
  p_amount numeric, 
  p_reason text, 
  p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_new_amount_used numeric;
  v_invoking_admin uuid;
  v_admin_name text;
BEGIN
  -- Validación: Monto debe ser mayor a 0
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'El monto debe ser mayor a 0');
  END IF;

  -- Usar p_admin_id directamente (control panel opera como anon, sin sesión Supabase Auth)
  v_invoking_admin := p_admin_id;
  
  -- Obtener nombre del admin para auditoría
  SELECT full_name INTO v_admin_name 
  FROM public.control_panel_users 
  WHERE id = v_invoking_admin AND is_active = true;
  
  IF v_admin_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Admin no encontrado o inactivo');
  END IF;

  -- Intentar decrementar amount_used e incrementar available_amount de forma atómica
  UPDATE public.financing_requests
  SET amount_used = amount_used - p_amount,
      available_amount = available_amount + p_amount,
      updated_at = now()
  WHERE id = p_financing_id
    AND amount_used >= p_amount
  RETURNING amount_used INTO v_new_amount_used;
  
  IF NOT FOUND THEN
    IF NOT EXISTS (SELECT 1 FROM public.financing_requests WHERE id = p_financing_id) THEN
      RETURN json_build_object('success', false, 'error', 'Financiamiento no encontrado');
    ELSE
      RETURN json_build_object('success', false, 'error', 'El monto excede amount_used');
    END IF;
  END IF;

  -- ✅ FIX: Registrar transacción SIN financing_id (solo financing_request_id)
  INSERT INTO public.financing_transactions (
    financing_request_id,
    type, 
    amount, 
    restoration_reason, 
    restored_by, 
    is_automatic, 
    metadata, 
    created_at
  )
  VALUES (
    p_financing_id,
    'reposicion', 
    p_amount, 
    COALESCE(p_reason, 'Reposición manual admin'), 
    v_invoking_admin, 
    false, 
    jsonb_build_object('admin_name', v_admin_name, 'note', 'Reposición manual admin'), 
    now()
  );

  -- Registrar auditoría admin (si la función existe)
  BEGIN
    PERFORM public.log_admin_audit(
      v_invoking_admin, 
      'FINANCING_RESTORE', 
      p_financing_id, 
      jsonb_build_object('amount', p_amount, 'reason', COALESCE(p_reason, 'Reposición manual admin')), 
      NULL, 
      NULL
    );
  EXCEPTION WHEN undefined_function THEN
    -- Si log_admin_audit no existe, continuar sin error
    NULL;
  END;

  RETURN json_build_object(
    'success', true, 
    'new_amount_used', v_new_amount_used,
    'admin', v_admin_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_restore_financing_amount TO authenticated, anon, service_role;

-- 2B) admin_process_refund - versión SIN financing_id
CREATE OR REPLACE FUNCTION public.admin_process_refund(
  p_financing_id uuid, 
  p_amount numeric, 
  p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_new_refunded numeric;
  v_refund_pending numeric;
  v_invoking_admin uuid;
  v_admin_name text;
BEGIN
  -- Validación: Monto debe ser mayor a 0
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'El monto debe ser mayor a 0');
  END IF;

  -- Usar p_admin_id directamente
  v_invoking_admin := p_admin_id;
  
  -- Obtener nombre del admin
  SELECT full_name INTO v_admin_name 
  FROM public.control_panel_users 
  WHERE id = v_invoking_admin AND is_active = true;
  
  IF v_admin_name IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Admin no encontrado o inactivo');
  END IF;

  -- ✅ FIX: Calcular refund_pending dinámicamente (no es columna real)
  SELECT (amount_paid - amount_used - amount_refunded) INTO v_refund_pending
  FROM public.financing_requests
  WHERE id = p_financing_id;

  IF v_refund_pending IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Financiamiento no encontrado');
  END IF;

  IF p_amount > v_refund_pending THEN
    RETURN json_build_object('success', false, 'error', 'El monto excede el reembolso pendiente');
  END IF;

  -- Incrementar amount_refunded
  UPDATE public.financing_requests
  SET amount_refunded = amount_refunded + p_amount,
      updated_at = now()
  WHERE id = p_financing_id
  RETURNING amount_refunded INTO v_new_refunded;

  -- ✅ FIX: Registrar transacción SIN financing_id
  INSERT INTO public.financing_transactions (
    financing_request_id,
    type, 
    amount, 
    metadata, 
    created_at
  )
  VALUES (
    p_financing_id,
    'devolucion', 
    p_amount, 
    jsonb_build_object('admin_id', v_invoking_admin, 'admin_name', v_admin_name, 'note', 'Devolución procesada por admin'), 
    now()
  );

  -- Registrar auditoría admin (si existe)
  BEGIN
    PERFORM public.log_admin_audit(
      v_invoking_admin, 
      'FINANCING_REFUND', 
      p_financing_id, 
      jsonb_build_object('amount', p_amount), 
      NULL, 
      NULL
    );
  EXCEPTION WHEN undefined_function THEN
    NULL;
  END;

  RETURN json_build_object(
    'success', true, 
    'new_amount_refunded', v_new_refunded,
    'admin', v_admin_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_process_refund TO authenticated, anon, service_role;

-- ============================================================================
-- PARTE 3: Agregar FK hacia supplier_orders (para que JOIN funcione)
-- ============================================================================

-- 3A) Agregar FK constraint (NOT VALID para evitar lock en tablas grandes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_financing_transactions_supplier_order'
  ) THEN
    ALTER TABLE public.financing_transactions
      ADD CONSTRAINT fk_financing_transactions_supplier_order 
      FOREIGN KEY (supplier_order_id) 
      REFERENCES public.supplier_orders(id) 
      ON DELETE SET NULL
      NOT VALID;
  END IF;
END;
$$;

-- 3B) Validar constraint (esto sí scanea la tabla, pero seguro)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_financing_transactions_supplier_order'
    AND NOT convalidated
  ) THEN
    ALTER TABLE public.financing_transactions 
      VALIDATE CONSTRAINT fk_financing_transactions_supplier_order;
  END IF;
END;
$$;

-- 3C) Crear índice para mejorar performance de JOINs (si no existe)
CREATE INDEX IF NOT EXISTS idx_financing_transactions_supplier_order_fk
  ON public.financing_transactions(supplier_order_id)
  WHERE supplier_order_id IS NOT NULL;

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN (ejecutar en SQL Editor):
-- ============================================================================
-- SELECT 
--   p.proname as function_name,
--   pg_get_functiondef(p.oid) as definition
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public' 
--   AND p.proname IN ('admin_restore_financing_amount', 'admin_process_refund');
--
-- SELECT 
--   tc.constraint_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table
-- FROM information_schema.table_constraints tc 
-- JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.table_name = 'financing_transactions' 
--   AND kcu.column_name = 'supplier_order_id';
