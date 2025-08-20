-- Migration: Backfill supplier_orders and supplier_order_items from existing orders.items JSON
-- Idempotent: skips rows already migrated. Run once after creating supplier_orders tables.
-- Assumptions:
--  * orders.items is an array of JSON objects each containing at minimum supplier_id, product_id, quantity, price_at_addition OR price.
--  * orders.shipping (or shipping) holds the total shipping cost for the full order (nullable).
--  * Existing unique constraint (parent_order_id, supplier_id) prevents duplicates.
--  * Some items may lack supplier_id -> skipped.
--  * payment_status + status are copied from parent order; future divergence allowed.

DO $$
BEGIN
  -- Ensure tables exist before attempting backfill
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_orders') THEN
    RAISE NOTICE 'supplier_orders table not found. Skipping backfill.';
    RETURN; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_order_items') THEN
    RAISE NOTICE 'supplier_order_items table not found. Skipping backfill.';
    RETURN; END IF;

  -- 1. Aggregate per (order, supplier) to compute subtotals & proportional shipping allocation
  WITH raw AS (
    SELECT o.id AS parent_order_id,
           o.status,
           o.payment_status,
           o.shipping, -- may be null
           o.estimated_delivery_date,
           o.items::jsonb AS items_json
    FROM orders o
    WHERE o.items IS NOT NULL
  ), expanded AS (
    SELECT r.parent_order_id,
           r.status,
           r.payment_status,
           r.shipping,
           r.estimated_delivery_date,
           (item ->> 'supplier_id')::uuid AS supplier_id,
           (item ->> 'product_id')::uuid AS product_id,
           GREATEST(COALESCE(NULLIF(item ->> 'quantity', '')::int, 0), 0) AS quantity,
           COALESCE(NULLIF(item ->> 'price_at_addition','')::numeric,
                    NULLIF(item ->> 'price','')::numeric, 0) AS unit_price,
           NULLIF(item ->> 'price_at_addition','')::numeric AS price_at_addition_raw,
           (item -> 'price_tiers') AS price_tiers
    FROM raw r,
         LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(r.items_json) = 'array' THEN r.items_json ELSE '[]'::jsonb END) AS item
    WHERE (item ? 'supplier_id')
      AND (item ->> 'supplier_id') IS NOT NULL
      AND (item ->> 'product_id') IS NOT NULL -- skip if product_id missing
  ), aggregated AS (
    SELECT parent_order_id,
           supplier_id,
           status,
           payment_status,
           shipping,
           estimated_delivery_date,
           SUM(unit_price * quantity) AS subtotal
    FROM expanded
    GROUP BY 1,2,3,4,5,6
  ), totals AS (
    SELECT parent_order_id,
           SUM(subtotal) AS total_subtotal
    FROM aggregated
    GROUP BY 1
  ), alloc AS (
    SELECT a.parent_order_id,
           a.supplier_id,
           a.status,
           a.payment_status,
           a.estimated_delivery_date,
           a.subtotal,
           COALESCE(a.shipping,0) * CASE WHEN t.total_subtotal = 0 THEN 0 ELSE (a.subtotal / t.total_subtotal) END AS shipping_alloc
    FROM aggregated a
    JOIN totals t USING (parent_order_id)
  ), inserted AS (
    INSERT INTO supplier_orders (parent_order_id, supplier_id, status, payment_status, estimated_delivery_date, subtotal, shipping_amount, total, created_at, updated_at)
    SELECT parent_order_id,
           supplier_id,
           status,
           payment_status,
           estimated_delivery_date,
           subtotal,
           shipping_alloc,
           subtotal + shipping_alloc AS total,
           NOW(), NOW()
    FROM alloc a
    WHERE NOT EXISTS (
      SELECT 1 FROM supplier_orders so
      WHERE so.parent_order_id = a.parent_order_id
        AND so.supplier_id = a.supplier_id
    )
    RETURNING id, parent_order_id, supplier_id
  )
  -- 2. Insert items for every (order,supplier) pair that now exists & missing items
  INSERT INTO supplier_order_items (supplier_order_id, product_id, quantity, unit_price, price_at_addition, price_tiers)
  SELECT so.id,
         e.product_id,
         e.quantity,
         e.unit_price,
         e.price_at_addition_raw,
         e.price_tiers
  FROM expanded e
  JOIN supplier_orders so
    ON so.parent_order_id = e.parent_order_id
   AND so.supplier_id = e.supplier_id
  LEFT JOIN supplier_order_items soi
    ON soi.supplier_order_id = so.id
   AND soi.product_id = e.product_id
  WHERE soi.id IS NULL; -- avoid duplicating existing items

  RAISE NOTICE 'Backfill supplier_orders completed.';
END $$;
