-- Migration: Reconcile offers.base_price_at_offer from products.price in batches
-- Safe, idempotent helper to populate missing/invalid base_price before VALIDATE
-- Usage: run this migration on staging/prod to fill base_price_at_offer where possible.

-- Quick pre-check (run manually):
-- SELECT count(*) FROM public.offers WHERE base_price_at_offer IS NULL OR base_price_at_offer <= 0;

DO $$
DECLARE
  batch_size integer := 1000; -- adjust for your DB size
  sleep_seconds numeric := 0.2; -- pause between batches to reduce load
  updated_count integer := 0;
BEGIN
  RAISE NOTICE 'Starting offers.base_price_at_offer reconciliation (batch_size=%).', batch_size;

  LOOP
    -- Update a limited number of rows that have an associated product with a positive price
    WITH to_fix AS (
  SELECT o.id, p.price
  FROM public.offers o
  JOIN public.products p ON p.productid = o.product_id
      WHERE (o.base_price_at_offer IS NULL OR o.base_price_at_offer <= 0)
        AND p.price > 0
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
  UPDATE public.offers o
  SET base_price_at_offer = tf.price
  FROM to_fix tf
  WHERE o.id = tf.id;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    IF updated_count = 0 THEN
      EXIT;
    END IF;

    RAISE NOTICE 'Updated % rows in this batch.', updated_count;
    PERFORM pg_sleep(sleep_seconds);
  END LOOP;

  RAISE NOTICE 'Reconciliation completed. Running final checks.';

  -- Remaining problematic rows (no product.price > 0 or no product linked)
  PERFORM (
    SELECT 1 FROM public.offers
    WHERE base_price_at_offer IS NULL OR base_price_at_offer <= 0
    LIMIT 1
  );

  RAISE NOTICE 'You should now inspect remaining rows: SELECT id, product_id FROM public.offers WHERE base_price_at_offer IS NULL OR base_price_at_offer <= 0 LIMIT 200;';
END$$;

-- After this migration runs, review remaining violating rows:
-- SELECT id, buyer_id, supplier_id, product_id, base_price_at_offer FROM public.offers
-- WHERE base_price_at_offer IS NULL OR base_price_at_offer <= 0 LIMIT 200;

-- When satisfied, validate the constraint added by the enforce migration:
-- ALTER TABLE public.offers VALIDATE CONSTRAINT chk_offers_base_price_positive;

-- NOTES:
-- - This script only fills rows where products.price > 0 exists.
-- - Remaining rows need manual review (set state, delete, or backfill with business logic).
-- - Adjust batch_size and sleep_seconds for your environment.
