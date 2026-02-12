-- 20260212000002_add_admin_financing_transactions_rpc.sql
-- RPC para que control_panel admin obtenga movimientos de financiamiento bypaseando RLS

BEGIN;

DROP FUNCTION IF EXISTS public.admin_get_financing_transactions(uuid);

-- Compatibilidad de esquema: algunos entornos no tienen columnas agregadas
ALTER TABLE public.financing_transactions
  ADD COLUMN IF NOT EXISTS financing_id uuid;

ALTER TABLE public.financing_transactions
  ADD COLUMN IF NOT EXISTS supplier_order_id uuid;

ALTER TABLE public.financing_transactions
  ADD COLUMN IF NOT EXISTS is_automatic boolean DEFAULT false;

-- Backfill seguro para financing_id
UPDATE public.financing_transactions
SET financing_id = financing_request_id
WHERE financing_id IS NULL
  AND financing_request_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_get_financing_transactions(p_financing_id uuid)
RETURNS TABLE (
  id uuid,
  financing_request_id uuid,
  financing_id uuid,
  type text,
  amount numeric,
  supplier_order_id uuid,
  metadata jsonb,
  is_automatic boolean,
  created_at timestamptz,
  order_total numeric,
  order_created_at timestamptz,
  order_parent_order_id uuid,
  order_status text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    ft.id,
    ft.financing_request_id,
    ft.financing_id,
    ft.type,
    ft.amount,
    ft.supplier_order_id,
    ft.metadata,
    ft.is_automatic,
    ft.created_at,
    so.total AS order_total,
    so.created_at AS order_created_at,
    so.parent_order_id AS order_parent_order_id,
    so.status AS order_status
  FROM public.financing_transactions ft
  LEFT JOIN public.supplier_orders so ON so.id = ft.supplier_order_id
  WHERE ft.financing_request_id = p_financing_id
  ORDER BY ft.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_financing_transactions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_financing_transactions(uuid) TO anon;

COMMENT ON FUNCTION public.admin_get_financing_transactions(uuid) IS
'Retorna movimientos de financing_transactions por financing_request_id para control panel admin. SECURITY DEFINER bypasea RLS y agrega datos de supplier_orders.';

COMMIT;
