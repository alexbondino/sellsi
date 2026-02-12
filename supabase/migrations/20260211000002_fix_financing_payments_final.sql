-- ============================================================================
-- FIX FINAL: Correcciones críticas descubiertas en revisión post-push
-- Fecha: 2026-02-11
-- Aplica sobre: 20260211000001_fix_financing_payments_insert_policy.sql
-- ============================================================================

-- ================================================================
-- BUG #29: RLS INSERT policy debe forzar payment_status='pending'
-- ================================================================
-- Previene que un buyer malicioso inserte registros con payment_status='paid'
-- desde la consola del navegador (ingeniería social con pagos falsos)

DROP POLICY IF EXISTS "financing_payments_buyer_insert" ON financing_payments;

CREATE POLICY "financing_payments_buyer_insert" ON financing_payments
  FOR INSERT WITH CHECK (
    -- Permitir todos los métodos de pago válidos
    payment_method IN ('khipu', 'flow', 'bank_transfer')
    -- ✅ BUG #29: Forzar que solo se puedan crear registros pendientes
    AND payment_status = 'pending'
    AND paid_at IS NULL
    -- Y verificar que el buyer_id corresponde al usuario autenticado
    AND buyer_id IN (
      SELECT b.id FROM buyer b WHERE b.user_id = auth.uid()
    )
  );

-- ================================================================
-- BUG #30: INSERT en financing_transactions faltaba columna financing_id
-- ================================================================
-- La columna financing_id es NOT NULL desde migración 20260123090000
-- Sin este fix, TODOS los pagos de financiamiento fallan con constraint violation

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

-- Asegurar permisos (idempotente)
GRANT EXECUTE ON FUNCTION process_financing_payment_success(UUID) TO service_role;

-- ============================================================================
-- RESUMEN DE FIXES APLICADOS EN ESTA MIGRACIÓN:
-- ============================================================================
-- ✅ BUG #29: RLS INSERT policy fuerza payment_status='pending' y paid_at IS NULL
-- ✅ BUG #30: INSERT en financing_transactions incluye financing_id (NOT NULL)
-- ============================================================================
-- NOTA: BUG #32 (Khipu webhook amount guard) se corrige en edge function deployment
-- ============================================================================
