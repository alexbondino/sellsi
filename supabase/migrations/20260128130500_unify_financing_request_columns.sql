-- 20260128130500_unify_financing_request_columns.sql
-- Migration: ensure all expected columns exist on public.financing_requests
-- Idempotent: safe to run multiple times and across environments

-- Summary of improvements in this version:
--  * Adds missing columns idempotently (same as before)
--  * Adds safe backfills for `term_days` and `available_amount` when derivable
--  * Sets sensible DEFAULTs and NOT NULL constraints after backfill to avoid NULL surprises
--  * Leaves textual/legal fields nullable to avoid data loss or heavy table rewrites

BEGIN;

-- 1) Add columns if missing (keeps operations small and idempotent)
ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS term_days integer,
  ADD COLUMN IF NOT EXISTS available_amount numeric,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS amount_used numeric,
  ADD COLUMN IF NOT EXISTS amount_paid numeric,
  ADD COLUMN IF NOT EXISTS amount_refunded numeric;

ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS legal_name text,
  ADD COLUMN IF NOT EXISTS legal_rut varchar(20),
  ADD COLUMN IF NOT EXISTS legal_representative_name text,
  ADD COLUMN IF NOT EXISTS buyer_legal_representative_name text,
  ADD COLUMN IF NOT EXISTS buyer_legal_representative_rut varchar(12),
  ADD COLUMN IF NOT EXISTS legal_address text,
  ADD COLUMN IF NOT EXISTS legal_commune text,
  ADD COLUMN IF NOT EXISTS legal_region text;

ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 2) Safe backfills
-- 2.a) If available_amount is NULL and `amount` exists, use it as initial available amount
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_requests' AND column_name='amount') THEN
    UPDATE public.financing_requests
    SET available_amount = amount
    WHERE available_amount IS NULL AND amount IS NOT NULL;
  END IF;
END
$$;

-- Ensure any remaining available_amount NULLs become 0 (safe finalization)
UPDATE public.financing_requests
SET available_amount = COALESCE(available_amount, 0)
WHERE available_amount IS NULL;

-- 2.b) term_days derive from expires_at and created_at/activated_at if columns exist
DO $$
DECLARE
  has_activated boolean;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='financing_requests' AND column_name='expires_at')
     AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='financing_requests' AND column_name='created_at') THEN

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='financing_requests' AND column_name='activated_at'
    ) INTO has_activated;

    IF has_activated THEN
      -- Use dynamic SQL to reference activated_at safely
      EXECUTE $sql$
        UPDATE public.financing_requests
        SET term_days = GREATEST((expires_at::date - COALESCE(activated_at::date, created_at::date)), 0)
        WHERE term_days IS NULL AND expires_at IS NOT NULL AND (created_at IS NOT NULL OR activated_at IS NOT NULL);
      $sql$;
    ELSE
      -- Fallback to created_at only
      EXECUTE $sql$
        UPDATE public.financing_requests
        SET term_days = GREATEST((expires_at::date - created_at::date), 0)
        WHERE term_days IS NULL AND expires_at IS NOT NULL AND created_at IS NOT NULL;
      $sql$;
    END IF;

  END IF;
END
$$;

-- Ensure remaining term_days are set to 0 so SET NOT NULL won't fail
UPDATE public.financing_requests
SET term_days = 0
WHERE term_days IS NULL;

-- 2.c) numeric accounting columns: coalesce to 0
UPDATE public.financing_requests
SET amount_used = COALESCE(amount_used, 0),
    amount_paid = COALESCE(amount_paid, 0),
    amount_refunded = COALESCE(amount_refunded, 0)
WHERE amount_used IS NULL OR amount_paid IS NULL OR amount_refunded IS NULL;

-- 2.d) ensure metadata exists as an object
UPDATE public.financing_requests
SET metadata = COALESCE(metadata, '{}'::jsonb)
WHERE metadata IS NULL;

-- 3) Apply DEFAULTs and NOT NULL where safe (only after backfill above)
ALTER TABLE public.financing_requests
  ALTER COLUMN term_days SET DEFAULT 0,
  ALTER COLUMN term_days SET NOT NULL;

ALTER TABLE public.financing_requests
  ALTER COLUMN available_amount SET DEFAULT 0,
  ALTER COLUMN available_amount SET NOT NULL;

ALTER TABLE public.financing_requests
  ALTER COLUMN amount_used SET DEFAULT 0,
  ALTER COLUMN amount_used SET NOT NULL,
  ALTER COLUMN amount_paid SET DEFAULT 0,
  ALTER COLUMN amount_paid SET NOT NULL,
  ALTER COLUMN amount_refunded SET DEFAULT 0,
  ALTER COLUMN amount_refunded SET NOT NULL;

ALTER TABLE public.financing_requests
  ALTER COLUMN metadata SET DEFAULT '{}'::jsonb,
  ALTER COLUMN metadata SET NOT NULL;

-- 4) Comments for clarity
COMMENT ON COLUMN public.financing_requests.term_days IS 'Plazo en días solicitado (form: term)';
COMMENT ON COLUMN public.financing_requests.available_amount IS 'Disponible para usar del monto aprobado';
COMMENT ON COLUMN public.financing_requests.amount_used IS 'Suma de consumos detectados';
COMMENT ON COLUMN public.financing_requests.legal_name IS 'Razón social provista por el comprador al solicitar financiamiento (form: businessName)';
COMMENT ON COLUMN public.financing_requests.legal_rut IS 'RUT de la entidad comprador (form: rut)';
COMMENT ON COLUMN public.financing_requests.legal_representative_name IS 'Nombre del representante legal (form: legalRepresentative)';
COMMENT ON COLUMN public.financing_requests.metadata IS 'JSONB para metadatos y campos adicionales';

COMMIT;

-- Usage notes:
-- 1) This migration centralizes schema additions for financing_requests and is safe to run repeatedly.
-- 2) After applying, run the check script `supabase/scripts/check_financing_schema.sql` and perform a test POST from the frontend (or via curl) to verify PostgREST recognizes the new columns.
-- 3) If PostgREST still returns PGRST204 for a column that exists, try restarting the Supabase API (or re-run `supabase db push`) to refresh the schema cache.
-- 4) Consider running this migration during a maintenance window for very large tables because altering large tables to set NOT NULL/defaults may take time on very large datasets.
