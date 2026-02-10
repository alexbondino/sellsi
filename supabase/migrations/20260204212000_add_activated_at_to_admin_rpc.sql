-- ============================================================================
-- Fix admin financing RPCs: tipos timestamptz y columnas faltantes
-- ============================================================================
-- PROBLEMA RAÍZ: Inconsistencia de tipos date vs timestamptz en RPCs admin
-- 
-- CORRECCIONES:
-- 1. admin_get_all_financing_requests(): 
--    - Corrige tipos: activated_at y expires_at de date → timestamptz
--    - Agrega columnas faltantes: approved_by_admin_id, rejected_at, rejection_reason
-- 
-- 2. admin_approve_financing_request():
--    - Cambia CURRENT_DATE → NOW() para activated_at
--    - Cambia v_expiration_date de date → timestamptz
--    - Usa NOW() + interval para cálculo de expiración
--
-- Estas correcciones aseguran compatibilidad completa con el schema de la tabla
-- financing_requests donde activated_at y expires_at son timestamptz

-- ============================================================================
-- DROP de funciones existentes (necesario para cambiar tipos de retorno)
-- ============================================================================

DROP FUNCTION IF EXISTS public.admin_get_all_financing_requests();
DROP FUNCTION IF EXISTS public.admin_approve_financing_request(uuid, uuid);

-- ============================================================================
-- 1. Crear admin_get_all_financing_requests con tipos corregidos
-- ============================================================================

CREATE FUNCTION public.admin_get_all_financing_requests()
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
  activated_at timestamptz,
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
  approved_by_admin_id uuid,
  rejected_at timestamptz,
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
    fr.activated_at,
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
    fr.approved_by_admin_id,
    fr.rejected_at,
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

COMMENT ON FUNCTION public.admin_get_all_financing_requests IS 
'Retorna todos los financing requests con buyer/supplier data incluyendo activated_at (timestamptz), expires_at (timestamptz), approved_by_admin_id y rejected_at. SECURITY DEFINER bypasea RLS. Solo para uso del control panel admin.';

-- ============================================================================
-- 2. Crear admin_approve_financing_request con tipos corregidos
-- ============================================================================

CREATE FUNCTION public.admin_approve_financing_request(
  p_financing_id uuid,
  p_admin_id uuid
)
RETURNS json
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_term_days integer;
  v_expiration_date timestamptz;
  v_result json;
BEGIN
  -- Obtener term_days para calcular expires_at
  SELECT term_days INTO v_term_days
  FROM public.financing_requests
  WHERE financing_requests.id = p_financing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financing request not found: %', p_financing_id;
  END IF;

  -- Calcular fecha de expiración (NOW() + term_days días) como timestamptz
  v_expiration_date := NOW() + (v_term_days || ' days')::interval;

  -- Actualizar solo si está en estado pending_sellsi_approval
  UPDATE public.financing_requests
  SET
    status = 'approved_by_sellsi',
    approved_by_admin_id = p_admin_id,
    activated_at = NOW(),
    expires_at = v_expiration_date,
    updated_at = NOW()
  WHERE financing_requests.id = p_financing_id
    AND financing_requests.status = 'pending_sellsi_approval'
  RETURNING to_json(financing_requests.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Financing request % is not in pending_sellsi_approval status or does not exist', p_financing_id;
  END IF;
  
  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.admin_approve_financing_request IS 
'Aprueba financiamiento bypaseando RLS para admins de control_panel. Usa NOW() y timestamptz para activated_at y expires_at.';

-- ============================================================================
-- 3. Permisos
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.admin_get_all_financing_requests() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_financing_request TO authenticated, anon;
