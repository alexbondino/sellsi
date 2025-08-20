-- Migration: add estimated_delivery_date column to orders
-- Adds a nullable timestamp to store supplier provided estimated delivery date.
-- Safe to run multiple times (IF NOT EXISTS guard via DO block).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='orders' AND column_name='estimated_delivery_date'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN estimated_delivery_date timestamptz NULL;
  END IF;
END $$;

-- Optional: index to query orders in transit by upcoming delivery date
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery_date ON public.orders(estimated_delivery_date);
