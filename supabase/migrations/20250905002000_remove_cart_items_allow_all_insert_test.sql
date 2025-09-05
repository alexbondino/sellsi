-- Remove temporary permissive insert policy created for testing

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items' AND policyname='cart_items_insert_allow_all_test'
  ) THEN
    EXECUTE 'DROP POLICY cart_items_insert_allow_all_test ON public.cart_items';
  END IF;
END$$;

COMMIT;
