-- ============================================================================
-- MIGRACIÓN COMPLETA: Arreglos de Financiamiento Admin
-- ============================================================================
-- Fecha: 2026-02-09
-- Módulo: Financiamiento
-- 
-- Esta migración arregla TODOS los problemas detectados en la sesión 2026-02-09:
-- 
-- 1. Status Inconsistency: 'approved' vs 'approved_by_sellsi'
-- 2. Funciones admin faltantes: admin_restore_financing_amount, admin_process_refund
-- 3. Trigger firma admin: auth.role() = 'admin' (nunca funciona) → is_admin_user()
-- 4. expire_due_financings(): usaba SOLO status='approved' (nunca encontraría nada)
-- 
-- PROBLEMAS DETECTADOS:
-- - Migración 20260123090000 marcada como aplicada PERO funciones NO existen (error parcial)
-- - Trigger update_financing_status_on_signature() usa 'approved' en lugar de 'approved_by_sellsi'
-- - Trigger on_financing_document_upsert() usa auth.role() = 'admin' (NUNCA es true en Supabase)
-- - pauseFinancing() fallaba con PGRST116 "no rows returned"
-- - Reponer monto fallaba con PGRST202 "function not found"
-- - Admin signing no guardaba signed_sellsi_at
-- 
-- SOLUCIÓN:
-- Esta migración es COMPLETA e IDEMPOTENTE - arregla todo de una vez
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: Crear funciones admin faltantes (de migración 20260123090000)
-- ============================================================================
-- Estas funciones deberían existir, pero un error parcial dejó la migración
-- marcada como aplicada sin crear las funciones

-- 1A) admin_restore_financing_amount
CREATE OR REPLACE FUNCTION public.admin_restore_financing_amount(
  p_financing_id uuid, 
  p_amount numeric, 
  p_reason text, 
  p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_new_amount_used numeric;
  v_invoking_admin uuid;
BEGIN
  -- Validación: Monto debe ser mayor a 0
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'El monto debe ser mayor a 0');
  END IF;

  -- Determinar admin: usar p_admin_id (control panel no tiene sesión Supabase Auth)
  v_invoking_admin := p_admin_id;
  
  IF v_invoking_admin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'p_admin_id es requerido');
  END IF;

  -- Verificar que el admin exista y esté activo
  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_invoking_admin AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Admin inválido o inactivo');
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

  -- Registrar transacción de reposición con referencia al admin
  INSERT INTO public.financing_transactions (
    financing_request_id,
    financing_id, 
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
    p_financing_id, 
    'reposicion', 
    p_amount, 
    COALESCE(p_reason, 'reposición manual admin'), 
    v_invoking_admin, 
    false, 
    jsonb_build_object('note', 'Reposición manual admin'), 
    now()
  );

  -- Registrar auditoría admin (si la función existe)
  BEGIN
    PERFORM public.log_admin_audit(
      v_invoking_admin, 
      'FINANCING_RESTORE', 
      p_financing_id, 
      jsonb_build_object('amount', p_amount, 'reason', COALESCE(p_reason, 'reposición manual admin')), 
      NULL, 
      NULL
    );
  EXCEPTION WHEN undefined_function THEN
    -- Si log_admin_audit no existe, continuar sin error
    NULL;
  END;

  RETURN json_build_object('success', true, 'new_amount_used', v_new_amount_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_restore_financing_amount(uuid, numeric, text, uuid) TO authenticated, anon, service_role;

-- 1B) admin_process_refund
CREATE OR REPLACE FUNCTION public.admin_process_refund(
  p_financing_id uuid, 
  p_amount numeric, 
  p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_updated_rows int;
  v_invoking_admin uuid;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'El monto debe ser mayor a 0');
  END IF;

  -- Determinar admin: usar p_admin_id (control panel no tiene sesión Supabase Auth)
  v_invoking_admin := p_admin_id;
  
  IF v_invoking_admin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'p_admin_id es requerido');
  END IF;

  -- Verificar que el admin exista y esté activo
  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_invoking_admin AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Admin inválido o inactivo');
  END IF;

  UPDATE public.financing_requests
  SET amount_refunded = amount_refunded + p_amount,
      updated_at = now()
  WHERE id = p_financing_id
    AND (amount_paid - amount_used - amount_refunded) >= p_amount;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  IF v_updated_rows = 0 THEN
    IF NOT EXISTS (SELECT 1 FROM public.financing_requests WHERE id = p_financing_id) THEN
      RETURN json_build_object('success', false, 'error', 'Financiamiento no encontrado');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Saldo insuficiente o modificado concurrentemente');
    END IF;
  END IF;

  INSERT INTO public.financing_transactions (
    financing_request_id, 
    financing_id, 
    type, 
    amount, 
    metadata, 
    created_at
  )
  VALUES (
    p_financing_id, 
    p_financing_id, 
    'devolucion', 
    p_amount, 
    jsonb_build_object(
      'note', 'Devolución procesada por admin', 
      'processed_by_admin_id', v_invoking_admin,
      'admin_name', (SELECT full_name FROM public.control_panel_users WHERE id = v_invoking_admin)
    ), 
    now()
  );

  -- Registrar auditoría admin (si la función existe)
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

  RETURN json_build_object('success', true, 'refund_processed', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_process_refund(uuid, numeric, uuid) TO authenticated, anon, service_role;

-- ============================================================================
-- PARTE 2: Fix trigger de firma admin (auth.role() → is_admin_user())
-- ============================================================================

CREATE OR REPLACE FUNCTION public.on_financing_document_upsert()
RETURNS trigger AS $$
DECLARE
  v_buyer_user_id uuid;
  v_supplier_user_id uuid;
  v_current_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Validar que financing exista
  IF NOT EXISTS (SELECT 1 FROM public.financing_requests fr WHERE fr.id = NEW.financing_id) THEN
    RAISE NOTICE '[on_financing_document_upsert] Financing not found: %', NEW.financing_id;
    RETURN NEW;
  END IF;

  -- Obtener user_id del buyer y supplier para este financing
  SELECT b.user_id, s.user_id
  INTO v_buyer_user_id, v_supplier_user_id
  FROM public.financing_requests fr
  JOIN public.buyer b ON b.id = fr.buyer_id
  JOIN public.supplier s ON s.id = fr.supplier_id
  WHERE fr.id = NEW.financing_id;

  -- Obtener user_id actual (puede ser null si es SERVICE_ROLE)
  BEGIN
    v_current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_current_user_id := NULL;
  END;

  -- 🔧 FIX: Usar is_admin_user() en lugar de auth.role() = 'admin'
  -- auth.role() en Supabase NUNCA retorna 'admin', solo 'anon', 'authenticated', 'service_role'
  BEGIN
    v_is_admin := public.is_admin_user();
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := FALSE;
  END;

  -- LÓGICA DE DETECCIÓN:
  -- 1. Si document_type es explícito de firma específica → usar esa lógica (retrocompatibilidad)
  -- 2. Si document_type es 'contrato_marco' (progresivo) → detectar por contexto de usuario
  -- 3. Si document_name tiene '_final' o es admin → signed_sellsi_at

  IF NEW.document_type = 'contrato_buyer_signed' OR NEW.document_name ILIKE '%buyer_signed%' THEN
    -- Firma buyer explícita (legacy o específica)
    UPDATE public.financing_requests 
    SET signed_buyer_at = now(), updated_at = now() 
    WHERE id = NEW.financing_id;
    
  ELSIF NEW.document_type = 'contrato_supplier_signed' OR NEW.document_name ILIKE '%supplier_signed%' THEN
    -- Firma supplier explícita (legacy o específica)
    UPDATE public.financing_requests 
    SET signed_supplier_at = now(), updated_at = now() 
    WHERE id = NEW.financing_id;
    
  ELSIF NEW.document_type = 'contrato_final' OR NEW.document_name ILIKE '%final%' THEN
    -- Firma admin/sellsi
    UPDATE public.financing_requests 
    SET signed_sellsi_at = now(), updated_at = now() 
    WHERE id = NEW.financing_id;
    
  ELSIF NEW.document_type = 'contrato_marco' THEN
    -- DOCUMENTO PROGRESIVO: detectar por contexto
    
    IF v_is_admin THEN
      -- Admin siempre actualiza signed_sellsi_at
      UPDATE public.financing_requests 
      SET signed_sellsi_at = now(), updated_at = now() 
      WHERE id = NEW.financing_id;
      
      RAISE NOTICE '✅ Admin firmó contrato - signed_sellsi_at actualizado para financing_id=%', NEW.financing_id;
      
    ELSIF v_current_user_id = v_buyer_user_id THEN
      -- Usuario autenticado es el buyer → actualizar signed_buyer_at
      UPDATE public.financing_requests 
      SET signed_buyer_at = now(), updated_at = now() 
      WHERE id = NEW.financing_id;
      
    ELSIF v_current_user_id = v_supplier_user_id THEN
      -- Usuario autenticado es el supplier → actualizar signed_supplier_at
      UPDATE public.financing_requests 
      SET signed_supplier_at = now(), updated_at = now() 
      WHERE id = NEW.financing_id;
      
    ELSE
      -- Usuario desconocido o SERVICE_ROLE sin contexto
      -- NO actualizar signed_*_at (puede ser generación automática)
      RAISE NOTICE '[on_financing_document_upsert] Document upserted by unknown user (auth.uid=%, admin=%), no signature timestamp updated', v_current_user_id, v_is_admin;
    END IF;
    
  ELSE
    -- Tipo de documento desconocido, no actualizar timestamps
    RAISE NOTICE '[on_financing_document_upsert] Unknown document_type: %, no signature timestamp updated', NEW.document_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.on_financing_document_upsert() IS 
  'Actualiza timestamps de firma cuando se suben documentos. Usa is_admin_user() para detectar admins correctamente.';

-- ============================================================================
-- PARTE 3: Fix status inconsistency (approved → approved_by_sellsi)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_financing_status_on_signature()
RETURNS trigger AS $$
DECLARE
  v_buyer_signed boolean;
  v_supplier_signed boolean;
  v_sellsi_signed boolean;
  v_new_status text;
BEGIN
  -- NO actualizar status si el financing ya fue cancelado, rechazado, expirado o pagado
  -- Estos estados son terminales y no deben ser sobrescritos por firmas
  IF OLD.status IN ('cancelled_by_buyer', 'cancelled_by_supplier', 'rejected_by_supplier', 
                     'rejected_by_sellsi', 'expired', 'paid', 'partially_paid', 'overdue') THEN
    RETURN NEW; -- No modificar status, mantener el estado terminal
  END IF;

  -- Obtener estado de firmas
  v_buyer_signed := NEW.signed_buyer_at IS NOT NULL;
  v_supplier_signed := NEW.signed_supplier_at IS NOT NULL;
  v_sellsi_signed := NEW.signed_sellsi_at IS NOT NULL;

  -- Determinar nuevo status basado en las firmas
  IF v_sellsi_signed THEN
    -- ✅ FIX: Cambiar de 'approved' a 'approved_by_sellsi' para consistencia con código
    v_new_status := 'approved_by_sellsi';
  ELSIF v_buyer_signed AND v_supplier_signed THEN
    -- Si ambos firmaron, esperando aprobación de Sellsi
    v_new_status := 'pending_sellsi_approval';
  ELSIF v_buyer_signed AND NOT v_supplier_signed THEN
    -- Si solo buyer firmó, esperando firma de supplier
    v_new_status := 'supplier_signature_pending';
  ELSIF v_supplier_signed AND NOT v_buyer_signed THEN
    -- Si solo supplier firmó, esperando firma de buyer
    v_new_status := 'buyer_signature_pending';
  ELSE
    -- Ninguno firmó aún, mantener status actual (no modificar)
    v_new_status := NEW.status;
  END IF;

  -- Solo actualizar si el status cambió
  IF v_new_status IS DISTINCT FROM NEW.status THEN
    NEW.status := v_new_status;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_financing_status_on_signature() IS 
  'Actualiza status automáticamente basado en firmas. Usa approved_by_sellsi (no approved) para consistencia con código existente.';

-- ============================================================================
-- PARTE 4: MIGRACIÓN DE DATOS
-- ============================================================================

-- 4A) Actualizar financings que tienen status='approved' a 'approved_by_sellsi'
UPDATE public.financing_requests
SET 
  status = 'approved_by_sellsi',
  updated_at = now()
WHERE status = 'approved';

-- 4B) Fix expire_due_financings() - usaba status = 'approved' (nunca encontraría nada)
CREATE OR REPLACE FUNCTION public.expire_due_financings()
RETURNS void AS $$
BEGIN
  UPDATE public.financing_requests
  SET status = 'expired', has_overdue = true, updated_at = now()
  WHERE due_date IS NOT NULL 
    AND due_date < now()::date 
    AND status IN ('approved', 'approved_by_sellsi');

  -- Actualizar flags de buyer en bloque
  UPDATE public.buyer b
  SET has_overdue_financing = true
  FROM (
    SELECT DISTINCT buyer_id FROM public.financing_requests WHERE status = 'expired'
  ) t
  WHERE b.id = t.buyer_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.expire_due_financings() IS 
  'Expira financiamientos vencidos. Acepta tanto approved como approved_by_sellsi para retrocompatibilidad.';

COMMIT;

-- ============================================================================
-- POST-MIGRATION: Logging y verificación
-- ============================================================================

DO $$
DECLARE
  v_updated_count integer;
  v_func_count integer;
BEGIN
  -- Contar financings actualizados
  SELECT COUNT(*) INTO v_updated_count 
  FROM public.financing_requests 
  WHERE status = 'approved_by_sellsi';

  -- Verificar funciones creadas
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('admin_restore_financing_amount', 'admin_process_refund');

  RAISE NOTICE '============================================================';
  RAISE NOTICE '✅ MIGRACIÓN COMPLETA EXITOSA';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '📊 Financings con status approved_by_sellsi: %', v_updated_count;
  RAISE NOTICE '🔧 Funciones admin creadas: % de 2', v_func_count;
  RAISE NOTICE '✅ Trigger on_financing_document_upsert: Usa is_admin_user()';
  RAISE NOTICE '✅ Trigger update_financing_status_on_signature: Usa approved_by_sellsi';
  RAISE NOTICE '✅ expire_due_financings(): Acepta approved + approved_by_sellsi';
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- VERIFICACIÓN POST-DEPLOY (Ejecutar manualmente después de aplicar)
-- ============================================================================

-- 1. Verificar que no queden financings con status='approved'
-- SELECT COUNT(*) FROM financing_requests WHERE status = 'approved';
-- Esperado: 0

-- 2. Verificar financings aprobados
-- SELECT id, status, signed_sellsi_at FROM financing_requests 
-- WHERE status = 'approved_by_sellsi' LIMIT 5;

-- 3. Verificar funciones admin existen
-- SELECT proname, pg_get_function_arguments(oid) 
-- FROM pg_proc 
-- WHERE proname IN ('admin_restore_financing_amount', 'admin_process_refund');
-- Esperado: 2 filas

-- 4. Probar función de reposición
-- SELECT * FROM admin_restore_financing_amount(
--   'financing-id-aqui'::uuid,
--   100::numeric,
--   'Prueba de reposición'::text,
--   (SELECT id FROM control_panel_users WHERE is_active = true LIMIT 1)
-- );
-- Esperado: {success: true, new_amount_used: ...}

-- 5. Verificar trigger de firma admin
-- SELECT pg_get_functiondef(oid) FROM pg_proc 
-- WHERE proname = 'on_financing_document_upsert';
-- Debe contener: "is_admin_user()" y NO "auth.role() = 'admin'"

-- ============================================================================
-- ROLLBACK (si es necesario volver atrás)
-- ============================================================================
/*
BEGIN;

-- Revertir funciones admin (DROP)
DROP FUNCTION IF EXISTS public.admin_restore_financing_amount(uuid, numeric, text, uuid);
DROP FUNCTION IF EXISTS public.admin_process_refund(uuid, numeric, uuid);

-- Revertir status
UPDATE public.financing_requests
SET status = 'approved', updated_at = now()
WHERE status = 'approved_by_sellsi';

-- Restaurar trigger status (versión antigua)
CREATE OR REPLACE FUNCTION public.update_financing_status_on_signature()
RETURNS trigger AS $$
DECLARE
  v_buyer_signed boolean;
  v_supplier_signed boolean;
  v_sellsi_signed boolean;
  v_new_status text;
BEGIN
  IF OLD.status IN ('cancelled_by_buyer', 'cancelled_by_supplier', 'rejected_by_supplier', 
                     'rejected_by_sellsi', 'expired', 'paid', 'partially_paid', 'overdue') THEN
    RETURN NEW;
  END IF;

  v_buyer_signed := NEW.signed_buyer_at IS NOT NULL;
  v_supplier_signed := NEW.signed_supplier_at IS NOT NULL;
  v_sellsi_signed := NEW.signed_sellsi_at IS NOT NULL;

  IF v_sellsi_signed THEN
    v_new_status := 'approved';  -- Volver a 'approved'
  ELSIF v_buyer_signed AND v_supplier_signed THEN
    v_new_status := 'pending_sellsi_approval';
  ELSIF v_buyer_signed AND NOT v_supplier_signed THEN
    v_new_status := 'supplier_signature_pending';
  ELSIF v_supplier_signed AND NOT v_buyer_signed THEN
    v_new_status := 'buyer_signature_pending';
  ELSE
    v_new_status := NEW.status;
  END IF;

  IF v_new_status IS DISTINCT FROM NEW.status THEN
    NEW.status := v_new_status;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restaurar trigger firma admin (versión antigua - NO FUNCIONA)
CREATE OR REPLACE FUNCTION public.on_financing_document_upsert()
RETURNS trigger AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  v_is_admin := (auth.role() = 'admin');  -- ❌ NUNCA funciona en Supabase
  
  IF v_is_admin AND NEW.document_type = 'contrato_marco' THEN
    UPDATE public.financing_requests
    SET signed_sellsi_at = now(), updated_at = now()
    WHERE id = NEW.financing_request_id AND signed_sellsi_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restaurar expire_due_financings (versión antigua)
CREATE OR REPLACE FUNCTION public.expire_due_financings()
RETURNS void AS $$
BEGIN
  UPDATE public.financing_requests
  SET status = 'expired', has_overdue = true, updated_at = now()
  WHERE due_date IS NOT NULL AND due_date < now()::date AND status = 'approved';

  UPDATE public.buyer b
  SET has_overdue_financing = true
  FROM (
    SELECT DISTINCT buyer_id FROM public.financing_requests WHERE status = 'expired'
  ) t
  WHERE b.id = t.buyer_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
*/
