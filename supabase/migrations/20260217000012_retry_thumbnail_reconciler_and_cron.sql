-- Retry Thumbnails: reconciler + scheduler (hourly)
-- Aligns with retry-thumbnails plan using serverless-safe pattern:
-- pg_cron -> perform_retry_thumbnail_jobs() -> HTTP call to retry-thumbnail-jobs (token auth)

CREATE EXTENSION IF NOT EXISTS http;

CREATE TABLE IF NOT EXISTS public.app_runtime_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_app_runtime_setting(
  p_key text,
  p_value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.app_runtime_settings(key, value, updated_at)
  VALUES (p_key, p_value, now())
  ON CONFLICT (key)
  DO UPDATE SET value = EXCLUDED.value, updated_at = now();
END;
$$;

ALTER TABLE public.image_thumbnail_jobs
  ADD COLUMN IF NOT EXISTS processing_started_at timestamptz;

ALTER TABLE public.product_images
  ADD COLUMN IF NOT EXISTS thumbnail_object_name text;

CREATE OR REPLACE FUNCTION public.extract_thumbnail_object_name(p_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_url IS NULL OR btrim(p_url) = '' THEN NULL
    ELSE split_part(
      regexp_replace(
        p_url,
        '^.*?/storage/v1/object/(public|sign)/product-images-thumbnails/',
        ''
      ),
      '?',
      1
    )
  END;
$$;

UPDATE public.product_images
SET thumbnail_object_name = public.extract_thumbnail_object_name(
  COALESCE(thumbnails ->> 'desktop', thumbnail_url)
)
WHERE image_order = 0
  AND COALESCE(thumbnails ->> 'desktop', thumbnail_url) IS NOT NULL
  AND (
    thumbnail_object_name IS NULL
    OR thumbnail_object_name = ''
    OR thumbnail_object_name <> public.extract_thumbnail_object_name(COALESCE(thumbnails ->> 'desktop', thumbnail_url))
  );

-- NOTE: Do not create indexes on storage.objects here.
-- In Supabase managed environments this table is not owned by app role,
-- and CREATE INDEX can fail with permission errors.

CREATE INDEX IF NOT EXISTS idx_product_images_thumbname_main
  ON public.product_images (thumbnail_object_name)
  WHERE image_order = 0 AND thumbnail_object_name IS NOT NULL;

CREATE OR REPLACE VIEW public.thumbnail_health AS
SELECT
  COUNT(*) FILTER (WHERE found_objects = 0) AS missing_count,
  COUNT(*) AS total_with_metadata,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE found_objects = 0) / NULLIF(COUNT(*), 0),
    2
  ) AS missing_pct
FROM (
  SELECT
    pi.product_id,
    COUNT(o.id) AS found_objects
  FROM public.product_images pi
  LEFT JOIN storage.objects o
    ON o.bucket_id = 'product-images-thumbnails'
   AND o.name = COALESCE(
     pi.thumbnail_object_name,
     public.extract_thumbnail_object_name(COALESCE(pi.thumbnails ->> 'desktop', pi.thumbnail_url))
   )
  WHERE pi.image_order = 0
    AND COALESCE(pi.thumbnails ->> 'desktop', pi.thumbnail_url) IS NOT NULL
  GROUP BY pi.product_id
) x;

CREATE OR REPLACE FUNCTION public.perform_retry_thumbnail_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_limit int := 20;
  v_reconciled int := 0;
  v_zombies int := 0;
  v_function_url text;
  v_cleanup_token text;
  v_response record;
BEGIN
  BEGIN
    v_batch_limit := COALESCE(NULLIF(current_setting('thumbnail.batch_limit', true), '')::int, 20);
  EXCEPTION WHEN others THEN
    v_batch_limit := 20;
  END;

  UPDATE public.image_thumbnail_jobs j
  SET status = 'error',
      last_error = 'reconciler:missing_storage_object',
      updated_at = now()
  WHERE j.id IN (
    SELECT j2.id
    FROM public.image_thumbnail_jobs j2
    JOIN public.product_images pi
      ON pi.product_id = j2.product_id
     AND pi.image_order = 0
    LEFT JOIN storage.objects o
      ON o.bucket_id = 'product-images-thumbnails'
     AND o.name = COALESCE(
       pi.thumbnail_object_name,
       public.extract_thumbnail_object_name(COALESCE(pi.thumbnails ->> 'desktop', pi.thumbnail_url))
     )
    WHERE COALESCE(pi.thumbnails ->> 'desktop', pi.thumbnail_url) IS NOT NULL
      AND j2.status IN ('success', 'processing')
    GROUP BY j2.id
    HAVING COUNT(o.id) = 0
    ORDER BY MAX(j2.updated_at) ASC
    LIMIT v_batch_limit
  );
  GET DIAGNOSTICS v_reconciled = ROW_COUNT;

  UPDATE public.image_thumbnail_jobs
  SET status = 'error',
      last_error = 'reconciler:stuck_processing',
      updated_at = now()
  WHERE status = 'processing'
    AND updated_at < now() - interval '15 minutes';
  GET DIAGNOSTICS v_zombies = ROW_COUNT;

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
      'required', ARRAY['app.supabase_url or app_runtime_settings.supabase_url', 'app.cleanup_secret_token or app_runtime_settings.cleanup_secret_token'],
      'reconciled_to_error', v_reconciled,
      'rescued_processing', v_zombies
    );
  END IF;

  SELECT INTO v_response
    status,
    content::jsonb AS body
  FROM public.http((
    'POST',
    rtrim(v_function_url, '/') || '/functions/v1/retry-thumbnail-jobs',
    ARRAY[
      public.http_header('Authorization', 'Bearer ' || v_cleanup_token),
      public.http_header('Content-Type', 'application/json')
    ],
    'application/json',
    '{}'::text
  )::public.http_request);

  RETURN jsonb_build_object(
    'ok', v_response.status IN (200, 207),
    'http_status', v_response.status,
    'reconciled_to_error', v_reconciled,
    'rescued_processing', v_zombies,
    'response', COALESCE(v_response.body, '{}'::jsonb)
  );
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retry-thumbnail-hourly') THEN
    PERFORM cron.schedule(
      'retry-thumbnail-hourly',
      '0 * * * *',
      'SELECT public.perform_retry_thumbnail_jobs();'
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION public.perform_retry_thumbnail_jobs() IS
'Reconcilia jobs success/processing sin objeto físico y dispara retry-thumbnail-jobs por HTTP. Ejecutar hourly via pg_cron.';
