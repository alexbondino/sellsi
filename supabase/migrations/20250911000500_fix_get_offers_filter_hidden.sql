-- Migration: update get_buyer_offers / get_supplier_offers to filter by hidden flags
-- This avoids modifying the existing view and instead filters using the underlying offers table.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_buyer_offers(p_buyer_id uuid)
RETURNS setof public.offers_with_details
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT d.*
  FROM public.offers_with_details d
  JOIN public.offers o ON o.id = d.id
  WHERE d.buyer_id = p_buyer_id
    AND (o.hidden_by_buyer IS NULL OR o.hidden_by_buyer = false)
  ORDER BY d.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_supplier_offers(p_supplier_id uuid)
RETURNS setof public.offers_with_details
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT d.*
  FROM public.offers_with_details d
  JOIN public.offers o ON o.id = d.id
  WHERE d.supplier_id = p_supplier_id
    AND (o.hidden_by_supplier IS NULL OR o.hidden_by_supplier = false)
  ORDER BY d.created_at DESC;
$$;

COMMIT;
