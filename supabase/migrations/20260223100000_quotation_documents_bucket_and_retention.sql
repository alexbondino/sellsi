-- 20260223100000_quotation_documents_bucket_and_retention.sql
-- Módulo: Cotizaciones - Persistencia (Storage + Metadata) + Retención (15 días) + Límite (últimas 3 por producto)
-- Fecha/Version: 2026-02-23

BEGIN;

-- 1) Bucket `quotations` (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'quotations') THEN
    INSERT INTO storage.buckets (id, name, "public", file_size_limit, allowed_mime_types)
    VALUES (
      'quotations',
      'quotations',
      false,
      5242880, -- 5 MB
      ARRAY['application/pdf']::text[]
    );
  END IF;
END;
$$;

-- 2) Tabla metadata
CREATE TABLE IF NOT EXISTS public.quotation_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(productid) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 days'),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT quotation_documents_storage_path_unique UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_quotation_documents_buyer_product_created_at
  ON public.quotation_documents (buyer_user_id, product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotation_documents_expires_at
  ON public.quotation_documents (expires_at);

ALTER TABLE public.quotation_documents ENABLE ROW LEVEL SECURITY;

-- Runtime settings (para pg_cron -> HTTP -> Edge Functions). Ya existe en algunos entornos; crear si no.
CREATE TABLE IF NOT EXISTS public.app_runtime_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP POLICY IF EXISTS quotation_documents_select ON public.quotation_documents;
CREATE POLICY "quotation_documents_select" ON public.quotation_documents
  FOR SELECT
  TO authenticated
  USING (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS quotation_documents_insert ON public.quotation_documents;
CREATE POLICY "quotation_documents_insert" ON public.quotation_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS quotation_documents_delete ON public.quotation_documents;
CREATE POLICY "quotation_documents_delete" ON public.quotation_documents
  FOR DELETE
  TO authenticated
  USING (buyer_user_id = auth.uid());

-- 3) Storage policies: path debe empezar con auth.uid()
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER TABLE IF EXISTS storage.objects ENABLE ROW LEVEL SECURITY';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping enabling RLS on storage.objects: insufficient privileges for current role';
  END;

  BEGIN
    DROP POLICY IF EXISTS quotations_upload ON storage.objects;
    CREATE POLICY "quotations_upload" ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'quotations' AND
        split_part(name, '/', 1) = auth.uid()::text
      );

    DROP POLICY IF EXISTS quotations_select ON storage.objects;
    CREATE POLICY "quotations_select" ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'quotations' AND
        split_part(name, '/', 1) = auth.uid()::text
      );

    DROP POLICY IF EXISTS quotations_delete ON storage.objects;
    CREATE POLICY "quotations_delete" ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'quotations' AND
        split_part(name, '/', 1) = auth.uid()::text
      );

    DROP POLICY IF EXISTS quotations_update ON storage.objects;
    CREATE POLICY "quotations_update" ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'quotations' AND
        split_part(name, '/', 1) = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'quotations' AND
        split_part(name, '/', 1) = auth.uid()::text
      );
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping creation of storage.objects policies: insufficient privileges for current role';
  END;
END;
$$;

-- 4) Enforce: máximo 3 cotizaciones activas (no expiradas) por buyer+product
CREATE OR REPLACE FUNCTION public.enforce_max_three_quotations_per_product()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM public.quotation_documents
  WHERE buyer_user_id = NEW.buyer_user_id
    AND product_id = NEW.product_id
    AND expires_at > now();

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Max 3 quotations per product (active) for buyer % product %', NEW.buyer_user_id, NEW.product_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_three_quotations_per_product ON public.quotation_documents;
CREATE TRIGGER trg_enforce_max_three_quotations_per_product
BEFORE INSERT ON public.quotation_documents
FOR EACH ROW
EXECUTE FUNCTION public.enforce_max_three_quotations_per_product();

-- 5) Retención 15 días (HARD DELETE)
-- ⚠️ Importante: el borrado físico de archivos se hace vía Storage API (Edge Function),
-- no vía DELETE directo a storage.objects.
-- Patrón: pg_cron -> perform_*() -> HTTP -> Edge Function (token auth)

DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS http';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping CREATE EXTENSION http: insufficient privileges';
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.perform_purge_expired_quotations()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_function_url text;
  v_cleanup_token text;
  v_response record;
BEGIN
  v_function_url := COALESCE(
    NULLIF(current_setting('app.supabase_url', true), ''),
    (SELECT ars.value FROM public.app_runtime_settings ars WHERE ars.key = 'supabase_url' LIMIT 1)
  );
  v_cleanup_token := COALESCE(
    NULLIF(current_setting('app.cleanup_secret_token', true), ''),
    (SELECT ars.value FROM public.app_runtime_settings ars WHERE ars.key = 'cleanup_secret_token' LIMIT 1)
  );

  IF v_function_url IS NULL OR v_function_url = '' OR v_cleanup_token IS NULL OR v_cleanup_token = '' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'missing_app_settings',
      'required', ARRAY['app.supabase_url or app_runtime_settings.supabase_url', 'app.cleanup_secret_token or app_runtime_settings.cleanup_secret_token']
    );
  END IF;

  SELECT INTO v_response
    status,
    content::jsonb AS body
  FROM http((
    'POST',
    rtrim(v_function_url, '/') || '/functions/v1/purge-expired-quotations',
    ARRAY[
      http_header('Authorization', 'Bearer ' || v_cleanup_token),
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    jsonb_build_object('limit', 500)::text
  )::http_request);

  RETURN jsonb_build_object(
    'ok', v_response.status IN (200, 207),
    'http_status', v_response.status,
    'response', COALESCE(v_response.body, '{}'::jsonb)
  );
EXCEPTION WHEN undefined_function THEN
  RETURN jsonb_build_object('ok', false, 'error', 'http_extension_not_available');
WHEN undefined_table THEN
  RETURN jsonb_build_object('ok', false, 'error', 'app_runtime_settings_missing');
END;
$$;

-- 6) Cron diario (idempotente): 03:00 AM
DO $$
DECLARE
  v_jobid int;
BEGIN
  BEGIN
    SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = 'purge-expired-quotations';
    IF v_jobid IS NOT NULL THEN
      PERFORM cron.unschedule(v_jobid);
    END IF;

    PERFORM cron.schedule(
      'purge-expired-quotations',
      '0 3 * * *',
      'SELECT public.perform_purge_expired_quotations();'
    );
  EXCEPTION WHEN undefined_table OR undefined_column OR undefined_function THEN
    RAISE NOTICE 'pg_cron no disponible o esquema distinto. Saltando schedule de purge-expired-quotations.';
  END;
END;
$$;

COMMIT;
