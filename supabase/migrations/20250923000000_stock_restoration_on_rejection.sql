-- Migration: Restauración automática de stock cuando orden pagada es rechazada
-- Timestamp: 2025-09-23 00:00:00
-- Handles: Stock restoration for both mono-supplier and multi-supplier orders

-- =====================================================
-- 1. FUNCIÓN PARA RESTAURAR STOCK EN RECHAZOS
-- =====================================================

CREATE OR REPLACE FUNCTION public.restore_stock_on_order_rejection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  item_record record;
  current_stock integer;
  new_stock integer;
  restoration_log jsonb := '[]'::jsonb;
  already_restored boolean := false;
BEGIN
  -- Solo procesar si:
  -- 1. El status cambió a 'rejected'
  -- 2. La orden tenía payment_status = 'paid'
  -- 3. El status anterior NO era 'rejected' (para evitar doble restauración)
  IF NEW.status = 'rejected' 
     AND NEW.payment_status = 'paid' 
     AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    
    -- Verificar si ya se restauró stock previamente (usando metadata)
    already_restored := COALESCE(NEW.metadata->>'stock_restored', 'false')::boolean;
    
    IF already_restored THEN
      -- Log: ya se restauró antes, no hacer nada
      RAISE NOTICE 'Stock already restored for order %, skipping', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Obtener items de la orden (parsear JSON si es necesario)
    FOR item_record IN 
      SELECT 
        COALESCE(item->>'product_id', item->>'productId') as product_id,
        COALESCE(item->>'supplier_id', item->>'supplierId') as supplier_id,
        COALESCE((item->>'quantity')::integer, (item->>'qty')::integer, 1) as quantity
      FROM (
        SELECT 
          CASE 
            WHEN jsonb_typeof(NEW.items) = 'array' THEN jsonb_array_elements(NEW.items)
            ELSE jsonb_array_elements(NEW.items->'items')
          END as item
      ) items_expanded
      WHERE COALESCE(item->>'product_id', item->>'productId') IS NOT NULL
        AND COALESCE((item->>'quantity')::integer, (item->>'qty')::integer, 0) > 0
    LOOP
      BEGIN
        -- Obtener stock actual del producto
        SELECT productqty INTO current_stock 
        FROM products 
        WHERE productid = item_record.product_id::uuid;
        
        IF FOUND THEN
          -- Calcular nuevo stock (restaurar la cantidad que se había descontado)
          new_stock := COALESCE(current_stock, 0) + item_record.quantity;
          
          -- Actualizar stock del producto
          UPDATE products 
          SET 
            productqty = new_stock,
            updateddt = now()
          WHERE productid = item_record.product_id::uuid;
          
          -- Registrar en log de restauración
          restoration_log := restoration_log || jsonb_build_object(
            'product_id', item_record.product_id,
            'supplier_id', item_record.supplier_id,
            'quantity_restored', item_record.quantity,
            'stock_before', current_stock,
            'stock_after', new_stock,
            'restored_at', now()
          );
          
          RAISE NOTICE 'Restored % units for product %. Stock: % → %', 
            item_record.quantity, item_record.product_id, current_stock, new_stock;
        ELSE
          RAISE WARNING 'Product % not found during stock restoration', item_record.product_id;
        END IF;
        
      EXCEPTION WHEN OTHERS THEN
        -- Log error pero continuar con otros productos
        RAISE WARNING 'Error restoring stock for product %: %', item_record.product_id, SQLERRM;
      END;
    END LOOP;
    
    -- Marcar en metadata que el stock fue restaurado
    NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
      'stock_restored', true,
      'stock_restored_at', now(),
      'stock_restoration_log', restoration_log
    );
    
    RAISE NOTICE 'Stock restoration completed for order %. Restored % products', 
      NEW.id, jsonb_array_length(restoration_log);
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 2. TRIGGER PARA ÓRDENES GLOBALES (MONO-SUPPLIER)
-- =====================================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_restore_stock_on_rejection ON public.orders;

-- Create trigger for orders table
CREATE TRIGGER trg_restore_stock_on_rejection
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.status = 'rejected' AND NEW.payment_status = 'paid')
  EXECUTE FUNCTION public.restore_stock_on_order_rejection();

-- =====================================================
-- 3. FUNCIÓN PARA RESTAURAR STOCK EN RECHAZOS PARCIALES
-- =====================================================

CREATE OR REPLACE FUNCTION public.restore_stock_on_partial_rejection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  item_record record;
  current_stock integer;
  new_stock integer;
  supplier_rejected boolean := false;
  order_payment_status text;
  already_restored boolean := false;
  restoration_log jsonb := '[]'::jsonb;
BEGIN
  -- Solo procesar si hay cambios en supplier_parts_meta
  IF NEW.supplier_parts_meta IS DISTINCT FROM OLD.supplier_parts_meta 
     AND NEW.payment_status = 'paid' THEN
    
    -- Verificar si algún supplier fue rechazado
    FOR supplier_rejected IN 
      SELECT (value->>'status') = 'rejected' as is_rejected
      FROM jsonb_each(NEW.supplier_parts_meta)
    LOOP
      IF supplier_rejected THEN
        -- Verificar que no estaba rechazado antes
        SELECT NOT COALESCE(
          (OLD.supplier_parts_meta->key->>'status') = 'rejected', 
          false
        ) INTO supplier_rejected
        FROM jsonb_each(NEW.supplier_parts_meta)
        WHERE (value->>'status') = 'rejected'
        LIMIT 1;
        
        EXIT; -- Salir del loop si encontramos un rechazo
      END IF;
    END LOOP;
    
    -- Si hay un supplier recién rechazado y el pago está confirmado
    IF supplier_rejected AND NEW.payment_status = 'paid' THEN
      
      -- Verificar si ya se restauró stock
      already_restored := COALESCE(NEW.metadata->>'partial_stock_restored', 'false')::boolean;
      
      IF already_restored THEN
        RAISE NOTICE 'Partial stock already restored for order %, skipping', NEW.id;
        RETURN NEW;
      END IF;
      
      -- Procesar cada supplier rechazado
      FOR supplier_rejected IN
        SELECT 
          key as supplier_id,
          value->>'status' as status,
          COALESCE((OLD.supplier_parts_meta->key->>'status'), 'pending') as old_status
        FROM jsonb_each(NEW.supplier_parts_meta)
        WHERE (value->>'status') = 'rejected' 
          AND COALESCE((OLD.supplier_parts_meta->key->>'status'), 'pending') != 'rejected'
      LOOP
        -- Restaurar stock solo para items de suppliers rechazados
        FOR item_record IN 
          SELECT 
            COALESCE(item->>'product_id', item->>'productId') as product_id,
            COALESCE(item->>'supplier_id', item->>'supplierId') as supplier_id,
            COALESCE((item->>'quantity')::integer, (item->>'qty')::integer, 1) as quantity
          FROM (
            SELECT 
              CASE 
                WHEN jsonb_typeof(NEW.items) = 'array' THEN jsonb_array_elements(NEW.items)
                ELSE jsonb_array_elements(NEW.items->'items')
              END as item
          ) items_expanded
          WHERE COALESCE(item->>'supplier_id', item->>'supplierId') = supplier_rejected
            AND COALESCE(item->>'product_id', item->>'productId') IS NOT NULL
            AND COALESCE((item->>'quantity')::integer, (item->>'qty')::integer, 0) > 0
        LOOP
          BEGIN
            -- Obtener stock actual
            SELECT productqty INTO current_stock 
            FROM products 
            WHERE productid = item_record.product_id::uuid;
            
            IF FOUND THEN
              new_stock := COALESCE(current_stock, 0) + item_record.quantity;
              
              -- Restaurar stock
              UPDATE products 
              SET 
                productqty = new_stock,
                updateddt = now()
              WHERE productid = item_record.product_id::uuid;
              
              -- Log de restauración
              restoration_log := restoration_log || jsonb_build_object(
                'product_id', item_record.product_id,
                'supplier_id', item_record.supplier_id,
                'quantity_restored', item_record.quantity,
                'stock_before', current_stock,
                'stock_after', new_stock,
                'restored_at', now(),
                'reason', 'partial_supplier_rejection'
              );
              
              RAISE NOTICE 'Restored % units for product % (supplier % rejected)', 
                item_record.quantity, item_record.product_id, item_record.supplier_id;
            END IF;
            
          EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error in partial stock restoration for product %: %', 
              item_record.product_id, SQLERRM;
          END;
        END LOOP;
      END LOOP;
      
      -- Marcar como restaurado parcialmente
      NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
        'partial_stock_restored', true,
        'partial_stock_restored_at', now(),
        'partial_restoration_log', restoration_log
      );
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. TRIGGER PARA RECHAZOS PARCIALES (MULTI-SUPPLIER)
-- =====================================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trg_restore_stock_on_partial_rejection ON public.orders;

-- Create trigger for partial rejections
CREATE TRIGGER trg_restore_stock_on_partial_rejection
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  WHEN (NEW.supplier_parts_meta IS DISTINCT FROM OLD.supplier_parts_meta 
        AND NEW.payment_status = 'paid')
  EXECUTE FUNCTION public.restore_stock_on_partial_rejection();

-- =====================================================
-- 5. ÍNDICES DE SOPORTE (PERFORMANCE)
-- =====================================================

-- Índice para consultas de productos por ID (si no existe)
CREATE INDEX IF NOT EXISTS idx_products_productid ON public.products(productid);

-- Índice para orders con payment_status y status (para triggers)
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_status 
ON public.orders(payment_status, status) 
WHERE payment_status = 'paid';

-- =====================================================
-- 6. COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON FUNCTION public.restore_stock_on_order_rejection() IS 
'Restaura automáticamente el stock cuando una orden pagada es rechazada completamente';

COMMENT ON FUNCTION public.restore_stock_on_partial_rejection() IS 
'Restaura el stock de productos cuando un supplier específico rechaza su parte de una orden multi-supplier';

COMMENT ON TRIGGER trg_restore_stock_on_rejection ON public.orders IS 
'Trigger que restaura stock cuando orders.status cambia a rejected para órdenes pagadas';

COMMENT ON TRIGGER trg_restore_stock_on_partial_rejection ON public.orders IS 
'Trigger que restaura stock cuando un supplier rechaza su parte en supplier_parts_meta';

-- =====================================================
-- 7. SEGURIDAD Y PERMISOS
-- =====================================================

-- Las funciones usan SECURITY DEFINER para ejecutarse con permisos del creador
-- Esto permite que las funciones actualicen products sin requerir permisos adicionales

-- =====================================================
-- 8. TESTING Y VALIDACIÓN
-- =====================================================

-- Para testear la migración, se puede usar:
-- 
-- 1. Crear orden de prueba con payment_status = 'paid'
-- 2. Cambiar status a 'rejected'
-- 3. Verificar que productqty se incrementó
-- 4. Verificar metadata->stock_restored = true
-- 
-- SELECT metadata FROM orders WHERE id = 'test-order-id';

-- END OF MIGRATION