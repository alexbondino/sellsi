-- Migration: allow service_role to bypass owner check on cart_items RLS policies
-- Date: 2025-09-04

BEGIN;

-- Drop existing policies (if present) and recreate them to also allow service_role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items' AND policyname='cart_items_update_owner'
  ) THEN
    EXECUTE 'DROP POLICY cart_items_update_owner ON public.cart_items';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='cart_items' AND policyname='cart_items_insert_owner'
  ) THEN
    EXECUTE 'DROP POLICY cart_items_insert_owner ON public.cart_items';
  END IF;
END$$;

-- Recreate UPDATE policy: allow owner (via carts.user_id = auth.uid()) OR service_role
CREATE POLICY cart_items_update_owner ON public.cart_items
  FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_items.cart_id
          AND c.user_id = auth.uid()
      )
    )
    OR auth.role() = 'service_role'
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_items.cart_id
          AND c.user_id = auth.uid()
      )
    )
    OR auth.role() = 'service_role'
  );

-- Recreate INSERT policy: allow owner via cart existence OR service_role
CREATE POLICY cart_items_insert_owner ON public.cart_items
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.carts c
        WHERE c.cart_id = cart_items.cart_id
          AND c.user_id = auth.uid()
      )
    )
    OR auth.role() = 'service_role'
  );

COMMIT;
