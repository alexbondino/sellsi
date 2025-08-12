-- Adjust FKs so deleting from public.orders works without FK errors
-- Based on current schema in sql supabase/query.sql

BEGIN;

-- payment_transactions.order_id must be deleted when parent order is deleted
ALTER TABLE public.payment_transactions
  DROP CONSTRAINT IF EXISTS payment_transactions_order_id_fkey;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT payment_transactions_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES public.orders(id)
  ON DELETE CASCADE;

-- product_sales.order_id should be retained but decoupled when order is deleted
-- Ensure order_id is nullable to allow SET NULL
ALTER TABLE public.product_sales
  ALTER COLUMN order_id DROP NOT NULL;

ALTER TABLE public.product_sales
  DROP CONSTRAINT IF EXISTS product_sales_order_id_fkey;

ALTER TABLE public.product_sales
  ADD CONSTRAINT product_sales_order_id_fkey
  FOREIGN KEY (order_id)
  REFERENCES public.orders(id)
  ON DELETE SET NULL;

COMMIT;
