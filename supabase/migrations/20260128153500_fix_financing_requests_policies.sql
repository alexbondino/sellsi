-- 20260128153500_fix_financing_requests_policies.sql
-- Ensure incorrect policies are removed and correct idempotent policies exist for buyers and suppliers
-- Also provide server-side helper RPC for robust buyer creation (upsert-like)
-- Safe to run multiple times

BEGIN;

-- Drop any stale/incorrect policies on financing_requests
DROP POLICY IF EXISTS buyer_select_financing ON public.financing_requests;
DROP POLICY IF EXISTS buyer_insert_financing ON public.financing_requests;
DROP POLICY IF EXISTS buyer_update_financing ON public.financing_requests;
DROP POLICY IF EXISTS supplier_select_financing ON public.financing_requests;
DROP POLICY IF EXISTS supplier_insert_financing ON public.financing_requests;
DROP POLICY IF EXISTS supplier_update_financing ON public.financing_requests;
DROP POLICY IF EXISTS financing_requests_insert_self ON public.financing_requests;

-- Buyer: SELECT (user can select rows that point to a buyer owned by their user_id)
CREATE POLICY buyer_select_financing ON public.financing_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer b
      WHERE b.id = public.financing_requests.buyer_id
        AND b.user_id = auth.uid()::uuid
    )
    OR auth.role() = 'service_role'::text
    OR auth.role() = 'admin'::text
  );

-- Buyer: INSERT (allow insert only when buyer_id is null or belongs to the authenticated user's buyer)
CREATE POLICY buyer_insert_financing ON public.financing_requests
  FOR INSERT
  WITH CHECK (
    (
      buyer_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.buyer b
        WHERE b.id = public.financing_requests.buyer_id
          AND b.user_id = auth.uid()::uuid
      )
    )
    OR auth.role() = 'service_role'::text
    OR auth.role() = 'admin'::text
  );

-- Buyer: UPDATE (user may update rows that belong to them, but cannot change admin-only paused fields)
CREATE POLICY buyer_update_financing ON public.financing_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.buyer b
      WHERE b.id = public.financing_requests.buyer_id
        AND b.user_id = auth.uid()::uuid
    )
    OR auth.role() = 'service_role'::text
    OR auth.role() = 'admin'::text
  )
  WITH CHECK (
    auth.role() = 'admin'::text OR (
      COALESCE(paused,false) = false
      AND paused_reason IS NULL
      AND paused_at IS NULL
      AND paused_by IS NULL
      AND unpaused_at IS NULL
      AND unpaused_by IS NULL
    )
  );

-- Supplier: SELECT
CREATE POLICY supplier_select_financing ON public.financing_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier s
      WHERE s.id = public.financing_requests.supplier_id
        AND s.user_id = auth.uid()::uuid
    )
    OR auth.role() = 'service_role'::text
    OR auth.role() = 'admin'::text
  );

-- Supplier: INSERT (allows supplier inserts if supplier_id belongs to the authenticated supplier or admin/service)
CREATE POLICY supplier_insert_financing ON public.financing_requests
  FOR INSERT
  WITH CHECK (
    (
      supplier_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.supplier s
        WHERE s.id = public.financing_requests.supplier_id
          AND s.user_id = auth.uid()::uuid
      )
    )
    OR auth.role() = 'service_role'::text
    OR auth.role() = 'admin'::text
  );

-- Supplier: UPDATE (similar protections to buyer update)
CREATE POLICY supplier_update_financing ON public.financing_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.supplier s
      WHERE s.id = public.financing_requests.supplier_id
        AND s.user_id = auth.uid()::uuid
    )
    OR auth.role() = 'service_role'::text
    OR auth.role() = 'admin'::text
  )
  WITH CHECK (
    auth.role() = 'admin'::text OR (
      COALESCE(paused,false) = false
      AND paused_reason IS NULL
      AND paused_at IS NULL
      AND paused_by IS NULL
      AND unpaused_at IS NULL
      AND unpaused_by IS NULL
    )
  );

-- Generic INSERT policy (keeps compatibility with earlier approach but uses proper EXISTS check)
CREATE POLICY financing_requests_insert_self ON public.financing_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      buyer_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.buyer b
        WHERE b.id = public.financing_requests.buyer_id
          AND b.user_id = auth.uid()::uuid
      )
    )
    OR (
      supplier_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.supplier s
        WHERE s.id = public.financing_requests.supplier_id
          AND s.user_id = auth.uid()::uuid
      )
    )
    OR auth.role() = 'service_role'::text
    OR auth.role() = 'admin'::text
  );

-- Ensure RLS is enabled (idempotent reminders)
ALTER TABLE public.financing_requests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper RPC: ensure_buyer_for_user(uuid) -> uuid
-- Ensures a buyer exists for given user_id and returns the buyer.id. Idempotent.
-- Useful to avoid race conditions from concurrent clients.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_buyer_for_user(p_user_id uuid) RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  v_id uuid;
  v_name text;
  v_email text;
BEGIN
  -- Try to get name/email from users table when available
  SELECT COALESCE(NULLIF(u.user_nm, ''), u.email)::text, u.email INTO v_name, v_email
  FROM public.users u WHERE u.user_id = p_user_id LIMIT 1;

  INSERT INTO public.buyer (id, user_id, name, email, created_at)
  VALUES (gen_random_uuid(), p_user_id, COALESCE(v_name, ''), v_email, now())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_id FROM public.buyer WHERE user_id = p_user_id LIMIT 1;
  RETURN v_id;
END;
$$;

-- Grant execute to authenticated and service_role so client can call RPC
GRANT EXECUTE ON FUNCTION public.ensure_buyer_for_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_buyer_for_user(uuid) TO service_role;

COMMIT;
