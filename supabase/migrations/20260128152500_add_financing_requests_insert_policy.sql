-- 20260128152500_add_financing_requests_insert_policy.sql
-- Idempotent migration: create RLS policy allowing authenticated users to insert financing_requests
-- Only allows insert when buyer_id belongs to the auth.uid() (or role is service_role/admin). Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy p JOIN pg_class c ON p.polrelid = c.oid
    WHERE c.relname = 'financing_requests' AND p.polname = 'financing_requests_insert_self'
  ) THEN
    EXECUTE $sql$
      CREATE POLICY financing_requests_insert_self ON public.financing_requests
      FOR INSERT TO authenticated
      WITH CHECK (
        (
          buyer_id IS NULL
          OR EXISTS (SELECT 1 FROM public.buyer b WHERE b.id = financing_requests.buyer_id AND b.user_id = auth.uid())
        )
        OR (auth.role() = 'service_role'::text)
        OR (auth.role() = 'admin'::text)
      );
    $sql$;
  END IF;
END
$$;
