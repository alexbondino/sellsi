-- Run this BEFORE applying 20250903150000_offer_limits_constraints_fix.sql
-- It reports duplicates and existing constraints/indexes.

-- 1. Existing constraints / indexes on product table
SELECT c.relname AS table_name, con.conname AS constraint_name, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'offer_limits_product';

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='offer_limits_product';

-- 2. Existing constraints / indexes on supplier table
SELECT c.relname AS table_name, con.conname AS constraint_name, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.conrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'offer_limits_supplier';

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public' AND tablename='offer_limits_supplier';

-- 3. Duplicate key check (product)
WITH d AS (
  SELECT buyer_id, product_id, month_year, COUNT(*) AS cnt, SUM(offers_count) AS sum_offers
  FROM public.offer_limits_product
  GROUP BY 1,2,3 HAVING COUNT(*) > 1
)
SELECT * FROM d ORDER BY cnt DESC;

-- 4. Duplicate key check (supplier)
WITH d AS (
  SELECT buyer_id, supplier_id, month_year, COUNT(*) AS cnt, SUM(offers_count) AS sum_offers
  FROM public.offer_limits_supplier
  GROUP BY 1,2,3 HAVING COUNT(*) > 1
)
SELECT * FROM d ORDER BY cnt DESC;

-- 5. Sample rows if duplicates exist (limit 50)
SELECT * FROM public.offer_limits_product ORDER BY buyer_id, product_id, month_year LIMIT 50;
SELECT * FROM public.offer_limits_supplier ORDER BY buyer_id, supplier_id, month_year LIMIT 50;
