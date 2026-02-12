-- ============================================================================
-- FIX: Correcciones críticas para financing_payments
-- Fecha: 2026-02-11
-- Problemas resueltos:
-- 1. Política RLS restrictiva (solo bank_transfer)
-- 2. Foreign Key faltante en buyer_id
-- 3. Índices no-unique permiten duplicados
-- 4. Race condition en process_financing_payment_success
-- 5. Falta función para manejar estados fallidos
-- ============================================================================

-- ================================================================
-- 1. FIX RLS POLICY - Permitir INSERT de todos los métodos de pago
-- ================================================================
DROP POLICY IF EXISTS "financing_payments_buyer_insert" ON financing_payments;

CREATE POLICY "financing_payments_buyer_insert" ON financing_payments
  FOR INSERT WITH CHECK (
    -- Permitir todos los métodos de pago válidos
    payment_method IN ('khipu', 'flow', 'bank_transfer')
    -- ✅ BUG #29: Forzar que solo se puedan crear registros pendientes
    -- Previene que un buyer malicioso inserte registros con payment_status='paid'
    -- (ingeniería social: mostrar pagos falsos en historial)
    AND payment_status = 'pending'
    AND paid_at IS NULL
    -- Y verificar que el buyer_id corresponde al usuario autenticado
    AND buyer_id IN (
      SELECT b.id FROM buyer b WHERE b.user_id = auth.uid()
    )
  );

-- ================================================================
-- 2. ADD FOREIGN KEY - Integridad referencial buyer_id
-- ================================================================
DO $$ BEGIN
  ALTER TABLE financing_payments
    ADD CONSTRAINT fk_financing_payments_buyer
    FOREIGN KEY (buyer_id) REFERENCES buyer(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================
-- 3. UNIQUE INDEXES - Previene duplicados y garantiza webhooks
-- ================================================================
DROP INDEX IF EXISTS idx_financing_payments_khipu;
DROP INDEX IF EXISTS idx_financing_payments_flow;

CREATE UNIQUE INDEX idx_financing_payments_khipu_unique 
  ON financing_payments(khipu_payment_id) 
  WHERE khipu_payment_id IS NOT NULL;

CREATE UNIQUE INDEX idx_financing_payments_flow_token_unique 
  ON financing_payments(flow_token) 
  WHERE flow_token IS NOT NULL;

CREATE UNIQUE INDEX idx_financing_payments_flow_order_unique 
  ON financing_payments(flow_order) 
  WHERE flow_order IS NOT NULL;

-- ================================================================
-- 4. FIX RACE CONDITION - UPDATE atómico en payment success
-- ================================================================
CREATE OR REPLACE FUNCTION process_financing_payment_success(
  p_payment_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_new_amount_used NUMERIC;
  v_previous_amount_used NUMERIC;
  v_current_status TEXT;
BEGIN
  -- ✅ FIX RACE CONDITION #10: Actualizar el pago como exitoso usando UPDATE condicional
  -- Solo actualiza si payment_status = 'pending', garantizando que solo UN webhook procese el pago
  -- Si ya fue procesado, NOT FOUND retorna error automáticamente (idempotencia atómica)
  UPDATE financing_payments
  SET payment_status = 'paid',
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payment_id 
    AND payment_status = 'pending'  -- ✅ CRÍTICO: Solo si está pending (previene doble procesamiento)
  RETURNING * INTO v_payment;
  
  IF NOT FOUND THEN
    -- El pago no existe O ya fue procesado
    -- Verificar cuál es el caso
    SELECT payment_status INTO v_current_status FROM financing_payments WHERE id = p_payment_id;
    IF FOUND THEN
      RETURN jsonb_build_object('error', 'Payment already processed', 'current_status', v_current_status);
    ELSE
      RETURN jsonb_build_object('error', 'Payment not found');
    END IF;
  END IF;
  
  -- Obtener el financiamiento para validación y capturar previous_amount_used
  SELECT amount_used INTO v_previous_amount_used
  FROM financing_requests
  WHERE id = v_payment.financing_request_id;
  
  IF NOT FOUND THEN
    -- ✅ BUG #27: RAISE EXCEPTION en vez de RETURN para forzar rollback transaccional
    -- El pago ya fue marcado como 'paid' arriba; si retornamos sin excepción,
    -- la transacción se commitea y el pago queda 'paid' sin reducir amount_used
    RAISE EXCEPTION 'Financing request % not found for payment %', v_payment.financing_request_id, p_payment_id;
  END IF;
  
  -- ✅ FIX RACE CONDITION: Usar UPDATE atómico con RETURNING
  -- En lugar de READ-MODIFY-WRITE separado que permite race conditions
  UPDATE financing_requests
  SET amount_used = GREATEST(0, amount_used - v_payment.amount),
      updated_at = NOW()
  WHERE id = v_payment.financing_request_id
  RETURNING amount_used INTO v_new_amount_used;
  
  -- ✅ BUG #18 + #27: Verificar que el UPDATE fue exitoso
  -- RAISE EXCEPTION para forzar rollback (pago ya marcado como 'paid')
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update financing_request amount_used for payment %', p_payment_id;
  END IF;
  
  -- Registrar transacción
  -- ✅ BUG #30: DEBE incluir financing_id (NOT NULL en financing_transactions desde migración 20260123)
  INSERT INTO financing_transactions (
    financing_request_id,
    financing_id,
    type,
    amount,
    metadata,
    created_at
  ) VALUES (
    v_payment.financing_request_id,
    v_payment.financing_request_id,  -- financing_id = financing_request_id (misma FK)
    'payment',
    v_payment.amount::numeric,  -- Cast INTEGER to NUMERIC
    jsonb_build_object(
      'description', 'Pago de deuda via ' || v_payment.payment_method,
      'payment_id', p_payment_id,
      'payment_method', v_payment.payment_method
    ),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'amount_paid', v_payment.amount,
    'previous_amount_used', v_previous_amount_used,
    'new_amount_used', v_new_amount_used
  );
END;
$$;

-- ================================================================
-- 5. FUNCIÓN PARA MANEJAR ESTADOS FALLIDOS - Webhooks
-- ================================================================
CREATE OR REPLACE FUNCTION mark_financing_payment_as_failed(
  p_payment_id UUID,
  p_new_status TEXT -- 'failed', 'expired', 'refunded'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_previous_status TEXT;
BEGIN
  -- Validar status
  IF p_new_status NOT IN ('failed', 'expired', 'refunded') THEN
    RETURN jsonb_build_object('error', 'Invalid status. Must be failed, expired, or refunded');
  END IF;
  
  -- ✅ FIX RACE CONDITION: UPDATE atómico solo si está pending
  -- Previene que dos webhooks simultáneos procesen el mismo pago
  UPDATE financing_payments
  SET payment_status = p_new_status,
      updated_at = NOW()
  WHERE id = p_payment_id
    AND payment_status = 'pending'  -- ✅ Solo actualiza si está pending
  RETURNING * INTO v_payment;
  
  IF NOT FOUND THEN
    -- El pago no existe O ya fue procesado
    SELECT payment_status INTO v_previous_status FROM financing_payments WHERE id = p_payment_id;
    IF FOUND THEN
      -- Ya fue procesado (idempotencia)
      RETURN jsonb_build_object(
        'success', true, 
        'already_processed', true,
        'current_status', v_previous_status
      );
    ELSE
      -- No existe
      RETURN jsonb_build_object('error', 'Payment not found');
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', p_payment_id,
    'previous_status', 'pending',
    'new_status', p_new_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION process_financing_payment_success(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION mark_financing_payment_as_failed(UUID, TEXT) TO service_role;

-- ============================================================================
-- RESUMEN DE FIXES APLICADOS:
-- ============================================================================
-- ✅ RLS Policy: Permite INSERT de khipu, flow, bank_transfer
-- ✅ FK buyer_id: Integridad referencial + performance de joins
-- ✅ Índices UNIQUE: Previene duplicados khipu_payment_id/flow_token/flow_order
-- ✅ Race condition: UPDATE atómico con RETURNING en amount_used
-- ✅ Estados fallidos: Función mark_financing_payment_as_failed() para webhooks
-- ============================================================================

-- NOTA: Las Edge Functions ya están modificadas para:
-- - Validar errores DB antes de redirigir usuario
-- - Manejar estados fallidos en webhooks (Flow status 3/4)
-- - Idempotencia mejorada en ambos webhooks
-- ============================================================================
