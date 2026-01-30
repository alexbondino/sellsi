-- 20260128124000_add_financing_request_metadata.sql
-- Añade columna `metadata` tipo jsonb a public.financing_requests (idempotente)

BEGIN;

-- 1) Añadir columna metadata para datos arbitrarios del formulario (jsonb, nullable)
ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS metadata jsonb;

COMMENT ON COLUMN public.financing_requests.metadata IS 'Campo JSONB para almacenar metadatos de la solicitud (documentos, campos adicionales, compatibilidad retroactiva)';

COMMIT;

-- NOTAS:
-- - Ejecutar `supabase db push` o ejecutar este SQL en el editor de Supabase para aplicarlo.
-- - Tras aplicar, PostgREST debe reconocer la columna; si sigues viendo PGRST204, intenta reiniciar la API o limpiar caches del lado del cliente.
