-- 20260128150000_backfill_buyer_supplier_from_users.sql
-- Backfill missing buyer/supplier rows from public.users, dedupe duplicates and add trigger to keep role tables in sync.
-- Idempotent / safe to run multiple times. Run in staging first and review duplicates report.

-- WARNING: CREATE INDEX CONCURRENTLY cannot run inside a transaction; this migration splits work accordingly.

-- 1) Backfill buyer rows for all users (ensure buyers are present for everyone)
BEGIN;
  INSERT INTO public.buyer (id, user_id, name, email, created_at)
  SELECT gen_random_uuid(), u.user_id, COALESCE(NULLIF(u.user_nm, ''), u.email)::text, u.email, now()
  FROM public.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.buyer b WHERE b.user_id = u.user_id);

  -- 2) Backfill supplier rows for users with main_supplier = true (unchanged)
  INSERT INTO public.supplier (id, user_id, name, created_at)
  SELECT gen_random_uuid(), u.user_id, COALESCE(NULLIF(u.user_nm, ''), u.email)::text, now()
  FROM public.users u
  WHERE u.main_supplier = true
    AND NOT EXISTS (SELECT 1 FROM public.supplier s WHERE s.user_id = u.user_id);

  -- 3) Detect duplicates (informational) — produce result rows for inspection
  -- Duplicate buyers by user_id (user_id => count)
  SELECT json_agg(x) AS duplicate_buyers
  FROM (SELECT user_id, count(*) FROM public.buyer GROUP BY user_id HAVING count(*) > 1) x;

  -- Duplicate suppliers by user_id (user_id => count)
  SELECT json_agg(x) AS duplicate_suppliers
  FROM (SELECT user_id, count(*) FROM public.supplier GROUP BY user_id HAVING count(*) > 1) x;

COMMIT;

-- 4) Deduplicate buyer rows: update references and remove duplicates
BEGIN;
  -- For each user_id with >1 buyer rows, keep the smallest id and re-point references
  WITH d AS (
    SELECT user_id, MIN(id::text)::uuid AS keep_id, array_agg(id) AS ids
    FROM public.buyer
    GROUP BY user_id
    HAVING count(*) > 1
  )
  -- Update financing_requests to point to the keep_id
  UPDATE public.financing_requests fr
  SET buyer_id = d.keep_id
  FROM d
  WHERE fr.buyer_id = ANY(d.ids) AND fr.buyer_id <> d.keep_id;

  -- Delete duplicate buyer rows (keep keep_id)
  DELETE FROM public.buyer b
  USING (
    SELECT user_id, MIN(id::text)::uuid AS keep_id, array_agg(id) AS ids
    FROM public.buyer
    GROUP BY user_id
    HAVING count(*) > 1
  ) d
  WHERE b.user_id = d.user_id AND b.id <> d.keep_id;

COMMIT;

-- 5) Deduplicate supplier rows similarly
BEGIN;
  WITH d AS (
    SELECT user_id, MIN(id::text)::uuid AS keep_id, array_agg(id) AS ids
    FROM public.supplier
    GROUP BY user_id
    HAVING count(*) > 1
  )
  -- Update references to other tables if applicable (currently financing_requests references buyer only)
  -- If you have custom references to supplier.id, add similar updates here.

  -- Delete duplicate supplier rows
  DELETE FROM public.supplier s
  USING (
    SELECT user_id, MIN(id::text)::uuid AS keep_id, array_agg(id) AS ids
    FROM public.supplier
    GROUP BY user_id
    HAVING count(*) > 1
  ) d
  WHERE s.user_id = d.user_id AND s.id <> d.keep_id;

COMMIT;

-- 6) Create UNIQUE indexes on user_id concurrently (safe for production, not inside a transaction)
-- Note: these statements must run outside a BEGIN/COMMIT block
-- NOTE: Using non-CONCURRENT index creation here to avoid pipeline errors when running migrations.
-- If you want non-blocking behavior on large production tables, run the following separately in maintenance window:
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_buyer_user_id ON public.buyer (user_id) WHERE user_id IS NOT NULL;
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_supplier_user_id ON public.supplier (user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_buyer_user_id ON public.buyer (user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_user_id ON public.supplier (user_id) WHERE user_id IS NOT NULL;

-- 7) Create trigger function to ensure a buyer/supplier row exists on INSERT/UPDATE of users
BEGIN;

CREATE OR REPLACE FUNCTION public.ensure_role_tables() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- On insert: always ensure a buyer exists; also ensure supplier if main_supplier = true
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.buyer (id, user_id, name, email, created_at)
    VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, NEW.email, now())
    ON CONFLICT (user_id) DO NOTHING;

    IF NEW.main_supplier = true THEN
      INSERT INTO public.supplier (id, user_id, name, created_at)
      VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, now())
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  -- On update: always ensure buyer exists; if toggled to supplier (true) ensure supplier exists too
  IF TG_OP = 'UPDATE' THEN
    -- ensure buyer exists (idempotent)
    INSERT INTO public.buyer (id, user_id, name, email, created_at)
    VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, NEW.email, now())
    ON CONFLICT (user_id) DO NOTHING;

    IF NEW.main_supplier IS DISTINCT FROM OLD.main_supplier AND NEW.main_supplier = true THEN
      INSERT INTO public.supplier (id, user_id, name, created_at)
      VALUES (gen_random_uuid(), NEW.user_id, COALESCE(NULLIF(NEW.user_nm, ''), NEW.email)::text, now())
      ON CONFLICT (user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Install trigger
DROP TRIGGER IF EXISTS trg_ensure_role_tables ON public.users;
CREATE TRIGGER trg_ensure_role_tables
AFTER INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.ensure_role_tables();

COMMIT;

-- 8) Create RLS policies (idempotent) for buyer and ensure supplier policies exist
DO $$
BEGIN
  -- Buyer: INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'buyer' AND p.polname = 'buyers_insert_self'
  ) THEN
    EXECUTE 'CREATE POLICY buyers_insert_self ON public.buyer FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text))';
  END IF;

  -- Buyer: SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'buyer' AND p.polname = 'buyers_select_self'
  ) THEN
    EXECUTE 'CREATE POLICY buyers_select_self ON public.buyer FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text))';
  END IF;

  -- Buyer: UPDATE (and WITH CHECK)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'buyer' AND p.polname = 'buyers_update_self'
  ) THEN
    EXECUTE 'CREATE POLICY buyers_update_self ON public.buyer FOR UPDATE TO authenticated USING ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text)) WITH CHECK ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text))';
  END IF;

  -- Supplier: if missing, create similar policies so migrations are self-contained
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'supplier' AND p.polname = 'suppliers_insert_self'
  ) THEN
    EXECUTE 'CREATE POLICY suppliers_insert_self ON public.supplier FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'supplier' AND p.polname = 'suppliers_select_self'
  ) THEN
    EXECUTE 'CREATE POLICY suppliers_select_self ON public.supplier FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'supplier' AND p.polname = 'suppliers_update_self'
  ) THEN
    EXECUTE 'CREATE POLICY suppliers_update_self ON public.supplier FOR UPDATE TO authenticated USING ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text)) WITH CHECK ((user_id = auth.uid()) OR (auth.role() = ''service_role''::text) OR (auth.role() = ''admin''::text))';
  END IF;
END
$$;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.buyer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier ENABLE ROW LEVEL SECURITY;

-- Usage notes:
--  * Run this migration first on staging and inspect NOTICE outputs for duplicates.
--  * The CONCURRENTLY unique index creation may take time on large tables but is non-blocking.
--  * If you have other application tables referencing supplier.id, add update statements analogous to the buyer dedupe step.
--  * After migration, update service code to use `ensureBuyerForUser`/`ensureSupplierForUser` or rely on the trigger for automatic creation.

-- End of migration
