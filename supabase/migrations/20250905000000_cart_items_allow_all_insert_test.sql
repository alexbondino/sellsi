-- Temporary migration: allow all INSERTs into cart_items for testing RLS issues
-- DO NOT KEEP THIS PERMANENTLY - remove after test

BEGIN;

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items' AND policyname='cart_items_insert_allow_all_test'
  ) THEN
    EXECUTE 'DROP POLICY cart_items_insert_allow_all_test ON public.cart_items';
  END IF;
END$$;

CREATE POLICY cart_items_insert_allow_all_test ON public.cart_items
  FOR INSERT
  WITH CHECK (true);

COMMIT;
