-- 20260127123000_create_supplier_user_index.sql
-- Create UNIQUE index on supplier(user_id) via migration (non-concurrent).
-- IMPORTANT: Creating a unique index without CONCURRENTLY can take locks on large tables.
-- Run in a maintenance window if your table is large. We already ran de-dup and orphan cleanup.

BEGIN;

-- Safe: only create if not exists
CREATE UNIQUE INDEX IF NOT EXISTS uq_supplier_user_id ON public.supplier(user_id);

COMMIT;

-- NOTE: If you prefer to avoid locking, run the following manually outside of a transaction:
--   CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_supplier_user_id ON public.supplier(user_id);
-- This cannot be run inside a transaction and therefore must be executed as a standalone statement (e.g., psql or SQL editor).
