-- Migration: add is_age_restricted to products
-- Adds a boolean flag for age-restricted products (alcohol/tobacco)
-- Backfills using category/product name heuristics
-- Includes partial index for performance optimization
-- Rollback included

BEGIN;

-- 1) Add column with default false
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS is_age_restricted boolean NOT NULL DEFAULT false;

-- 2) Add column comment for documentation
COMMENT ON COLUMN public.products.is_age_restricted IS 
  'Indica si el producto requiere verificación de edad (+18) antes de compra (alcohol, tabaco)';

-- 3) Create partial index for fast checks (only indexes TRUE values for efficiency)
CREATE INDEX IF NOT EXISTS idx_products_is_age_restricted 
  ON public.products(is_age_restricted) 
  WHERE is_age_restricted = true;

-- 4) Backfill: mark products in age-restricted categories
-- Based on your standardized categories: 'Alcoholes' and 'Tabaquería'
UPDATE public.products
SET is_age_restricted = true
WHERE 
  category = 'Alcoholes'
  OR category = 'Tabaquería';

COMMIT;

-- === VALIDACIÓN POST-MIGRACIÓN ===
-- Ejecutar estas queries para verificar el resultado:
-- 
-- SELECT 
--   count(*) FILTER (WHERE is_age_restricted = true) as restricted_count,
--   count(*) as total_products,
--   round(100.0 * count(*) FILTER (WHERE is_age_restricted = true) / count(*), 2) as percentage
-- FROM public.products;
-- 
-- SELECT productid, productnm, category, product_type, is_age_restricted
-- FROM public.products 
-- WHERE is_age_restricted = true 
-- ORDER BY category
-- LIMIT 20;

-- === ROLLBACK ===
-- Use these statements to revert the migration if necessary
-- (Execute in a single transaction)

-- BEGIN;
-- DROP INDEX IF EXISTS idx_products_is_age_restricted;
-- ALTER TABLE public.products DROP COLUMN IF EXISTS is_age_restricted CASCADE;
-- COMMIT;