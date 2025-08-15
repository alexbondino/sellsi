-- Metrics retention job (weekly) keeping last 30 days of raw invocations
-- Requires pg_cron extension enabled.

-- 1. Safety function: delete rows older than 30 days in manageable batches to avoid long locks.
CREATE OR REPLACE FUNCTION public.prune_edge_function_invocations(p_days integer DEFAULT 30, p_batch integer DEFAULT 50000)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  v_cutoff timestamptz := now() - (p_days || ' days')::interval;
  v_rows integer;
BEGIN
  LOOP
    WITH cte AS (
      SELECT ctid FROM public.edge_function_invocations
       WHERE started_at < v_cutoff
       LIMIT p_batch
    )
    DELETE FROM public.edge_function_invocations e
    USING cte
    WHERE e.ctid = cte.ctid;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    EXIT WHEN v_rows < p_batch;
    PERFORM pg_sleep(0.2);
  END LOOP;
END;
$$;

-- 2. (No se programa aquí) Programación pg_cron omitida en migración por falta de privilegios sobre cron.job.
--    Para crear el job manualmente (en el SQL editor con rol con permisos suficientes / soporte Supabase):
--    SELECT cron.schedule(
--      'edge_metrics_retention_weekly',
--      '0 3 * * 0',
--      $$SELECT public.prune_edge_function_invocations(30, 50000);$$
--    );
--    Alternativas si no tienes permisos pg_cron:
--      a) Llamar SELECT public.prune_edge_function_invocations(); desde una función maintenance diaria existente.
--      b) Crear Edge Function metrics-prune y dispararla con GitHub Actions / externo.

COMMENT ON FUNCTION public.prune_edge_function_invocations(integer, integer) IS 'Deletes edge_function_invocations rows older than given days in batches.';
