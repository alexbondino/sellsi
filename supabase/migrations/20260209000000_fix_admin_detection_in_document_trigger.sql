-- ============================================================================
-- Fix Admin Detection in on_financing_document_upsert Trigger
-- ============================================================================
-- Fecha: 2026-02-09
-- Módulo: Financiamiento
-- 
-- PROBLEMA CRÍTICO:
-- El trigger on_financing_document_upsert usa auth.role() = 'admin' para detectar
-- si el usuario que sube el documento es admin.
-- 
-- PERO auth.role() en Supabase solo retorna: 'anon', 'authenticated', 'service_role'
-- NUNCA retorna 'admin' → El trigger NUNCA actualiza signed_sellsi_at
-- 
-- SOLUCIÓN:
-- Usar la función is_admin_user() que verifica si auth.uid() existe en
-- control_panel_users con is_active = TRUE
-- 
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

  -- ✅ FIX: Usar is_admin_user() en lugar de auth.role() = 'admin'
  BEGIN
    v_is_admin := public.is_admin_user();
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := FALSE;
  END;

  RAISE NOTICE '[on_financing_document_upsert] Document upload context: user_id=%, is_admin=%, document_type=%', 
    v_current_user_id, v_is_admin, NEW.document_type;

  -- LÓGICA DE DETECCIÓN:
  -- 1. Si document_type es explícito de firma específica → usar esa lógica (retrocompatibilidad)
  -- 2. Si document_type es 'contrato_marco' (progresivo) → detectar por contexto de usuario
  -- 3. Si document_name tiene '_final' o es admin → signed_sellsi_at

  IF NEW.document_type = 'contrato_buyer_signed' OR NEW.document_name ILIKE '%buyer_signed%' THEN
    -- Firma buyer explícita (legacy o específica)
    UPDATE public.financing_requests 
    SET signed_buyer_at = now(), updated_at = now() 
    WHERE id = NEW.financing_id;
    
    RAISE NOTICE '[on_financing_document_upsert] ✅ Updated signed_buyer_at for financing %', NEW.financing_id;
    
  ELSIF NEW.document_type = 'contrato_supplier_signed' OR NEW.document_name ILIKE '%supplier_signed%' THEN
    -- Firma supplier explícita (legacy o específica)
    UPDATE public.financing_requests 
    SET signed_supplier_at = now(), updated_at = now() 
    WHERE id = NEW.financing_id;
    
    RAISE NOTICE '[on_financing_document_upsert] ✅ Updated signed_supplier_at for financing %', NEW.financing_id;
    
  ELSIF NEW.document_type = 'contrato_final' OR NEW.document_name ILIKE '%final%' THEN
    -- Firma admin/sellsi
    UPDATE public.financing_requests 
    SET signed_sellsi_at = now(), updated_at = now() 
    WHERE id = NEW.financing_id;
    
    RAISE NOTICE '[on_financing_document_upsert] ✅ Updated signed_sellsi_at for financing %', NEW.financing_id;
    
  ELSIF NEW.document_type = 'contrato_marco' THEN
    -- DOCUMENTO PROGRESIVO: detectar por contexto
    
    IF v_is_admin THEN
      -- ✅ Admin detectado correctamente → actualizar signed_sellsi_at
      UPDATE public.financing_requests 
      SET signed_sellsi_at = now(), updated_at = now() 
      WHERE id = NEW.financing_id;
      
      RAISE NOTICE '[on_financing_document_upsert] ✅ Admin signing detected - Updated signed_sellsi_at for financing %', NEW.financing_id;
      
    ELSIF v_current_user_id = v_buyer_user_id THEN
      -- Usuario autenticado es el buyer → actualizar signed_buyer_at
      UPDATE public.financing_requests 
      SET signed_buyer_at = now(), updated_at = now() 
      WHERE id = NEW.financing_id;
      
      RAISE NOTICE '[on_financing_document_upsert] ✅ Buyer signing detected - Updated signed_buyer_at for financing %', NEW.financing_id;
      
    ELSIF v_current_user_id = v_supplier_user_id THEN
      -- Usuario autenticado es el supplier → actualizar signed_supplier_at
      UPDATE public.financing_requests 
      SET signed_supplier_at = now(), updated_at = now() 
      WHERE id = NEW.financing_id;
      
      RAISE NOTICE '[on_financing_document_upsert] ✅ Supplier signing detected - Updated signed_supplier_at for financing %', NEW.financing_id;
      
    ELSE
      -- Usuario desconocido o SERVICE_ROLE sin contexto
      -- NO actualizar signed_*_at (puede ser generación automática)
      RAISE NOTICE '[on_financing_document_upsert] ⚠️ Document upserted by unknown user (auth.uid=%, admin=%), no signature timestamp updated', v_current_user_id, v_is_admin;
    END IF;
    
  ELSE
    -- Tipo de documento desconocido, no actualizar timestamps
    RAISE NOTICE '[on_financing_document_upsert] ⚠️ Unknown document_type: %, no signature timestamp updated', NEW.document_type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.on_financing_document_upsert IS 
  'Actualiza signed_*_at según el tipo de documento y el contexto del usuario. Usa is_admin_user() para detectar admins.';

-- ============================================================================
-- VALIDACIÓN POST-DEPLOY
-- ============================================================================
-- Verificar que la función se actualizó correctamente:
-- SELECT p.proname, pg_get_functiondef(p.oid)
-- FROM pg_proc p
-- WHERE p.proname = 'on_financing_document_upsert';

-- Verificar trigger:
-- SELECT tgname, tgrelid::regclass, proname
-- FROM pg_trigger t
-- JOIN pg_proc p ON t.tgfoid = p.oid
-- WHERE tgname = 'trigger_on_financing_document_upsert';

-- ============================================================================
-- TESTING
-- ============================================================================
-- 1. Admin sube contrato firmado:
--    - Autenticar como admin en control_panel
--    - Llamar uploadFinancingDocument() → RPC admin_insert_financing_document
--    - Verificar que signed_sellsi_at se actualiza
--
-- 2. Buyer firma contrato:
--    - Autenticar como buyer en Sellsi app
--    - Subir documento con document_type='contrato_marco'
--    - Verificar que signed_buyer_at se actualiza
--
-- 3. Supplier firma contrato:
--    - Autenticar como supplier en Sellsi app
--    - Subir documento con document_type='contrato_marco'
--    - Verificar que signed_supplier_at se actualiza
