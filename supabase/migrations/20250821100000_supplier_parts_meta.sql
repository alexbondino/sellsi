-- Migration: Add supplier_parts_meta JSONB column (Option A 2.0)
-- No default to distinguish NULL (uninicializada) vs objeto vacío
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS supplier_parts_meta jsonb;

-- Optional future index (descomentar cuando se requieran filtros por supplier dentro del JSON)
-- CREATE INDEX IF NOT EXISTS idx_orders_supplier_parts_meta ON public.orders USING GIN (supplier_parts_meta);
