-- =============================================================================
-- P0 Phase 2: Remove remaining SQL dependencies on product_images.thumbnail_url
-- =============================================================================
-- Precondition verified (precheck 0.1 run 2026-02-17):
--   mismatched_desktop = 0, with_thumbnail_url = 64, with_desktop_json = 64
--   All rows that have thumbnail_url ALSO have thumbnails->>'desktop' with matching value.
--   Therefore removing the COALESCE(..., thumbnail_url) fallback is safe.
--
-- True blockers fixed in this migration:
--   1. thumbnail_health view           (0.4.c hit, not in 0.6.c → real dep)
--   2. offers_with_details view        (0.4.c + 0.8 hit → real dep + product_thumbnail_url)
--   3. perform_retry_thumbnail_jobs fn (0.4.b hit, not in 0.6.b → real dep)
--
-- False positives NOT touched (visible in both 0.4.c AND 0.6.c → only reference products.tiny_thumbnail_url):
--   · marketplace_products_daily   (p.* expansion includes products.tiny_thumbnail_url)
--   · product_price_summary        (explicit p.tiny_thumbnail_url)
--   · products_sorted              (legacy view, references products.tiny_thumbnail_url)
-- These do NOT reference product_images.thumbnail_url and will NOT block the column DROP.
-- =============================================================================


-- 1) View: thumbnail_health
-- Remove pi.thumbnail_url fallback from both COALESCE usages.
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
  WHERE pi.image_order = 0
    AND COALESCE(
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
  GROUP BY pi.product_id
) x;

COMMENT ON VIEW public.thumbnail_health IS
'Monitoreo de thumbnails faltantes en storage. P0 phase2: sin dependencia de product_images.thumbnail_url legacy.';


-- 2) View: offers_with_details
-- Replace COALESCE(pi.thumbnails->>''desktop'', pi.thumbnail_url) with JSON-only COALESCE (no legacy column).
-- product_thumbnail_url alias is preserved for frontend compatibility.
CREATE OR REPLACE VIEW public.offers_with_details AS
SELECT
  o.id,
  o.buyer_id,
  o.supplier_id,
  o.product_id,
  o.offered_price,
  o.offered_quantity,
  o.message,
  o.status,
  o.created_at,
  o.expires_at,
  o.accepted_at,
  o.purchase_deadline,
  o.purchased_at,
  o.rejected_at,
  o.expired_at,
  o.tier_price_at_offer,
  o.base_price_at_offer,
  o.stock_reserved,
  o.reserved_at,
  o.rejection_reason,
  o.updated_at,
  p.productnm AS product_name,
  p.price AS current_product_price,
  p.productqty AS current_stock,
  pi.image_url AS product_image,
  buyer.user_nm AS buyer_name,
  buyer.email AS buyer_email,
  supplier.user_nm AS supplier_name,
  supplier.email AS supplier_email,
  CASE
    WHEN o.status = 'pending'  THEN EXTRACT(EPOCH FROM (o.expires_at        - now()))
    WHEN o.status = 'accepted' THEN EXTRACT(EPOCH FROM (o.purchase_deadline - now()))
    ELSE 0
  END AS seconds_remaining,
  CASE
    WHEN o.status = 'pending'  AND now() > o.expires_at        THEN true
    WHEN o.status = 'accepted' AND now() > o.purchase_deadline THEN true
    ELSE false
  END AS is_expired,
  pi.thumbnails AS product_thumbnails,
  COALESCE(
    pi.thumbnails ->> 'desktop',
    pi.thumbnails ->> 'tablet',
    pi.thumbnails ->> 'mobile',
    pi.thumbnails ->> 'minithumb'
  ) AS product_thumbnail_url
FROM public.offers o
JOIN public.products p        ON o.product_id  = p.productid
JOIN public.users buyer       ON o.buyer_id    = buyer.user_id
JOIN public.users supplier    ON o.supplier_id = supplier.user_id
LEFT JOIN public.product_images pi
  ON p.productid = pi.product_id
 AND pi.image_order = 0;

COMMENT ON VIEW public.offers_with_details IS
'Vista de ofertas con detalle de producto, comprador y proveedor. P0 phase2: product_thumbnail_url via thumbnails JSON sin fallback a thumbnail_url legacy.';


-- 3) Function: perform_retry_thumbnail_jobs
-- Remove pi.thumbnail_url from the two COALESCE usages in the reconciler subquery.
-- Nota: usamos COALESCE solo dentro de thumbnails JSON (desktop/tablet/mobile/minithumb) para no depender de la columna legacy.
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

  -- Reconciler: mark success/processing jobs as error when storage object is missing.
  -- Usa COALESCE solo dentro de thumbnails JSON (no thumbnail_url fallback).
  UPDATE public.image_thumbnail_jobs j
  SET status    = 'error',
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

  -- Zombie recovery: stuck processing jobs older than 15 minutes.
  UPDATE public.image_thumbnail_jobs
  SET status    = 'error',
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
      'ok',    false,
      'error', 'missing_app_settings',
      'required', ARRAY[
        'app.supabase_url or app_runtime_settings.supabase_url',
        'app.cleanup_secret_token or app_runtime_settings.cleanup_secret_token'
      ],
      'reconciled_to_error', v_reconciled,
      'rescued_processing',  v_zombies
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
    'ok',                 v_response.status IN (200, 207),
    'http_status',        v_response.status,
    'reconciled_to_error', v_reconciled,
    'rescued_processing',  v_zombies,
    'response',           COALESCE(v_response.body, '{}'::jsonb)
  );
END;
$$;

COMMENT ON FUNCTION public.perform_retry_thumbnail_jobs() IS
'Reconcilia jobs success/processing sin objeto físico y dispara retry-thumbnail-jobs por HTTP. Ejecutar hourly via pg_cron. P0 phase2: sin dependencia de product_images.thumbnail_url legacy.';
