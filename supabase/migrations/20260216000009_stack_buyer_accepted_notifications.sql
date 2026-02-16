BEGIN;

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_supplier_id uuid DEFAULT NULL,
  p_order_id uuid DEFAULT NULL,
  p_product_id uuid DEFAULT NULL,
  p_order_status text DEFAULT NULL,
  p_role_context text DEFAULT 'buyer',
  p_context_section text DEFAULT 'generic',
  p_body text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notifications;
  v_now timestamptz := now();
  v_stack_window interval := interval '120 seconds';
  v_existing_ids text[] := ARRAY[]::text[];
  v_has_product boolean := false;
  v_stack_count integer := 1;
  v_new_metadata jsonb := '{}'::jsonb;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id requerido';
  END IF;
  IF p_type IS NULL THEN
    RAISE EXCEPTION 'p_type requerido';
  END IF;
  IF p_title IS NULL THEN
    RAISE EXCEPTION 'p_title requerido';
  END IF;

  IF p_role_context = 'buyer'
     AND p_order_id IS NOT NULL
     AND COALESCE(p_order_status, '') = 'accepted'
     AND p_type IN ('supplier_part_status', 'order_status') THEN

    SELECT * INTO v_row
    FROM public.notifications
    WHERE user_id = p_user_id
      AND order_id = p_order_id
      AND type = p_type
      AND COALESCE(order_status, '') = COALESCE(p_order_status, '')
      AND role_context = p_role_context
      AND context_section = p_context_section
      AND created_at > v_now - v_stack_window
    ORDER BY created_at DESC
    LIMIT 1;

    IF FOUND THEN
      IF jsonb_typeof(v_row.metadata->'stack_product_ids') = 'array' THEN
        SELECT COALESCE(array_agg(value), ARRAY[]::text[])
        INTO v_existing_ids
        FROM jsonb_array_elements_text(v_row.metadata->'stack_product_ids');
      END IF;

      IF p_product_id IS NOT NULL THEN
        v_has_product := p_product_id::text = ANY(v_existing_ids);
        IF NOT v_has_product THEN
          v_existing_ids := array_append(v_existing_ids, p_product_id::text);
        END IF;
      END IF;

      v_stack_count := COALESCE(NULLIF(v_row.metadata->>'stack_count', '')::integer, 1);
      IF p_product_id IS NULL OR NOT v_has_product THEN
        v_stack_count := v_stack_count + 1;
      END IF;

      v_new_metadata := COALESCE(v_row.metadata, '{}'::jsonb)
        || COALESCE(p_metadata, '{}'::jsonb)
        || jsonb_build_object(
          'stacked', true,
          'stack_count', v_stack_count,
          'stack_window_seconds', 120,
          'last_event_at', v_now,
          'stack_product_ids', to_jsonb(v_existing_ids)
        );

      UPDATE public.notifications
      SET title = CASE
            WHEN v_stack_count = 1 THEN 'Se aceptó 1 producto de tu compra'
            ELSE format('Se aceptaron %s productos de tu compra', v_stack_count)
          END,
          body = CASE
            WHEN v_stack_count = 1 THEN 'Un producto de tu orden fue aceptado.'
            ELSE format('%s productos de tu orden fueron aceptados.', v_stack_count)
          END,
          metadata = v_new_metadata,
          is_read = false,
          read_at = NULL,
          created_at = v_now
      WHERE id = v_row.id
      RETURNING * INTO v_row;

      RETURN v_row;
    END IF;
  END IF;

  SELECT * INTO v_row
  FROM public.notifications
  WHERE user_id = p_user_id
    AND COALESCE(order_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_order_id, '00000000-0000-0000-0000-000000000000')
    AND COALESCE(product_id, '00000000-0000-0000-0000-000000000000') = COALESCE(p_product_id, '00000000-0000-0000-0000-000000000000')
    AND type = p_type
    AND COALESCE(order_status,'') = COALESCE(p_order_status,'')
    AND created_at > v_now - interval '30 seconds'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN v_row;
  END IF;

  INSERT INTO public.notifications(
    user_id, supplier_id, order_id, product_id, type, order_status,
    role_context, context_section, title, body, metadata
  ) VALUES (
    p_user_id, p_supplier_id, p_order_id, p_product_id, p_type, p_order_status,
    p_role_context, p_context_section, p_title, p_body, COALESCE(p_metadata, '{}'::jsonb)
  ) RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_items JSONB;
  v_item JSONB;
  v_supplier_id UUID;
  v_supplier_ids UUID[];
BEGIN
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN

    -- Evitar duplicados: Khipu/Flow ya notifican desde Edge Functions
    IF COALESCE(NEW.payment_method, '') <> 'bank_transfer' THEN
      RETURN NEW;
    END IF;

    IF NEW.payment_status = 'paid' AND OLD.payment_status = 'pending' THEN

      PERFORM public.create_notification(
        jsonb_build_object(
          'p_user_id', NEW.user_id,
          'p_order_id', NEW.id,
          'p_type', 'payment_confirmed',
          'p_order_status', NEW.status,
          'p_role_context', 'buyer',
          'p_context_section', 'buyer_orders',
          'p_title', '✅ Pago Confirmado',
          'p_body', 'Tu transferencia bancaria ha sido verificada y confirmada. Tu pedido está siendo procesado.',
          'p_metadata', jsonb_build_object(
            'payment_method', NEW.payment_method,
            'total', COALESCE(NEW.grand_total, NEW.total)
          )
        )
      );

      v_items := NEW.items;
      v_supplier_ids := ARRAY[]::UUID[];

      IF v_items IS NOT NULL AND jsonb_typeof(v_items) = 'array' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
        LOOP
          BEGIN
            v_supplier_id := (v_item->>'supplier_id')::UUID;
          EXCEPTION WHEN others THEN
            v_supplier_id := NULL;
          END;

          IF v_supplier_id IS NOT NULL AND NOT (v_supplier_id = ANY(v_supplier_ids)) THEN
            v_supplier_ids := array_append(v_supplier_ids, v_supplier_id);

            PERFORM public.create_notification(
              jsonb_build_object(
                'p_user_id', v_supplier_id,
                'p_supplier_id', v_supplier_id,
                'p_order_id', NEW.id,
                'p_type', 'order_new',
                'p_order_status', 'paid',
                'p_role_context', 'supplier',
                'p_context_section', 'supplier_orders',
                'p_title', 'Nuevo pedido pagado',
                'p_body', 'Tienes productos listos para despacho.',
                'p_metadata', jsonb_build_object(
                  'buyer_id', NEW.user_id,
                  'payment_method', NEW.payment_method,
                  'total', COALESCE(NEW.grand_total, NEW.total)
                )
              )
            );
          END IF;
        END LOOP;
      END IF;

    ELSIF NEW.payment_status = 'rejected' THEN

      PERFORM public.create_notification(
        jsonb_build_object(
          'p_user_id', NEW.user_id,
          'p_order_id', NEW.id,
          'p_type', 'payment_rejected',
          'p_order_status', NEW.status,
          'p_role_context', 'buyer',
          'p_context_section', 'buyer_orders',
          'p_title', '❌ Pago No Confirmado',
          'p_body', COALESCE(
            'Tu transferencia no pudo ser verificada. Razón: ' || NEW.payment_rejection_reason,
            'Tu transferencia no pudo ser verificada. Por favor contacta a soporte.'
          ),
          'p_metadata', jsonb_build_object(
            'payment_method', NEW.payment_method,
            'rejection_reason', NEW.payment_rejection_reason
          )
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
