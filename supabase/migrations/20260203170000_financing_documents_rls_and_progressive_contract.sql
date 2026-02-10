-- ============================================================================
-- MIGRACIÓN: financing_documents - RLS completo + Documento Progresivo
-- ============================================================================
-- Fecha: 2026-02-03 17:00:00
-- Módulo: Financiamiento
-- 
-- OBJETIVO:
-- 1. Crear constraint único para permitir UPSERT de documento progresivo
-- 2. Agregar políticas RLS faltantes (INSERT, UPDATE, DELETE) 
-- 3. Corregir política SELECT con lógica correcta de JOINs
--
-- FLUJO:
-- - Un solo archivo "contrato_marco_{id}.pdf" evoluciona con cada firma
-- - UPSERT reemplaza archivo en storage y actualiza registro en DB
-- - Triggers actualizan signed_*_at y status automáticamente
-- ============================================================================

-- ============================================================================
-- PARTE 1: CONSTRAINT ÚNICO
-- ============================================================================
-- Garantiza que solo existe UN documento por (financing_request_id, document_type)
-- Esto permite UPSERT: si existe el par, actualiza; si no, inserta

DROP INDEX IF EXISTS public.idx_financing_documents_unique_type;

ALTER TABLE public.financing_documents
  DROP CONSTRAINT IF EXISTS financing_documents_request_type_unique;

ALTER TABLE public.financing_documents
  ADD CONSTRAINT financing_documents_request_type_unique 
  UNIQUE (financing_request_id, document_type);

COMMENT ON CONSTRAINT financing_documents_request_type_unique ON public.financing_documents 
  IS 'Permite UPSERT de documento progresivo: un solo contrato evoluciona con cada firma';

-- ============================================================================
-- PARTE 2: POLÍTICAS RLS
-- ============================================================================

-- ===== SELECT: Quién puede VER documentos =====
-- Buyer/Supplier/Admin pueden ver documentos de sus propios financiamientos
-- IMPORTANTE: Usa EXISTS con JOIN (no comparar buyer_id/supplier_id con auth.uid())
DROP POLICY IF EXISTS "fin_doc_access" ON public.financing_documents;
CREATE POLICY "fin_doc_access" ON public.financing_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.buyer b ON b.id = fr.buyer_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND b.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.supplier s ON s.id = fr.supplier_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND s.user_id = auth.uid()
    )
    OR auth.role() = 'admin'
  );

-- ===== INSERT: Quién puede CREAR documentos =====
-- Buyer/Supplier/Admin pueden insertar documentos en sus financiamientos
DROP POLICY IF EXISTS "fin_doc_insert" ON public.financing_documents;
CREATE POLICY "fin_doc_insert" ON public.financing_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.buyer b ON b.id = fr.buyer_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND b.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.supplier s ON s.id = fr.supplier_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND s.user_id = auth.uid()
    )
    OR auth.role() = 'admin'
  );

-- ===== UPDATE: Quién puede MODIFICAR documentos =====
-- Buyer/Supplier/Admin pueden actualizar documentos (para UPSERT de firmas)
DROP POLICY IF EXISTS "fin_doc_update" ON public.financing_documents;
CREATE POLICY "fin_doc_update" ON public.financing_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.buyer b ON b.id = fr.buyer_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND b.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.supplier s ON s.id = fr.supplier_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND s.user_id = auth.uid()
    )
    OR auth.role() = 'admin'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.buyer b ON b.id = fr.buyer_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND b.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.supplier s ON s.id = fr.supplier_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND s.user_id = auth.uid()
    )
    OR auth.role() = 'admin'
  );

-- ===== DELETE: Quién puede ELIMINAR documentos =====
-- Buyer/Supplier/Admin pueden eliminar documentos de sus financiamientos
-- NOTA: Evaluar si restringir solo a admin en producción
DROP POLICY IF EXISTS "fin_doc_delete" ON public.financing_documents;
CREATE POLICY "fin_doc_delete" ON public.financing_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.buyer b ON b.id = fr.buyer_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND b.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.financing_requests fr
      JOIN public.supplier s ON s.id = fr.supplier_id
      WHERE fr.id = financing_documents.financing_request_id 
        AND s.user_id = auth.uid()
    )
    OR auth.role() = 'admin'
  );

-- ============================================================================
-- VALIDACIONES
-- ============================================================================

-- Verificar que RLS está habilitado
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'financing_documents') THEN
    RAISE EXCEPTION 'RLS no está habilitado en financing_documents';
  END IF;
  
  RAISE NOTICE '✅ RLS habilitado en financing_documents';
  RAISE NOTICE '✅ Constraint único creado: financing_documents_request_type_unique';
  RAISE NOTICE '✅ Políticas RLS creadas: SELECT, INSERT, UPDATE, DELETE';
END $$;

-- ============================================================================
-- FLUJO DOCUMENTO PROGRESIVO
-- ============================================================================
-- 
-- GENERACIÓN INICIAL (Edge Function):
--   - Edge function generate-financing-contract
--   - UPSERT en financing_documents: (financing_request_id, 'contrato_marco')
--   - Upload a storage: {financing_id}/contrato_marco_{financing_id}.pdf
--   - Trigger: on_financing_document_upsert NO actualiza signed_*_at (archivo generado)
--
-- BUYER FIRMA:
--   1. Frontend descarga: storage.download('contrato_marco_{id}.pdf')
--   2. Usuario firma offline (Adobe, DocuSign, etc.)
--   3. Frontend upload con UPSERT: storage.upload(..., {upsert: true})
--   4. Frontend UPSERT DB: onConflict('financing_request_id,document_type')
--   5. Delay 500ms para triggers
--   6. Trigger on_financing_document_upsert: actualiza signed_buyer_at
--   7. Trigger update_financing_status_on_signature: status → 'supplier_signature_pending'
--
-- SUPPLIER FIRMA:
--   1. Descarga contrato (ahora con firma buyer)
--   2. Agrega su firma
--   3. Upload REEMPLAZA archivo en storage
--   4. UPSERT DB actualiza mismo registro
--   5. Trigger: signed_supplier_at actualizado
--   6. Trigger: status → 'pending_sellsi_approval'
--
-- ADMIN FIRMA:
--   1. Descarga contrato (con firma buyer + supplier)
--   2. Agrega firma final
--   3. Upload REEMPLAZA
--   4. UPSERT DB
--   5. Trigger: signed_sellsi_at actualizado
--   6. Trigger: status → 'approved'
--
-- ============================================================================

-- ============================================================================
-- VENTAJAS
-- ============================================================================
-- ✅ Archivo único evoluciona (no versiones múltiples)
-- ✅ Storage limpio (no archivos huérfanos)
-- ✅ Nombre consistente para descargas
-- ✅ UPSERT automático gracias a constraint único
-- ✅ Integridad garantizada

-- ============================================================================
-- CASOS EDGE VALIDADOS
-- ============================================================================
-- ✅ Re-firma: UPSERT permite múltiples firmas del mismo actor
-- ✅ Orden flexible: Buyer o Supplier pueden firmar primero
-- ✅ Documento huérfano: FK financing_request_id previene
-- ✅ Acceso no autorizado: RLS policies verifican ownership
-- ✅ Tamaño: Trigger validate_financing_document_upload valida 10MB max
-- ✅ Tipo: Trigger valida solo PDF

-- ============================================================================
-- PERFORMANCE
-- ============================================================================
-- ✅ Índices únicos existen: uq_buyer_user_id, uq_supplier_user_id
-- ✅ JOINs usan índices en buyer.id y supplier.id (PKs)
-- ✅ EXISTS es eficiente con índices correctos
-- ✅ Patrón consistente con financing_requests

-- ============================================================================
-- SEGURIDAD
-- ============================================================================
-- ✅ RLS policies verifican ownership vía buyer.user_id / supplier.user_id
-- ✅ No expone buyer_id/supplier_id directamente
-- ✅ Admin tiene acceso total
-- ⚠️ DELETE permite a buyer/supplier eliminar - evaluar restringir a admin

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- DROP POLICY IF EXISTS "fin_doc_insert" ON public.financing_documents;
-- DROP POLICY IF EXISTS "fin_doc_update" ON public.financing_documents;
-- DROP POLICY IF EXISTS "fin_doc_delete" ON public.financing_documents;
-- DROP POLICY IF EXISTS "fin_doc_access" ON public.financing_documents;
-- ALTER TABLE public.financing_documents DROP CONSTRAINT IF EXISTS financing_documents_request_type_unique;
