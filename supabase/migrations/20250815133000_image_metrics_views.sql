-- Migration: image system metrics views
-- Fecha: 2025-08-15
-- Objetivo: Exponer métricas agregadas para monitoreo sin lógica de aplicación

-- Vista: métricas de jobs de thumbnails
CREATE OR REPLACE VIEW public.vw_image_thumbnail_job_metrics AS
SELECT
  COUNT(*) FILTER (WHERE status='queued') AS queued,
  COUNT(*) FILTER (WHERE status='processing') AS processing,
  COUNT(*) FILTER (WHERE status='error') AS error,
  COUNT(*) FILTER (WHERE status='success') AS success,
  COALESCE(EXTRACT(EPOCH FROM (now() - (MIN(updated_at) FILTER (WHERE status IN ('queued','processing')))))::int,0) AS oldest_pending_age_seconds,
  COALESCE(EXTRACT(EPOCH FROM (now() - MAX(updated_at)))::int,0) AS last_activity_age_seconds
FROM public.image_thumbnail_jobs;

COMMENT ON VIEW public.vw_image_thumbnail_job_metrics IS 'Métricas agregadas de jobs de thumbnails.';

-- Vista: métricas de orphans en staging por edad
CREATE OR REPLACE VIEW public.vw_image_orphan_candidates_metrics AS
WITH base AS (
  SELECT *, now() - detected_at AS age FROM public.image_orphan_candidates WHERE confirmed_deleted_at IS NULL
)
SELECT
  COUNT(*) AS total_staged,
  COUNT(*) FILTER (WHERE age < interval '1 day') AS lt_1d,
  COUNT(*) FILTER (WHERE age >= interval '1 day' AND age < interval '3 day') AS d1_3,
  COUNT(*) FILTER (WHERE age >= interval '3 day' AND age < interval '7 day') AS d3_7,
  COUNT(*) FILTER (WHERE age >= interval '7 day') AS gte_7d
FROM base;

COMMENT ON VIEW public.vw_image_orphan_candidates_metrics IS 'Distribución de orphans en staging por edad.';

-- Vista: resumen único combinando principales indicadores
CREATE OR REPLACE VIEW public.vw_image_system_overview AS
SELECT
  m.queued, m.processing, m.error, m.success, m.oldest_pending_age_seconds, m.last_activity_age_seconds,
  o.total_staged AS orphans_total, o.lt_1d, o.d1_3, o.d3_7, o.gte_7d
FROM public.vw_image_thumbnail_job_metrics m CROSS JOIN public.vw_image_orphan_candidates_metrics o;

COMMENT ON VIEW public.vw_image_system_overview IS 'Overview consolidado de estado de jobs y orphans.';
