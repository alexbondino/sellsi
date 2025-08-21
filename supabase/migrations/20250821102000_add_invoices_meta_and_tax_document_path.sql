-- Add invoices_meta table (idempotent) and tax_document_path column to orders if missing
BEGIN;

-- invoices_meta table (only create if not exists)
CREATE TABLE IF NOT EXISTS public.invoices_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(user_id),
  supplier_id uuid REFERENCES public.users(user_id),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  path text NOT NULL,
  filename text,
  size integer,
  content_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index to avoid duplicates for same order/path
CREATE UNIQUE INDEX IF NOT EXISTS invoices_meta_order_path_uidx ON public.invoices_meta(order_id, path);

-- Add tax_document_path to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tax_document_path'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN tax_document_path text;
  END IF;
END;$$;

COMMIT;
