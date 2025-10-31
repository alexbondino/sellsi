-- Migration: add RLS INSERT policy for cart_items allowing owner inserts
-- Date: 2025-09-04

BEGIN;

-- Ensure RLS is enabled (idempotent safe)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing similarly named policy if re-running
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items' AND policyname='cart_items_insert_owner'
  ) THEN
    EXECUTE 'DROP POLICY cart_items_insert_owner ON public.cart_items';
  END IF;
END$$;

CREATE POLICY cart_items_insert_owner ON public.cart_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts c
      WHERE c.cart_id = cart_items.cart_id
        AND c.user_id = auth.uid()
    )
  );

COMMIT;
