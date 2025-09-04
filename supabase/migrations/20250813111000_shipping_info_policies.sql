-- Shipping info RLS complete policies (idempotent)
-- Adds self-access (select/insert/update/delete) and improved supplier visibility.

BEGIN;

-- Ensure RLS enabled
ALTER TABLE public.shipping_info ENABLE ROW LEVEL SECURITY;

-- 1. Buyer self SELECT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='shipping_info' AND policyname='users_select_own_shipping_info'
  ) THEN
    EXECUTE 'CREATE POLICY users_select_own_shipping_info ON public.shipping_info FOR SELECT TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 2. Buyer self INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='shipping_info' AND policyname='users_insert_own_shipping_info'
  ) THEN
    EXECUTE 'CREATE POLICY users_insert_own_shipping_info ON public.shipping_info FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- 3. Buyer self UPDATE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='shipping_info' AND policyname='users_update_own_shipping_info'
  ) THEN
    EXECUTE 'CREATE POLICY users_update_own_shipping_info ON public.shipping_info FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- 4. Buyer self DELETE (optional but useful)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='shipping_info' AND policyname='users_delete_own_shipping_info'
  ) THEN
    EXECUTE 'CREATE POLICY users_delete_own_shipping_info ON public.shipping_info FOR DELETE TO authenticated USING (auth.uid() = user_id)';
  END IF;
END $$;

-- 5. Supplier policy (hybrid: product_sales OR historical carts)
DROP POLICY IF EXISTS suppliers_can_view_buyer_shipping_for_their_orders ON public.shipping_info;
CREATE POLICY suppliers_can_view_buyer_shipping_for_their_orders
ON public.shipping_info
FOR SELECT TO authenticated
USING (
  -- Access via recorded sales
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.product_sales ps ON ps.order_id = o.id
    WHERE o.user_id = shipping_info.user_id
      AND ps.supplier_id = auth.uid()
      AND o.status <> 'cancelled'
  )
  OR
  -- Transitional access via carts already converted (status <> 'active')
  EXISTS (
    SELECT 1
    FROM public.carts c
    JOIN public.cart_items ci ON ci.cart_id = c.cart_id
    JOIN public.products p ON p.productid = ci.product_id
    WHERE c.user_id = shipping_info.user_id
      AND p.supplier_id = auth.uid()
      AND c.status <> 'active'
  )
);

COMMIT;

-- Verification (manual):
-- SELECT policyname FROM pg_policies WHERE tablename='shipping_info';
