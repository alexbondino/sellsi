-- ============================================================================
-- Migration: RLS Policies para bucket 'product-images'
-- ============================================================================
-- Fecha: 2025-11-19
-- Descripción: Permitir a usuarios autenticados subir/actualizar/eliminar 
--              imágenes de productos que les pertenecen
-- Path structure: {user_id}/{product_id}/{timestamp}.{ext}
-- ============================================================================

-- storage.objects (bucket 'product-images') policies
DO $$
BEGIN
  -- ============================================================================
  -- POLÍTICA 1: INSERT - Permitir que usuarios suban imágenes de sus productos
  -- Validación: el product_id en el path debe pertenecer al usuario autenticado
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'product-images insert owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "product-images insert owner" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
        AND EXISTS (
          SELECT 1 FROM public.products
          WHERE productid = split_part(name, '/', 2)::uuid
            AND supplier_id = auth.uid()
        )
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 2: SELECT (owner) - Permitir que usuarios lean imágenes de sus productos
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'product-images select owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "product-images select owner" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'product-images' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 3: UPDATE - Permitir que usuarios actualicen imágenes de sus productos
  -- Necesario para que funcione la opción upsert: true en el upload
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'product-images update owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "product-images update owner" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'product-images' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
        AND EXISTS (
          SELECT 1 FROM public.products
          WHERE productid = split_part(name, '/', 2)::uuid
            AND supplier_id = auth.uid()
        )
      )
      WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
        AND EXISTS (
          SELECT 1 FROM public.products
          WHERE productid = split_part(name, '/', 2)::uuid
            AND supplier_id = auth.uid()
        )
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 4: DELETE - Permitir que usuarios eliminen imágenes de sus productos
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'product-images delete owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "product-images delete owner" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
        AND EXISTS (
          SELECT 1 FROM public.products
          WHERE productid = split_part(name, '/', 2)::uuid
            AND supplier_id = auth.uid()
        )
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 5: SELECT (public) - Permitir lectura pública de imágenes de productos
  -- Necesario porque las imágenes se muestran en marketplace público
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'product-images select public'
  ) THEN
    EXECUTE $pol$CREATE POLICY "product-images select public" ON storage.objects
      FOR SELECT
      TO public
      USING (
        bucket_id = 'product-images'
      )$pol$;
  END IF;
END$$;
