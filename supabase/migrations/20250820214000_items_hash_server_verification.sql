-- Server-side canonical items hash function to align webhook verification with finalize_order_pricing
CREATE OR REPLACE FUNCTION public.order_items_canonical_hash(o public.orders)
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT encode(digest(convert_to(o.items::text,'UTF8'),'sha256'),'hex');
$$;

COMMENT ON FUNCTION public.order_items_canonical_hash(public.orders) IS 'Computed column style function: canonical SHA-256 hash over orders.items using Postgres jsonb text representation.';
