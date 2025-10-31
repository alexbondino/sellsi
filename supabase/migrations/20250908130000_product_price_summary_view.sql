-- Migration: product_price_summary view (quick win for min/max tier pricing)
-- Created: 2025-09-08
-- Purpose: Expose aggregated min/max tier prices and summary flags per product to avoid
--          client-side aggregation and extra network round trips.
-- Strategy: Simple SQL VIEW (always fresh). Can later be upgraded to MATERIALIZED VIEW or
--           denormalized columns + triggers if performance requires it.

BEGIN;

-- 1. Supporting index to accelerate MIN/MAX/COUNT by product_id.
-- (If it already exists this is a no-op.)
CREATE INDEX IF NOT EXISTS idx_product_quantity_ranges_product_id_price
  ON public.product_quantity_ranges (product_id, price);

-- 2. Drop prior view if re-running / during iterative development.
DROP VIEW IF EXISTS public.product_price_summary;

-- 3. Create the aggregation view.
CREATE VIEW public.product_price_summary AS
SELECT
  p.productid,
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
  -- Optional: could expose first/last updated timestamps of tiers later if needed.
  p.supplier_id,
  p.productnm,
  p.category,
  p.product_type,
  p.productqty,
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

-- 4. (Optional) Future RLS: The view inherits RLS from underlying tables in Postgres.
--    If tighter control is needed, create SECURITY BARRIER or dedicated policies.

COMMIT;

-- Smoke test (non-fatal if no rows):
-- SELECT * FROM public.product_price_summary LIMIT 5;
