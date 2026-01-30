-- 20260128123500_add_financing_request_legal_representative_name.sql
-- Añade columna `legal_representative_name` que el frontend envía (idempotente)

BEGIN;

ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS legal_representative_name text;

COMMENT ON COLUMN public.financing_requests.legal_representative_name IS 'Nombre del representante legal provisto en el formulario (form: legalRepresentative)';

COMMIT;

-- Nota: Ejecutar `supabase db push` (o ejecutar este SQL en el editor) para que PostgREST reconozca la columna.
