-- Migration originally added invoices_meta and (deprecated) tax_document_path.
-- Updated: retain only invoices_meta creation; tax_document_path removed (handled by later drop migration).
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

-- (Removed) tax_document_path addition block.

COMMIT;
