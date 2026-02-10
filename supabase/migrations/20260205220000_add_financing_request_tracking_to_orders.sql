-- Migration: Add financing_request_id tracking and automatic transaction creation
-- Date: 2026-02-05 22:00:00
-- Description:
--   1. Add financing_request_id column to orders table
--   2. Create trigger to automatically create financing_transactions when orders are paid with financing
--   3. This fixes the issue where financing is used but available_amount is not decremented

BEGIN;

-- ============================================================================
-- PART 1: Add financing_request_id to orders table
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS financing_request_id uuid REFERENCES public.financing_requests(id);

COMMENT ON COLUMN public.orders.financing_request_id IS 
  'FK to financing_requests table. Tracks which financing line was used for this order. Added 2026-02-05 to enable automatic transaction creation.';

-- Create index for lookups
CREATE INDEX IF NOT EXISTS idx_orders_financing_request 
  ON public.orders(financing_request_id) 
  WHERE financing_request_id IS NOT NULL;

-- ============================================================================
-- PART 2: Create trigger function to auto-create financing transactions
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_financing_transaction_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_financing_request RECORD;
  v_supplier_id uuid;
  v_items jsonb;
  v_item jsonb;
  v_supplier_financing_map jsonb := '{}'::jsonb;
  v_supplier_order_id uuid;
BEGIN
  -- Only execute when payment_status changes to 'paid' and there's financing involved
  -- NEW.payment_status = 'paid' (NEW STATE)
  -- OLD.payment_status != 'paid' (PREVIOUS STATE - ensure we only fire ONCE)
  -- NEW.financing_amount > 0 (ORDER HAS FINANCING)
  IF NEW.payment_status = 'paid' 
     AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')
     AND NEW.financing_amount > 0 THEN
    
    -- Safety check: Prevent duplicate transactions if trigger fires multiple times
    IF EXISTS (
      SELECT 1 FROM public.financing_transactions 
      WHERE metadata->>'order_id' = NEW.id::text 
        AND type = 'consumo'
        AND is_automatic = true
    ) THEN
      RAISE NOTICE 'Financing transactions already exist for order %, skipping', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Strategy: If order has financing_request_id, use it directly.
    -- Otherwise, try to determine from items or fallback to lookup.
    
    IF NEW.financing_request_id IS NOT NULL THEN
      -- CASE 1: Order has explicit financing_request_id (preferred)
      -- Verify the financing_request exists and is approved
      SELECT * INTO v_financing_request
      FROM public.financing_requests
      WHERE id = NEW.financing_request_id
        AND status = 'approved_by_sellsi' -- Only use approved financings
        AND buyer_id = NEW.user_id -- Security check
      LIMIT 1;
      
      IF FOUND THEN
        -- Update financing_request: decrement available_amount and increment amount_used
        UPDATE public.financing_requests
        SET available_amount = GREATEST(0, available_amount - NEW.financing_amount),
            amount_used = COALESCE(amount_used, 0) + NEW.financing_amount,
            updated_at = now()
        WHERE id = NEW.financing_request_id;
        
        -- Create transactions based on items JSONB (supplier_orders may not exist yet as they're inserted after this trigger)
        -- Group by supplier to create one transaction per supplier
        v_items := NEW.items;
        v_supplier_financing_map := '{}'::jsonb; -- Reset map
        
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
          BEGIN
            v_supplier_id := (v_item->>'supplier_id')::uuid;
          EXCEPTION WHEN others THEN
            v_supplier_id := NULL;
          END;
          
          -- Skip if supplier_id is null or already processed
          IF v_supplier_id IS NULL OR (v_supplier_financing_map ? v_supplier_id::text) THEN
            CONTINUE;
          END IF;
          
          -- Calculate total financing for this supplier from items
          DECLARE
            v_supplier_financing_amount numeric := 0;
            v_temp_item jsonb;
          BEGIN
            FOR v_temp_item IN SELECT * FROM jsonb_array_elements(v_items)
            LOOP
              IF (v_temp_item->>'supplier_id')::uuid = v_supplier_id THEN
                v_supplier_financing_amount := v_supplier_financing_amount + 
                  COALESCE((v_temp_item->>'financing_amount')::numeric, 0);
              END IF;
            END LOOP;
            
            IF v_supplier_financing_amount > 0 THEN
              -- Try to find supplier_order_id (may not exist yet if finalize_order_pricing hasn't inserted yet)
              SELECT id INTO v_supplier_order_id
              FROM public.supplier_orders
              WHERE parent_order_id = NEW.id
                AND supplier_id = v_supplier_id
              LIMIT 1;
              
              -- Create transaction (supplier_order_id will be NULL if supplier_orders not inserted yet)
              INSERT INTO public.financing_transactions (
                financing_request_id,
                financing_id,
                type,
                amount,
                supplier_order_id,
                metadata,
                is_automatic,
                created_at
              )
              VALUES (
                NEW.financing_request_id,
                NEW.financing_request_id,
                'consumo',
                v_supplier_financing_amount,
                v_supplier_order_id,
                jsonb_build_object(
                  'order_id', NEW.id,
                  'supplier_id', v_supplier_id,
                  'payment_status', NEW.payment_status,
                  'paid_at', NEW.paid_at,
                  'auto_created', true
                ),
                true,
                now()
              );
              
              -- Mark supplier as processed
              v_supplier_financing_map := v_supplier_financing_map || 
                jsonb_build_object(v_supplier_id::text, true);
            END IF;
          END;
        END LOOP;
        
        RAISE NOTICE 'Created financing_transactions for order % using financing_request % (total: %)', 
          NEW.id, NEW.financing_request_id, NEW.financing_amount;
      ELSE
        RAISE WARNING 'financing_request % not found or not approved for order %', 
          NEW.financing_request_id, NEW.id;
      END IF;
      
    ELSE
      -- CASE 2: No explicit financing_request_id - try to determine from supplier
      -- This handles legacy orders or orders created before this migration
      
      v_items := NEW.items;
      
      -- Extract unique supplier_ids from items
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
      LOOP
        BEGIN
          v_supplier_id := (v_item->>'supplier_id')::uuid;
        EXCEPTION WHEN others THEN
          v_supplier_id := NULL;
        END;
        
        -- Skip if we already processed this supplier or supplier_id is null
        IF v_supplier_id IS NULL OR (v_supplier_financing_map ? v_supplier_id::text) THEN
          CONTINUE;
        END IF;
        
        -- Look up an available financing_request for this buyer+supplier
        SELECT * INTO v_financing_request
        FROM public.financing_requests
        WHERE buyer_id = NEW.user_id
          AND supplier_id = v_supplier_id
          AND status = 'approved_by_sellsi'
          AND (expires_at IS NULL OR expires_at > now())
        ORDER BY created_at DESC -- Use most recent
        LIMIT 1;
        
        IF FOUND THEN
          -- Calculate financing amount for this supplier's items
          DECLARE
            v_supplier_financing_amount numeric := 0;
            v_temp_item jsonb;
          BEGIN
            FOR v_temp_item IN SELECT * FROM jsonb_array_elements(v_items)
            LOOP
              IF (v_temp_item->>'supplier_id')::uuid = v_supplier_id THEN
                v_supplier_financing_amount := v_supplier_financing_amount + 
                  COALESCE((v_temp_item->>'financing_amount')::numeric, 0);
              END IF;
            END LOOP;
            
            IF v_supplier_financing_amount > 0 THEN
              -- Update financing_request: decrement available_amount and increment amount_used
              UPDATE public.financing_requests
              SET available_amount = GREATEST(0, available_amount - v_supplier_financing_amount),
                  amount_used = COALESCE(amount_used, 0) + v_supplier_financing_amount,
                  updated_at = now()
              WHERE id = v_financing_request.id;
              
              -- Find the supplier_order_id if it exists
              SELECT id INTO v_supplier_order_id
              FROM public.supplier_orders
              WHERE parent_order_id = NEW.id
                AND supplier_id = v_supplier_id
              LIMIT 1;
              
              -- Create transaction
              INSERT INTO public.financing_transactions (
                financing_request_id,
                financing_id,
                type,
                amount,
                supplier_order_id,
                metadata,
                is_automatic,
                created_at
              )
              VALUES (
                v_financing_request.id,
                v_financing_request.id,
                'consumo',
                v_supplier_financing_amount,
                v_supplier_order_id,
                jsonb_build_object(
                  'order_id', NEW.id,
                  'supplier_id', v_supplier_id,
                  'payment_status', NEW.payment_status,
                  'paid_at', NEW.paid_at,
                  'auto_created', true,
                  'inferred_financing', true
                ),
                true,
                now()
              );
              
              -- Mark this supplier as processed
              v_supplier_financing_map := v_supplier_financing_map || 
                jsonb_build_object(v_supplier_id::text, v_financing_request.id::text);
                
              RAISE NOTICE 'Created financing_transaction for order % supplier % using inferred financing_request % (amount: %)', 
                NEW.id, v_supplier_id, v_financing_request.id, v_supplier_financing_amount;
            END IF;
          END;
        ELSE
          RAISE WARNING 'No available financing_request found for buyer % supplier % on order %', 
            NEW.user_id, v_supplier_id, NEW.id;
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 3: Create trigger on orders table
-- ============================================================================

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

COMMENT ON FUNCTION public.create_financing_transaction_on_payment IS 
  'Automatically creates financing_transaction records when an order is marked as paid with financing_amount > 0. Handles both explicit financing_request_id and inferred from supplier. Created 2026-02-05 to fix missing transaction creation.';

-- ============================================================================
-- PART 3A: Link transactions to supplier_orders after insert
-- ============================================================================

-- Function to update supplier_order_id in financing_transactions after supplier_order is created
CREATE OR REPLACE FUNCTION public.link_financing_transactions_to_supplier_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update financing_transactions that were created for this order+supplier but don't have supplier_order_id yet
  UPDATE public.financing_transactions
  SET supplier_order_id = NEW.id,
      updated_at = now()
  WHERE supplier_order_id IS NULL
    AND metadata->>'order_id' = NEW.parent_order_id::text
    AND metadata->>'supplier_id' = NEW.supplier_id::text
    AND type = 'consumo'
    AND is_automatic = true;
    
  RETURN NEW;
END;
$$;

-- Trigger on supplier_orders AFTER INSERT to link transactions
DROP TRIGGER IF EXISTS trg_link_financing_transactions ON public.supplier_orders;

CREATE TRIGGER trg_link_financing_transactions
  AFTER INSERT ON public.supplier_orders
  FOR EACH ROW
  WHEN (NEW.financing_amount > 0)
  EXECUTE FUNCTION public.link_financing_transactions_to_supplier_order();

COMMENT ON FUNCTION public.link_financing_transactions_to_supplier_order IS 
  'Updates supplier_order_id in financing_transactions after supplier_order is created. This handles the race condition where transactions are created before supplier_orders exist.';

-- ============================================================================
-- PART 4: Backfill existing paid orders with financing (if any)
-- ============================================================================

-- This will create transactions for existing orders that were paid with financing
-- but don't have transactions yet. Only run if there are such orders.

DO $$
DECLARE
  v_order RECORD;
  v_financing_request RECORD;
  v_supplier_rec RECORD;
  v_supplier_id uuid;
  v_supplier_order_id uuid;
  v_items jsonb;
  v_item jsonb;
  v_supplier_financing_amount numeric;
  v_count integer := 0;
BEGIN
  -- Find orders that are paid, have financing, but no transactions
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

    -- Extract unique supplier_ids and create transactions per supplier
    FOR v_supplier_rec IN SELECT DISTINCT (item->>'supplier_id')::uuid AS supplier_id
                  FROM jsonb_array_elements(v_items) AS item
                  WHERE item->>'supplier_id' IS NOT NULL
    LOOP
      v_supplier_id := v_supplier_rec.supplier_id;
      SELECT * INTO v_financing_request
      FROM public.financing_requests
      WHERE buyer_id = v_order.user_id
        AND supplier_id = v_supplier_id
        AND status = 'approved_by_sellsi'
      ORDER BY created_at DESC
      LIMIT 1;
      
      IF FOUND THEN
        -- Calculate supplier's financing amount from items
        v_supplier_financing_amount := 0;
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
          IF (v_item->>'supplier_id')::uuid = v_supplier_id THEN
            v_supplier_financing_amount := v_supplier_financing_amount + 
              COALESCE((v_item->>'financing_amount')::numeric, 0);
          END IF;
        END LOOP;
        
        -- Only create if amount > 0
        IF v_supplier_financing_amount > 0 THEN
          -- Update financing_request: decrement available_amount and increment amount_used
          UPDATE public.financing_requests
          SET available_amount = GREATEST(0, available_amount - v_supplier_financing_amount),
              amount_used = COALESCE(amount_used, 0) + v_supplier_financing_amount,
              updated_at = now()
          WHERE id = v_financing_request.id;
          
          -- Find supplier_order_id
          SELECT id INTO v_supplier_order_id
          FROM public.supplier_orders
          WHERE parent_order_id = v_order.id
            AND supplier_id = v_supplier_id
          LIMIT 1;
          
          -- Create transaction
          INSERT INTO public.financing_transactions (
            financing_request_id,
            financing_id,
            type,
            amount,
            supplier_order_id,
            metadata,
            is_automatic,
            created_at
          )
          VALUES (
            v_financing_request.id,
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
            true,
            v_order.paid_at
          );
          
          v_count := v_count + 1;
        END IF;
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

COMMIT;

-- Verification queries (run manually after migration):
-- 
-- -- Check orders with financing but no transactions
-- SELECT o.id, o.user_id, o.financing_amount, o.payment_status, o.paid_at
-- FROM public.orders o
-- WHERE o.financing_amount > 0
--   AND NOT EXISTS (
--     SELECT 1 FROM public.financing_transactions ft 
--     WHERE ft.metadata->>'order_id' = o.id::text
--   );
-- 
-- -- Check recently created transactions
-- SELECT ft.*, fr.buyer_id, fr.supplier_id, fr.amount AS financing_total
-- FROM public.financing_transactions ft
-- JOIN public.financing_requests fr ON fr.id = ft.financing_request_id
-- WHERE ft.created_at > now() - interval '1 hour'
-- ORDER BY ft.created_at DESC;
