-- ============================================================================
-- MIGRATION: CREATE PAYMENT METHODS CONFIG TABLE
-- Descripción: Tabla para gestionar la configuración de métodos de pago
-- Fecha: 2026-01-05
-- ============================================================================

-- Crear tabla payment_methods_config
CREATE TABLE IF NOT EXISTS payment_methods_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  khipu_enabled BOOLEAN NOT NULL DEFAULT false,
  flow_enabled BOOLEAN NOT NULL DEFAULT true,
  bank_transfer_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint para asegurar que solo hay una fila de configuración
  CONSTRAINT single_config_row CHECK (id = 1)
);

-- Insertar configuración por defecto
INSERT INTO payment_methods_config (id, khipu_enabled, flow_enabled, bank_transfer_enabled)
VALUES (1, false, true, true)
ON CONFLICT (id) DO NOTHING;

-- Crear trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_payment_methods_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_methods_config_updated_at
BEFORE UPDATE ON payment_methods_config
FOR EACH ROW
EXECUTE FUNCTION update_payment_methods_config_updated_at();

-- RLS Policies
ALTER TABLE payment_methods_config ENABLE ROW LEVEL SECURITY;

-- Permitir lectura anónima para el frontend (necesario para cargar métodos de pago disponibles)
CREATE POLICY "Public can view payment methods config"
  ON payment_methods_config
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Los admins autenticados pueden actualizar la configuración
-- Nota: La validación de admin se hace a nivel de aplicación ya que control_panel_users
-- no está vinculado a auth.users (sistema de auth separado)
CREATE POLICY "Authenticated users can update payment methods config"
  ON payment_methods_config
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE payment_methods_config IS 'Configuración global de métodos de pago habilitados en la plataforma';
COMMENT ON COLUMN payment_methods_config.khipu_enabled IS 'Indica si Khipu está habilitado como método de pago';
COMMENT ON COLUMN payment_methods_config.flow_enabled IS 'Indica si Flow está habilitado como método de pago';
COMMENT ON COLUMN payment_methods_config.bank_transfer_enabled IS 'Indica si Transferencia Manual está habilitada';

-- ============================================================================
-- PARTE 2: PAYMENT STATUS CONSTRAINT Y AUDITORÍA
-- ============================================================================

-- Agregar constraint para payment_status (valores permitidos)
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check
  CHECK (payment_status IN ('pending', 'paid', 'rejected', 'expired', 'refunded'));

-- Agregar columnas de auditoría para pagos manuales
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_reviewed_by UUID REFERENCES control_panel_users(id),
  ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;

-- Índice optimizado para consultas de pagos pendientes
CREATE INDEX IF NOT EXISTS idx_orders_bank_transfer_pending 
  ON orders(payment_method, payment_status, created_at DESC)
  WHERE payment_method = 'bank_transfer' AND payment_status = 'pending';

-- Comentarios
COMMENT ON COLUMN orders.payment_reviewed_at IS 'Timestamp cuando admin revisó el pago manual (transferencia bancaria)';
COMMENT ON COLUMN orders.payment_reviewed_by IS 'ID del admin que aprobó o rechazó el pago manual';
COMMENT ON COLUMN orders.payment_rejection_reason IS 'Razón proporcionada por el admin al rechazar el pago';

-- ============================================================================
-- PARTE 3: RPC FUNCTIONS PARA APROBAR/RECHAZAR PAGOS
-- ============================================================================

-- Function: Aprobar pago manual (admin only)
CREATE OR REPLACE FUNCTION approve_bank_transfer_payment(
  p_order_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_payment_method TEXT;
  v_order_payment_status TEXT;
  v_updated_order JSONB;
BEGIN
  -- Verificar que el admin existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = p_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Admin no válido o inactivo';
  END IF;

  -- Obtener datos actuales de la orden
  SELECT payment_method, payment_status
  INTO v_order_payment_method, v_order_payment_status
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: Orden no existe';
  END IF;

  -- Validar que es transferencia bancaria
  IF v_order_payment_method != 'bank_transfer' THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD: Solo se pueden aprobar transferencias bancarias';
  END IF;

  -- Validar que está pendiente
  IF v_order_payment_status != 'pending' THEN
    RAISE EXCEPTION 'INVALID_STATUS: El pago ya fue procesado (estado: %)', v_order_payment_status;
  END IF;

  -- Actualizar orden
  UPDATE orders
  SET 
    payment_status = 'paid',
    paid_at = NOW(),
    payment_reviewed_at = NOW(),
    payment_reviewed_by = p_admin_id,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING to_jsonb(orders.*) INTO v_updated_order;

  -- Log de auditoría
  INSERT INTO admin_audit_log (admin_id, action, target_id, details)
  VALUES (
    p_admin_id,
    'approve_bank_transfer_payment',
    p_order_id,
    jsonb_build_object(
      'previous_status', v_order_payment_status,
      'new_status', 'paid',
      'timestamp', NOW()
    )
  );

  RETURN v_updated_order;
END;
$$;

-- Function: Rechazar pago manual (admin only)
CREATE OR REPLACE FUNCTION reject_bank_transfer_payment(
  p_order_id UUID,
  p_admin_id UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_payment_method TEXT;
  v_order_payment_status TEXT;
  v_updated_order JSONB;
BEGIN
  -- Verificar admin
  IF NOT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = p_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: Admin no válido o inactivo';
  END IF;

  -- Obtener datos actuales
  SELECT payment_method, payment_status
  INTO v_order_payment_method, v_order_payment_status
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: Orden no existe';
  END IF;

  -- Validaciones
  IF v_order_payment_method != 'bank_transfer' THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD: Solo se pueden rechazar transferencias bancarias';
  END IF;

  IF v_order_payment_status != 'pending' THEN
    RAISE EXCEPTION 'INVALID_STATUS: El pago ya fue procesado (estado: %)', v_order_payment_status;
  END IF;

  -- Actualizar orden
  UPDATE orders
  SET 
    payment_status = 'rejected',
    payment_reviewed_at = NOW(),
    payment_reviewed_by = p_admin_id,
    payment_rejection_reason = p_rejection_reason,
    updated_at = NOW()
  WHERE id = p_order_id
  RETURNING to_jsonb(orders.*) INTO v_updated_order;

  -- Log de auditoría
  INSERT INTO admin_audit_log (admin_id, action, target_id, details)
  VALUES (
    p_admin_id,
    'reject_bank_transfer_payment',
    p_order_id,
    jsonb_build_object(
      'previous_status', v_order_payment_status,
      'new_status', 'rejected',
      'reason', p_rejection_reason,
      'timestamp', NOW()
    )
  );

  RETURN v_updated_order;
END;
$$;

-- Permisos para las funciones
GRANT EXECUTE ON FUNCTION approve_bank_transfer_payment TO authenticated;
GRANT EXECUTE ON FUNCTION reject_bank_transfer_payment TO authenticated;

COMMENT ON FUNCTION approve_bank_transfer_payment IS 'Aprueba un pago por transferencia bancaria (solo admins)';
COMMENT ON FUNCTION reject_bank_transfer_payment IS 'Rechaza un pago por transferencia bancaria con razón opcional (solo admins)';

-- ============================================================================
-- PARTE 4: TRIGGER PARA NOTIFICACIONES
-- ============================================================================

-- Function: Notificar al comprador cuando cambia payment_status
CREATE OR REPLACE FUNCTION notify_buyer_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Solo ejecutar si payment_status cambió
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    
    -- Pago aprobado
    IF NEW.payment_status = 'paid' AND OLD.payment_status = 'pending' THEN
      INSERT INTO notifications (
        user_id,
        order_id,
        type,
        order_status,
        role_context,
        context_section,
        title,
        body,
        metadata
      ) VALUES (
        NEW.user_id,
        NEW.id,
        'payment_confirmed',
        NEW.status,
        'buyer',
        'orders',
        '✅ Pago Confirmado',
        'Tu transferencia bancaria ha sido verificada y confirmada. Tu pedido está siendo procesado.',
        jsonb_build_object(
          'payment_method', NEW.payment_method,
          'total', NEW.grand_total
        )
      );
    
    -- Pago rechazado
    ELSIF NEW.payment_status = 'rejected' THEN
      INSERT INTO notifications (
        user_id,
        order_id,
        type,
        order_status,
        role_context,
        context_section,
        title,
        body,
        metadata
      ) VALUES (
        NEW.user_id,
        NEW.id,
        'payment_rejected',
        NEW.status,
        'buyer',
        'orders',
        '❌ Pago No Confirmado',
        COALESCE(
          'Tu transferencia no pudo ser verificada. Razón: ' || NEW.payment_rejection_reason,
          'Tu transferencia no pudo ser verificada. Por favor contacta a soporte.'
        ),
        jsonb_build_object(
          'payment_method', NEW.payment_method,
          'rejection_reason', NEW.payment_rejection_reason
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger
DROP TRIGGER IF EXISTS on_payment_status_change ON orders;

CREATE TRIGGER on_payment_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION notify_buyer_payment_status_change();

COMMENT ON FUNCTION notify_buyer_payment_status_change IS 'Envía notificación al comprador cuando cambia el estado de su pago';
