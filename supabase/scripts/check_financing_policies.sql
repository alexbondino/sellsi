-- supabase/scripts/check_financing_policies.sql
-- Run this on the target DB (staging) to verify financing-related policies are present and use the expected EXISTS checks.

-- List policies and their expressions for easy inspection
SELECT p.polname, c.relname,
  pg_get_expr(p.polqual, p.polrelid) AS using_expr,
  pg_get_expr(p.polwithcheck, p.polrelid) AS with_check_expr
FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname = 'financing_requests'
ORDER BY p.polname;

-- Simple programmatic checks (raise an error with guidance if an expected pattern is missing)
DO $$
DECLARE
  cnt int;
BEGIN
  -- Ensure buyer insert policy uses EXISTS / references buyer.user_id
  SELECT count(*) INTO cnt FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
  WHERE c.relname = 'financing_requests' AND (pg_get_expr(p.polwithcheck, p.polrelid) ILIKE '%b.user_id%auth.uid%' OR pg_get_expr(p.polwithcheck, p.polrelid) ILIKE '%buyer_id IS NULL%');
  IF cnt = 0 THEN
    RAISE EXCEPTION 'financing_requests INSERT policy does not reference buyer.user_id via EXISTS or allow buyer_id IS NULL. Review migration.';
  END IF;

  -- Ensure buyer select policy uses EXISTS on buyer.user_id
  SELECT count(*) INTO cnt FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
  WHERE c.relname = 'financing_requests' AND pg_get_expr(p.polqual, p.polrelid) ILIKE '%b.user_id%auth.uid%';
  IF cnt = 0 THEN
    RAISE EXCEPTION 'financing_requests SELECT policy does not reference buyer.user_id via EXISTS. Review migration.';
  END IF;

  RAISE NOTICE 'Policy checks passed (manual inspection of output recommended).';
END$$;
