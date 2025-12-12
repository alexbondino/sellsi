-- Migration: Add metadata column to orders table for stock restoration tracking
-- Date: 2025-12-12
-- Related: Fix for stock_restoration_on_rejection trigger error (42703)

BEGIN;

-- Add metadata column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Create GIN index for better JSONB query performance
CREATE INDEX IF NOT EXISTS idx_orders_metadata 
ON public.orders USING gin(metadata);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.metadata IS 
'JSONB field for storing order metadata including stock restoration flags and logs';

COMMIT;
