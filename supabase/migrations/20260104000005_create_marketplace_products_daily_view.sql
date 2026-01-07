-- =============================================================================
-- MIGRATION: Create Marketplace Products Daily View
-- =============================================================================
-- Description: Creates a view that joins products with their daily rankings
--              for easy consumption in the marketplace. Returns only active
--              products ordered by their daily rank.
-- Date: 2026-01-04
-- =============================================================================

CREATE OR REPLACE VIEW public.marketplace_products_daily AS
SELECT
  p.*,
  r.rank AS daily_rank
FROM public.products p
JOIN marketplace.products_daily_rank r
  ON r.product_id = p.productid
 AND r.day = current_date
WHERE p.is_active = true
ORDER BY r.rank ASC, p.productid ASC;

-- Comentario descriptivo
COMMENT ON VIEW public.marketplace_products_daily IS 
  'Vista que combina productos activos con su ranking diario para el marketplace. Ordenada por rank ascendente.';
