-- Fix cart_items RLS policies to use NEW.cart_id properly on INSERT/UPDATE
-- Created: 2025-09-04
-- Description:
--   Replaces previous cart_items_insert_owner / cart_items_update_owner policies
--   which referenced cart_items.cart_id inside WITH CHECK for INSERT (can cause
--   unexpected rejections) with versions that explicitly use NEW.cart_id.
--   Keeps service_role bypass and restricts to carts owned by auth.uid() and active.
--
--   If you decide NOT to enforce cart status, remove the lines: AND c.status = 'active'
--
-- Deployment:
--   supabase db push             (local -> remote project)
--   # or to inspect diff first:
--   supabase db diff --use-migra
-- Verification:
--   SELECT policyname, qual, with_check FROM pg_policies
--   WHERE schemaname='public' AND tablename='cart_items';

BEGIN;

DROP POLICY IF EXISTS cart_items_insert_owner ON public.cart_items;
CREATE POLICY cart_items_insert_owner
  ON public.cart_items
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_id
          AND c.user_id = auth.uid()
          AND c.status = 'active'
      )
    )
    OR (auth.role() = 'service_role')
  );

DROP POLICY IF EXISTS cart_items_update_owner ON public.cart_items;
CREATE POLICY cart_items_update_owner
  ON public.cart_items
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_items.cart_id
          AND c.user_id = auth.uid()
          AND c.status = 'active'
      )
    )
    OR (auth.role() = 'service_role')
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_id
          AND c.user_id = auth.uid()
          AND c.status = 'active'
      )
    )
    OR (auth.role() = 'service_role')
  );

-- Allow SELECT of own cart items (and service_role). Without this, frontend may see empty list.
DROP POLICY IF EXISTS cart_items_select_owner ON public.cart_items;
CREATE POLICY cart_items_select_owner
  ON public.cart_items
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_items.cart_id
          AND c.user_id = auth.uid()
          AND c.status = 'active'
      )
    )
    OR (auth.role() = 'service_role')
  );

-- Allow DELETE of own cart items (and service_role) if needed by clear/remove logic.
DROP POLICY IF EXISTS cart_items_delete_owner ON public.cart_items;
CREATE POLICY cart_items_delete_owner
  ON public.cart_items
  FOR DELETE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_items.cart_id
          AND c.user_id = auth.uid()
          AND c.status = 'active'
      )
    )
    OR (auth.role() = 'service_role')
  );

COMMIT;
