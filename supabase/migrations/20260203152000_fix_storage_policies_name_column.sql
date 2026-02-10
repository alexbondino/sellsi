-- 20260203152000_fix_storage_policies_name_column.sql
-- Corregir bug crítico: storage.foldername(b.name) debe ser storage.foldername(name)
-- name es la columna de storage.objects con el path del archivo

-- ===== Eliminar policies rotas =====
DROP POLICY IF EXISTS financing_docs_select ON storage.objects;
DROP POLICY IF EXISTS financing_docs_upload ON storage.objects;
DROP POLICY IF EXISTS financing_docs_delete ON storage.objects;
DROP POLICY IF EXISTS financing_docs_update ON storage.objects;

-- ===== Policy SELECT (CORREGIDA) =====
CREATE POLICY "financing_docs_select" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'financing-documents' AND (
      -- Buyer: financing_requests.buyer_id -> buyer.id WHERE buyer.user_id = auth.uid()
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.buyer b ON fr.buyer_id = b.id
        WHERE b.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      -- Supplier: financing_requests.supplier_id -> supplier.id WHERE supplier.user_id = auth.uid()
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.supplier s ON fr.supplier_id = s.id
        WHERE s.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      -- Admin puede ver todo
      EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
    )
  );

-- ===== Policy INSERT (CORREGIDA) =====
CREATE POLICY "financing_docs_upload" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'financing-documents' AND (
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.buyer b ON fr.buyer_id = b.id
        WHERE b.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.supplier s ON fr.supplier_id = s.id
        WHERE s.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
    )
  );

-- ===== Policy DELETE (CORREGIDA) =====
CREATE POLICY "financing_docs_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'financing-documents' AND (
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.buyer b ON fr.buyer_id = b.id
        WHERE b.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.supplier s ON fr.supplier_id = s.id
        WHERE s.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
    )
  );

-- ===== Policy UPDATE (CORREGIDA) =====
CREATE POLICY "financing_docs_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'financing-documents' AND (
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.buyer b ON fr.buyer_id = b.id
        WHERE b.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.supplier s ON fr.supplier_id = s.id
        WHERE s.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
    )
  )
  WITH CHECK (
    bucket_id = 'financing-documents' AND (
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.buyer b ON fr.buyer_id = b.id
        WHERE b.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (
        SELECT 1
        FROM public.financing_requests fr
        INNER JOIN public.supplier s ON fr.supplier_id = s.id
        WHERE s.user_id = auth.uid()
          AND fr.id::text = (storage.foldername(objects.name))[1]  -- FIX: objects.name calificado
      )
      OR
      EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = auth.uid() AND is_active = true)
    )
  );
