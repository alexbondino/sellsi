-- 20260205190000_add_unique_user_id_constraints_buyer_supplier.sql
-- Fix: Replace partial UNIQUE index with full UNIQUE constraint on buyer.user_id
-- 
-- PROBLEM: 
--   1. buyer has partial index: CREATE UNIQUE INDEX ... WHERE (user_id IS NOT NULL)
--   2. Trigger ensure_role_tables uses: ON CONFLICT (user_id) DO UPDATE ...
--   3. PostgreSQL rejects this because ON CONFLICT doesn't specify WHERE clause
-- 
-- ERROR: PostgreSQL 42P10 "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- 
-- SOLUTION: 
--   1. Drop partial index on buyer.user_id
--   2. Create full UNIQUE constraint (no WHERE clause)
--   3. Supplier already has full index, but convert to constraint for consistency

BEGIN;

-- 1. Fix buyer.user_id - Replace partial index with full constraint
-- Check for duplicates first (should be none if trigger worked correctly)
DO $$
DECLARE
  v_duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM public.buyer
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate user_id values in buyer table', v_duplicate_count;
    -- Cleanup: Keep only the most recent row for each user_id
    DELETE FROM public.buyer
    WHERE id IN (
      SELECT id
      FROM (
        SELECT id, user_id, created_at,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.buyer
        WHERE user_id IS NOT NULL
      ) ranked
      WHERE rn > 1
    );
  END IF;
END $$;

-- Drop existing partial index on buyer
DROP INDEX IF EXISTS public.uq_buyer_user_id;

-- Create UNIQUE constraint on buyer.user_id (full, no WHERE clause)
ALTER TABLE public.buyer
  ADD CONSTRAINT uq_buyer_user_id_constraint UNIQUE (user_id);

-- 2. Fix supplier.user_id - Replace index with constraint for consistency
-- Check for duplicates first
DO $$
DECLARE
  v_duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as cnt
    FROM public.supplier
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate user_id values in supplier table', v_duplicate_count;
    -- Cleanup: Keep only the most recent row for each user_id
    DELETE FROM public.supplier
    WHERE id IN (
      SELECT id
      FROM (
        SELECT id, user_id, created_at,
               ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
        FROM public.supplier
        WHERE user_id IS NOT NULL
      ) ranked
      WHERE rn > 1
    );
  END IF;
END $$;

-- Drop existing index on supplier (will be replaced by constraint)
DROP INDEX IF EXISTS public.uq_supplier_user_id;

-- Create UNIQUE constraint on supplier.user_id
ALTER TABLE public.supplier
  ADD CONSTRAINT uq_supplier_user_id_constraint UNIQUE (user_id);

-- 3. Add comments for documentation
COMMENT ON CONSTRAINT uq_buyer_user_id_constraint ON public.buyer IS 
  'Ensures each user_id can only have one buyer record. Required for ON CONFLICT in ensure_role_tables trigger. Replaced partial index to allow UPSERT without WHERE clause.';

COMMENT ON CONSTRAINT uq_supplier_user_id_constraint ON public.supplier IS 
  'Ensures each user_id can only have one supplier record. Required for ON CONFLICT in ensure_role_tables trigger.';

COMMIT;

-- Verification (run manually):
-- SELECT * FROM pg_constraint WHERE conname IN ('uq_buyer_user_id', 'uq_supplier_user_id');
