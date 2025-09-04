-- Migration: create supplier_orders and supplier_order_items (Fase 1.5)
-- Idempotent (safe to re-run). Creates per-supplier decomposition of a parent order.

-- supplier_orders: one row per (order, supplier)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_orders'
  ) THEN
    CREATE TABLE public.supplier_orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      parent_order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
      supplier_id uuid NOT NULL REFERENCES public.users(user_id),
      status text NOT NULL DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending','accepted','in_transit','delivered','cancelled','rejected'])),
      payment_status text NOT NULL DEFAULT 'pending',
      estimated_delivery_date timestamptz NULL,
      subtotal numeric NOT NULL DEFAULT 0,
      shipping_amount numeric NOT NULL DEFAULT 0,
      total numeric NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      delivered_at timestamptz NULL,
      UNIQUE(parent_order_id, supplier_id)
    );
    CREATE INDEX idx_supplier_orders_parent ON public.supplier_orders(parent_order_id);
    CREATE INDEX idx_supplier_orders_supplier ON public.supplier_orders(supplier_id);
    CREATE INDEX idx_supplier_orders_status ON public.supplier_orders(status);
  END IF;
END $$;

-- supplier_order_items: line items per supplier order
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='supplier_order_items'
  ) THEN
    CREATE TABLE public.supplier_order_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      supplier_order_id uuid NOT NULL REFERENCES public.supplier_orders(id) ON DELETE CASCADE,
      product_id uuid NOT NULL REFERENCES public.products(productid),
      quantity integer NOT NULL CHECK (quantity > 0),
      unit_price numeric NOT NULL DEFAULT 0, -- effective unit price (tier applied)
      price_at_addition numeric,             -- raw price_at_addition from original payload (for audit)
      price_tiers jsonb,                     -- snapshot of tiers for audit
      document_type text CHECK (document_type IN ('boleta','factura','ninguno') OR document_type IS NULL),
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_supplier_order_items_order ON public.supplier_order_items(supplier_order_id);
    CREATE INDEX idx_supplier_order_items_product ON public.supplier_order_items(product_id);
  END IF;
END $$;

-- Helper function (optional future): recalc supplier_orders.total from items
-- (intentionally not created now to keep migration minimal)
