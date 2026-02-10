-- 20260203143000_fix_financing_storage_policies.sql
-- Módulo: Financiamiento - Fix Storage RLS Policies
-- Fecha/Version: 2026-02-03 14:30:00
-- Objetivo: Corregir las policies de storage para que funcionen con la estructura real
--           buyer/supplier tienen user_id que referencia a auth.uid(), no directamente

DO $$
BEGIN
  -- Intentar crear/actualizar las policies; si falla por permisos, emitir NOTICE y continuar
  BEGIN
    -- Recrear policy SELECT con JOIN correcto a través de buyer/supplier.user_id
    DROP POLICY IF EXISTS financing_docs_select ON storage.objects;
    CREATE POLICY "financing_docs_select" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'financing-documents' AND (
          -- Buyer puede ver: financing_request.buyer_id -> buyer.id WHERE buyer.user_id = auth.uid()
          EXISTS (
            SELECT 1
            FROM public.financing_requests fr
            INNER JOIN public.buyer b ON fr.buyer_id = b.id
            WHERE b.user_id = auth.uid()
              AND fr.id::text = (storage.foldername(name))[1]
          )
          OR
          -- Supplier puede ver: financing_request.supplier_id -> supplier.id WHERE supplier.user_id = auth.uid()
          EXISTS (
            SELECT 1
            FROM public.financing_requests fr
            INNER JOIN public.supplier s ON fr.supplier_id = s.id
            WHERE s.user_id = auth.uid()
              AND fr.id::text = (storage.foldername(name))[1]
          )
          OR
          -- Admin puede ver todo
          EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
        )
      );

    -- Recrear policy UPLOAD con JOIN correcto
    DROP POLICY IF EXISTS financing_docs_upload ON storage.objects;
    CREATE POLICY "financing_docs_upload" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'financing-documents' AND (
          -- Buyer puede subir a su propio financing
          EXISTS (
            SELECT 1
            FROM public.financing_requests fr
            INNER JOIN public.buyer b ON fr.buyer_id = b.id
            WHERE b.user_id = auth.uid()
              AND fr.id::text = (storage.foldername(name))[1]
          )
          OR
          -- Supplier puede subir a su propio financing
          EXISTS (
            SELECT 1
            FROM public.financing_requests fr
            INNER JOIN public.supplier s ON fr.supplier_id = s.id
            WHERE s.user_id = auth.uid()
              AND fr.id::text = (storage.foldername(name))[1]
          )
          OR
          -- Admin puede subir
          EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
        )
      );

    -- Recrear policy DELETE con JOIN correcto
    DROP POLICY IF EXISTS financing_docs_delete ON storage.objects;
    CREATE POLICY "financing_docs_delete" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'financing-documents' AND (
          -- Solo buyer puede eliminar
          EXISTS (
            SELECT 1
            FROM public.financing_requests fr
            INNER JOIN public.buyer b ON fr.buyer_id = b.id
            WHERE b.user_id = auth.uid()
              AND fr.id::text = (storage.foldername(name))[1]
          )
          OR
          -- Admin puede eliminar
          EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
        )
      );

    -- Recrear policy UPDATE con JOIN correcto
    DROP POLICY IF EXISTS financing_docs_update ON storage.objects;
    CREATE POLICY "financing_docs_update" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'financing-documents' AND (
          (
            -- Buyer puede actualizar archivos buyer_signed
            storage.filename(name) LIKE '%buyer_signed%' AND
            EXISTS (
              SELECT 1
              FROM public.financing_requests fr
              INNER JOIN public.buyer b ON fr.buyer_id = b.id
              WHERE b.user_id = auth.uid()
                AND fr.id::text = (storage.foldername(name))[1]
            )
          ) OR (
            -- Supplier puede actualizar archivos supplier_signed
            storage.filename(name) LIKE '%supplier_signed%' AND
            EXISTS (
              SELECT 1
              FROM public.financing_requests fr
              INNER JOIN public.supplier s ON fr.supplier_id = s.id
              WHERE s.user_id = auth.uid()
                AND fr.id::text = (storage.foldername(name))[1]
            )
          ) OR (
            -- Admin puede actualizar archivos final
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

-- ===== Rollback =====
-- Se pueden recrear las policies originales desde 20260120090003_financing_storage_bucket.sql
