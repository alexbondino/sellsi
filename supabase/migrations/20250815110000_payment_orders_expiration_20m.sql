-- ============================================================================
-- CONSOLIDATED MIGRATION: Auto-expirar payment orders (TTL 20 minutos)
-- Fecha: 2025-08-15
-- Contexto: Sustituye 2 borradores previos no desplegados (30m + ajuste 20m) unificando
-- Objetivos:
--   * Definir TTL por defecto de 20 minutos (fallback si Khipu no provee expires_at)
--   * Backfill de khipu_expires_at para órdenes pendientes sin valor
--   * Expirar legacy muy antiguas (> 2 horas) inmediatamente
--   * Crear / actualizar función idempotente de expiración
--   * Crear índice parcial para acelerar barrido
--   * Programar job pg_cron cada 5 minutos (reemplazando si ya existía)
-- Seguridad / Idempotencia: Cada paso se protege para múltiples ejecuciones
-- ============================================================================

-- 1. DEFAULT TTL 20m
ALTER TABLE public.orders
  ALTER COLUMN khipu_expires_at SET DEFAULT (now() + interval '20 minutes');

-- 2. Backfill sólo donde falta o está inconsistente
UPDATE public.orders
SET khipu_expires_at = created_at + interval '20 minutes'
WHERE payment_status = 'pending'
  AND paid_at IS NULL
  AND (khipu_expires_at IS NULL OR khipu_expires_at <= created_at);

-- 3. Expirar legacy (muy antiguas) para limpieza inicial
UPDATE public.orders
SET payment_status = 'expired',
    status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
    cancellation_reason = COALESCE(cancellation_reason, 'auto-expired (legacy cleanup)'),
    updated_at = now()
WHERE payment_status = 'pending'
  AND paid_at IS NULL
  AND created_at < now() - interval '2 hours';

-- 4. Función idempotente de expiración (usa khipu_expires_at real o fallback default)
CREATE OR REPLACE FUNCTION public.cancel_stale_payment_orders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.orders o
  SET payment_status = 'expired',
      status = CASE WHEN status = 'pending' THEN 'cancelled' ELSE status END,
      cancellation_reason = COALESCE(cancellation_reason, 'payment window expired'),
      updated_at = now()
  WHERE payment_status = 'pending'
    AND paid_at IS NULL
    AND khipu_expires_at IS NOT NULL
    AND now() > khipu_expires_at
    AND NOT EXISTS (
      SELECT 1 FROM public.orders o2
      WHERE o2.id = o.id AND o2.payment_status IN ('paid','failed','expired')
    );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE LOG 'cancel_stale_payment_orders: % órdenes expiradas', v_updated;
END; $$;

COMMENT ON FUNCTION public.cancel_stale_payment_orders() IS 'Marca payment orders pending sin pago como expired + cancelled cuando supera TTL (20m o expires_at real).';
COMMENT ON COLUMN public.orders.khipu_expires_at IS 'Expiry de intento de pago Khipu (API) o fallback 20m.';

-- 5. Índice parcial (si ya existe, no se duplica)
CREATE INDEX IF NOT EXISTS idx_orders_pending_payment
  ON public.orders (khipu_expires_at)
  WHERE payment_status = 'pending' AND paid_at IS NULL;

-- 6. Programar/Reprogramar job cron cada 5 minutos
DO $$
DECLARE
  job_id int;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'cancel-stale-payment-orders';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
  PERFORM cron.schedule('cancel-stale-payment-orders', '*/5 * * * *', $cmd$SELECT public.cancel_stale_payment_orders();$cmd$);
END $$;

-- 7. cart_id linkage para deduplicación determinística (añadido posteriormente y consolidado aquí)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cart_id uuid NULL;
COMMENT ON COLUMN public.orders.cart_id IS 'Original cart identifier linked to this payment order (for dedup/materialization).';
CREATE INDEX IF NOT EXISTS idx_orders_cart_id ON public.orders(cart_id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='uniq_orders_cart_pending'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX uniq_orders_cart_pending ON public.orders(cart_id) WHERE cart_id IS NOT NULL AND payment_status = ''pending''';
  END IF;
END $$;

-- ============================================================================
-- FIN MIGRACIÓN CONSOLIDADA
-- ============================================================================
