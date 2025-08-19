-- Migration: Add split architecture support for orders -> per-supplier carts
-- Date: 2025-08-19
-- Phase: 0 (schema preparation)

-- 1. Add split_status to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS split_status text CHECK (split_status IN ('not_split','split','partial')) DEFAULT 'not_split';

-- 2. Add payment_order_id + supplier_id to carts
ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS payment_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;

ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS supplier_id uuid; -- optional FK to users table (not enforced yet to avoid locking) -- REFERENCES public.users(user_id)

-- 3. Indices
CREATE INDEX IF NOT EXISTS idx_orders_split_status ON public.orders(split_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_payment_order_id ON public.carts(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_carts_payment_order_supplier ON public.carts(payment_order_id, supplier_id);
CREATE INDEX IF NOT EXISTS idx_carts_supplier_id_status ON public.carts(supplier_id, status);

-- 4. Future proof: do not backfill yet; leave existing rows with default 'not_split'.

-- 5. Safety note: If RLS enabled, ensure policies allow insert/select on new columns where needed.
