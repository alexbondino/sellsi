-- check_supplier_migration.sql
-- Run these checks BEFORE applying 20260127122000_unify_supplier_legal_and_rls.sql in staging/prod

-- 1) General counts
SELECT 'total_suppliers' AS name, count(*) AS value FROM public.supplier;
SELECT 'suppliers_userid_null' AS name, count(*) AS value FROM public.supplier WHERE user_id IS NULL;

-- 2) Duplicated user_id (should be zero)
SELECT user_id, count(*) AS cnt
FROM public.supplier
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING count(*) > 1
ORDER BY cnt DESC;

-- 3) Orphaned supplier rows (user_id references missing user)
SELECT s.id, s.user_id, s.name, s.created_at
FROM public.supplier s
LEFT JOIN public.users u ON s.user_id = u.user_id
WHERE s.user_id IS NOT NULL AND u.user_id IS NULL
LIMIT 200;

-- 4) Snapshot of any rows with partial legal data (helpful to inspect merging behavior)
SELECT id, user_id, supplier_legal_name, supplier_legal_rut, supplier_legal_address, supplier_legal_region, supplier_legal_commune
FROM public.supplier
WHERE (supplier_legal_name IS NOT NULL OR supplier_legal_rut IS NOT NULL OR supplier_legal_address IS NOT NULL)
ORDER BY created_at DESC
LIMIT 200;

-- 5) If you find duplicated user_ids, inspect sample duplicates
-- Replace '<user_id>' with a real value from step 2 to inspect rows
-- SELECT * FROM public.supplier WHERE user_id = '<user_id>' ORDER BY id;

-- 6) After running the migration and deduplication, create the index CONCURRENTLY:
-- CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_supplier_user_id ON public.supplier(user_id);

-- 7) Quick post-checks
-- Verify index exists and is unique
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'supplier' AND indexname ILIKE '%uq_supplier_user_id%';

-- Verify there are no duplicates post-index
SELECT user_id, count(*) AS cnt
FROM public.supplier
WHERE user_id IS NOT NULL
GROUP BY user_id
HAVING count(*) > 1;
