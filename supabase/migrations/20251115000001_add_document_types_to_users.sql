-- ============================================================================
-- Migración: Agregar columna document_types a users
-- ============================================================================
-- Fecha: 2025-11-15
-- Propósito: Permitir que usuarios (proveedores) especifiquen qué tipos de 
--            documentos tributarios pueden emitir: boleta, factura, ninguno
-- ============================================================================

BEGIN;

-- 1. Agregar columna document_types (idempotente)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'document_types'
  ) THEN
    ALTER TABLE public.users 
    ADD COLUMN document_types text[] 
    DEFAULT '{}'::text[] 
    CHECK (document_types <@ ARRAY['ninguno'::text, 'boleta'::text, 'factura'::text]);
    
    RAISE NOTICE 'Columna document_types agregada exitosamente';
  ELSE
    RAISE NOTICE 'Columna document_types ya existe, omitiendo';
  END IF;
END $$;

-- 2. Backfill: Asegurar que todos los usuarios existentes tengan array vacío
UPDATE public.users 
SET document_types = '{}'::text[] 
WHERE document_types IS NULL;

-- 3. Comentario para documentación
COMMENT ON COLUMN public.users.document_types IS 
  'Tipos de documentos tributarios que el proveedor puede emitir. Valores permitidos: ninguno, boleta, factura';

COMMIT;
