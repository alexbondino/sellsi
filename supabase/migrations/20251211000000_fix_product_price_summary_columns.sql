-- Migration: Fix product_price_summary column naming to snake_case standard
-- Created: 2025-12-11
-- Purpose: Add snake_case alias (product_id) WHILE maintaining backward compatibility
--          Error PostgreSQL 42703 was occurring because JS code expected 'product_id' 
--          but view only exposed 'productid' (inherited from products table legacy naming)
-- Strategy: Expose BOTH columns (productid AND product_id as alias) to support:
--           - Existing code in production that uses 'productid' (origin/staging line 510)
--           - New code that uses 'product_id' (local changes + future deploys)
-- Migration Path: This allows zero-downtime deployment:
--           1. Apply this migration first (adds product_id while keeping productid)
--           2. Deploy new code that uses product_id
--           3. Eventually remove productid support in future migration (breaking change)

BEGIN;

-- Drop and recreate the view with proper snake_case column naming
DROP VIEW IF EXISTS public.product_price_summary;

CREATE VIEW public.product_price_summary AS
SELECT
  p.productid,                      -- ✅ Legacy column (backward compatibility)
  p.productid AS product_id,        -- ✅ Snake_case alias (new standard)
  p.price AS base_price,
  COALESCE(MIN(r.price), p.price) AS min_price,
  COALESCE(MAX(r.price), p.price) AS max_price,
  COUNT(r.product_qty_id) AS tiers_count,
  (
    COUNT(r.product_qty_id) > 0
    AND (
      COALESCE(MIN(r.price), p.price) <> COALESCE(MAX(r.price), p.price)
      OR COALESCE(MIN(r.price), p.price) <> p.price
    )
  ) AS has_variable_pricing,
  -- Include additional useful product fields
  p.supplier_id,
  p.productnm,                      -- ✅ Keep original name for compatibility
  p.category,
  p.product_type,
  p.productqty,                     -- ✅ Keep original name for compatibility
  p.minimum_purchase,
  p.negotiable,
  p.is_active,
  p.tiny_thumbnail_url
FROM public.products p
LEFT JOIN public.product_quantity_ranges r
  ON r.product_id = p.productid
GROUP BY
  p.productid,
  p.price,
  p.supplier_id,
  p.productnm,
  p.category,
  p.product_type,
  p.productqty,
  p.minimum_purchase,
  p.negotiable,
  p.is_active,
  p.tiny_thumbnail_url;

-- Create index on the underlying table to optimize the view query
-- (If it already exists this is a no-op from previous migration)
CREATE INDEX IF NOT EXISTS idx_product_quantity_ranges_product_id_price
  ON public.product_quantity_ranges (product_id, price);

COMMIT;

-- Verification queries (can be run manually to test both column names work):
-- Test legacy column name:
-- SELECT productid, min_price, max_price FROM public.product_price_summary LIMIT 3;
-- Test new column name:
-- SELECT product_id, min_price, max_price FROM public.product_price_summary LIMIT 3;
-- Both should work!
