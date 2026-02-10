-- 20260203162000_remove_signature_order_restriction.sql
-- Módulo: Financiamiento - Eliminar restricción de orden de firmas
-- Fecha/Version: 2026-02-03 16:20:00
-- Objetivo: 
--   Permitir que supplier pueda firmar antes que buyer (orden flexible)
--   La migración 20260203160000 ya creó el trigger automático de status
--   Esta migración complementa removiendo la restricción artificial

-- ===== ACTUALIZAR FUNCIÓN DE VALIDACIÓN =====
-- Elimina la restricción que bloqueaba supplier_signed si buyer no había firmado
-- El trigger update_financing_status_on_signature (creado en migración anterior)
-- manejará correctamente el status independientemente del orden de firmas

CREATE OR REPLACE FUNCTION public.validate_financing_document_upload()
RETURNS trigger AS $$
DECLARE
  v_signed_buyer timestamptz;
  v_signed_supplier timestamptz;
BEGIN
  -- Validar que el financing exista
  IF NOT EXISTS (SELECT 1 FROM public.financing_requests fr WHERE fr.id = NEW.financing_id) THEN
    RAISE EXCEPTION 'Financing not found: %', NEW.financing_id;
  END IF;

  SELECT signed_buyer_at, signed_supplier_at
  INTO v_signed_buyer, v_signed_supplier
  FROM public.financing_requests WHERE id = NEW.financing_id;

  -- ❌ RESTRICCIÓN ELIMINADA: supplier no puede firmar antes que buyer
  -- Motivo: Hay flujos válidos donde supplier firma primero (ej: aprobación express)
  -- El trigger update_financing_status_on_signature manejará el status correctamente:
  --   - Solo buyer firmó → status = 'supplier_signature_pending'
  --   - Solo supplier firmó → status = 'buyer_signature_pending'
  --   - Ambos firmaron → status = 'pending_sellsi_approval'
  
  -- ✅ Restricción mantenida: documento final solo si ambos firmaron
  IF (NEW.document_name ILIKE '%final%') AND (v_signed_buyer IS NULL OR v_signed_supplier IS NULL) THEN
    RAISE EXCEPTION 'Both buyer and supplier must sign before uploading final file for financing %', NEW.financing_id;
  END IF;

  -- Validar mime_type si viene presente
  IF NEW.mime_type IS NOT NULL AND NOT (NEW.mime_type IN (
      'application/pdf','image/jpeg','image/png','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )) THEN
    RAISE EXCEPTION 'Invalid mime type: %', NEW.mime_type;
  END IF;

  -- Validar tamaño máximo 10MB
  IF NEW.file_size IS NOT NULL AND NEW.file_size > 10485760 THEN
    RAISE EXCEPTION 'File too large: % bytes (max 10485760)', NEW.file_size;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== FLUJO COMPLETO ACTUALIZADO =====
-- 1. Usuario (buyer/supplier) sube PDF firmado → Storage bucket
-- 2. Frontend: INSERT en financing_documents con document_type apropiado
-- 3. AFTER INSERT trigger on_financing_document_upsert: UPDATE signed_*_at
-- 4. BEFORE UPDATE trigger (migración anterior): Calcula status automáticamente
--    - Buyer firmó → 'supplier_signature_pending'
--    - Supplier firmó → 'buyer_signature_pending'  
--    - Ambos firmaron → 'pending_sellsi_approval'
--    - Sellsi aprobó → 'approved'
-- 5. Frontend refetch → UI actualizada con status correcto
--
-- ✅ VENTAJA CLAVE: Orden de firmas ya NO importa
-- El sistema ahora soporta cualquier secuencia de firmas

-- ===== ROLLBACK =====
-- Para restaurar la restricción original (buyer primero):
/*
CREATE OR REPLACE FUNCTION public.validate_financing_document_upload()
RETURNS trigger AS $$
DECLARE
  v_signed_buyer timestamptz;
  v_signed_supplier timestamptz;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.financing_requests fr WHERE fr.id = NEW.financing_id) THEN
    RAISE EXCEPTION 'Financing not found: %', NEW.financing_id;
  END IF;

  SELECT signed_buyer_at, signed_supplier_at
  INTO v_signed_buyer, v_signed_supplier
  FROM public.financing_requests WHERE id = NEW.financing_id;

  -- Restaurar restricción de orden
  IF (NEW.document_name ILIKE '%supplier_signed%') AND v_signed_buyer IS NULL THEN
    RAISE EXCEPTION 'Buyer must sign before supplier for financing %', NEW.financing_id;
  END IF;

  IF (NEW.document_name ILIKE '%final%') AND (v_signed_buyer IS NULL OR v_signed_supplier IS NULL) THEN
    RAISE EXCEPTION 'Both buyer and supplier must sign before uploading final file for financing %', NEW.financing_id;
  END IF;

  IF NEW.mime_type IS NOT NULL AND NOT (NEW.mime_type IN (
      'application/pdf','image/jpeg','image/png','application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )) THEN
    RAISE EXCEPTION 'Invalid mime type: %', NEW.mime_type;
  END IF;

  IF NEW.file_size IS NOT NULL AND NEW.file_size > 10485760 THEN
    RAISE EXCEPTION 'File too large: % bytes (max 10485760)', NEW.file_size;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
