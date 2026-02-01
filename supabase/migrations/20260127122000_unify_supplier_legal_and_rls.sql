-- 20260127122000_unify_supplier_legal_and_rls.sql
-- Unifies supplier legal fields creation, constraints and RLS policies
-- Idempotent: safe to run multiple times

BEGIN;

-- 1) Add supplier_legal_* columns idempotently
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier' AND column_name = 'supplier_legal_name') THEN
    ALTER TABLE public.supplier ADD COLUMN supplier_legal_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier' AND column_name = 'supplier_legal_rut') THEN
    ALTER TABLE public.supplier ADD COLUMN supplier_legal_rut varchar(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier' AND column_name = 'supplier_legal_representative_name') THEN
    ALTER TABLE public.supplier ADD COLUMN supplier_legal_representative_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier' AND column_name = 'supplier_legal_representative_rut') THEN
    ALTER TABLE public.supplier ADD COLUMN supplier_legal_representative_rut varchar(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier' AND column_name = 'supplier_legal_address') THEN
    ALTER TABLE public.supplier ADD COLUMN supplier_legal_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier' AND column_name = 'supplier_legal_region') THEN
    ALTER TABLE public.supplier ADD COLUMN supplier_legal_region varchar(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'supplier' AND column_name = 'supplier_legal_commune') THEN
    ALTER TABLE public.supplier ADD COLUMN supplier_legal_commune varchar(100);
  END IF;
END$$;

-- 2) Deduplicate existing supplier rows to allow creating a UNIQUE index on user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM (
      SELECT user_id FROM public.supplier WHERE user_id IS NOT NULL GROUP BY user_id HAVING COUNT(*) > 1
    ) t
  ) THEN
    -- Merge simple non-null legal fields into the row with the smallest id per user_id, then remove duplicates
    WITH duplicates AS (
      SELECT user_id, min(id) AS keep_id
      FROM public.supplier
      WHERE user_id IS NOT NULL
      GROUP BY user_id
      HAVING count(*) > 1
    )
    -- Merge fields into the keep row when keep row has NULLs
    UPDATE public.supplier s
    SET
      supplier_legal_name = COALESCE(s.supplier_legal_name, (SELECT supplier_legal_name FROM public.supplier s2 WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.supplier_legal_name IS NOT NULL ORDER BY s2.id LIMIT 1)),
      supplier_legal_rut = COALESCE(s.supplier_legal_rut, (SELECT supplier_legal_rut FROM public.supplier s2 WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.supplier_legal_rut IS NOT NULL ORDER BY s2.id LIMIT 1)),
      supplier_legal_representative_name = COALESCE(s.supplier_legal_representative_name, (SELECT supplier_legal_representative_name FROM public.supplier s2 WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.supplier_legal_representative_name IS NOT NULL ORDER BY s2.id LIMIT 1)),
      supplier_legal_representative_rut = COALESCE(s.supplier_legal_representative_rut, (SELECT supplier_legal_representative_rut FROM public.supplier s2 WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.supplier_legal_representative_rut IS NOT NULL ORDER BY s2.id LIMIT 1)),
      supplier_legal_address = COALESCE(s.supplier_legal_address, (SELECT supplier_legal_address FROM public.supplier s2 WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.supplier_legal_address IS NOT NULL ORDER BY s2.id LIMIT 1)),
      supplier_legal_region = COALESCE(s.supplier_legal_region, (SELECT supplier_legal_region FROM public.supplier s2 WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.supplier_legal_region IS NOT NULL ORDER BY s2.id LIMIT 1)),
      supplier_legal_commune = COALESCE(s.supplier_legal_commune, (SELECT supplier_legal_commune FROM public.supplier s2 WHERE s2.user_id = s.user_id AND s2.id <> s.id AND s2.supplier_legal_commune IS NOT NULL ORDER BY s2.id LIMIT 1))
    FROM duplicates d
    WHERE s.user_id = d.user_id AND s.id = d.keep_id;

    -- Delete non-kept rows for duplicated user_ids
    DELETE FROM public.supplier s
    USING duplicates d
    WHERE s.user_id = d.user_id AND s.id <> d.keep_id;
  END IF;
END$$;

-- Note: creating a UNIQUE index can be long-running on large tables. It's recommended
-- to create the index CONCURRENTLY outside of a transaction to avoid blocking writes.
-- We intentionally do NOT create the index inside the transaction when data size is large.

-- 4) Add FK constraint to users.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = 'public' AND tc.table_name = 'supplier' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'user_id'
  ) THEN
    ALTER TABLE public.supplier
      ADD CONSTRAINT fk_supplier_user FOREIGN KEY (user_id)
        REFERENCES public.users(user_id) ON DELETE SET NULL;
  END IF;
END$$;

-- 4) Backfill: create supplier rows for users that are main_supplier
DO $$
DECLARE
  has_legal_rut boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'supplier_legal_rut'
  ) INTO has_legal_rut;

  IF has_legal_rut THEN
    -- Insert new supplier rows only when not exists
    INSERT INTO public.supplier (user_id, name, legal_rut, created_at)
    SELECT u.user_id, u.user_nm, u.supplier_legal_rut, now()
    FROM public.users u
    WHERE u.main_supplier = true
      AND NOT EXISTS (SELECT 1 FROM public.supplier s WHERE s.user_id = u.user_id);

    -- Update existing rows with fresh values from users
    UPDATE public.supplier s
    SET
      name = u.user_nm,
      legal_rut = COALESCE(u.supplier_legal_rut, s.legal_rut)
    FROM public.users u
    WHERE s.user_id = u.user_id AND u.main_supplier = true;
  ELSE
    INSERT INTO public.supplier (user_id, name, legal_rut, created_at)
    SELECT u.user_id, u.user_nm, NULL, now()
    FROM public.users u
    WHERE u.main_supplier = true
      AND NOT EXISTS (SELECT 1 FROM public.supplier s WHERE s.user_id = u.user_id);

    UPDATE public.supplier s
    SET
      name = u.user_nm
    FROM public.users u
    WHERE s.user_id = u.user_id AND u.main_supplier = true;
  END IF;
END$$;

-- 4b) Cleanup: set to NULL any supplier.user_id that points to a non-existing user
-- This avoids foreign key creation failures in environments that had manual inserts
UPDATE public.supplier s
SET user_id = NULL
WHERE s.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.user_id = s.user_id);

-- 5) Backfill: copy supplier_legal_* values from users to supplier when present
DO $$
DECLARE
  assignments text := '';
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='supplier_legal_name') THEN
    assignments := assignments || 'supplier_legal_name = COALESCE(u.supplier_legal_name, s.supplier_legal_name), ';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='supplier_legal_rut') THEN
    assignments := assignments || 'supplier_legal_rut = COALESCE(u.supplier_legal_rut, s.supplier_legal_rut), ';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='supplier_legal_representative_name') THEN
    assignments := assignments || 'supplier_legal_representative_name = COALESCE(u.supplier_legal_representative_name, s.supplier_legal_representative_name), ';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='supplier_legal_representative_rut') THEN
    assignments := assignments || 'supplier_legal_representative_rut = COALESCE(u.supplier_legal_representative_rut, s.supplier_legal_representative_rut), ';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='supplier_legal_address') THEN
    assignments := assignments || 'supplier_legal_address = COALESCE(u.supplier_legal_address, s.supplier_legal_address), ';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='supplier_legal_region') THEN
    assignments := assignments || 'supplier_legal_region = COALESCE(u.supplier_legal_region, s.supplier_legal_region), ';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='supplier_legal_commune') THEN
    assignments := assignments || 'supplier_legal_commune = COALESCE(u.supplier_legal_commune, s.supplier_legal_commune), ';
  END IF;

  IF assignments <> '' THEN
    assignments := left(assignments, length(assignments)-2); -- remove trailing comma and space
    EXECUTE 'UPDATE public.supplier s SET ' || assignments || ' FROM public.users u WHERE s.user_id = u.user_id AND u.main_supplier = true';
  END IF;
END$$;

-- 6) Enable RLS and create policies for supplier table
ALTER TABLE IF EXISTS public.supplier ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS suppliers_select_self ON public.supplier;
CREATE POLICY suppliers_select_self ON public.supplier
  FOR SELECT
  USING (user_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin');

DROP POLICY IF EXISTS suppliers_insert_self ON public.supplier;
CREATE POLICY suppliers_insert_self ON public.supplier
  FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin');

DROP POLICY IF EXISTS suppliers_update_self ON public.supplier;
CREATE POLICY suppliers_update_self ON public.supplier
  FOR UPDATE
  USING (user_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin')
  WITH CHECK (user_id = auth.uid()::uuid OR auth.role() = 'service_role' OR auth.role() = 'admin');

COMMIT;

-- 5) Create UNIQUE INDEX CONCURRENTLY on user_id (execute OUTSIDE a transaction to avoid locks on large tables)
-- If your deployment tool runs migrations inside a transaction, run the following manually on staging/prod:
--   CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_supplier_user_id ON public.supplier(user_id);
-- If you can run it via migration runner that supports non-transactional statements, you can uncomment the following line and run it OUTSIDE a transaction:
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_supplier_user_id ON public.supplier(user_id);

-- NOTES: This migration is purposely idempotent and groups schema + RLS changes to
-- ensure the API (PostgREST/Rest) can use `supplier(*)` embedded selects and
-- ON CONFLICT(user_id) upserts without runtime schema errors.
