-- Edge Metrics Enhancements: catalog + extended daily view + index
-- Created: 2025-08-15
-- Phase 1.1 improvements

-- 1. Catalog table for edge functions (idempotent creation)
CREATE TABLE IF NOT EXISTS public.edge_functions (
  function_name text PRIMARY KEY,
  display_name text,
  category text,
  owner text,
  sla_ms integer, -- target p95 latency in ms
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 2. Seed current known functions (insert only missing)
INSERT INTO public.edge_functions (function_name, display_name, category, owner, sla_ms)
VALUES
  ('admin-2fa','Admin 2FA','security','platform', 800),
  ('cleanup-product','Cleanup Product','maintenance','platform', 1200),
  ('create-khipu-payment','Create Khipu Payment (LEGACY)','payments','platform', 1500),
  ('create-payment-khipu','Create Payment Khipu','payments','platform', 1500),
  ('daily-cleanup','Daily Cleanup','maintenance','platform', 2000),
  ('generate-thumbnail','Generate Thumbnail','media','platform', 2500),
  ('get-payment-status','Get Payment Status','payments','platform', 800),
  ('khipu-webhook-handler','Khipu Webhook Handler','payments','platform', 1800),
  ('process-khipu-webhook','Process Khipu Webhook','payments','platform', 1800),
  ('purge-orphans','Purge Orphans','maintenance','platform', 2500),
  ('retry-thumbnail-jobs','Retry Thumbnail Jobs','media','platform', 2500),
  ('update-lastip','Update Last IP','security','platform', 600),
  ('verify-khipu-payment','Verify Khipu Payment','payments','platform', 1200)
ON CONFLICT (function_name) DO NOTHING;

-- 3. Index to accelerate time range + aggregation queries
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_edge_function_invocations_fn_started') THEN
    CREATE INDEX idx_edge_function_invocations_fn_started ON public.edge_function_invocations(function_name, started_at DESC);
  END IF;
END $$;

-- 4. Add FK constraint (only if absent and data consistent)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='edge_function_invocations_function_name_fkey') THEN
    ALTER TABLE public.edge_function_invocations
      ADD CONSTRAINT edge_function_invocations_function_name_fkey
      FOREIGN KEY (function_name) REFERENCES public.edge_functions(function_name) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

-- 5. Extended daily aggregation view (WITH p95, max, error rate, SLA breaches)
CREATE OR REPLACE VIEW public.vw_edge_function_daily_ext AS
WITH base AS (
  SELECT
    e.function_name,
    date_trunc('day', e.started_at) AS day,
    COUNT(*)::int AS invocations,
    SUM( (e.status='error')::int )::int AS errors,
    AVG(e.duration_ms)::numeric(10,2) AS avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.duration_ms) AS p95_duration_ms,
    MAX(e.duration_ms)::int AS max_duration_ms,
    SUM( CASE WHEN ef.sla_ms IS NOT NULL AND e.duration_ms > ef.sla_ms THEN 1 ELSE 0 END )::int AS sla_breaches,
    ef.sla_ms,
    MIN(e.started_at) AS first_started_at,
    MAX(e.finished_at) AS last_finished_at
  FROM public.edge_function_invocations e
  LEFT JOIN public.edge_functions ef USING (function_name)
  GROUP BY e.function_name, date_trunc('day', e.started_at), ef.sla_ms
)
SELECT
  b.function_name,
  ef.display_name,
  ef.category,
  ef.owner,
  b.day,
  b.invocations,
  b.errors,
  (CASE WHEN b.invocations > 0 THEN (b.errors::decimal / b.invocations) * 100 ELSE 0 END)::numeric(6,2) AS error_rate_pct,
  b.avg_duration_ms,
  b.p95_duration_ms,
  b.max_duration_ms,
  b.sla_ms,
  b.sla_breaches,
  (CASE WHEN b.invocations > 0 AND b.sla_ms IS NOT NULL THEN (b.sla_breaches::decimal / b.invocations) * 100 ELSE NULL END)::numeric(6,2) AS sla_breach_pct,
  b.first_started_at,
  b.last_finished_at
FROM base b
LEFT JOIN public.edge_functions ef USING (function_name);

-- 6. Comment for documentation
COMMENT ON VIEW public.vw_edge_function_daily_ext IS 'Extended daily metrics for edge functions including p95, max latency, error rate, and SLA breaches.';
