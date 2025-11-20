-- ============================================================================
-- Migration: RLS Policies para bucket 'product-images-thumbnails'
-- ============================================================================
-- Fecha: 2025-11-20
-- Descripción: Permitir acceso al bucket de thumbnails generados automáticamente
--              por la Edge Function generate-thumbnail
-- Path structure: {user_id}/{product_id}/thumb_{timestamp}.{ext}
-- ============================================================================

-- storage.objects (bucket 'product-images-thumbnails') policies
DO $$
BEGIN
  -- ============================================================================
  -- POLÍTICA 1: INSERT - Permitir que la Edge Function suba thumbnails
  -- Solo service_role y authenticated pueden insertar (Edge Function usa service_role)
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'thumbnails insert service'
  ) THEN
    EXECUTE $pol$CREATE POLICY "thumbnails insert service" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images-thumbnails'
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 2: SELECT (owner) - Permitir que usuarios lean thumbnails de sus productos
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'thumbnails select owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "thumbnails select owner" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'product-images-thumbnails' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 3: SELECT (public) - Permitir lectura pública de thumbnails
  -- Necesario porque los thumbnails se muestran en marketplace público
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'thumbnails select public'
  ) THEN
    EXECUTE $pol$CREATE POLICY "thumbnails select public" ON storage.objects
      FOR SELECT
      TO public
      USING (
        bucket_id = 'product-images-thumbnails'
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 4: UPDATE - Permitir que se actualicen thumbnails (upsert)
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'thumbnails update service'
  ) THEN
    EXECUTE $pol$CREATE POLICY "thumbnails update service" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'product-images-thumbnails'
      )
      WITH CHECK (
        bucket_id = 'product-images-thumbnails'
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLÍTICA 5: DELETE - Permitir que usuarios eliminen thumbnails de sus productos
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'thumbnails delete owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "thumbnails delete owner" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images-thumbnails' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )$pol$;
  END IF;
END$$;
