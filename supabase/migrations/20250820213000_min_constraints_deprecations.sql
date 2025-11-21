-- Minimal migration: add unique indexes + basic performance indexes + deprecation comments.
-- No overengineering: only safe dedupe + unique indexes + COMMENTS.

-- 1. Deduplicate supplier_orders (keep earliest created_at) before unique index
WITH dup AS (
  SELECT parent_order_id, supplier_id, array_agg(id ORDER BY created_at, id) AS ids
  FROM supplier_orders
  GROUP BY parent_order_id, supplier_id
  HAVING COUNT(*) > 1
)
DELETE FROM supplier_orders so
USING dup
WHERE so.id = ANY( dup.ids[2:array_length(dup.ids,1)] );

-- 2. Deduplicate supplier_order_items (by supplier_order_id, product_id)
WITH dup_items AS (
  SELECT supplier_order_id, product_id, array_agg(id ORDER BY created_at, id) AS ids
  FROM supplier_order_items
  GROUP BY supplier_order_id, product_id
  HAVING COUNT(*) > 1
)
DELETE FROM supplier_order_items soi
USING dup_items di
WHERE soi.id = ANY( di.ids[2:array_length(di.ids,1)] );

-- 3. Deduplicate payment_transactions (order_id, external_payment_id) when external_payment_id IS NOT NULL
WITH dup_pay AS (
  SELECT order_id, external_payment_id, array_agg(id ORDER BY created_at, id) AS ids
  FROM payment_transactions
  WHERE external_payment_id IS NOT NULL
  GROUP BY order_id, external_payment_id
  HAVING COUNT(*) > 1
)
DELETE FROM payment_transactions pt
USING dup_pay dp
WHERE pt.id = ANY( dp.ids[2:array_length(dp.ids,1)] );

-- 4. Unique indexes (act as constraints) --------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_orders_parent_supplier ON supplier_orders(parent_order_id, supplier_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_order_items_order_product ON supplier_order_items(supplier_order_id, product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_transactions_order_external ON payment_transactions(order_id, external_payment_id);

-- 5. Performance / lookup indexes ---------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_product_sales_prod_sup_date ON product_sales(product_id, supplier_id, trx_date);
CREATE INDEX IF NOT EXISTS idx_khipu_webhook_logs_payment_id ON khipu_webhook_logs(payment_id);

-- 6. Deprecation comments -----------------------------------------------------------------
COMMENT ON TABLE carts IS 'DEPRECATED: legacy pre-order cart. Pending removal after full migration to orders.';
COMMENT ON TABLE cart_items IS 'DEPRECATED: legacy cart items. Pending removal.';
COMMENT ON TABLE sales IS 'DEPRECATED: superseded by product_sales. Consider dropping after validation.';
COMMENT ON TABLE control_panel IS 'DEPRECATED admin legacy module.';
COMMENT ON TABLE control_panel_users IS 'DEPRECATED admin legacy module.';
COMMENT ON TABLE admin_audit_log IS 'DEPRECATED admin legacy module.';
COMMENT ON TABLE admin_sessions IS 'DEPRECATED admin legacy module.';
COMMENT ON TABLE admin_trusted_devices IS 'DEPRECATED admin legacy module.';
COMMENT ON TABLE ejemplo IS 'TO REMOVE: test table.';

COMMENT ON TABLE banned_ips IS 'UNUSED? verify usage; mark deprecated if no active enforcement.';

-- 7. (Optional) NOTE: Not adding format constraint on items_hash to keep migration minimal.

-- End of minimal migration.
