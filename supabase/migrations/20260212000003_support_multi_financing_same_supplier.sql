-- 20260212000003_support_multi_financing_same_supplier.sql
-- Permite aplicar múltiples financing_request_id en una misma orden pagada
-- incluso cuando pertenecen al mismo supplier.

BEGIN;

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
  v_temp_item jsonb;
  v_supplier_financing_map jsonb := '{}'::jsonb;
  v_financing_request_map jsonb := '{}'::jsonb;
  v_supplier_order_id uuid;
  v_financing_id uuid;
  v_financing_id_text text;
  v_group_financing_amount numeric;
  v_has_item_financing_ids boolean := false;
  v_first_supplier_user_id uuid;
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

    SELECT id INTO v_buyer_id FROM public.buyer WHERE user_id = NEW.user_id;

    IF v_buyer_id IS NULL THEN
      RAISE WARNING 'Could not find buyer.id for user_id % in order %', NEW.user_id, NEW.id;
      RETURN NEW;
    END IF;

    v_items := NEW.items;

    -- Detectar si items traen financing_request_id explícito por producto
    SELECT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_items) AS itm
      WHERE NULLIF(itm->>'financing_request_id', '') IS NOT NULL
    ) INTO v_has_item_financing_ids;

    -- CASE 0: Configuración explícita por item (prioridad máxima)
    IF v_has_item_financing_ids THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
      LOOP
        v_financing_id_text := NULLIF(v_item->>'financing_request_id', '');

        IF v_financing_id_text IS NULL THEN
          CONTINUE;
        END IF;

        IF v_financing_request_map ? v_financing_id_text THEN
          CONTINUE;
        END IF;

        BEGIN
          v_financing_id := v_financing_id_text::uuid;
        EXCEPTION WHEN others THEN
          RAISE WARNING 'Invalid financing_request_id % in order % item', v_financing_id_text, NEW.id;
          CONTINUE;
        END;

        v_group_financing_amount := 0;
        v_first_supplier_user_id := NULL;

        FOR v_temp_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
          IF NULLIF(v_temp_item->>'financing_request_id', '') = v_financing_id_text THEN
            v_group_financing_amount := v_group_financing_amount + COALESCE((v_temp_item->>'financing_amount')::numeric, 0);

            IF v_first_supplier_user_id IS NULL THEN
              BEGIN
                v_first_supplier_user_id := (v_temp_item->>'supplier_id')::uuid;
              EXCEPTION WHEN others THEN
                v_first_supplier_user_id := NULL;
              END;
            END IF;
          END IF;
        END LOOP;

        IF v_group_financing_amount <= 0 THEN
          v_financing_request_map := v_financing_request_map || jsonb_build_object(v_financing_id_text, true);
          CONTINUE;
        END IF;

        SELECT * INTO v_financing_request
        FROM public.financing_requests
        WHERE id = v_financing_id
          AND buyer_id = v_buyer_id
          AND status = 'approved_by_sellsi'
          AND (expires_at IS NULL OR expires_at > now())
        LIMIT 1;

        IF NOT FOUND THEN
          RAISE WARNING 'financing_request % not found/invalid for buyer % order %', v_financing_id, v_buyer_id, NEW.id;
          v_financing_request_map := v_financing_request_map || jsonb_build_object(v_financing_id_text, true);
          CONTINUE;
        END IF;

        -- Seguridad: no consumir por sobre saldo disponible de esa línea
        IF v_group_financing_amount > GREATEST(0, COALESCE(v_financing_request.available_amount, 0)) THEN
          RAISE WARNING 'Skipping financing_request % in order %: amount % exceeds available %',
            v_financing_id, NEW.id, v_group_financing_amount, v_financing_request.available_amount;
          v_financing_request_map := v_financing_request_map || jsonb_build_object(v_financing_id_text, true);
          CONTINUE;
        END IF;

        v_supplier_id := NULL;
        v_supplier_order_id := NULL;

        IF v_first_supplier_user_id IS NULL THEN
          RAISE WARNING 'Skipping financing_request % in order %: missing item supplier_id for explicit financing mapping',
            v_financing_id, NEW.id;
          v_financing_request_map := v_financing_request_map || jsonb_build_object(v_financing_id_text, true);
          CONTINUE;
        END IF;

        SELECT id INTO v_supplier_id FROM public.supplier WHERE user_id = v_first_supplier_user_id;

        IF v_supplier_id IS NULL OR v_supplier_id <> v_financing_request.supplier_id THEN
          RAISE WARNING 'Skipping financing_request % in order %: supplier mismatch (item supplier %, financing supplier %)',
            v_financing_id, NEW.id, v_supplier_id, v_financing_request.supplier_id;
          v_financing_request_map := v_financing_request_map || jsonb_build_object(v_financing_id_text, true);
          CONTINUE;
        END IF;

        SELECT id INTO v_supplier_order_id
        FROM public.supplier_orders
        WHERE parent_order_id = NEW.id
          AND supplier_id = v_first_supplier_user_id
        LIMIT 1;

        UPDATE public.financing_requests
        SET available_amount = GREATEST(0, available_amount - v_group_financing_amount),
            amount_used = COALESCE(amount_used, 0) + v_group_financing_amount,
            updated_at = now()
        WHERE id = v_financing_id;

        INSERT INTO public.financing_transactions (
          financing_request_id,
          financing_id,
          type,
          amount,
          supplier_order_id,
          metadata,
          created_at
        )
        VALUES (
          v_financing_id,
          v_financing_id,
          'consumo',
          v_group_financing_amount,
          v_supplier_order_id,
          jsonb_build_object(
            'order_id', NEW.id,
            'supplier_id', v_supplier_id,
            'payment_status', NEW.payment_status,
            'paid_at', NEW.paid_at,
            'financing_request_id', v_financing_id,
            'source', 'item_financing_request_id'
          ),
          COALESCE(NEW.paid_at, now())
        );

        v_financing_request_map := v_financing_request_map || jsonb_build_object(v_financing_id_text, true);
      END LOOP;

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
          BEGIN
            FOR v_temp_item IN SELECT * FROM jsonb_array_elements(v_items)
            LOOP
              IF (v_temp_item->>'supplier_id')::uuid = v_user_id_from_items THEN
                v_supplier_financing_amount := v_supplier_financing_amount + COALESCE((v_temp_item->>'financing_amount')::numeric, 0);
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
                financing_id,
                type,
                amount,
                supplier_order_id,
                metadata,
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
                  'paid_at', NEW.paid_at
                ),
                COALESCE(NEW.paid_at, now())
              );

              v_supplier_financing_map := v_supplier_financing_map || jsonb_build_object(v_supplier_id::text, true);
            END IF;
          END;
        END LOOP;
      ELSE
        RAISE WARNING 'financing_request % not found or not approved for buyer % order %',
          NEW.financing_request_id, v_buyer_id, NEW.id;
      END IF;

    ELSE
      -- CASE 2: No explicit financing_request_id - infer from supplier
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
          BEGIN
            FOR v_temp_item IN SELECT * FROM jsonb_array_elements(v_items)
            LOOP
              IF (v_temp_item->>'supplier_id')::uuid = v_user_id_from_items THEN
                v_supplier_financing_amount := v_supplier_financing_amount + COALESCE((v_temp_item->>'financing_amount')::numeric, 0);
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
                financing_id,
                type,
                amount,
                supplier_order_id,
                metadata,
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
                  'paid_at', NEW.paid_at
                ),
                COALESCE(NEW.paid_at, now())
              );

              v_supplier_financing_map := v_supplier_financing_map || jsonb_build_object(v_supplier_id::text, true);
            END IF;
          END;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
