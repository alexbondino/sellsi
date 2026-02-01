-- 20260128123000_add_financing_request_legal_fields.sql
-- Añadir campos legales a public.financing_requests que usa el frontend
-- Idempotente: usa IF NOT EXISTS para no romper entornos ya actualizados

BEGIN;

-- 1) Añadir columnas para información legal enviada por formularios de solicitud
ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS legal_rut varchar(20),
  ADD COLUMN IF NOT EXISTS buyer_legal_representative_name text,
  ADD COLUMN IF NOT EXISTS buyer_legal_representative_rut varchar(12),
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS legal_commune text,
  ADD COLUMN IF NOT EXISTS legal_region text;

-- 1b) Documentar columnas (comentarios):
COMMENT ON COLUMN public.financing_requests.legal_name IS 'Razón social provista por el comprador al solicitar financiamiento (form: businessName).';
COMMENT ON COLUMN public.financing_requests.legal_rut IS 'RUT de la entidad comprador (form: rut)';
COMMENT ON COLUMN public.financing_requests.buyer_legal_representative_name IS 'Nombre del representante legal del comprador (form: legalRepresentative)';
COMMENT ON COLUMN public.financing_requests.buyer_legal_representative_rut IS 'RUT del representante legal del comprador (form: legalRepresentativeRut)';
COMMENT ON COLUMN public.financing_requests.legal_address IS 'Dirección legal provista por el comprador en la solicitud';
COMMENT ON COLUMN public.financing_requests.legal_commune IS 'Comuna legal provista por el comprador en la solicitud';
COMMENT ON COLUMN public.financing_requests.legal_region IS 'Región legal provista por el comprador en la solicitud';

-- 2) Backfill seguro (opcional, idempotente): copiar legal_name desde tabla buyer.name si existe y si está NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='buyer' AND column_name='name') THEN
    UPDATE public.financing_requests fr
    SET legal_name = b.name
    FROM public.buyer b
    WHERE fr.buyer_id = b.id AND fr.legal_name IS NULL;
  END IF;
END$$;

COMMIT;

-- NOTAS:
-- - Ejecute `supabase db push` o aplique este SQL en el editor de la instancia para que PostgREST reconozca los nuevos campos.
-- - Si su entorno de producción tiene políticas RLS estrictas, revise las políticas "buyer_insert_financing" y similares para asegurarse de que permitirán INSERT con estos campos (normalmente no es necesario cambiar).
