-- check_financing_schema.sql
-- Run these queries in Supabase SQL editor (or psql as admin) to validate the Financing schema
-- Date: 2026-01-22

-- 0) Quick existence checks for helpful flags
SELECT
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_requests' AND column_name='amount_used') AS has_amount_used,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_requests' AND column_name='amount_paid') AS has_amount_paid,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_requests' AND column_name='amount_refunded') AS has_amount_refunded,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_transactions' AND column_name='financing_id') AS has_financing_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_requests' AND column_name='legal_name') AS has_legal_name,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_requests' AND column_name='buyer_legal_representative_rut') AS has_buyer_legal_representative_rut,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='financing_requests' AND column_name='metadata') AS has_metadata;

-- 1) Columns expected in `financing_requests` (informational)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'financing_requests'
AND column_name IN (
  'amount', 'available_amount', 'amount_used', 'amount_paid', 'amount_refunded',
  'term_days', 'due_date', 'expires_at',
  'legal_name', 'legal_rut', 'legal_representative_name', 'buyer_legal_representative_name', 'buyer_legal_representative_rut',
  'legal_address', 'legal_commune', 'legal_region',
  'metadata'
);

-- 2) Columns expected in `financing_transactions`
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'financing_transactions'
AND column_name IN ('id', 'financing_id', 'financing_request_id', 'type', 'amount', 'supplier_order_id', 'metadata', 'is_automatic');

-- 3) Which FK name is present? (financing_id vs financing_request_id counts)
SELECT
  SUM(CASE WHEN column_name = 'financing_id' THEN 1 ELSE 0 END) AS has_financing_id_col,
  SUM(CASE WHEN column_name = 'financing_request_id' THEN 1 ELSE 0 END) AS has_financing_request_id_col
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'financing_transactions'
AND column_name IN ('financing_id','financing_request_id');

-- 4) Show rows where transactions link to financing_request_id but financing_id is NULL (potential backfill candidates)
SELECT ft.id, ft.financing_request_id, ft.type, ft.amount, ft.supplier_order_id
FROM public.financing_transactions ft
WHERE ft.financing_request_id IS NOT NULL
LIMIT 50;

-- 5) Check for financings where payments (by transactions) exceed used (refund candidates)
-- Uses transaction aggregates (grouped by financing_request_id) to avoid referencing possibly-missing columns in the requests table.
WITH tx AS (
  SELECT
    ft.financing_request_id::uuid AS financing_id,
    SUM(CASE WHEN ft.type = 'pago' THEN ft.amount ELSE 0 END) AS amount_paid_tx,
    SUM(CASE WHEN ft.type = 'consumo' THEN ft.amount ELSE 0 END) AS amount_used_tx,
    SUM(CASE WHEN ft.type IN ('devolucion','refund') THEN ft.amount ELSE 0 END) AS amount_refunded_tx
  FROM public.financing_transactions ft
  GROUP BY 1
)
SELECT
  fr.id,
  fr.amount AS requested_amount,
  COALESCE(tx.amount_used_tx, 0) AS amount_used_by_tx,
  COALESCE(tx.amount_paid_tx, 0) AS amount_paid_by_tx,
  COALESCE(tx.amount_refunded_tx, 0) AS amount_refunded_by_tx,
  (COALESCE(tx.amount_paid_tx, 0) - COALESCE(tx.amount_used_tx, 0) - COALESCE(tx.amount_refunded_tx, 0)) AS refund_pending_calc
FROM public.financing_requests fr
LEFT JOIN tx ON tx.financing_id = fr.id
WHERE (COALESCE(tx.amount_paid_tx, 0) - COALESCE(tx.amount_used_tx, 0) - COALESCE(tx.amount_refunded_tx, 0)) > 0
ORDER BY refund_pending_calc DESC
LIMIT 200;

-- 6) Sanity: show transaction sums per financing (use this to compare with stored columns if they exist)
WITH txs AS (
  SELECT
    ft.financing_request_id::uuid AS financing_id,
    SUM(CASE WHEN ft.type = 'consumo' THEN ft.amount ELSE 0 END) AS amount_used_sum,
    SUM(CASE WHEN ft.type = 'pago' THEN ft.amount ELSE 0 END) AS amount_paid_sum,
    SUM(CASE WHEN ft.type IN ('devolucion','refund') THEN ft.amount ELSE 0 END) AS amount_refunded_sum
  FROM public.financing_transactions ft
  GROUP BY 1
)
SELECT fr.id,
  COALESCE(txs.amount_used_sum,0) AS amount_used_sum,
  COALESCE(txs.amount_paid_sum,0) AS amount_paid_sum,
  COALESCE(txs.amount_refunded_sum,0) AS amount_refunded_sum
FROM public.financing_requests fr
LEFT JOIN txs ON txs.financing_id = fr.id
LIMIT 200;

-- NOTE: If you have columns amount_used/amount_paid/amount_refunded in `financing_requests`, run a comparison query separately in your environment to highlight mismatches.

-- 7) Check for RPCs/functions existence (admin functions required by frontend)
SELECT proname, prosrc
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname IN ('admin_restore_financing_amount','admin_process_refund','log_admin_audit')
AND n.nspname = 'public';

-- 8) Check triggers we expect
SELECT tgname, tgrelid::regclass AS table_name, tgtype, tgenabled
FROM pg_trigger
WHERE tgname IN ('trg_restore_financing_on_supplier_order_cancel','trg_update_buyer_overdue_flag','trg_financing_documents_upsert','trg_financing_documents_validate')
ORDER BY tgname;

-- 9) Check indices existence (key ones)
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('financing_requests','financing_transactions','financing_documents')
AND indexname IN ('idx_financing_checkout_lookup','idx_financing_buyer_overdue_check','idx_ftx_refund','idx_ftx_supplier_order','idx_ftx_reposiciones','idx_fdocs_financing');

-- 10) RLS / Policies quick check
SELECT c.relname, c.relrowsecurity, p.policyname, p.cmd, p.permissive
FROM pg_class c
LEFT JOIN pg_policies p ON p.tablename = c.relname
WHERE c.relname IN ('buyer','supplier','financing_requests','financing_transactions','financing_documents');

-- 11) Storage bucket check (Supabase storage)
SELECT * FROM storage.buckets WHERE id = 'financing-documents';

-- 12) Suggested backfill (DRY-RUN patterns)
-- NOTE: DO NOT RUN AUTOMATICALLY IN PROD: review results above first.
-- If your schema has a `financing_id` column, run the backfill check below (replace or adapt as needed).
-- Otherwise, count rows that have financing_request_id populated (these are candidates to be backfilled once you add financing_id).
SELECT count(*) AS financing_request_id_present
FROM public.financing_transactions
WHERE financing_request_id IS NOT NULL;

-- Example backfill update (run only after reviewing and in a transaction):
-- BEGIN;
-- ALTER TABLE public.financing_transactions ADD COLUMN IF NOT EXISTS financing_id uuid;
-- UPDATE public.financing_transactions SET financing_id = financing_request_id WHERE financing_id IS NULL AND financing_request_id IS NOT NULL;
-- COMMIT;

-- 13) Suggested backfill of amounts (recompute from transactions) - dry run
-- This version computes sums from transactions and shows the transaction-based values. If your `financing_requests` table includes amount_* columns, run a comparison query after confirming their presence.
SELECT fr.id,
  COALESCE(t.amount_used_sum,0) AS amount_used_calc,
  COALESCE(t.amount_paid_sum,0) AS amount_paid_calc,
  COALESCE(t.amount_refunded_sum,0) AS amount_refunded_calc
FROM public.financing_requests fr
LEFT JOIN (
  SELECT ft.financing_request_id::uuid AS financing_id,
    SUM(CASE WHEN ft.type = 'consumo' THEN ft.amount ELSE 0 END) AS amount_used_sum,
    SUM(CASE WHEN ft.type = 'pago' THEN ft.amount ELSE 0 END) AS amount_paid_sum,
    SUM(CASE WHEN ft.type IN ('devolucion','refund') THEN ft.amount ELSE 0 END) AS amount_refunded_sum
  FROM public.financing_transactions ft
  GROUP BY 1
) t ON t.financing_id = fr.id
WHERE (COALESCE(t.amount_used_sum,0) <> 0)
   OR (COALESCE(t.amount_paid_sum,0) <> 0)
   OR (COALESCE(t.amount_refunded_sum,0) <> 0)
LIMIT 200;

-- 14) Quick sanity: sample 10 financings sorted by refund_pending (computed from transactions)
WITH tx AS (
  SELECT
    ft.financing_request_id::uuid AS financing_id,
    SUM(CASE WHEN ft.type = 'pago' THEN ft.amount ELSE 0 END) AS amount_paid_tx,
    SUM(CASE WHEN ft.type = 'consumo' THEN ft.amount ELSE 0 END) AS amount_used_tx,
    SUM(CASE WHEN ft.type IN ('devolucion','refund') THEN ft.amount ELSE 0 END) AS amount_refunded_tx
  FROM public.financing_transactions ft
  GROUP BY 1
)
SELECT fr.id, fr.amount,
  COALESCE(tx.amount_paid_tx,0) AS amount_paid_by_tx,
  COALESCE(tx.amount_used_tx,0) AS amount_used_by_tx,
  COALESCE(tx.amount_refunded_tx,0) AS amount_refunded_by_tx,
  (COALESCE(tx.amount_paid_tx,0) - COALESCE(tx.amount_used_tx,0) - COALESCE(tx.amount_refunded_tx,0)) AS refund_pending_calc
FROM public.financing_requests fr
LEFT JOIN tx ON tx.financing_id = fr.id
ORDER BY refund_pending_calc DESC NULLS LAST
LIMIT 10;

-- End of script
