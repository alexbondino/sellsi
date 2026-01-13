-- ============================================================================
-- MIGRATION: Fix Payment Rejection Complete
-- Descripción: Corrige el rechazo de transferencias bancarias para que:
--   1. Cancele automáticamente la orden (consistente con expired)
--   2. Propague el estado 'cancelled' a todas las supplier_orders
--   3. NO notifica a proveedores (nunca se enteraron del pedido sin pago confirmado)
-- Fecha: 2026-01-09
-- ============================================================================

BEGIN;

-- ============================================================================
-- PARTE 1: TRIGGER PARA PROPAGAR STATUS A SUPPLIER_ORDERS
-- ============================================================================

-- Function: Sincronizar status de parent order a supplier_orders
CREATE OR REPLACE FUNCTION sync_supplier_orders_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo ejecutar si el status cambió
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Si la orden padre se cancela, cancelar todas las supplier_orders
    IF NEW.status = 'cancelled' THEN
      UPDATE supplier_orders
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE parent_order_id = NEW.id
        AND status NOT IN ('cancelled', 'delivered');  -- No sobrescribir entregados
    
    -- Si la orden padre es aceptada, propagar a supplier_orders pendientes
    ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
      UPDATE supplier_orders
      SET 
        status = 'accepted',
        updated_at = NOW()
      WHERE parent_order_id = NEW.id
        AND status = 'pending';
    
    -- Si la orden padre es rechazada (edge case), propagar
    ELSIF NEW.status = 'rejected' THEN
      UPDATE supplier_orders
      SET 
        status = 'rejected',
        updated_at = NOW()
      WHERE parent_order_id = NEW.id
        AND status NOT IN ('cancelled', 'rejected', 'delivered');
    END IF;
  END IF;
  
  -- Propagar payment_status a supplier_orders cuando cambie
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    UPDATE supplier_orders
    SET 
      payment_status = NEW.payment_status,
      updated_at = NOW()
    WHERE parent_order_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Crear trigger para sincronización automática
DROP TRIGGER IF EXISTS sync_supplier_orders_on_order_status_change ON orders;

CREATE TRIGGER sync_supplier_orders_on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (
    OLD.status IS DISTINCT FROM NEW.status OR 
    OLD.payment_status IS DISTINCT FROM NEW.payment_status
  )
  EXECUTE FUNCTION sync_supplier_orders_status();

COMMENT ON FUNCTION sync_supplier_orders_status IS 
  'Propaga cambios de status y payment_status de orders a supplier_orders. Garantiza consistencia en órdenes mono y multi-supplier.';

-- ============================================================================
-- PARTE 2: MODIFICAR reject_bank_transfer_payment PARA CANCELAR ORDEN
-- ============================================================================

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
  v_admin_exists BOOLEAN;
BEGIN
  -- Validar que el admin existe y está activo
  SELECT EXISTS(
    SELECT 1 FROM control_panel_users
    WHERE id = p_admin_id AND is_active = true
  ) INTO v_admin_exists;

  IF NOT v_admin_exists THEN
    RAISE EXCEPTION 'INVALID_ADMIN: Admin no existe o no está activo';
  END IF;

  -- Validar que la orden existe y obtener datos
  SELECT payment_method, payment_status
  INTO v_order_payment_method, v_order_payment_status
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: No se encontró la orden con ID %', p_order_id;
  END IF;

  -- Validaciones
  IF v_order_payment_method != 'bank_transfer' THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD: Solo se pueden rechazar transferencias bancarias';
  END IF;

  IF v_order_payment_status != 'pending' THEN
    RAISE EXCEPTION 'INVALID_STATUS: El pago ya fue procesado (estado: %)', v_order_payment_status;
  END IF;

  -- Actualizar orden: cambiar payment_status Y status
  -- Nota: NO se notifica a proveedores porque nunca recibieron notificación de este pedido
  -- (solo se notifica cuando payment_status=paid)
  UPDATE orders
  SET 
    payment_status = 'rejected',
    status = 'cancelled',                           -- ✅ Cancelar orden
    cancelled_at = NOW(),                           -- ✅ Timestamp cancelación
    cancellation_reason = COALESCE(                 -- ✅ Razón de cancelación
      p_rejection_reason,
      'Transferencia bancaria rechazada por administrador'
    ),
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
      'previous_payment_status', v_order_payment_status,
      'new_payment_status', 'rejected',
      'new_status', 'cancelled',
      'reason', p_rejection_reason,
      'timestamp', NOW()
    )
  );

  RETURN v_updated_order;
END;
$$;

COMMENT ON FUNCTION reject_bank_transfer_payment IS 
  'Rechaza una transferencia bancaria y cancela la orden. NO notifica a proveedores (nunca recibieron notificación del pedido). Propaga estado a supplier_orders vía trigger.';

-- Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION reject_bank_transfer_payment TO authenticated;

-- ============================================================================
-- PARTE 3: BACKFILL - CANCELAR ÓRDENES REJECTED EXISTENTES
-- ============================================================================

-- Identificar y corregir órdenes en estado inconsistente
DO $$
DECLARE
  v_affected_orders INTEGER := 0;
BEGIN
  -- Paso 1: Cancelar órdenes con payment_status=rejected pero status!=cancelled
  UPDATE orders
  SET 
    status = 'cancelled',
    cancelled_at = COALESCE(cancelled_at, updated_at),
    cancellation_reason = COALESCE(
      cancellation_reason,
      'Transferencia bancaria rechazada (corregido automáticamente)'
    ),
    updated_at = NOW()
  WHERE payment_status = 'rejected'
    AND payment_method = 'bank_transfer'
    AND status != 'cancelled';
  
  GET DIAGNOSTICS v_affected_orders = ROW_COUNT;
  
  IF v_affected_orders > 0 THEN
    RAISE NOTICE 'BACKFILL: % órdenes corregidas (rejected -> cancelled)', v_affected_orders;
    RAISE NOTICE 'BACKFILL: supplier_orders se sincronizarán automáticamente vía trigger';
  END IF;

  -- Nota: NO necesitamos actualizar supplier_orders manualmente.
  -- El trigger sync_supplier_orders_on_order_status_change ya propagó
  -- los cambios cuando actualizamos orders.status en el Paso 1.
END $$;

COMMIT;
