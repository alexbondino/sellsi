-- ============================================================================
-- Core Metrics Migration (Fase 1)
-- Date: 2025-08-15
-- Scope (mínimo viable):
--   2. ALTER khipu_webhook_logs (enriquecimiento básico)
--   3. ALTER image_thumbnail_jobs (timestamps y duración)
--   4. Vista diaria simple para dashboard
--   * Diseñado para bajo costo de almacenamiento y lecturas eficientes
-- ============================================================================

-- 1) Tabla principal de invocaciones de Edge Functions
CREATE TABLE IF NOT EXISTS public.edge_function_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  request_id uuid DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms integer,                 -- se calcula desde código (finished_at - started_at)
  status text NOT NULL CHECK (status IN ('success','error')),
  error_code text,                     -- códigos normalizados (validation_error, db_error, etc.)
  error_message text,                  -- truncado en código (<300 chars)
  request_origin text,                 -- origen CORS / referer (opcional)
  input_size_bytes integer,
  output_size_bytes integer,
  meta jsonb DEFAULT '{}'::jsonb,      -- {"order_id": ..., "product_id": ...}
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.edge_function_invocations IS 'Registro liviano por invocación de Edge Functions (observabilidad núcleo).';
COMMENT ON COLUMN public.edge_function_invocations.meta IS 'Metadata ligera contextual (IDs, no payloads completos).';

CREATE INDEX IF NOT EXISTS edge_fn_invocations_fn_started_idx
  ON public.edge_function_invocations(function_name, started_at DESC);

CREATE INDEX IF NOT EXISTS edge_fn_invocations_error_idx
  ON public.edge_function_invocations(status) WHERE status = 'error';

-- 2) Enriquecimiento de khipu_webhook_logs
ALTER TABLE public.khipu_webhook_logs
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS signature_valid boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS processing_latency_ms integer;

CREATE INDEX IF NOT EXISTS khipu_webhook_logs_order_idx
  ON public.khipu_webhook_logs(order_id);

-- 3) Extensión mínima de image_thumbnail_jobs
ALTER TABLE public.image_thumbnail_jobs
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration_ms integer,   -- (completed_at - started_at) en ms, calculado por código
  ADD COLUMN IF NOT EXISTS error_code text;       -- normalizar last_error en categorías

CREATE INDEX IF NOT EXISTS image_thumbnail_jobs_status_updated_idx
  ON public.image_thumbnail_jobs(status, updated_at DESC);

-- 4) Vista diaria simple (sin percentiles para reducir costo inicial)
CREATE OR REPLACE VIEW public.vw_edge_function_daily_stats AS
SELECT
  function_name,
  date_trunc('day', started_at) AS day,
  count(*) AS invocations,
  count(*) FILTER (WHERE status='error') AS errors,
  ROUND((count(*) FILTER (WHERE status='error') * 100.0 / NULLIF(count(*),0))::numeric, 2) AS error_rate_pct,
  ROUND(avg(duration_ms)::numeric,2) AS avg_duration_ms
FROM public.edge_function_invocations
GROUP BY 1,2;

COMMENT ON VIEW public.vw_edge_function_daily_stats IS 'Agregados diarios por función: conteos, errores y duración promedio.';

-- 5) Recomendación de retención (manual):
--    DELETE FROM public.edge_function_invocations WHERE started_at < now() - interval '90 days';

-- FIN MIGRACIÓN FASE 1
