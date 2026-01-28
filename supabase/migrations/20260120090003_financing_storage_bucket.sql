-- 20260120090003_financing_storage_bucket.sql
-- Módulo: Financiamiento - Storage Bucket + RLS
-- Fecha/Version: 2026-01-21 12:30:00
-- Objetivo: Crear el bucket `financing-documents` y las políticas RLS para que
--           solo el buyer/supplier relacionados con un financing puedan
--           acceder a los objetos.

BEGIN;

-- 1) Crear bucket (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'financing-documents') THEN
    INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
    VALUES (
      'financing-documents',
      'financing-documents',
      false,
      10485760, -- 10 MB
      ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ]::text[]
    );
  END IF;
END;
$$;

-- 2) Asegurar RLS activado en storage.objects (si aplica) y crear policies de forma segura
DO $$
BEGIN
  -- Intentar habilitar RLS; si no se tiene permiso, no fallar la migración
  BEGIN
    EXECUTE 'ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping enabling RLS on storage.objects: insufficient privileges for current role';
  END;

  -- Intentar crear las policies; si falla por permisos, emitir NOTICE y continuar
  BEGIN
    -- Policy: Subida (INSERT) - Sólo usuarios autenticados que pertenezcan al financing
    DROP POLICY IF EXISTS financing_docs_upload ON storage.objects;
    CREATE POLICY "financing_docs_upload" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'financing-documents' AND
        (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.financing_requests WHERE buyer_id = auth.uid() OR supplier_id = auth.uid()
        )
      );

    -- Policy: Ver/Descargar (SELECT) - Buyer, Supplier del financing o admin
    DROP POLICY IF EXISTS financing_docs_select ON storage.objects;
    CREATE POLICY "financing_docs_select" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'financing-documents' AND (
          (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.financing_requests WHERE buyer_id = auth.uid() OR supplier_id = auth.uid()
          )
          OR EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
        )
      );

    -- Policy: Eliminar (DELETE) - Sólo Buyer del financing puede eliminar
    DROP POLICY IF EXISTS financing_docs_delete ON storage.objects;
    CREATE POLICY "financing_docs_delete" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'financing-documents' AND
        (storage.foldername(name))[1] IN (
          SELECT id::text FROM public.financing_requests WHERE buyer_id = auth.uid()
        )
      );

    -- Policy: UPDATE (sobrescribir) - Restricción por nombre de archivo para asegurar roles
    DROP POLICY IF EXISTS financing_docs_update ON storage.objects;
    CREATE POLICY "financing_docs_update" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'financing-documents' AND (
          (
            storage.filename(name) LIKE '%buyer_signed%' AND
            (storage.foldername(name))[1] IN (
              SELECT id::text FROM public.financing_requests WHERE buyer_id = auth.uid()
            )
          ) OR (
            storage.filename(name) LIKE '%supplier_signed%' AND
            (storage.foldername(name))[1] IN (
              SELECT id::text FROM public.financing_requests WHERE supplier_id = auth.uid()
            )
          ) OR (
            storage.filename(name) LIKE '%final%' AND
            EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
          )
        )
      )
      WITH CHECK (bucket_id = 'financing-documents');

  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping creation of storage.objects policies: insufficient privileges for current role';
  END;
END;
$$;

-- Trigger/Function: Validaciones previas a INSERT/UPDATE en financing_documents
-- Asegura orden de firmas, mime y tamaño
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

  -- Restricción de orden: supplier no puede firmar antes que buyer
  IF (NEW.document_name ILIKE '%supplier_signed%') AND v_signed_buyer IS NULL THEN
    RAISE EXCEPTION 'Buyer must sign before supplier can upload supplier_signed for financing %', NEW.financing_id;
  END IF;

  -- Restricción de orden: final sólo si buyer y supplier ya firmaron
  IF (NEW.document_name ILIKE '%final%') AND (v_signed_buyer IS NULL OR v_signed_supplier IS NULL) THEN
    RAISE EXCEPTION 'Both buyer and supplier must sign before uploading final file for financing %', NEW.financing_id;
  END IF;

  -- Validar mime_type si viene presente
  IF NEW.mime_type IS NOT NULL AND NOT (NEW.mime_type IN (
      'application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )) THEN
    RAISE EXCEPTION 'Invalid mime type: %', NEW.mime_type;
  END IF;

  -- Validar tamaño
  IF NEW.file_size IS NOT NULL AND NEW.file_size > 10485760 THEN
    RAISE EXCEPTION 'File too large: % (max 10485760)', NEW.file_size;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_financing_documents_validate ON public.financing_documents;
CREATE TRIGGER trg_financing_documents_validate
  BEFORE INSERT OR UPDATE ON public.financing_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_financing_document_upload();

-- Trigger/Function: actualizar timestamps signed_*_at en financing_requests cuando
-- se inserte o actualice un registro en financing_documents (mantener comportamiento existente)
CREATE OR REPLACE FUNCTION public.on_financing_document_upsert()
RETURNS trigger AS $$
BEGIN
  -- Validar que financing exista
  IF NOT EXISTS (SELECT 1 FROM public.financing_requests fr WHERE fr.id = NEW.financing_id) THEN
    RAISE NOTICE 'Financing not found: %', NEW.financing_id;
    RETURN NEW;
  END IF;

  -- Actualizar timestamps según document_type o nombre de archivo
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

DROP TRIGGER IF EXISTS trg_financing_documents_upsert ON public.financing_documents;
CREATE TRIGGER trg_financing_documents_upsert
  AFTER INSERT OR UPDATE ON public.financing_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.on_financing_document_upsert();

-- 4) Comentarios / pruebas sugeridas (SQL de prueba paso a paso)
-- Ejecutar estas pruebas en el SQL Editor de dev (en orden) para validar reglas de negocio y RLS
-- 0) Precondiciones: Tener un buyer (user), supplier (user) y un financing_request creado.
--    -- Insertar datos de prueba:
--    INSERT INTO public.buyer(user_id, name, email) VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'Test Buyer','buyer@example.com');
--    INSERT INTO public.supplier(user_id, name, legal_rut) VALUES ('00000000-0000-0000-0000-000000000002'::uuid, 'Test Supplier','12345678-9');
--    -- Crear financing (usando los ids anteriores)
--    INSERT INTO public.financing_requests(id, buyer_id, supplier_id, amount, available_amount, status)
--    VALUES ('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 100000, 100000, 'approved_by_sellsi');
--
-- 1) Intentar que SUPPLIER suba su firmado ANTES que BUYER lo haya firmado (debe FALLAR):
--    -- Simular INSERT como supplier (ejecutar con sesión supplier vía SQL editor si es posible):
--    INSERT INTO public.financing_documents (id, financing_id, document_type, document_name, storage_path, file_size, mime_type, uploaded_by)
--    VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'contrato', 'contrato_supplier_signed.pdf', '11111111-1111-1111-1111-111111111111/contrato_supplier_signed.pdf', 1024, 'application/pdf', '00000000-0000-0000-0000-000000000002'::uuid);
--    -- Resultado esperado: ERROR 'Buyer must sign before supplier can upload supplier_signed'
--
-- 2) Buyer sube su firmado (debe SUCEDER):
--    INSERT INTO public.financing_documents (id, financing_id, document_type, document_name, storage_path, file_size, mime_type, uploaded_by)
--    VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'contrato', 'contrato_buyer_signed.pdf', '11111111-1111-1111-1111-111111111111/contrato_buyer_signed.pdf', 1024, 'application/pdf', '00000000-0000-0000-0000-000000000001'::uuid);
--    -- Resultado esperado: INSERT ok + ON INSERT trigger sets financing_requests.signed_buyer_at
--
-- 3) Ahora SUPPLIER sube su firmado (debe SUCEDER):
--    INSERT INTO public.financing_documents (id, financing_id, document_type, document_name, storage_path, file_size, mime_type, uploaded_by)
--    VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'contrato', 'contrato_supplier_signed.pdf', '11111111-1111-1111-1111-111111111111/contrato_supplier_signed.pdf', 1024, 'application/pdf', '00000000-0000-0000-0000-000000000002'::uuid);
--    -- Resultado esperado: INSERT ok + ON INSERT trigger sets financing_requests.signed_supplier_at
--
-- 4) Intentar subir FINAL antes de ambas firmas (ya no aplica porque ambas existen), pero test: SUBIR final
--    INSERT INTO public.financing_documents (id, financing_id, document_type, document_name, storage_path, file_size, mime_type, uploaded_by)
--    VALUES (gen_random_uuid(), '11111111-1111-1111-1111-111111111111'::uuid, 'contrato', 'contrato_final.pdf', '11111111-1111-1111-1111-111111111111/contrato_final.pdf', 2048, 'application/pdf', (SELECT id FROM public.control_panel_users LIMIT 1));
--    -- Resultado esperado: INSERT ok + ON INSERT trigger sets signed_sellsi_at
--
-- 5) Probar validaciones de mime/tamaño:
--    INSERT con mime_type = 'text/plain' -> debe FALLAR (Invalid mime type)
--    INSERT con file_size = 20000000 -> debe FALLAR (File too large)
--
-- Notas:
-- - Ejecutar estos statements con usuarios/sesiones que representen buyer/supplier/admin para validar RLS real.
-- - Si tu entorno no permite simular sesiones diferentes desde SQL editor, realiza los uploads desde el SDK/Frontend con las credenciales de usuario correspondientes.


COMMIT;

-- ===== Rollback =====
-- DROP POLICY IF EXISTS financing_docs_select ON storage.objects;
-- DROP POLICY IF EXISTS financing_docs_admin_select ON storage.objects;
-- DROP POLICY IF EXISTS financing_docs_insert ON storage.objects;
-- DELETE FROM storage.buckets WHERE id = 'financing-documents';
