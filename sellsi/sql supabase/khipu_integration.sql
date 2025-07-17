-- ============================================================================
-- KHIPU INTEGRATION - ACTUALIZACIÓN DE ESQUEMA PARA PAGOS
-- ============================================================================

-- Crear tabla de órdenes si no existe
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  shipping numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'CLP',
  status varchar(20) NOT NULL DEFAULT 'pending',
  payment_method varchar(50),
  payment_status varchar(20) NOT NULL DEFAULT 'pending',
  shipping_address jsonb,
  billing_address jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);

-- Agregar campos específicos para Khipu a la tabla de órdenes
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS khipu_payment_id varchar(255),
ADD COLUMN IF NOT EXISTS khipu_transaction_id varchar(255),
ADD COLUMN IF NOT EXISTS khipu_payment_url text,
ADD COLUMN IF NOT EXISTS khipu_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_khipu_payment_id ON public.orders(khipu_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_khipu_transaction_id ON public.orders(khipu_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Crear tabla para logs de webhooks de Khipu
CREATE TABLE IF NOT EXISTS public.khipu_webhook_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payment_id varchar(255),
  transaction_id varchar(255),
  status varchar(50),
  webhook_data jsonb,
  signature_header text,
  processed boolean DEFAULT false,
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT khipu_webhook_logs_pkey PRIMARY KEY (id)
);

-- Crear índices para la tabla de logs
CREATE INDEX IF NOT EXISTS idx_khipu_webhook_logs_payment_id ON public.khipu_webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_khipu_webhook_logs_transaction_id ON public.khipu_webhook_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_khipu_webhook_logs_processed ON public.khipu_webhook_logs(processed);

-- Crear tabla para transacciones de pago
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  payment_method varchar(50) NOT NULL,
  external_payment_id varchar(255), -- payment_id de Khipu
  external_transaction_id varchar(255), -- transaction_id de Khipu
  amount numeric NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'CLP',
  status varchar(20) NOT NULL DEFAULT 'pending',
  gateway_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);

-- Crear índices para la tabla de transacciones
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_external_payment_id ON public.payment_transactions(external_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

-- Funciones para actualizar timestamps automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON public.orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at 
  BEFORE UPDATE ON public.payment_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.khipu_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo vean sus propias órdenes
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para transacciones de pago (solo lectura para usuarios)
DROP POLICY IF EXISTS "Users can view own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own payment transactions" ON public.payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = payment_transactions.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Los webhooks solo pueden ser insertados/actualizados por el servicio
DROP POLICY IF EXISTS "Service role can manage webhook logs" ON public.khipu_webhook_logs;
CREATE POLICY "Service role can manage webhook logs" ON public.khipu_webhook_logs
  FOR ALL USING (true);

-- Comentarios para documentación
COMMENT ON TABLE public.orders IS 'Órdenes de compra de los usuarios';
COMMENT ON TABLE public.payment_transactions IS 'Transacciones de pago con proveedores externos';
COMMENT ON TABLE public.khipu_webhook_logs IS 'Logs de webhooks recibidos de Khipu';

COMMENT ON COLUMN public.orders.khipu_payment_id IS 'ID del pago en Khipu';
COMMENT ON COLUMN public.orders.khipu_transaction_id IS 'ID de transacción personalizado para Khipu';
COMMENT ON COLUMN public.orders.khipu_payment_url IS 'URL de pago generada por Khipu';
COMMENT ON COLUMN public.orders.khipu_expires_at IS 'Fecha de expiración del pago en Khipu';
COMMENT ON COLUMN public.orders.paid_at IS 'Fecha y hora cuando se confirmó el pago';
