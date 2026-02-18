-- =============================================================================
-- Hotfix: Ensure perform_retry_thumbnail_jobs has ZERO dependency on thumbnail_url
-- =============================================================================
-- Reason:
-- - After applying previous migrations, precheck 0.4.f still reports
--   public.perform_retry_thumbnail_jobs() as matching identifier `thumbnail_url`.
-- - Applied migrations are immutable; this migration re-applies the intended
--   definition explicitly.
--
-- Goal:
-- - Remove any remaining reference to product_images.thumbnail_url (legacy)
-- - Keep reconciler behavior using thumbnails JSON only (desktop/tablet/mobile/minithumb)
-- - Be robust if thumbnails JSON contains non-Supabase URLs: do not use extracted
--   object name when it looks like an URL; fallback to thumbnail_object_name.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.perform_retry_thumbnail_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch_limit int := 20;
  v_reconciled  int := 0;
  v_zombies     int := 0;
  v_function_url  text;
  v_cleanup_token text;
  v_response record;
BEGIN
  BEGIN
    v_batch_limit := COALESCE(NULLIF(current_setting('thumbnail.batch_limit', true), '')::int, 20);
  EXCEPTION WHEN others THEN
    v_batch_limit := 20;
  END;

  UPDATE public.image_thumbnail_jobs j
  SET status     = 'error',
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
       CASE
         WHEN public.extract_thumbnail_object_name(
           COALESCE(
             pi.thumbnails ->> 'desktop',
             pi.thumbnails ->> 'tablet',
             pi.thumbnails ->> 'mobile',
             pi.thumbnails ->> 'minithumb'
           )
         ) ~ '^https?://' THEN NULL
         ELSE public.extract_thumbnail_object_name(
           COALESCE(
             pi.thumbnails ->> 'desktop',
             pi.thumbnails ->> 'tablet',
             pi.thumbnails ->> 'mobile',
             pi.thumbnails ->> 'minithumb'
           )
         )
       END,
       pi.thumbnail_object_name
     )
    WHERE COALESCE(
      pi.thumbnails ->> 'desktop',
      pi.thumbnails ->> 'tablet',
      pi.thumbnails ->> 'mobile',
      pi.thumbnails ->> 'minithumb'
    ) IS NOT NULL
      AND COALESCE(
        CASE
          WHEN public.extract_thumbnail_object_name(
            COALESCE(
              pi.thumbnails ->> 'desktop',
              pi.thumbnails ->> 'tablet',
              pi.thumbnails ->> 'mobile',
              pi.thumbnails ->> 'minithumb'
            )
          ) ~ '^https?://' THEN NULL
          ELSE public.extract_thumbnail_object_name(
            COALESCE(
              pi.thumbnails ->> 'desktop',
              pi.thumbnails ->> 'tablet',
              pi.thumbnails ->> 'mobile',
              pi.thumbnails ->> 'minithumb'
            )
          )
        END,
        pi.thumbnail_object_name
      ) IS NOT NULL
      AND j2.status IN ('success', 'processing')
    GROUP BY j2.id
    HAVING COUNT(o.id) = 0
    ORDER BY MAX(j2.updated_at) ASC
    LIMIT v_batch_limit
  );
  GET DIAGNOSTICS v_reconciled = ROW_COUNT;

  UPDATE public.image_thumbnail_jobs
  SET status     = 'error',
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
      'required', ARRAY[
        'app.supabase_url or app_runtime_settings.supabase_url',
        'app.cleanup_secret_token or app_runtime_settings.cleanup_secret_token'
      ],
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

COMMENT ON FUNCTION public.perform_retry_thumbnail_jobs() IS
'Reconcilia jobs success/processing sin objeto físico y dispara retry-thumbnail-jobs por HTTP. P0: sin dependencia de product_images.thumbnail_url legacy.';
