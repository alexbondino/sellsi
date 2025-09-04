-- Minimal migration: add estimated_delivery_date to orders (no carts change for now)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamptz;

COMMENT ON COLUMN public.orders.estimated_delivery_date IS 'Supplier-provided estimated delivery date (set when status moves to in_transit).';
