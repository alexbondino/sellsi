-- ============================================================================
-- MIGRATION: Fix RPC Function - Correct VARCHAR Types
-- ============================================================================
-- Fecha: 2026-01-06
-- Problema: La función get_pending_bank_transfers_for_admin usa TEXT pero
--           las columnas de orders y users son VARCHAR
-- Solución: Recrear la función con los tipos correctos
-- ============================================================================

-- Eliminar la función con tipos incorrectos
DROP FUNCTION IF EXISTS public.get_pending_bank_transfers_for_admin(UUID);

-- Recrear con tipos VARCHAR correctos
CREATE OR REPLACE FUNCTION public.get_pending_bank_transfers_for_admin(
  p_admin_id UUID
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  user_id UUID,
  grand_total NUMERIC,
  currency VARCHAR,
  payment_method VARCHAR,
  payment_status VARCHAR,
  status VARCHAR,
  user_nm VARCHAR,
  email VARCHAR,
  rut VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el admin existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM public.control_panel_users 
    WHERE control_panel_users.id = p_admin_id 
      AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Admin no válido o inactivo';
  END IF;
  
  -- Retornar órdenes pendientes de transferencia bancaria con datos del usuario
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.user_id,
    o.grand_total,
    o.currency,
    o.payment_method,
    o.payment_status,
    o.status,
    u.user_nm,
    u.email,
    u.rut
  FROM public.orders o
  LEFT JOIN public.users u ON o.user_id = u.user_id
  WHERE o.payment_method = 'bank_transfer'
    AND o.payment_status = 'pending'
  ORDER BY o.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_pending_bank_transfers_for_admin IS 
  'Retorna órdenes pendientes de transferencia bancaria para revisión del admin (bypassa RLS con tipos VARCHAR correctos)';

GRANT EXECUTE ON FUNCTION public.get_pending_bank_transfers_for_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_bank_transfers_for_admin TO anon;
