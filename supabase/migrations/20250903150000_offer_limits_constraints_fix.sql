-- =====================================================
-- Migration: Ensure unique constraints for offer_limits upserts
-- Date: 2025-09-03
-- Context: Previous migration used CREATE TABLE IF NOT EXISTS, so on environments
--          where tables existed without UNIQUE constraints, the ON CONFLICT clause
--          in create_offer() fails with: "there is no unique or exclusion constraint
--          matching the ON CONFLICT specification".
-- Action: Add (idempotently) the required UNIQUE constraints.
-- =====================================================
BEGIN;

-- =====================================================
-- 1. De-duplicate potential duplicate keys BEFORE adding UNIQUE constraints
--    (If tables were created previously without UNIQUE, multiple rows may exist.)
--    Strategy: collapse duplicates by summing offers_count into the most recent row.
-- =====================================================

-- Product-level duplicates
WITH ranked_prod AS (
  SELECT id, buyer_id, product_id, month_year, offers_count, updated_at, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY buyer_id, product_id, month_year
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
         ) AS rn
  FROM public.offer_limits_product
), agg_prod AS (
  SELECT buyer_id, product_id, month_year, SUM(offers_count) AS total, COUNT(*) AS cnt
  FROM public.offer_limits_product
  GROUP BY 1,2,3
  HAVING COUNT(*) > 1
)
UPDATE public.offer_limits_product p
SET offers_count = a.total, updated_at = now()
FROM agg_prod a
WHERE p.buyer_id = a.buyer_id
  AND p.product_id = a.product_id
  AND p.month_year = a.month_year
  AND p.id = (
      SELECT id FROM ranked_prod r
      WHERE r.buyer_id = a.buyer_id
        AND r.product_id = a.product_id
        AND r.month_year = a.month_year
        AND r.rn = 1
    );

WITH ranked_prod AS (
  SELECT id, buyer_id, product_id, month_year, offers_count, updated_at, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY buyer_id, product_id, month_year
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
         ) AS rn
  FROM public.offer_limits_product
)
DELETE FROM public.offer_limits_product
WHERE id IN (SELECT id FROM ranked_prod WHERE rn > 1);

-- Supplier-level duplicates
WITH ranked_supp AS (
  SELECT id, buyer_id, supplier_id, month_year, offers_count, updated_at, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY buyer_id, supplier_id, month_year
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
         ) AS rn
  FROM public.offer_limits_supplier
), agg_supp AS (
  SELECT buyer_id, supplier_id, month_year, SUM(offers_count) AS total, COUNT(*) AS cnt
  FROM public.offer_limits_supplier
  GROUP BY 1,2,3
  HAVING COUNT(*) > 1
)
UPDATE public.offer_limits_supplier s
SET offers_count = a.total, updated_at = now()
FROM agg_supp a
WHERE s.buyer_id = a.buyer_id
  AND s.supplier_id = a.supplier_id
  AND s.month_year = a.month_year
  AND s.id = (
      SELECT id FROM ranked_supp r
      WHERE r.buyer_id = a.buyer_id
        AND r.supplier_id = a.supplier_id
        AND r.month_year = a.month_year
        AND r.rn = 1
    );

WITH ranked_supp AS (
  SELECT id, buyer_id, supplier_id, month_year, offers_count, updated_at, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY buyer_id, supplier_id, month_year
           ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id
         ) AS rn
  FROM public.offer_limits_supplier
)
DELETE FROM public.offer_limits_supplier
WHERE id IN (SELECT id FROM ranked_supp WHERE rn > 1);

-- =====================================================
-- 2. Add required UNIQUE constraints (idempotent via exception handling)
-- =====================================================

DO $$ BEGIN
  ALTER TABLE public.offer_limits_product
    ADD CONSTRAINT offer_limits_product_buyer_product_month_unique UNIQUE (buyer_id, product_id, month_year);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.offer_limits_supplier
    ADD CONSTRAINT offer_limits_supplier_buyer_supplier_month_unique UNIQUE (buyer_id, supplier_id, month_year);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
