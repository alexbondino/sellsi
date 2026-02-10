-- Migration: Fix supplier_order_notifications.supplier_id type from bigint to uuid
-- Date: 2026-02-05
-- 
-- PROBLEM: supplier_order_notifications.supplier_id is bigint but should be uuid
-- ERROR: "column "supplier_id" is of type bigint but expression is of type uuid"
--        when trigger notify_supplier_order_email tries to insert into supplier_order_notifications
-- 
-- SOLUTION: Change supplier_id from bigint to uuid (safe since table is empty)

BEGIN;

-- Verify table is empty before modifying (safety check)
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.supplier_order_notifications;
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Cannot modify supplier_id type: table has % rows. Manual data migration required.', v_count;
  END IF;
  
  RAISE NOTICE 'Table is empty, safe to modify supplier_id type';
END $$;

-- Change supplier_id from bigint to uuid
ALTER TABLE public.supplier_order_notifications
  ALTER COLUMN supplier_id TYPE uuid USING supplier_id::text::uuid;

-- Add comment for documentation
COMMENT ON COLUMN public.supplier_order_notifications.supplier_id IS 
  'Foreign key to users.user_id (uuid). Changed from bigint on 2026-02-05 to match users.user_id type.';

COMMIT;

-- Verification (run manually):
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'supplier_order_notifications' AND column_name = 'supplier_id';
-- Expected: uuid
