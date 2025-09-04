-- Migration: Add inventory_processed_at to orders for webhook idempotence
-- Idempotent addition of column if missing.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='inventory_processed_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN inventory_processed_at timestamptz;
    COMMENT ON COLUMN public.orders.inventory_processed_at IS 'Timestamp when inventory & sales side-effects were applied (webhook idempotence marker).';
  END IF;
END $$;
