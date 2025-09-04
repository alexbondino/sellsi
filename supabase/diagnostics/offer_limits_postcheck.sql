-- Run this AFTER applying 20250903150000_offer_limits_constraints_fix.sql
-- Confirms constraints exist and no duplicates remain.

-- 1. Confirm constraints present
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname='public'
  AND c.relname IN ('offer_limits_product','offer_limits_supplier')
  AND con.contype='u'
ORDER BY con.conname;

-- 2. Verify no duplicates product
SELECT COUNT(*) AS duplicate_groups
FROM (
  SELECT 1
  FROM public.offer_limits_product
  GROUP BY buyer_id, product_id, month_year
  HAVING COUNT(*) > 1
) t;

-- 3. Verify no duplicates supplier
SELECT COUNT(*) AS duplicate_groups
FROM (
  SELECT 1
  FROM public.offer_limits_supplier
  GROUP BY buyer_id, supplier_id, month_year
  HAVING COUNT(*) > 1
) t;

-- 4. Quick sample
SELECT * FROM public.offer_limits_product ORDER BY updated_at DESC NULLS LAST LIMIT 20;
SELECT * FROM public.offer_limits_supplier ORDER BY updated_at DESC NULLS LAST LIMIT 20;
