-- Migration: add supplier_ids column + trigger to maintain it
-- Date: 2025-08-21
-- Purpose: Add supplier_ids array, backfill existing rows and keep it updated via trigger

-- 1. Add nullable column (non-generated because generated expressions cannot contain subqueries)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS supplier_ids uuid[];

-- 2. Function to extract supplier_ids from JSONB items
CREATE OR REPLACE FUNCTION public.orders_supplier_ids_from_items(p_items jsonb)
RETURNS uuid[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY(
    SELECT DISTINCT (elem->> 'supplier_id')::uuid
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_items) = 'array' THEN p_items ELSE '[]'::jsonb END) elem
    WHERE (elem ? 'supplier_id')
      AND (elem->> 'supplier_id') ~ '^[0-9a-fA-F-]{36}$'
  );
$$;

-- 3. Trigger function to set NEW.supplier_ids before insert/update
CREATE OR REPLACE FUNCTION public.orders_supplier_ids_trigger()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.supplier_ids := public.orders_supplier_ids_from_items(NEW.items);
  RETURN NEW;
END;
$$;

-- 4. Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE t.tgname = 'trg_orders_set_supplier_ids') THEN
    CREATE TRIGGER trg_orders_set_supplier_ids
      BEFORE INSERT OR UPDATE ON public.orders
      FOR EACH ROW EXECUTE FUNCTION public.orders_supplier_ids_trigger();
  END IF;
END $$;

-- 5. Backfill existing rows where supplier_ids is null
UPDATE public.orders
SET supplier_ids = public.orders_supplier_ids_from_items(items)
WHERE supplier_ids IS NULL;

-- 6. Create index
CREATE INDEX IF NOT EXISTS idx_orders_supplier_ids ON public.orders USING GIN (supplier_ids);

-- 7. Optional: set NOT NULL if desired after verification (left nullable for safety)
-- ALTER TABLE public.orders ALTER COLUMN supplier_ids SET NOT NULL;
