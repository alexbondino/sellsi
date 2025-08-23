-- Migration: Drop deprecated tax_document_path column from orders
-- Safe / idempotent: only drops if exists and not already removed.
-- Rationale: Replaced by invoices_meta table which supports multi-supplier invoices.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='orders' AND column_name='tax_document_path'
  ) THEN
    ALTER TABLE public.orders DROP COLUMN tax_document_path;
  END IF;
END$$;

-- (Optional) You may want to create a view summarizing latest invoice per supplier:
-- CREATE OR REPLACE VIEW public.order_latest_invoices AS
-- SELECT im.order_id,
--        im.supplier_id,
--        im.path,
--        im.created_at,
--        row_number() OVER (PARTITION BY im.order_id, im.supplier_id ORDER BY im.created_at DESC) AS rn
-- FROM public.invoices_meta im;
-- (Consumer query would then filter rn=1)
