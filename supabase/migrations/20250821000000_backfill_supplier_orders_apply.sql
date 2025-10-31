-- Migration: Apply backfill for supplier_orders & supplier_order_items
-- Created: 2025-08-20 by automation to avoid modifying historical migrations
-- Safe to re-run: idempotent inserts/updates and presence checks

DO $$ BEGIN
  -- Ensure supplier_orders table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_orders') THEN
    RAISE NOTICE 'supplier_orders table not found. Skipping backfill.';
    RETURN; 
  END IF;
  -- Ensure supplier_order_items table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_order_items') THEN
    RAISE NOTICE 'supplier_order_items table not found. Skipping backfill.';
    RETURN; 
  END IF;
END $$;

-- 1. Ensure required columns exist on supplier_orders (non destructive)
ALTER TABLE IF EXISTS public.supplier_orders
  ADD COLUMN IF NOT EXISTS parent_order_id uuid,
  ADD COLUMN IF NOT EXISTS supplier_id uuid,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS estimated_delivery_date timestamptz,
  ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_orders_parent_order_id_fkey'
  ) THEN
    ALTER TABLE public.supplier_orders
      ADD CONSTRAINT supplier_orders_parent_order_id_fkey FOREIGN KEY (parent_order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'supplier_orders_supplier_id_fkey'
  ) THEN
    ALTER TABLE public.supplier_orders
      ADD CONSTRAINT supplier_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname='uq_supplier_orders_parent_supplier'
  ) THEN
    CREATE UNIQUE INDEX uq_supplier_orders_parent_supplier ON public.supplier_orders(parent_order_id, supplier_id);
  END IF;
END $$;

-- 2. Ensure supplier_order_items table minimally exists (create if missing)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_order_items') THEN
    CREATE TABLE public.supplier_order_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_order_id uuid NOT NULL,
      product_id uuid NOT NULL,
      quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
      unit_price numeric NOT NULL DEFAULT 0,
      price_at_addition numeric,
      price_tiers jsonb,
      document_type text DEFAULT 'ninguno',
      created_at timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_supplier_order_items_supplier_order_id ON public.supplier_order_items(supplier_order_id);
  END IF;
END $$;

-- 3. Backfill supplier_orders from paid orders (only if missing) - idempotent
WITH candidate_parts AS (
  SELECT
    o.id               AS parent_order_id,
    (it->>'supplier_id')::uuid AS supplier_id,
    COALESCE(o.status,'pending') AS status,
    COALESCE(o.payment_status,'pending') AS payment_status,
    o.estimated_delivery_date,
    SUM( COALESCE( (it->>'price_at_addition')::numeric, (it->>'price')::numeric, 0 ) *
         COALESCE( NULLIF(it->>'quantity','')::numeric, 1) ) AS subtotal
  FROM public.orders o
  CROSS JOIN LATERAL jsonb_array_elements(o.items) it
  WHERE o.payment_status = 'paid'
    AND (it->>'supplier_id') IS NOT NULL
  GROUP BY o.id, (it->>'supplier_id'), o.status, o.payment_status, o.estimated_delivery_date
), ins_parts AS (
  INSERT INTO public.supplier_orders (parent_order_id, supplier_id, status, payment_status, estimated_delivery_date, subtotal, shipping_amount, total, created_at, updated_at)
  SELECT c.parent_order_id,
         c.supplier_id,
         c.status,
         c.payment_status,
         c.estimated_delivery_date,
         c.subtotal,
         0 AS shipping_amount,
         c.subtotal AS total,
         now(),
         now()
  FROM candidate_parts c
  LEFT JOIN public.supplier_orders so
    ON so.parent_order_id = c.parent_order_id AND so.supplier_id = c.supplier_id
  WHERE so.id IS NULL
  RETURNING parent_order_id, supplier_id, id, subtotal
)
SELECT * FROM ins_parts;

-- 4. Backfill supplier_order_items for all parts (idempotent)
WITH part_map AS (
  SELECT id AS supplier_order_id, parent_order_id, supplier_id FROM public.supplier_orders
), order_items AS (
  SELECT
    o.id AS parent_order_id,
    (it->>'supplier_id')::uuid AS supplier_id,
    (it->>'product_id')::uuid AS product_id,
    COALESCE(NULLIF(it->>'quantity','')::int,1) AS quantity,
    COALESCE( (it->>'price_at_addition')::numeric, (it->>'price')::numeric, 0) AS price_at_addition,
    CASE WHEN (lower(it->>'document_type') IN ('boleta','factura')) THEN lower(it->>'document_type') ELSE 'ninguno' END AS document_type,
    it->'price_tiers' AS price_tiers
  FROM public.orders o
  CROSS JOIN LATERAL jsonb_array_elements(o.items) it
  WHERE (it->>'supplier_id') IS NOT NULL
), to_insert AS (
  SELECT
    pm.supplier_order_id,
    oi.product_id,
    oi.quantity,
    oi.price_at_addition AS unit_price,
    oi.price_at_addition,
    oi.price_tiers,
    oi.document_type
  FROM order_items oi
  JOIN part_map pm ON pm.parent_order_id = oi.parent_order_id AND pm.supplier_id = oi.supplier_id
  LEFT JOIN public.supplier_order_items soi ON soi.supplier_order_id = pm.supplier_order_id AND soi.product_id = oi.product_id
  WHERE soi.id IS NULL
    AND EXISTS (SELECT 1 FROM public.products WHERE id = oi.product_id)  -- Only include products that exist
)
INSERT INTO public.supplier_order_items (supplier_order_id, product_id, quantity, unit_price, price_at_addition, price_tiers, document_type)
SELECT * FROM to_insert;

-- 5. Recompute totals
UPDATE public.supplier_orders so
SET subtotal = COALESCE(src.subtotal, so.subtotal),
    total = COALESCE(src.subtotal, so.subtotal) + COALESCE(so.shipping_amount,0),
    updated_at = now()
FROM (
  SELECT soi.supplier_order_id, SUM(soi.unit_price * soi.quantity) AS subtotal
  FROM public.supplier_order_items soi
  GROUP BY soi.supplier_order_id
) src
WHERE src.supplier_order_id = so.id;

-- End migration
