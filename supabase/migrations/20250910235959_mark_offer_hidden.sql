-- Migration: Add persistent per-role hide flags and RPC to mark offer hidden
-- Adds columns hidden_by_buyer, hidden_by_supplier to offers table and a function
-- mark_offer_hidden(p_offer_id uuid, p_role text) RETURNS jsonb that marks the
-- corresponding hidden flag. If both flags are true the function deletes the
-- offer and returns { deleted: true }. Otherwise returns { deleted: false }.

BEGIN;

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS hidden_by_buyer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_by_supplier boolean DEFAULT false;

-- Create RPC function
CREATE OR REPLACE FUNCTION public.mark_offer_hidden(p_offer_id uuid, p_role text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted boolean := false;
BEGIN
  IF p_role IS NULL THEN
    RAISE EXCEPTION 'p_role required';
  END IF;

  IF p_role = 'buyer' THEN
    UPDATE public.offers SET hidden_by_buyer = true WHERE id = p_offer_id;
  ELSIF p_role = 'supplier' THEN
    UPDATE public.offers SET hidden_by_supplier = true WHERE id = p_offer_id;
  ELSE
    RAISE EXCEPTION 'invalid role';
  END IF;

  -- If both have hidden=true, remove the offer permanently
  PERFORM 1 FROM public.offers WHERE id = p_offer_id AND hidden_by_buyer = true AND hidden_by_supplier = true;
  IF FOUND THEN
    DELETE FROM public.offers WHERE id = p_offer_id;
    v_deleted := true;
  END IF;

  RETURN jsonb_build_object('deleted', v_deleted);
END;
$$;

COMMIT;
