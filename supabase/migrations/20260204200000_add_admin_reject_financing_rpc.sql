-- ============================================================================
-- Migration: Admin Reject Financing RPC + Column Cleanup
-- Date: 2026-02-04 20:00:00
-- Purpose: 
--   1. Create RPC for control panel to reject financing requests (bypasses RLS)
--   2. Cleanup duplicate column rejection_reason (keep only rejected_reason)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Cleanup duplicate column before creating RPC
-- ============================================================================

-- 1.1. Backfill rejected_reason from rejection_reason if needed
UPDATE financing_requests
SET rejected_reason = rejection_reason
WHERE rejected_reason IS NULL AND rejection_reason IS NOT NULL;

-- 1.2. Drop duplicate column
ALTER TABLE financing_requests DROP COLUMN IF EXISTS rejection_reason;

-- 1.3. Add comment to remaining column
COMMENT ON COLUMN financing_requests.rejected_reason IS 
  'Motivo por el cual se rechazó el financiamiento. Solo se llena cuando status es rejected_by_sellsi o rejected_by_supplier.';

-- ============================================================================
-- PART 2: Create RPC for admin to reject financing requests
-- ============================================================================

-- 2.1. Drop existing function if any
DROP FUNCTION IF EXISTS admin_reject_financing_request(uuid, text);

-- 2.2. Create function to reject financing request
CREATE OR REPLACE FUNCTION admin_reject_financing_request(
  p_financing_id uuid,
  p_reject_reason text
)
RETURNS TABLE (
  id uuid,
  status text,
  rejected_reason text,
  rejected_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update financing_requests status to rejected_by_sellsi
  RETURN QUERY
  UPDATE financing_requests
  SET
    status = 'rejected_by_sellsi',
    rejected_reason = p_reject_reason,
    rejected_at = now(),
    updated_at = now()
  WHERE 
    financing_requests.id = p_financing_id
    AND financing_requests.status = 'pending_sellsi_approval'
  RETURNING
    financing_requests.id,
    financing_requests.status,
    financing_requests.rejected_reason,
    financing_requests.rejected_at,
    financing_requests.updated_at;
    
  -- If no rows were updated, raise exception
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Financing request not found or not in pending_sellsi_approval status';
  END IF;
END;
$$;

-- 2.3. Grant permissions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION admin_reject_financing_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_reject_financing_request(uuid, text) TO anon;

-- 2.4. Add function comment
COMMENT ON FUNCTION admin_reject_financing_request IS 
  'Allows admin to reject financing requests bypassing RLS. Used by control panel with custom auth (control_panel_users). Returns updated row or raises exception if not found or wrong status.';

COMMIT;
