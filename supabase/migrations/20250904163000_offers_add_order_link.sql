-- Migration: Add order linkage to offers (Phase 1 incremental)
-- Purpose: allow associating one or more offers to an order at payment creation time
-- Features:
--   * Adds nullable order_id column to offers
--   * Adds FK (ON DELETE SET NULL) and supporting index
--   * (Optional helper) function link_offers_to_order for bulk association with validation
-- Safety: non-blocking (nullable). Rollback simply drops column & function.

BEGIN;

DO $$ BEGIN
  -- Add column only if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='offers' AND column_name='order_id'
  ) THEN
    ALTER TABLE public.offers ADD COLUMN order_id uuid NULL;
  END IF;
END $$;

-- Add FK constraint idempotently
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='offers_order_id_fkey'
  ) THEN
    ALTER TABLE public.offers
      ADD CONSTRAINT offers_order_id_fkey FOREIGN KEY (order_id)
      REFERENCES public.orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Index to quickly find offers by order
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname='idx_offers_order_id' AND n.nspname='public'
  ) THEN
    CREATE INDEX idx_offers_order_id ON public.offers(order_id) WHERE order_id IS NOT NULL;
  END IF;
END $$;

-- Helper function for bulk linking with basic deadline & state validation
CREATE OR REPLACE FUNCTION public.link_offers_to_order(p_order_id uuid, p_offer_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec offers%ROWTYPE;
  linked_count int := 0;
  invalid_deadline int := 0;
  invalid_state int := 0;
  already_linked int := 0;
  now_ts timestamptz := now();
BEGIN
  IF p_offer_ids IS NULL OR array_length(p_offer_ids,1) IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'EMPTY_IDS');
  END IF;

  FOR rec IN SELECT * FROM offers WHERE id = ANY(p_offer_ids) FOR UPDATE LOOP
    -- Deadline check (only if purchase_deadline present)
    IF rec.purchase_deadline IS NOT NULL AND rec.purchase_deadline < now_ts THEN
      invalid_deadline := invalid_deadline + 1;
      CONTINUE;
    END IF;
    -- State check (accepted / purchased for Phase1)
    IF rec.status NOT IN ('accepted','purchased') THEN
      invalid_state := invalid_state + 1;
      CONTINUE;
    END IF;
    -- Already linked to different order
    IF rec.order_id IS NOT NULL AND rec.order_id <> p_order_id THEN
      already_linked := already_linked + 1;
      CONTINUE;
    END IF;
    UPDATE offers SET order_id = p_order_id, updated_at = now_ts WHERE id = rec.id;
    linked_count := linked_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'linked', linked_count,
    'invalid_deadline', invalid_deadline,
    'invalid_state', invalid_state,
    'already_linked_other_order', already_linked
  );
END;
$$;

COMMIT;
