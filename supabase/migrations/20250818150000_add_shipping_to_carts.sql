-- Migration: add shipping_total to carts for unified totals post materialization
-- Date: 2025-08-18
-- Purpose: Persist shipping amount chosen at checkout so classic cart orders can display
-- the same total as their originating payment order.
-- Safe (idempotent) additions using IF NOT EXISTS guards.

BEGIN;

-- Add column to store shipping amount in CLP (integer pesos). If already exists, do nothing.
ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS shipping_total integer;

-- Optional: currency for future multi-currency (default CLP)
ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS shipping_currency text DEFAULT 'CLP';

-- (Optional) Column to cache grand total (items + shipping) at materialization time,
-- to avoid recomputation drift. Uncomment if required later.
-- ALTER TABLE public.carts
--   ADD COLUMN IF NOT EXISTS grand_total integer;

COMMENT ON COLUMN public.carts.shipping_total IS 'Shipping amount (CLP) persisted from originating payment order';
COMMENT ON COLUMN public.carts.shipping_currency IS 'Currency code for shipping amount (default CLP)';

COMMIT;
