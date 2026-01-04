-- =============================================================================
-- MIGRATION: Fix Marketplace Products Daily View to use LEFT JOIN
-- =============================================================================
-- Description: Updates the view to use LEFT JOIN instead of JOIN, ensuring
--              all active products are returned even if they don't have a
--              daily rank yet. Products without rank will have daily_rank = NULL.
-- Date: 2026-01-04
-- =============================================================================

CREATE OR REPLACE VIEW public.marketplace_products_daily AS
SELECT
  p.*,
  r.rank AS daily_rank
FROM public.products p
LEFT JOIN marketplace.products_daily_rank r
  ON r.product_id = p.productid
 AND r.day = current_date
WHERE p.is_active = true
ORDER BY r.rank ASC NULLS LAST, p.productid ASC;

-- Comentario descriptivo actualizado
COMMENT ON VIEW public.marketplace_products_daily IS 
  'Vista que combina productos activos con su ranking diario para el marketplace. Usa LEFT JOIN para incluir todos los productos activos. Ordenada por rank ascendente (productos sin rank van al final).';
