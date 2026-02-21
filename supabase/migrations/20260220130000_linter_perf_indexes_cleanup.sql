-- ============================================================================
-- Migration: Linter Performance Fixes (indexes/duplicates)
-- Date: 2026-02-20
-- Goal:
--   - Remove duplicate indexes/constraints reported by Supabase DB linter
--   - Add covering indexes for foreign keys (especially delete/JOIN hotspots)
-- Notes:
--   - Idempotent and guarded for mixed-schema installations.
--   - Uses non-CONCURRENTLY operations for compatibility with `supabase db push`.
--     In high-traffic production, consider applying equivalent changes
--     manually with CONCURRENTLY.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Drop duplicate indexes (keep one)
-- --------------------------------------------------------------------------

-- edge_function_invocations: keep `edge_fn_invocations_fn_started_idx`, drop `idx_edge_function_invocations_fn_started`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='edge_function_invocations' AND indexname='edge_fn_invocations_fn_started_idx'
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='edge_function_invocations' AND indexname='idx_edge_function_invocations_fn_started'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.idx_edge_function_invocations_fn_started';
  END IF;
END;
$$;

-- financing_transactions(supplier_order_id): keep `idx_ftx_supplier_order`, drop `idx_financing_transactions_supplier_order_fk`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='financing_transactions' AND indexname='idx_ftx_supplier_order'
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='financing_transactions' AND indexname='idx_financing_transactions_supplier_order_fk'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.idx_financing_transactions_supplier_order_fk';
  END IF;
END;
$$;

-- supplier_orders uniqueness: keep table UNIQUE constraint, drop redundant unique index if both exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.supplier_orders'::regclass
      AND conname='supplier_orders_parent_order_id_supplier_id_key'
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='supplier_orders' AND indexname='uq_supplier_orders_parent_supplier'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS public.uq_supplier_orders_parent_supplier';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;

-- control_panel.feature_flags: if both identical unique indexes exist, drop one of them
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='control_panel' AND tablename='feature_flags' AND indexname='feature_flags_workspace_key_uq'
  ) AND EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='control_panel' AND tablename='feature_flags' AND indexname='feature_flags_workspace_key_uk'
  ) THEN
    EXECUTE 'DROP INDEX IF EXISTS control_panel.feature_flags_workspace_key_uq';
  END IF;
EXCEPTION
  WHEN invalid_schema_name THEN
    NULL;
END;
$$;

-- --------------------------------------------------------------------------
-- 2) Drop duplicate UNIQUE constraints created twice (keep named constraints)
-- --------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.offer_limits_product'::regclass
      AND conname='offer_limits_product_buyer_product_month_unique'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.offer_limits_product'::regclass
      AND conname='offer_limits_product_buyer_id_product_id_month_year_key'
  ) THEN
    EXECUTE 'ALTER TABLE public.offer_limits_product DROP CONSTRAINT offer_limits_product_buyer_id_product_id_month_year_key';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.offer_limits_supplier'::regclass
      AND conname='offer_limits_supplier_buyer_supplier_month_unique'
  ) AND EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.offer_limits_supplier'::regclass
      AND conname='offer_limits_supplier_buyer_id_supplier_id_month_year_key'
  ) THEN
    EXECUTE 'ALTER TABLE public.offer_limits_supplier DROP CONSTRAINT offer_limits_supplier_buyer_id_supplier_id_month_year_key';
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END;
$$;

-- --------------------------------------------------------------------------
-- 3) Add covering indexes for foreign keys flagged by the linter
-- --------------------------------------------------------------------------

-- cart_items(product_id) FK coverage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cart_items')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='cart_items' AND column_name='product_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id)';
  END IF;
END;
$$;

-- products(supplier_id) FK coverage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='supplier_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id) WHERE supplier_id IS NOT NULL';
  END IF;
END;
$$;

-- invoices_meta(user_id) FK coverage (may already exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices_meta')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices_meta' AND column_name='user_id') THEN
    -- Note: idx_invoices_meta_user_id was created in 20260114120000_performance_critical_indexes.sql without WHERE clause.
    -- We use a different name here if we want the partial index, or just skip it.
    -- Since the linter complained, it might be because the existing index is not exactly matching the FK or was dropped.
    -- We will create a safe fallback index with a different name just in case.
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_invoices_meta_user_id_fk ON public.invoices_meta(user_id) WHERE user_id IS NOT NULL';
  END IF;
END;
$$;

-- orders(payment_reviewed_by) FK coverage (bank transfer audit)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='orders')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='payment_reviewed_by') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_orders_payment_reviewed_by ON public.orders(payment_reviewed_by) WHERE payment_reviewed_by IS NOT NULL';
  END IF;
END;
$$;

-- financing_transactions(restored_by) FK coverage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='financing_transactions')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_transactions' AND column_name='restored_by') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_financing_transactions_restored_by ON public.financing_transactions(restored_by) WHERE restored_by IS NOT NULL';
  END IF;
END;
$$;

-- offer_limits legacy table FK coverage (if still present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='offer_limits') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='offer_limits' AND column_name='product_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_offer_limits_product_id ON public.offer_limits(product_id) WHERE product_id IS NOT NULL';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='offer_limits' AND column_name='supplier_id') THEN
      EXECUTE 'CREATE INDEX IF NOT EXISTS idx_offer_limits_supplier_id ON public.offer_limits(supplier_id) WHERE supplier_id IS NOT NULL';
    END IF;
  END IF;
END;
$$;

-- offer_limits_product(product_id) FK coverage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='offer_limits_product')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='offer_limits_product' AND column_name='product_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_offer_limits_product_product_id ON public.offer_limits_product(product_id)';
  END IF;
END;
$$;

-- offer_limits_supplier(supplier_id) FK coverage
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='offer_limits_supplier')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='offer_limits_supplier' AND column_name='supplier_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_offer_limits_supplier_supplier_id ON public.offer_limits_supplier(supplier_id)';
  END IF;
END;
$$;

COMMIT;
