-- Migration: Fix stock restoration trigger - remove set-returning function from CASE
-- Date: 2026-01-07
-- Issue: PostgreSQL error "set-returning functions are not allowed in CASE"
-- Solution: Use LATERAL join instead of CASE with jsonb_array_elements
-- Version: 2 (Fixed casting and multi-supplier logic)

-- =====================================================
-- 1. FIX: FUNCIÓN PARA RESTAURAR STOCK EN RECHAZOS (MONO-SUPPLIER)
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
    
    -- ✅ FIX: Usar LATERAL y validación regex para casting seguro
    FOR item_record IN 
      SELECT 
        COALESCE(item_data->>'product_id', item_data->>'productId') as product_id,
        COALESCE(item_data->>'supplier_id', item_data->>'supplierId') as supplier_id,
        CASE
          WHEN item_data->>'quantity' ~ '^\d+$' THEN (item_data->>'quantity')::integer
          WHEN item_data->>'qty' ~ '^\d+$' THEN (item_data->>'qty')::integer
          ELSE 1
        END as quantity
      FROM (
        -- Determinar la estructura de items primero
        SELECT 
          CASE 
            WHEN jsonb_typeof(NEW.items) = 'array' THEN NEW.items
            WHEN NEW.items ? 'items' THEN NEW.items->'items'
            ELSE '[]'::jsonb
          END as items_array
      ) AS items_structure,
      LATERAL jsonb_array_elements(items_array) AS item_data
      WHERE COALESCE(item_data->>'product_id', item_data->>'productId') IS NOT NULL
        AND (
          (item_data->>'quantity' ~ '^\d+$' AND (item_data->>'quantity')::integer > 0)
          OR
          (item_data->>'qty' ~ '^\d+$' AND (item_data->>'qty')::integer > 0)
        )
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
-- 2. FIX: FUNCIÓN PARA RESTAURAR STOCK EN RECHAZOS PARCIALES (MULTI-SUPPLIER)
-- =====================================================

CREATE OR REPLACE FUNCTION public.restore_stock_on_partial_rejection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  item_record record;
  current_stock integer;
  new_stock integer;
  supplier_rejected boolean := false;
  rejected_supplier_id text;
  restoration_log jsonb := '[]'::jsonb;
  restored_suppliers jsonb;
BEGIN
  -- Solo procesar si hay cambios en supplier_parts_meta
  IF NEW.supplier_parts_meta IS DISTINCT FROM OLD.supplier_parts_meta 
     AND NEW.payment_status = 'paid' THEN
    
    -- ✅ FIX: Obtener lista de suppliers ya restaurados
    restored_suppliers := COALESCE(NEW.metadata->'stock_restored_suppliers', '[]'::jsonb);
    
    -- Procesar cada supplier que fue rechazado
    FOR rejected_supplier_id IN 
      SELECT key
      FROM jsonb_each(NEW.supplier_parts_meta)
      WHERE (value->>'status') = 'rejected'
        AND COALESCE((OLD.supplier_parts_meta->key->>'status'), 'pending') != 'rejected'
        AND NOT (restored_suppliers @> jsonb_build_array(key))  -- Solo si NO fue restaurado antes
    LOOP
      supplier_rejected := true;
      
      -- ✅ FIX: Usar LATERAL y validación regex para casting seguro
      FOR item_record IN 
        SELECT 
          COALESCE(item_data->>'product_id', item_data->>'productId') as product_id,
          COALESCE(item_data->>'supplier_id', item_data->>'supplierId') as supplier_id,
          CASE
            WHEN item_data->>'quantity' ~ '^\d+$' THEN (item_data->>'quantity')::integer
            WHEN item_data->>'qty' ~ '^\d+$' THEN (item_data->>'qty')::integer
            ELSE 1
          END as quantity
        FROM (
          -- Determinar la estructura de items primero
          SELECT 
            CASE 
              WHEN jsonb_typeof(NEW.items) = 'array' THEN NEW.items
              WHEN NEW.items ? 'items' THEN NEW.items->'items'
              ELSE '[]'::jsonb
            END as items_array
        ) AS items_structure,
        LATERAL jsonb_array_elements(items_array) AS item_data
        WHERE COALESCE(item_data->>'supplier_id', item_data->>'supplierId') = rejected_supplier_id
          AND COALESCE(item_data->>'product_id', item_data->>'productId') IS NOT NULL
          AND (
            (item_data->>'quantity' ~ '^\d+$' AND (item_data->>'quantity')::integer > 0)
            OR
            (item_data->>'qty' ~ '^\d+$' AND (item_data->>'qty')::integer > 0)
          )
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
      
      -- ✅ FIX: Agregar supplier al array de restaurados
      restored_suppliers := restored_suppliers || jsonb_build_array(rejected_supplier_id);
    END LOOP;
    
    -- Actualizar metadata si hubo restauraciones
    IF supplier_rejected AND jsonb_array_length(restoration_log) > 0 THEN
      NEW.metadata := COALESCE(NEW.metadata, '{}'::jsonb) || jsonb_build_object(
        'stock_restored_suppliers', restored_suppliers,
        'partial_stock_restored_at', now(),
        'partial_restoration_log', COALESCE(NEW.metadata->'partial_restoration_log', '[]'::jsonb) || restoration_log
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. COMENTARIOS Y VALIDACIÓN
-- =====================================================

COMMENT ON FUNCTION public.restore_stock_on_order_rejection() IS 
'Restaura stock cuando una orden mono-supplier pagada es rechazada. Fixed: removed set-returning function from CASE (2026-01-07)';

COMMENT ON FUNCTION public.restore_stock_on_partial_rejection() IS 
'Restaura stock cuando un supplier en orden multi-supplier pagada es rechazado. Fixed: removed set-returning function from CASE (2026-01-07)';
