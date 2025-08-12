-- Adjust FKs so deleting from public.orders works without FK errors
-- Based on current schema provided in sql supabase/query.sql

BEGIN;

-- Ensure deletes in orders remove dependent payment transactions
ALTER TABLE public.payment_transactions
	DROP CONSTRAINT IF EXISTS payment_transactions_order_id_fkey;

ALTER TABLE public.payment_transactions
	ADD CONSTRAINT payment_transactions_order_id_fkey
	FOREIGN KEY (order_id)
	REFERENCES public.orders(id)
	ON DELETE CASCADE;

-- Keep historical sales but detach from deleted orders
-- Make sure order_id is nullable to allow SET NULL (no-op if already nullable)
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

