-- =============================================================================
-- MIGRATION: Create Products Daily Rank Table
-- =============================================================================
-- Description: Creates auxiliary table for daily product ranking in marketplace
--              schema. This table stores pre-calculated rankings without 
--              modifying the public.products table.
-- Date: 2026-01-04
-- =============================================================================

-- Tabla auxiliar para ranking diario (no toca public.products)
CREATE TABLE IF NOT EXISTS marketplace.products_daily_rank (
  day DATE NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(productid) ON DELETE CASCADE,
  rank DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (day, product_id)
);

-- Índice para ordenar rápido por día y rank
CREATE INDEX IF NOT EXISTS idx_products_daily_rank_day_rank
ON marketplace.products_daily_rank (day, rank, product_id);

-- Índice útil para joins por producto
CREATE INDEX IF NOT EXISTS idx_products_daily_rank_product_day
ON marketplace.products_daily_rank (product_id, day);

-- Habilitar RLS
ALTER TABLE marketplace.products_daily_rank ENABLE ROW LEVEL SECURITY;

-- Política de lectura pública (cualquiera puede ver rankings)
CREATE POLICY "Allow public read access to daily ranks"
ON marketplace.products_daily_rank
FOR SELECT
TO anon, authenticated
USING (true);

-- Comentarios descriptivos
COMMENT ON TABLE marketplace.products_daily_rank IS 'Tabla auxiliar con rankings diarios pre-calculados de productos';
COMMENT ON COLUMN marketplace.products_daily_rank.day IS 'Fecha del ranking';
COMMENT ON COLUMN marketplace.products_daily_rank.product_id IS 'ID del producto (FK a public.products.productid)';
COMMENT ON COLUMN marketplace.products_daily_rank.rank IS 'Valor de ranking calculado (mayor = mejor posición)';
COMMENT ON COLUMN marketplace.products_daily_rank.created_at IS 'Timestamp de creación del registro';
