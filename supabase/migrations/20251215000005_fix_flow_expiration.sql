-- ============================================================================
-- FIX: Expiración automática de órdenes Flow
-- Fecha: 2024-12-15
-- Problema: cancel_stale_payment_orders() solo procesa payment_method='khipu'
--           Las órdenes Flow quedan en pending indefinidamente
-- Solución: Extender la función para soportar tanto Khipu como Flow
-- ============================================================================

BEGIN;

-- 1. Establecer DEFAULT para flow_expires_at (30 minutos, coherente con create-payment-flow)
ALTER TABLE public.orders
  ALTER COLUMN flow_expires_at SET DEFAULT (now() + interval '30 minutes');

COMMENT ON COLUMN public.orders.flow_expires_at IS 'Expiry de intento de pago Flow (30 minutos desde creación)';

-- 2. Backfill flow_expires_at para órdenes Flow pending sin valor
UPDATE public.orders
SET flow_expires_at = created_at + interval '30 minutes',
    updated_at = now()
WHERE payment_method = 'flow'
  AND payment_status = 'pending'
  AND paid_at IS NULL
  AND (flow_expires_at IS NULL OR flow_expires_at <= created_at);

-- 3. Limpiar órdenes Flow antiguas (>2 horas) inmediatamente
UPDATE public.orders
SET payment_status = 'expired',
    status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
    cancellation_reason = COALESCE(cancellation_reason, 'auto-expired (Flow legacy cleanup)'),
    updated_at = now()
WHERE payment_method = 'flow'
  AND payment_status = 'pending'
  AND paid_at IS NULL
  AND created_at < now() - interval '2 hours'
  AND payment_status NOT IN ('paid', 'failed', 'expired');

-- 4. Actualizar función para procesar AMBOS métodos de pago (Khipu + Flow)
CREATE OR REPLACE FUNCTION public.cancel_stale_payment_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_khipu integer := 0;
  v_updated_flow integer := 0;
BEGIN
  -- Expirar órdenes Khipu
  UPDATE public.orders o
  SET payment_status = 'expired',
      status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
      cancellation_reason = COALESCE(cancellation_reason, 'payment window expired'),
      updated_at = now()
  WHERE o.payment_method = 'khipu'
    AND o.payment_status = 'pending'
    AND o.paid_at IS NULL
    AND (
      now() > COALESCE(o.khipu_expires_at, o.created_at + interval '20 minutes')
      OR now() > o.created_at + interval '2 hours'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o2 
      WHERE o2.id = o.id AND o2.payment_status IN ('paid','failed','expired')
    );

  GET DIAGNOSTICS v_updated_khipu = ROW_COUNT;

  -- Expirar órdenes Flow
  UPDATE public.orders o
  SET payment_status = 'expired',
      status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
      cancellation_reason = COALESCE(cancellation_reason, 'payment window expired'),
      updated_at = now()
  WHERE o.payment_method = 'flow'
    AND o.payment_status = 'pending'
    AND o.paid_at IS NULL
    AND (
      now() > COALESCE(o.flow_expires_at, o.created_at + interval '30 minutes')
      OR now() > o.created_at + interval '2 hours'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o2 
      WHERE o2.id = o.id AND o2.payment_status IN ('paid','failed','expired')
    );

  GET DIAGNOSTICS v_updated_flow = ROW_COUNT;

  RAISE LOG 'cancel_stale_payment_orders: Khipu=% Flow=% órdenes expiradas', v_updated_khipu, v_updated_flow;
END;
$$;

COMMENT ON FUNCTION public.cancel_stale_payment_orders() IS 
'Marca payment orders pending sin pago como expired + cancelled cuando supera TTL.
Soporta Khipu (20min) y Flow (30min). Ejecutado cada 5 min via pg_cron.';

-- 5. Crear índice para órdenes Flow pending (optimización de queries)
CREATE INDEX IF NOT EXISTS idx_orders_flow_pending_payment_exp_coalesce ON public.orders
  USING btree (COALESCE(flow_expires_at, created_at))
  WHERE payment_method = 'flow' AND payment_status = 'pending' AND paid_at IS NULL;

-- 6. Verificar que el cron job existe (no lo recreamos, ya está programado)
-- El job 'cancel-stale-payment-orders' ejecuta cada 5 min la función actualizada

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-DESPLIEGUE
-- ============================================================================
-- Para confirmar que funciona:
--
-- 1. Ver órdenes Flow pendientes actuales:
--    SELECT id, created_at, flow_expires_at, payment_status 
--    FROM orders 
--    WHERE payment_method = 'flow' AND payment_status = 'pending';
--
-- 2. Verificar cron job activo:
--    SELECT * FROM cron.job WHERE jobname = 'cancel-stale-payment-orders';
--
-- 3. Logs de ejecución (después de 5+ min):
--    SELECT * FROM cron.job_run_details 
--    WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'cancel-stale-payment-orders')
--    ORDER BY start_time DESC LIMIT 10;
--
-- 4. Forzar ejecución manual (testing):
--    SELECT public.cancel_stale_payment_orders();
-- ============================================================================
