-- Schema consistency & shipping access fix
-- Idempotent adjustments: ensure product_sales exists, add missing FK on request_products,
-- adjust product_sales order_id FK semantics, and refine shipping_info supplier policy.

BEGIN;

-- 1. Ensure product_sales table
CREATE TABLE IF NOT EXISTS public.product_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(productid),
  supplier_id uuid NOT NULL REFERENCES public.users(user_id),
  quantity integer NOT NULL CHECK (quantity > 0),
  amount numeric NOT NULL DEFAULT 0,
  trx_date timestamptz NOT NULL DEFAULT now(),
  order_id uuid REFERENCES public.orders(id)
);

-- Unique composite (ignore if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_sales_unique'
  ) THEN
    ALTER TABLE public.product_sales
      ADD CONSTRAINT product_sales_unique UNIQUE (order_id, product_id, supplier_id);
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_product_sales_supplier ON public.product_sales (supplier_id, trx_date);
CREATE INDEX IF NOT EXISTS idx_product_sales_product ON public.product_sales (product_id, trx_date);
CREATE INDEX IF NOT EXISTS idx_product_sales_order ON public.product_sales (order_id);

-- 2. Add missing FK in request_products (cleanup orphans first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.request_products'::regclass
      AND conname = 'request_products_product_id_fkey'
  ) THEN
    DELETE FROM public.request_products rp
    WHERE rp.product_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM public.products p WHERE p.productid = rp.product_id);
    ALTER TABLE public.request_products
      ADD CONSTRAINT request_products_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(productid);
  END IF;
END$$;

-- 3. Align product_sales.order_id FK to ON DELETE SET NULL
ALTER TABLE public.product_sales
  DROP CONSTRAINT IF EXISTS product_sales_order_id_fkey;
ALTER TABLE public.product_sales
  ADD CONSTRAINT product_sales_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;

-- 4. Improve shipping_info policy (suppliers see shipping if they sold in non-cancelled orders)
ALTER TABLE public.shipping_info ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS suppliers_can_view_buyer_shipping_for_their_orders ON public.shipping_info;
CREATE POLICY suppliers_can_view_buyer_shipping_for_their_orders
ON public.shipping_info
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.product_sales ps ON ps.order_id = o.id
    WHERE o.user_id = shipping_info.user_id
      AND ps.supplier_id = auth.uid()
      AND o.status <> 'cancelled'
  )
);

COMMIT;

-- Optional backfill (commented out; run manually if needed)
-- INSERT INTO public.product_sales (product_id, supplier_id, quantity, amount, order_id)
-- SELECT (item->>'product_id')::uuid,
--        (item->>'supplier_id')::uuid,
--        (item->>'quantity')::int,
--        ((item->>'quantity')::int * (item->>'unit_price')::numeric),
--        o.id
-- FROM public.orders o
-- CROSS JOIN LATERAL jsonb_array_elements(o.items) item
-- WHERE (item->>'product_id') IS NOT NULL
--   AND (item->>'supplier_id') IS NOT NULL
--   AND NOT EXISTS (
--     SELECT 1 FROM public.product_sales ps
--     WHERE ps.order_id = o.id
--       AND ps.product_id = (item->>'product_id')::uuid
--       AND ps.supplier_id = (item->>'supplier_id')::uuid
--   );
