-- Migration: add generated supplier_ids array for efficient supplier filtering
-- Date: 2025-08-20
-- Purpose: Close B1 gap (avoid downloading all paid orders then filtering in memory)

-- 1. Add generated column (idempotent)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS supplier_ids uuid[]
  GENERATED ALWAYS AS (
    (
      SELECT ARRAY(
        SELECT DISTINCT (elem->>'supplier_id')::uuid
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(items) = 'array' THEN items ELSE '[]'::jsonb END
        ) AS elem
        WHERE (elem ? 'supplier_id')
          AND (elem->>'supplier_id') ~ '^[0-9a-fA-F-]{36}$'
      )
    )
  ) STORED;

COMMENT ON COLUMN public.orders.supplier_ids IS 'Generated distinct supplier UUIDs present in items[].supplier_id';

-- 2. Index for containment queries
CREATE INDEX IF NOT EXISTS idx_orders_supplier_ids ON public.orders USING GIN (supplier_ids);

-- 3. (Optional) Analyze to update planner stats (safe if run with elevated role)
-- ANALYZE public.orders;

-- 4. Verification query (manual run post-migration):
-- SELECT id, supplier_ids FROM public.orders ORDER BY created_at DESC LIMIT 5;

-- 5. Sample containment filter (manual):
-- SELECT id FROM public.orders WHERE payment_status='paid' AND supplier_ids @> ARRAY['00000000-0000-0000-0000-000000000000'::uuid];
