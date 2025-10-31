-- Migration: Harden mark_offer_hidden with SECURITY DEFINER and better validation
-- Motivo: Actualmente la función se ejecuta como SECURITY INVOKER y RLS en 'offers' sólo
-- define políticas SELECT, impidiendo UPDATE para usuarios autenticados. Esto evita
-- que se persistan hidden_by_buyer / hidden_by_supplier y las ofertas reaparecen tras F5.
-- Solución: Re-crear la función como SECURITY DEFINER, fijar search_path y validar ownership.

BEGIN;

CREATE OR REPLACE FUNCTION public.mark_offer_hidden(
  p_offer_id uuid,
  p_role text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted boolean := false;
  v_offer record;
  v_updates int := 0;
BEGIN
  IF p_offer_id IS NULL THEN
    RAISE EXCEPTION 'p_offer_id required';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('buyer','supplier') THEN
    RAISE EXCEPTION 'invalid role';
  END IF;

  -- Obtener oferta asegurando ownership del invocante (auth.uid())
  SELECT * INTO v_offer FROM public.offers WHERE id = p_offer_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'offer % not found', p_offer_id;
  END IF;

  -- Verificar ownership según rol
  IF p_role = 'buyer' AND auth.uid() <> v_offer.buyer_id THEN
    RAISE EXCEPTION 'not owner (buyer)';
  ELSIF p_role = 'supplier' AND auth.uid() <> v_offer.supplier_id THEN
    RAISE EXCEPTION 'not owner (supplier)';
  END IF;

  -- Actualizar flag correspondiente sólo si aún no está en true
  IF p_role = 'buyer' AND COALESCE(v_offer.hidden_by_buyer,false) = false THEN
    UPDATE public.offers SET hidden_by_buyer = true, updated_at = now() WHERE id = p_offer_id;
    GET DIAGNOSTICS v_updates = ROW_COUNT;
  ELSIF p_role = 'supplier' AND COALESCE(v_offer.hidden_by_supplier,false) = false THEN
    UPDATE public.offers SET hidden_by_supplier = true, updated_at = now() WHERE id = p_offer_id;
    GET DIAGNOSTICS v_updates = ROW_COUNT;
  END IF;

  -- Si ambos ocultaron, eliminar definitivamente
  SELECT hidden_by_buyer, hidden_by_supplier INTO v_offer FROM public.offers WHERE id = p_offer_id;
  IF FOUND AND COALESCE(v_offer.hidden_by_buyer,false) AND COALESCE(v_offer.hidden_by_supplier,false) THEN
    DELETE FROM public.offers WHERE id = p_offer_id;
    v_deleted := true;
  END IF;

  RETURN jsonb_build_object(
    'deleted', v_deleted,
    'updated', v_updates > 0
  );
END;
$$;

-- Asegurar permisos de ejecución para roles autenticados
DO $$ BEGIN
  BEGIN EXECUTE 'GRANT EXECUTE ON FUNCTION public.mark_offer_hidden(uuid, text) TO authenticated'; EXCEPTION WHEN others THEN NULL; END;
END $$;

COMMIT;
