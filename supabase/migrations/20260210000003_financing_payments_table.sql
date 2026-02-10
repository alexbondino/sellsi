-- ============================================================================
-- MIGRACIÓN: Tabla financing_payments para registrar pagos de deuda
-- Fecha: 2026-02-10
-- Propósito: Registrar pagos de deuda de financiamiento via Khipu/Flow/Transferencia
-- ============================================================================

-- 1. Crear tabla financing_payments
CREATE TABLE IF NOT EXISTS financing_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  financing_request_id UUID NOT NULL REFERENCES financing_requests(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'CLP',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('khipu', 'flow', 'bank_transfer')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
  
  -- Datos de Khipu
  khipu_payment_id TEXT,
  khipu_payment_url TEXT,
  khipu_transaction_id TEXT,
  khipu_expires_at TIMESTAMPTZ,
  
  -- Datos de Flow
  flow_order TEXT,
  flow_token TEXT,
  flow_payment_url TEXT,
  flow_expires_at TIMESTAMPTZ,
  
  -- Datos de Transferencia
  transfer_reference TEXT,
  transfer_verified_by UUID,
  transfer_verified_at TIMESTAMPTZ,
  
  -- Gateway response cruda
  gateway_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_financing_payments_request ON financing_payments(financing_request_id);
CREATE INDEX IF NOT EXISTS idx_financing_payments_buyer ON financing_payments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_financing_payments_status ON financing_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_financing_payments_khipu ON financing_payments(khipu_payment_id) WHERE khipu_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_financing_payments_flow ON financing_payments(flow_order) WHERE flow_order IS NOT NULL;

-- 3. RLS
ALTER TABLE financing_payments ENABLE ROW LEVEL SECURITY;

-- Buyers pueden ver sus propios pagos
CREATE POLICY "financing_payments_buyer_select" ON financing_payments
  FOR SELECT USING (
    buyer_id IN (
      SELECT b.id FROM buyer b WHERE b.user_id = auth.uid()
    )
  );

-- Buyers pueden insertar pagos por transferencia bancaria
CREATE POLICY "financing_payments_buyer_insert" ON financing_payments
  FOR INSERT WITH CHECK (
    payment_method = 'bank_transfer'
    AND buyer_id IN (
      SELECT b.id FROM buyer b WHERE b.user_id = auth.uid()
    )
  );

-- Service role puede hacer todo (para Edge Functions)
-- No se necesita policy explícita, service_role bypassa RLS

-- 4. Función para procesar pago exitoso de financiamiento
-- Cuando un pago se confirma, reduce el amount_used del financiamiento
CREATE OR REPLACE FUNCTION process_financing_payment_success(
  p_payment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_financing RECORD;
  v_new_amount_used INTEGER;
BEGIN
  -- Obtener el pago
  SELECT * INTO v_payment
  FROM financing_payments
  WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Payment not found');
  END IF;
  
  IF v_payment.payment_status = 'paid' THEN
    RETURN jsonb_build_object('error', 'Payment already processed');
  END IF;
  
  -- Obtener el financiamiento
  SELECT * INTO v_financing
  FROM financing_requests
  WHERE id = v_payment.financing_request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Financing request not found');
  END IF;
  
  -- Calcular nuevo amount_used
  v_new_amount_used := GREATEST(0, v_financing.amount_used - v_payment.amount);
  
  -- Actualizar el pago como exitoso
  UPDATE financing_payments
  SET payment_status = 'paid',
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payment_id;
  
  -- Reducir el amount_used del financiamiento
  UPDATE financing_requests
  SET amount_used = v_new_amount_used,
      updated_at = NOW()
  WHERE id = v_payment.financing_request_id;
  
  -- Registrar transacción
  INSERT INTO financing_transactions (
    financing_request_id,
    type,
    amount,
    description,
    created_at
  ) VALUES (
    v_payment.financing_request_id,
    'payment',
    v_payment.amount,
    'Pago de deuda via ' || v_payment.payment_method,
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'amount_paid', v_payment.amount,
    'previous_amount_used', v_financing.amount_used,
    'new_amount_used', v_new_amount_used
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_financing_payment_success(UUID) TO service_role;
