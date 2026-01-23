-- 20260121000000_financing_documents_schema_update.sql
-- Añadir columnas necesarias para contratos y metadatos en financing_documents
-- Fecha/Version: 2026-01-21 00:00:00
-- Objetivo: Añadir columnas compatibles con DISEÑO_BACKEND y con la Edge Function

BEGIN;

-- 1) Añadir columnas de forma idempotente (nullable para no romper datos existentes)
ALTER TABLE IF EXISTS public.financing_documents
  ADD COLUMN IF NOT EXISTS financing_id uuid,
  ADD COLUMN IF NOT EXISTS document_type text,
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS file_size integer,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS uploaded_by_admin_id uuid;

-- 2) Backfill básico: copiar financing_request_id -> financing_id cuando aplique
UPDATE public.financing_documents
SET financing_id = financing_request_id
WHERE financing_id IS NULL AND financing_request_id IS NOT NULL;

-- 3) Crear índice para consultas habituales (financing + tipo)
CREATE INDEX IF NOT EXISTS idx_fdocs_financing ON public.financing_documents (financing_id, document_type);

-- 4) Añadir FK opcional como NOT VALID para evitar bloqueo; validar manualmente luego si se desea
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.contype = 'f' AND t.relname = 'financing_documents' AND c.conname = 'fk_financing_documents_financing'
  ) THEN
    ALTER TABLE public.financing_documents
      ADD CONSTRAINT fk_financing_documents_financing FOREIGN KEY (financing_id) REFERENCES public.financing_requests(id) NOT VALID;
  END IF;
END;
$$;

COMMIT;

-- ===== Rollback =====
-- ALTER TABLE public.financing_documents DROP CONSTRAINT IF EXISTS fk_financing_documents_financing;
-- DROP INDEX IF EXISTS idx_fdocs_financing;
-- ALTER TABLE public.financing_documents DROP COLUMN IF EXISTS financing_id, DROP COLUMN IF EXISTS document_type, DROP COLUMN IF EXISTS document_name, DROP COLUMN IF EXISTS storage_path, DROP COLUMN IF EXISTS file_size, DROP COLUMN IF EXISTS mime_type, DROP COLUMN IF EXISTS uploaded_by_admin_id;