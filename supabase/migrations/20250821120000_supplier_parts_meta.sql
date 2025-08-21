-- Migration: Add supplier_parts_meta JSONB column (Option A 2.0) - renamed to resolve version conflict
-- Idempotent: uses IF NOT EXISTS
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS supplier_parts_meta jsonb;

-- Optional future index (uncomment if needed for supplier filtering)
-- CREATE INDEX IF NOT EXISTS idx_orders_supplier_parts_meta ON public.orders USING GIN (supplier_parts_meta);
