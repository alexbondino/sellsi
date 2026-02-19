-- ============================================================================
-- FIX: available_amount default 0 + trigger init bug
-- Date: 2026-02-19
--
-- 🐛 BUG:
-- - Migration 20260128130500 set DEFAULT 0 + NOT NULL on financing_requests.available_amount.
-- - When INSERT omits available_amount, Postgres applies DEFAULT 0.
-- - Trigger financing_set_available_amount only sets available_amount when NULL.
-- → New financings can be created with available_amount=0 even when amount>0.
-- → Later hotfixes may infer amount_used=amount-available_amount (false “usage”).
--
-- ✅ FIX:
-- - Drop DEFAULT on available_amount.
-- - Make trigger initialize available_amount on INSERT when it is 0 and there is no accounting yet.
-- ============================================================================

BEGIN;

-- 1) Drop DEFAULT to prevent implicit 0 on inserts that omit the column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'financing_requests'
      AND column_name = 'available_amount'
  ) THEN
    -- DROP DEFAULT is idempotent: if there is no default, it succeeds with no-op.
    -- Let other errors (permissions, locks, missing table) fail the migration loudly.
    ALTER TABLE public.financing_requests
      ALTER COLUMN available_amount DROP DEFAULT;
  END IF;
END
$$;

-- 2) Ensure trigger function initializes available_amount reliably on INSERT
CREATE OR REPLACE FUNCTION public.financing_set_available_amount()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use JSON view of NEW to safely access optional columns across environments.
  -- (Avoid compile-time dependency on columns that may not exist in some schemas.)
  DECLARE
    v_new jsonb := to_jsonb(NEW);
    v_amount_used numeric := 0;
    v_amount_paid numeric := 0;
    v_amount_refunded numeric := 0;
  BEGIN
    BEGIN
      v_amount_used := COALESCE(NULLIF(v_new->>'amount_used', '')::numeric, 0);
    EXCEPTION WHEN others THEN
      v_amount_used := 0;
    END;

    BEGIN
      v_amount_paid := COALESCE(NULLIF(v_new->>'amount_paid', '')::numeric, 0);
    EXCEPTION WHEN others THEN
      v_amount_paid := 0;
    END;

    BEGIN
      v_amount_refunded := COALESCE(NULLIF(v_new->>'amount_refunded', '')::numeric, 0);
    EXCEPTION WHEN others THEN
      v_amount_refunded := 0;
    END;

  -- Primary behavior: if NULL, initialize from amount
  IF NEW.available_amount IS NULL THEN
    NEW.available_amount := NEW.amount;
    RETURN NEW;
  END IF;

  -- Compatibility behavior:
  -- If INSERT provides 0 (often due to DEFAULT 0), and there is no accounting yet,
  -- treat it as "unset" and initialize from amount.
  IF TG_OP = 'INSERT'
     AND COALESCE(NEW.available_amount, 0) = 0
     AND COALESCE(NEW.amount, 0) > 0
      AND COALESCE(v_amount_used, 0) = 0
      AND COALESCE(v_amount_paid, 0) = 0
      AND COALESCE(v_amount_refunded, 0) = 0 THEN
    NEW.available_amount := NEW.amount;
  END IF;

    RETURN NEW;
  END;
END;
$$;

DROP TRIGGER IF EXISTS trg_financing_set_available_amount ON public.financing_requests;
CREATE TRIGGER trg_financing_set_available_amount
BEFORE INSERT ON public.financing_requests
FOR EACH ROW
EXECUTE FUNCTION public.financing_set_available_amount();

COMMIT;
