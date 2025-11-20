-- ============================================================================
-- Migration: RLS Policies para bucket 'user-logos'
-- ============================================================================
-- Fecha: 2025-11-17
-- Descripcion: Permitir a usuarios autenticados subir/actualizar/eliminar 
--              sus propios logos en storage.objects
-- Patron: Basado en politicas de bucket 'invoices' (20250819130000)
-- ============================================================================

-- storage.objects (bucket 'user-logos') policies
DO $$
BEGIN
  -- ============================================================================
  -- POLITICA 1: INSERT - Permitir que usuarios suban logos a su propia carpeta
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'user-logos insert owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "user-logos insert owner" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'user-logos' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLITICA 2: SELECT (owner) - Permitir que usuarios lean sus propios logos
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'user-logos select owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "user-logos select owner" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'user-logos' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLITICA 3: UPDATE - Permitir que usuarios actualicen sus propios logos
  -- Necesario para que funcione la opcion upsert: true en el upload
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'user-logos update owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "user-logos update owner" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'user-logos' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )
      WITH CHECK (
        bucket_id = 'user-logos' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLITICA 4: DELETE - Permitir que usuarios eliminen sus propios logos
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'user-logos delete owner'
  ) THEN
    EXECUTE $pol$CREATE POLICY "user-logos delete owner" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'user-logos' 
        AND auth.uid() = split_part(name, '/', 1)::uuid
      )$pol$;
  END IF;

  -- ============================================================================
  -- POLITICA 5: SELECT (public) - Permitir lectura publica de logos
  -- Necesario porque los logos se muestran en marketplace y perfiles publicos
  -- ============================================================================
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'user-logos select public'
  ) THEN
    EXECUTE $pol$CREATE POLICY "user-logos select public" ON storage.objects
      FOR SELECT
      TO public
      USING (
        bucket_id = 'user-logos'
      )$pol$;
  END IF;
END$$;