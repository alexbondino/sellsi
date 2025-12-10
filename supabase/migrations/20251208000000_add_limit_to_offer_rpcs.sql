-- Migration: Add LIMIT 50 to offer RPCs to prevent performance issues with large datasets
-- This is a quick fix to reduce payload from 500KB+ to ~50KB for users with 500+ offers
-- Date: 2024-12-08
-- Priority: P0 - Critical (prevents mobile crashes)

BEGIN;

-- Update get_buyer_offers to limit results to 50 most recent offers
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
  ORDER BY d.created_at DESC
  LIMIT 50;
$$;

-- Update get_supplier_offers to limit results to 50 most recent offers
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
  ORDER BY d.created_at DESC
  LIMIT 50;
$$;

COMMIT;
