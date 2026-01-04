-- =============================================================================
-- MIGRATION: Create Refresh Products Daily Rank Function
-- =============================================================================
-- Description: Creates function to refresh daily product rankings in the
--              marketplace schema. This function clears today's rankings
--              and generates new random rankings for all active products.
-- Date: 2026-01-04
-- =============================================================================

CREATE OR REPLACE FUNCTION marketplace.refresh_products_daily_rank()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Borra el ranking de hoy (por si se re-ejecuta)
  DELETE FROM marketplace.products_daily_rank
  WHERE day = current_date;

  -- Inserta ranking nuevo para los productos activos
  INSERT INTO marketplace.products_daily_rank (day, product_id, rank)
  SELECT
    current_date AS day,
    p.productid AS product_id,
    random() AS rank
  FROM public.products p
  WHERE p.is_active = true;
END;
$$;

-- Comentario descriptivo
COMMENT ON FUNCTION marketplace.refresh_products_daily_rank() IS 
  'Regenera el ranking diario de productos activos con valores aleatorios. Diseñada para ejecutarse una vez al día.';
