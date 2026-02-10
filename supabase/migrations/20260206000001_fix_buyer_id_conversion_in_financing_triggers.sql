-- ============================================================================
-- Migration: Fix buyer_id conversion in financing triggers
-- Date: 2026-02-06
-- 
-- Problem: Triggers use order.user_id directly but financing_requests.buyer_id
--          references buyer.id, not auth.users.id
--
-- Solution: Convert order.user_id → buyer.id before querying financing_requests
-- ============================================================================

-- Drop and recreate trigger with buyer_id conversion
DROP FUNCTION IF EXISTS public.create_financing_transaction_on_payment() CASCADE;

CREATE OR REPLACE FUNCTION public.create_financing_transaction_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_financing_request RECORD;
  v_buyer_id uuid;
  v_supplier_id uuid;
  v_user_id_from_items uuid;
  v_items jsonb;
  v_item jsonb;
  v_supplier_financing_map jsonb := '{}'::jsonb;
  v_supplier_order_id uuid;
BEGIN
  IF NEW.payment_status = 'paid' 
     AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')
     AND NEW.financing_amount > 0 THEN
    
    IF EXISTS (
      SELECT 1 FROM public.financing_transactions 
      WHERE metadata->>'order_id' = NEW.id::text 
        AND type = 'consumo'
    ) THEN
      RAISE NOTICE 'Financing transactions already exist for order %, skipping', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Convert order.user_id to buyer.id
    SELECT id INTO v_buyer_id FROM public.buyer WHERE user_id = NEW.user_id;
    
    IF v_buyer_id IS NULL THEN
      RAISE WARNING 'Could not find buyer.id for user_id % in order %', NEW.user_id, NEW.id;
      RETURN NEW;
    END IF;
    
    -- CASE 1: Order has explicit financing_request_id
    IF NEW.financing_request_id IS NOT NULL THEN
      SELECT * INTO v_financing_request
      FROM public.financing_requests
      WHERE id = NEW.financing_request_id
        AND status = 'approved_by_sellsi'
        AND buyer_id = v_buyer_id
      LIMIT 1;
      
      IF FOUND THEN
        UPDATE public.financing_requests
        SET available_amount = GREATEST(0, available_amount - NEW.financing_amount),
            amount_used = COALESCE(amount_used, 0) + NEW.financing_amount,
            updated_at = now()
        WHERE id = NEW.financing_request_id;
        
        v_items := NEW.items;
        v_supplier_financing_map := '{}'::jsonb;
        
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
          BEGIN
            v_user_id_from_items := (v_item->>'supplier_id')::uuid;
            SELECT id INTO v_supplier_id FROM public.supplier WHERE user_id = v_user_id_from_items;
          EXCEPTION WHEN others THEN
            v_supplier_id := NULL;
          END;
          
          IF v_supplier_id IS NULL OR (v_supplier_financing_map ? v_supplier_id::text) THEN
            CONTINUE;
          END IF;
          
          DECLARE
            v_supplier_financing_amount numeric := 0;
            v_temp_item jsonb;
          BEGIN
            FOR v_temp_item IN SELECT * FROM jsonb_array_elements(v_items)
            LOOP
              IF (v_temp_item->>'supplier_id')::uuid = v_user_id_from_items THEN
                v_supplier_financing_amount := v_supplier_financing_amount + 
                  COALESCE((v_temp_item->>'financing_amount')::numeric, 0);
              END IF;
            END LOOP;
            
            IF v_supplier_financing_amount > 0 THEN
              SELECT id INTO v_supplier_order_id
              FROM public.supplier_orders
              WHERE parent_order_id = NEW.id
                AND supplier_id = v_user_id_from_items
              LIMIT 1;
              
              INSERT INTO public.financing_transactions (
                financing_request_id,
                type,
                amount,
                supplier_order_id,
                metadata,
                created_at
              )
              VALUES (
                NEW.financing_request_id,
                'consumo',
                v_supplier_financing_amount,
                v_supplier_order_id,
                jsonb_build_object(
                  'order_id', NEW.id,
                  'supplier_id', v_supplier_id,
                  'payment_status', NEW.payment_status,
                  'paid_at', NEW.paid_at
                ),
                COALESCE(NEW.paid_at, now())
              );
              
              v_supplier_financing_map := v_supplier_financing_map || 
                jsonb_build_object(v_supplier_id::text, true);
            END IF;
          END;
        END LOOP;
        
        RAISE NOTICE 'Created financing_transactions for order % using financing_request % (total: %)', 
          NEW.id, NEW.financing_request_id, NEW.financing_amount;
      ELSE
        RAISE WARNING 'financing_request % not found or not approved for buyer % order %', 
          NEW.financing_request_id, v_buyer_id, NEW.id;
      END IF;
      
    ELSE
      -- CASE 2: No explicit financing_request_id - infer from supplier
      v_items := NEW.items;
      
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
      LOOP
        BEGIN
          v_user_id_from_items := (v_item->>'supplier_id')::uuid;
          SELECT id INTO v_supplier_id FROM public.supplier WHERE user_id = v_user_id_from_items;
        EXCEPTION WHEN others THEN
          v_supplier_id := NULL;
        END;
        
        IF v_supplier_id IS NULL OR (v_supplier_financing_map ? v_supplier_id::text) THEN
          CONTINUE;
        END IF;
        
        SELECT * INTO v_financing_request
        FROM public.financing_requests
        WHERE buyer_id = v_buyer_id
          AND supplier_id = v_supplier_id
          AND status = 'approved_by_sellsi'
          AND (expires_at IS NULL OR expires_at > now())
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF FOUND THEN
          DECLARE
            v_supplier_financing_amount numeric := 0;
            v_temp_item jsonb;
          BEGIN
            FOR v_temp_item IN SELECT * FROM jsonb_array_elements(v_items)
            LOOP
              IF (v_temp_item->>'supplier_id')::uuid = v_user_id_from_items THEN
                v_supplier_financing_amount := v_supplier_financing_amount + 
                  COALESCE((v_temp_item->>'financing_amount')::numeric, 0);
              END IF;
            END LOOP;
            
            IF v_supplier_financing_amount > 0 THEN
              UPDATE public.financing_requests
              SET available_amount = GREATEST(0, available_amount - v_supplier_financing_amount),
                  amount_used = COALESCE(amount_used, 0) + v_supplier_financing_amount,
                  updated_at = now()
              WHERE id = v_financing_request.id;
              
              SELECT id INTO v_supplier_order_id
              FROM public.supplier_orders
              WHERE parent_order_id = NEW.id
                AND supplier_id = v_user_id_from_items
              LIMIT 1;
              
              INSERT INTO public.financing_transactions (
                financing_request_id,
                type,
                amount,
                supplier_order_id,
                metadata,
                created_at
              )
              VALUES (
                v_financing_request.id,
                'consumo',
                v_supplier_financing_amount,
                v_supplier_order_id,
                jsonb_build_object(
                  'order_id', NEW.id,
                  'supplier_id', v_supplier_id,
                  'payment_status', NEW.payment_status,
                  'paid_at', NEW.paid_at
                ),
                COALESCE(NEW.paid_at, now())
              );
              
              v_supplier_financing_map := v_supplier_financing_map || 
                jsonb_build_object(v_supplier_id::text, true);
              
              RAISE NOTICE 'Created financing_transaction for order % supplier % (amount: %)', 
                NEW.id, v_supplier_id, v_supplier_financing_amount;
            END IF;
          END;
        END IF;
      END LOOP;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS trg_create_financing_transaction_on_payment ON public.orders;

CREATE TRIGGER trg_create_financing_transaction_on_payment
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (
    NEW.payment_status = 'paid' 
    AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')
    AND NEW.financing_amount > 0
  )
  EXECUTE FUNCTION public.create_financing_transaction_on_payment();

-- ============================================================================
-- Secondary trigger: Link supplier_order_id after supplier_orders insert
-- ============================================================================

DROP FUNCTION IF EXISTS public.link_financing_transactions_to_supplier_order() CASCADE;

CREATE OR REPLACE FUNCTION public.link_financing_transactions_to_supplier_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_real_supplier_id uuid;
BEGIN
  -- Convert user_id from supplier_orders.supplier_id to real supplier.id
  SELECT id INTO v_real_supplier_id FROM public.supplier WHERE user_id = NEW.supplier_id;
  
  IF v_real_supplier_id IS NULL THEN
    RAISE WARNING 'Could not find supplier.id for user_id % in supplier_order %', NEW.supplier_id, NEW.id;
    RETURN NEW;
  END IF;
  
  -- Update financing_transactions that were created for this order+supplier but don't have supplier_order_id yet
  -- metadata->>'supplier_id' contains the real supplier.id
  UPDATE public.financing_transactions
  SET supplier_order_id = NEW.id
  WHERE supplier_order_id IS NULL
    AND metadata->>'order_id' = NEW.parent_order_id::text
    AND metadata->>'supplier_id' = v_real_supplier_id::text
    AND type = 'consumo';
    
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_financing_transactions ON public.supplier_orders;

CREATE TRIGGER trg_link_financing_transactions
  AFTER INSERT ON public.supplier_orders
  FOR EACH ROW
  WHEN (NEW.financing_amount > 0)
  EXECUTE FUNCTION public.link_financing_transactions_to_supplier_order();

-- ============================================================================
-- Backfill with correct buyer_id conversion
-- ============================================================================

DO $$
DECLARE
  v_order RECORD;
  v_financing_request RECORD;
  v_supplier_rec RECORD;
  v_buyer_id uuid;
  v_supplier_id uuid;
  v_user_id_from_items uuid;
  v_supplier_order_id uuid;
  v_items jsonb;
  v_item jsonb;
  v_supplier_financing_amount numeric;
  v_count integer := 0;
BEGIN
  FOR v_order IN
    SELECT o.*
    FROM public.orders o
    WHERE o.payment_status = 'paid'
      AND o.financing_amount > 0
      AND NOT EXISTS (
        SELECT 1
        FROM public.financing_transactions ft
        WHERE ft.metadata->>'order_id' = o.id::text
      )
    ORDER BY o.paid_at DESC
  LOOP
    v_items := v_order.items;
    
    -- Convert order.user_id to buyer.id
    SELECT id INTO v_buyer_id FROM public.buyer WHERE user_id = v_order.user_id;
    
    IF v_buyer_id IS NULL THEN
      RAISE WARNING 'Could not find buyer.id for user_id % in order %', v_order.user_id, v_order.id;
      CONTINUE;
    END IF;

    FOR v_supplier_rec IN SELECT DISTINCT (item->>'supplier_id')::uuid AS user_id_from_items
                  FROM jsonb_array_elements(v_items) AS item
                  WHERE item->>'supplier_id' IS NOT NULL
    LOOP
      v_user_id_from_items := v_supplier_rec.user_id_from_items;
      
      -- Convert user_id to supplier.id
      SELECT id INTO v_supplier_id FROM public.supplier WHERE user_id = v_user_id_from_items;
      
      IF v_supplier_id IS NULL THEN
        RAISE WARNING 'Could not find supplier.id for user_id % in order %', v_user_id_from_items, v_order.id;
        CONTINUE;
      END IF;

      -- Find financing_request using buyer.id
      SELECT * INTO v_financing_request
      FROM public.financing_requests
      WHERE buyer_id = v_buyer_id
        AND supplier_id = v_supplier_id
        AND status = 'approved_by_sellsi'
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        v_supplier_financing_amount := 0;
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
          IF (v_item->>'supplier_id')::uuid = v_user_id_from_items THEN
            v_supplier_financing_amount := v_supplier_financing_amount + 
              COALESCE((v_item->>'financing_amount')::numeric, 0);
          END IF;
        END LOOP;
        
        IF v_supplier_financing_amount > 0 THEN
          UPDATE public.financing_requests
          SET available_amount = GREATEST(0, available_amount - v_supplier_financing_amount),
              amount_used = COALESCE(amount_used, 0) + v_supplier_financing_amount,
              updated_at = now()
          WHERE id = v_financing_request.id;
          
          SELECT id INTO v_supplier_order_id
          FROM public.supplier_orders
          WHERE parent_order_id = v_order.id
            AND supplier_id = v_user_id_from_items
          LIMIT 1;
          
          INSERT INTO public.financing_transactions (
            financing_request_id,
            type,
            amount,
            supplier_order_id,
            metadata,
            created_at
          )
          VALUES (
            v_financing_request.id,
            'consumo',
            v_supplier_financing_amount,
            v_supplier_order_id,
            jsonb_build_object(
              'order_id', v_order.id,
              'supplier_id', v_supplier_id,
              'payment_status', v_order.payment_status,
              'paid_at', v_order.paid_at,
              'backfilled', true
            ),
            v_order.paid_at
          );
          
          v_count := v_count + 1;
          
          RAISE NOTICE 'Backfilled order % buyer % supplier % amount %', 
            v_order.id, v_buyer_id, v_supplier_id, v_supplier_financing_amount;
        END IF;
      ELSE
        RAISE WARNING 'No approved financing found for order % buyer % supplier %', 
          v_order.id, v_buyer_id, v_supplier_id;
      END IF;
    END LOOP;
  END LOOP;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Backfilled % financing_transaction records for existing paid orders', v_count;
  ELSE
    RAISE NOTICE 'No existing paid orders with financing needed backfilling';
  END IF;
END;
$$;
