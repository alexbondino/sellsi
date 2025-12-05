-- Migration: Flow Payment Integration
-- Date: 2024-12-04
-- Description: Add Flow payment gateway support (parallel to Khipu)

-- ============================================================================
-- Nueva tabla para logs de webhook Flow
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.flow_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_order bigint,
  commerce_order varchar,
  token varchar,
  status integer,
  webhook_data jsonb,
  signature_valid boolean DEFAULT true,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  processing_latency_ms integer,
  error_message text,
  created_at timestamptz DEFAULT now(),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  category text  -- 'payment_confirmed', 'payment_rejected', etc.
);

-- ============================================================================
-- Agregar columnas Flow a orders (paralelo a khipu_*)
-- ============================================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS flow_order bigint;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS flow_token varchar;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS flow_payment_url text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS flow_expires_at timestamptz;

-- ============================================================================
-- Índices para búsquedas eficientes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_flow_order ON public.orders(flow_order) WHERE flow_order IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flow_webhook_logs_order_id ON public.flow_webhook_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_flow_webhook_logs_flow_order ON public.flow_webhook_logs(flow_order);
CREATE INDEX IF NOT EXISTS idx_flow_webhook_logs_token ON public.flow_webhook_logs(token);

-- ============================================================================
-- RLS policies para flow_webhook_logs
-- ============================================================================
ALTER TABLE public.flow_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Solo service role puede insertar/actualizar (webhooks vienen del backend)
CREATE POLICY flow_webhook_logs_service_insert ON public.flow_webhook_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY flow_webhook_logs_service_update ON public.flow_webhook_logs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role puede leer (los admins acceden via control_panel_users con service role)
CREATE POLICY flow_webhook_logs_service_select ON public.flow_webhook_logs
  FOR SELECT
  TO service_role
  USING (true);

-- ============================================================================
-- Registrar en catálogo de edge functions (si existe la tabla)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'edge_functions') THEN
    INSERT INTO edge_functions (function_name, display_name, category, owner, sla_ms, is_active)
    VALUES 
      ('create-payment-flow', 'Create Payment Flow', 'payments', 'platform', 1500, true),
      ('process-flow-webhook', 'Process Flow Webhook', 'payments', 'platform', 1800, true)
    ON CONFLICT (function_name) DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.flow_webhook_logs IS 'Logs de webhooks recibidos de Flow.cl para auditoría y debugging';
COMMENT ON COLUMN public.orders.flow_order IS 'ID de orden en Flow (flowOrder)';
COMMENT ON COLUMN public.orders.flow_token IS 'Token de pago Flow';
COMMENT ON COLUMN public.orders.flow_payment_url IS 'URL de pago Flow completa';
COMMENT ON COLUMN public.orders.flow_expires_at IS 'Expiración de la sesión de pago Flow';
