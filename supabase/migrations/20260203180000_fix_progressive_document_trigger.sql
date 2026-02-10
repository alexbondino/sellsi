-- ============================================================================
-- MIGRACIÓN: Fix trigger on_financing_document_upsert para documento progresivo
-- ============================================================================
-- Fecha: 2026-02-03 18:00:00
-- Módulo: Financiamiento
-- 
-- PROBLEMA CRÍTICO:
-- El trigger on_financing_document_upsert busca document_type específicos:
--   - 'contrato_buyer_signed'
--   - 'contrato_supplier_signed'
--   - 'contrato_final'
--
-- Pero el documento progresivo usa SIEMPRE:
--   - document_type: 'contrato_marco'
--   - document_name: 'contrato_marco_{id}.pdf'
--
-- RESULTADO: El trigger NO actualiza signed_*_at y el flujo de firmas NO funciona
--
-- SOLUCIÓN:
-- Detectar quién subió el archivo usando:
--   1. Contexto de usuario autenticado (auth.uid())
--   2. Verificar si el usuario es buyer o supplier del financing
--   3. Actualizar el signed_*_at correspondiente
--
-- VENTAJA:
-- - No depende de nombres de archivo
-- - Funciona con documento progresivo
-- - Soporta re-firma (UPSERT)
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

  -- Verificar si el usuario es admin
  BEGIN
    v_is_admin := (auth.role() = 'admin');
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

-- El trigger ya existe desde migración anterior, solo reemplazamos la función

-- ============================================================================
-- FLUJO ACTUALIZADO
-- ============================================================================
--
-- GENERACIÓN INICIAL (Edge Function con SERVICE_ROLE):
--   1. Edge Function UPSERT financing_documents con document_type='contrato_marco'
--   2. Trigger: auth.uid() = NULL, NO actualiza signed_*_at ✅
--   3. Financing permanece en status original (ej: 'pending_supplier_review')
--
-- BUYER FIRMA:
--   1. Buyer descarga, firma offline, upload con UPSERT
--   2. Frontend UPSERT financing_documents (auth.uid() = buyer.user_id)
--   3. Trigger: Detecta user_id = buyer → UPDATE signed_buyer_at ✅
--   4. Trigger update_financing_status_on_signature: status → 'supplier_signature_pending'
--
-- SUPPLIER FIRMA:
--   1. Supplier descarga, firma offline, upload con UPSERT
--   2. Frontend UPSERT financing_documents (auth.uid() = supplier.user_id)
--   3. Trigger: Detecta user_id = supplier → UPDATE signed_supplier_at ✅
--   4. Trigger update_financing_status_on_signature: status → 'pending_sellsi_approval'
--
-- ADMIN APRUEBA:
--   1. Admin descarga, firma, upload con UPSERT
--   2. Control Panel UPSERT financing_documents (auth.role() = 'admin')
--   3. Trigger: Detecta admin → UPDATE signed_sellsi_at ✅
--   4. Trigger update_financing_status_on_signature: status → 'approved'
--
-- ============================================================================

-- ============================================================================
-- VALIDACIÓN POST-DEPLOY
-- ============================================================================
-- Verificar que la función existe y tiene la firma correcta:
-- SELECT p.proname, pg_get_functiondef(p.oid)
-- FROM pg_proc p
-- WHERE p.proname = 'on_financing_document_upsert';

-- ============================================================================
-- ROLLBACK (restaurar versión anterior)
-- ============================================================================
/*
CREATE OR REPLACE FUNCTION public.on_financing_document_upsert()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.financing_requests fr WHERE fr.id = NEW.financing_id) THEN
    RAISE NOTICE 'Financing not found: %', NEW.financing_id;
    RETURN NEW;
  END IF;

  IF NEW.document_type = 'contrato_buyer_signed' OR NEW.document_name ILIKE '%buyer_signed%' THEN
    UPDATE public.financing_requests SET signed_buyer_at = now(), updated_at = now() WHERE id = NEW.financing_id;
  ELSIF NEW.document_type = 'contrato_supplier_signed' OR NEW.document_name ILIKE '%supplier_signed%' THEN
    UPDATE public.financing_requests SET signed_supplier_at = now(), updated_at = now() WHERE id = NEW.financing_id;
  ELSIF NEW.document_type = 'contrato_final' OR NEW.document_name ILIKE '%final%' THEN
    UPDATE public.financing_requests SET signed_sellsi_at = now(), updated_at = now() WHERE id = NEW.financing_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
