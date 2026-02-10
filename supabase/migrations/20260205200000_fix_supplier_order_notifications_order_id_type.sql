-- Migration: Fix supplier_order_notifications.order_id type from bigint to uuid
-- Date: 2026-02-05
-- 
-- PROBLEM: supplier_order_notifications.order_id is bigint but should be uuid
-- ERROR: "column "order_id" is of type bigint but expression is of type uuid"
--        when finalize_order_pricing tries to create supplier_orders
-- 
-- SOLUTION: Change order_id from bigint to uuid (safe since table is empty)

BEGIN;

-- Verify table is empty before modifying (safety check)
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.supplier_order_notifications;
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Cannot modify order_id type: table has % rows. Manual data migration required.', v_count;
  END IF;
  
  RAISE NOTICE 'Table is empty, safe to modify order_id type';
END $$;

-- Change order_id from bigint to uuid
ALTER TABLE public.supplier_order_notifications
  ALTER COLUMN order_id TYPE uuid USING order_id::text::uuid;

-- Add comment for documentation
COMMENT ON COLUMN public.supplier_order_notifications.order_id IS 
  'Foreign key to supplier_orders.id (uuid). Changed from bigint on 2026-02-05 to match orders.id type.';

COMMIT;

-- Verification (run manually):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'supplier_order_notifications' AND column_name = 'order_id';
-- Expected: uuid

