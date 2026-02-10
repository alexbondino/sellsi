-- 20260204140000_add_admin_financing_rpcs.sql
-- RPCs SECURITY DEFINER para que control_panel admins puedan acceder a financing_requests
-- bypaseando RLS (control_panel_users no usa Supabase Auth, por lo tanto auth.uid() es NULL)

BEGIN;

-- Drop existing function if exists (to allow changing return type)
DROP FUNCTION IF EXISTS public.admin_get_all_financing_requests();

-- ============================================================================
-- RPC: admin_get_all_financing_requests
-- Retorna TODOS los financing requests con JOINs a buyer/supplier
-- SECURITY DEFINER bypasea RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_all_financing_requests()
RETURNS TABLE (
  id uuid,
  buyer_id uuid,
  supplier_id uuid,
  amount numeric,
  available_amount numeric,
  status text,
  due_date date,
  has_overdue boolean,
  created_at timestamptz,
  updated_at timestamptz,
  paused boolean,
  paused_reason text,
  paused_at timestamptz,
  paused_by uuid,
  unpaused_at timestamptz,
  unpaused_by uuid,
  expires_at timestamptz,
  amount_used numeric,
  amount_paid numeric,
  amount_refunded numeric,
  legal_name text,
  legal_rut text,
  buyer_legal_representative_name text,
  buyer_legal_representative_rut varchar,
  legal_address text,
  legal_commune text,
  legal_region text,
  legal_representative_name text,
  metadata jsonb,
  term_days integer,
  rejected_reason text,
  cancelled_reason text,
  signed_buyer_at timestamptz,
  signed_supplier_at timestamptz,
  signed_sellsi_at timestamptz,
  -- Buyer data
  buyer_user_id uuid,
  buyer_name text,
  buyer_email text,
  -- Supplier data
  supplier_user_id uuid,
  supplier_name text,
  supplier_legal_rut text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT 
    fr.id,
    fr.buyer_id,
    fr.supplier_id,
    fr.amount,
    fr.available_amount,
    fr.status,
    fr.due_date,
    fr.has_overdue,
    fr.created_at,
    fr.updated_at,
    fr.paused,
    fr.paused_reason,
    fr.paused_at,
    fr.paused_by,
    fr.unpaused_at,
    fr.unpaused_by,
    fr.expires_at,
    fr.amount_used,
    fr.amount_paid,
    fr.amount_refunded,
    fr.legal_name,
    fr.legal_rut,
    fr.buyer_legal_representative_name,
    fr.buyer_legal_representative_rut,
    fr.legal_address,
    fr.legal_commune,
    fr.legal_region,
    fr.legal_representative_name,
    fr.metadata,
    fr.term_days,
    fr.rejected_reason,
    fr.cancelled_reason,
    fr.signed_buyer_at,
    fr.signed_supplier_at,
    fr.signed_sellsi_at,
    -- Buyer data
    b.user_id as buyer_user_id,
    b.name as buyer_name,
    b.email as buyer_email,
    -- Supplier data
    s.user_id as supplier_user_id,
    s.name as supplier_name,
    s.legal_rut as supplier_legal_rut
  FROM public.financing_requests fr
  LEFT JOIN public.buyer b ON fr.buyer_id = b.id
  LEFT JOIN public.supplier s ON fr.supplier_id = s.id
  ORDER BY fr.created_at DESC;
$$;

-- Dar permisos de ejecución a usuarios autenticados (control panel usa anon key como authenticated)
GRANT EXECUTE ON FUNCTION public.admin_get_all_financing_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_financing_requests() TO anon;

COMMENT ON FUNCTION public.admin_get_all_financing_requests IS 
'Retorna todos los financing requests con buyer/supplier data. SECURITY DEFINER bypasea RLS. Solo para uso del control panel admin.';

COMMIT;

-- ============================================================================
-- TESTING
-- ============================================================================
-- SELECT * FROM public.admin_get_all_financing_requests() LIMIT 5;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.admin_get_all_financing_requests();
