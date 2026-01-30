-- 20260128153000_replace_buyer_insert_financing_policy.sql
-- Replace old buyer_insert_financing policy to allow INSERT when buyer_id belongs to auth.uid()

BEGIN;

-- Drop old policy if present
DROP POLICY IF EXISTS buyer_insert_financing ON public.financing_requests;

-- Create corrected policy
CREATE POLICY buyer_insert_financing ON public.financing_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.buyer b WHERE b.id = financing_requests.buyer_id AND b.user_id = auth.uid()::uuid)
    OR auth.role() = 'service_role'::text OR auth.role() = 'admin'::text
  );

COMMIT;