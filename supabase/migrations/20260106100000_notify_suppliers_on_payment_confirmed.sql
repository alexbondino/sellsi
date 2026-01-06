-- ============================================================================
-- Migration: Notify suppliers when payment is confirmed
-- Purpose: Extend payment status notification to also notify suppliers when
--          payment_status changes to 'paid'. This fixes the issue where suppliers
--          don't receive notifications for manually approved bank transfers.
-- Date: 2026-01-06
-- ============================================================================

BEGIN;

-- Replace function to add supplier notification logic
CREATE OR REPLACE FUNCTION notify_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_supplier_id UUID;
  v_supplier_ids UUID[];
BEGIN
  -- Only execute if payment_status changed
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    
    -- Payment approved (pending -> paid)
    IF NEW.payment_status = 'paid' AND OLD.payment_status = 'pending' THEN
      
      -- ========== NOTIFY BUYER ==========
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
      
      -- ========== NOTIFY SUPPLIERS ==========
      -- Extract unique supplier_ids from order items
      v_items := NEW.items;
      v_supplier_ids := ARRAY[]::UUID[];
      
      IF v_items IS NOT NULL AND jsonb_typeof(v_items) = 'array' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
          -- Extract supplier_id from item
          BEGIN
            v_supplier_id := (v_item->>'supplier_id')::UUID;
          EXCEPTION WHEN others THEN
            v_supplier_id := NULL;
          END;
          
          -- Only notify each supplier once (avoid duplicates if they have multiple products)
          IF v_supplier_id IS NOT NULL AND NOT (v_supplier_id = ANY(v_supplier_ids)) THEN
            -- Add to array to track notified suppliers
            v_supplier_ids := array_append(v_supplier_ids, v_supplier_id);
            
            -- Create notification for supplier
            INSERT INTO notifications (
              user_id,
              supplier_id,
              order_id,
              type,
              order_status,
              role_context,
              context_section,
              title,
              body,
              metadata
            ) VALUES (
              v_supplier_id,  -- user_id = supplier (notification recipient)
              v_supplier_id,  -- supplier_id (who sells)
              NEW.id,
              'order_new',
              'paid',
              'supplier',
              'supplier_orders',
              'Nuevo pedido pagado',
              'Tienes productos listos para despacho.',
              jsonb_build_object(
                'buyer_id', NEW.user_id,
                'payment_method', NEW.payment_method,
                'total', NEW.grand_total
              )
            );
          END IF;
        END LOOP;
      END IF;
    
    -- Payment rejected
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

-- Recreate trigger to use updated function
DROP TRIGGER IF EXISTS on_payment_status_change ON orders;

CREATE TRIGGER on_payment_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  EXECUTE FUNCTION notify_payment_status_change();

COMMENT ON FUNCTION notify_payment_status_change IS 
  'Sends notification to buyer when payment_status changes. When payment_status becomes paid, also notifies all suppliers of the order items. This ensures suppliers receive order notifications for all payment methods (khipu, flow, bank_transfer).';

COMMIT;
