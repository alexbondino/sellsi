-- ============================================================================
-- 20260212000004_add_financing_notifications_triggers.sql
-- Objetivo: emitir notificaciones in-app para los hitos del flujo de financiamiento
-- ============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.notify_financing_request_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_user_id uuid;
BEGIN
  IF NEW.status NOT IN ('pending_supplier_review', 'pending') THEN
    RETURN NEW;
  END IF;

  SELECT s.user_id
  INTO v_supplier_user_id
  FROM public.supplier s
  WHERE s.id = NEW.supplier_id;

  IF v_supplier_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      p_user_id := v_supplier_user_id,
      p_type := 'financing_request_created',
      p_title := 'Nueva solicitud de financiamiento',
      p_supplier_id := v_supplier_user_id,
      p_order_id := NULL,
      p_product_id := NULL,
      p_order_status := NEW.status,
      p_role_context := 'supplier',
      p_context_section := 'supplier_financing',
      p_body := 'Tienes una nueva solicitud de financiamiento para revisar.',
      p_metadata := jsonb_build_object(
        'financing_id', NEW.id,
        'buyer_id', NEW.buyer_id,
        'supplier_id', NEW.supplier_id,
        'request_type', COALESCE(NEW.metadata->>'request_type', NULL)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_financing_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_user_id uuid;
  v_supplier_user_id uuid;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT b.user_id, s.user_id
  INTO v_buyer_user_id, v_supplier_user_id
  FROM public.financing_requests fr
  LEFT JOIN public.buyer b ON b.id = fr.buyer_id
  LEFT JOIN public.supplier s ON s.id = fr.supplier_id
  WHERE fr.id = NEW.id;

  -- Proveedor aprobó solicitud -> notificar comprador
  IF NEW.status = 'buyer_signature_pending' AND v_buyer_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      p_user_id := v_buyer_user_id,
      p_type := 'financing_supplier_approved',
      p_title := 'Solicitud aprobada por el proveedor',
      p_supplier_id := v_supplier_user_id,
      p_order_id := NULL,
      p_product_id := NULL,
      p_order_status := NEW.status,
      p_role_context := 'buyer',
      p_context_section := 'buyer_financing',
      p_body := 'El proveedor aprobó tu solicitud. Ya puedes firmar el contrato.',
      p_metadata := jsonb_build_object(
        'financing_id', NEW.id,
        'previous_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  -- Proveedor rechazó solicitud -> notificar comprador
  IF NEW.status = 'rejected_by_supplier' AND v_buyer_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      p_user_id := v_buyer_user_id,
      p_type := 'financing_supplier_rejected',
      p_title := 'Solicitud rechazada por el proveedor',
      p_supplier_id := v_supplier_user_id,
      p_order_id := NULL,
      p_product_id := NULL,
      p_order_status := NEW.status,
      p_role_context := 'buyer',
      p_context_section := 'buyer_financing',
      p_body := 'El proveedor rechazó tu solicitud de financiamiento.',
      p_metadata := jsonb_build_object(
        'financing_id', NEW.id,
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'rejected_reason', COALESCE(NEW.rejected_reason, NEW.cancelled_reason)
      )
    );
  END IF;

  -- Buyer firmó -> notificar proveedor
  IF NEW.status = 'supplier_signature_pending' AND v_supplier_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      p_user_id := v_supplier_user_id,
      p_type := 'financing_buyer_signed',
      p_title := 'Contrato firmado por el comprador',
      p_supplier_id := v_supplier_user_id,
      p_order_id := NULL,
      p_product_id := NULL,
      p_order_status := NEW.status,
      p_role_context := 'supplier',
      p_context_section := 'supplier_financing',
      p_body := 'El comprador firmó el contrato. Falta tu firma para continuar.',
      p_metadata := jsonb_build_object(
        'financing_id', NEW.id,
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'signed_buyer_at', NEW.signed_buyer_at
      )
    );
  END IF;

  -- Proveedor firmó -> notificar comprador
  IF NEW.status = 'pending_sellsi_approval' AND v_buyer_user_id IS NOT NULL THEN
    PERFORM public.create_notification(
      p_user_id := v_buyer_user_id,
      p_type := 'financing_supplier_signed',
      p_title := 'Contrato firmado por el proveedor',
      p_supplier_id := v_supplier_user_id,
      p_order_id := NULL,
      p_product_id := NULL,
      p_order_status := NEW.status,
      p_role_context := 'buyer',
      p_context_section := 'buyer_financing',
      p_body := 'El proveedor firmó el contrato. Tu solicitud quedó pendiente de aprobación de Sellsi.',
      p_metadata := jsonb_build_object(
        'financing_id', NEW.id,
        'previous_status', OLD.status,
        'new_status', NEW.status,
        'signed_supplier_at', NEW.signed_supplier_at
      )
    );
  END IF;

  -- Sellsi aprobó -> notificar comprador y proveedor
  IF NEW.status IN ('approved_by_sellsi', 'approved') THEN
    IF v_buyer_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        p_user_id := v_buyer_user_id,
        p_type := 'financing_sellsi_approved',
        p_title := 'Financiamiento aprobado por Sellsi',
        p_supplier_id := v_supplier_user_id,
        p_order_id := NULL,
        p_product_id := NULL,
        p_order_status := NEW.status,
        p_role_context := 'buyer',
        p_context_section := 'buyer_financing',
        p_body := 'Sellsi aprobó tu financiamiento.',
        p_metadata := jsonb_build_object(
          'financing_id', NEW.id,
          'previous_status', OLD.status,
          'new_status', NEW.status,
          'approved_by_admin_id', NEW.approved_by_admin_id,
          'activated_at', NEW.activated_at,
          'expires_at', NEW.expires_at
        )
      );
    END IF;

    IF v_supplier_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        p_user_id := v_supplier_user_id,
        p_type := 'financing_sellsi_approved',
        p_title := 'Financiamiento aprobado por Sellsi',
        p_supplier_id := v_supplier_user_id,
        p_order_id := NULL,
        p_product_id := NULL,
        p_order_status := NEW.status,
        p_role_context := 'supplier',
        p_context_section := 'supplier_financing',
        p_body := 'Sellsi aprobó el financiamiento del comprador.',
        p_metadata := jsonb_build_object(
          'financing_id', NEW.id,
          'previous_status', OLD.status,
          'new_status', NEW.status,
          'approved_by_admin_id', NEW.approved_by_admin_id,
          'activated_at', NEW.activated_at,
          'expires_at', NEW.expires_at
        )
      );
    END IF;
  END IF;

  -- Sellsi rechazó -> notificar comprador y proveedor
  IF NEW.status = 'rejected_by_sellsi' THEN
    IF v_buyer_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        p_user_id := v_buyer_user_id,
        p_type := 'financing_sellsi_rejected',
        p_title := 'Financiamiento rechazado por Sellsi',
        p_supplier_id := v_supplier_user_id,
        p_order_id := NULL,
        p_product_id := NULL,
        p_order_status := NEW.status,
        p_role_context := 'buyer',
        p_context_section := 'buyer_financing',
        p_body := 'Sellsi rechazó tu solicitud de financiamiento.',
        p_metadata := jsonb_build_object(
          'financing_id', NEW.id,
          'previous_status', OLD.status,
          'new_status', NEW.status,
          'rejected_reason', COALESCE(NEW.rejected_reason, NEW.cancelled_reason),
          'rejected_at', NEW.rejected_at
        )
      );
    END IF;

    IF v_supplier_user_id IS NOT NULL THEN
      PERFORM public.create_notification(
        p_user_id := v_supplier_user_id,
        p_type := 'financing_sellsi_rejected',
        p_title := 'Financiamiento rechazado por Sellsi',
        p_supplier_id := v_supplier_user_id,
        p_order_id := NULL,
        p_product_id := NULL,
        p_order_status := NEW.status,
        p_role_context := 'supplier',
        p_context_section := 'supplier_financing',
        p_body := 'Sellsi rechazó el financiamiento del comprador.',
        p_metadata := jsonb_build_object(
          'financing_id', NEW.id,
          'previous_status', OLD.status,
          'new_status', NEW.status,
          'rejected_reason', COALESCE(NEW.rejected_reason, NEW.cancelled_reason),
          'rejected_at', NEW.rejected_at
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_financing_request_created ON public.financing_requests;
CREATE TRIGGER trg_notify_financing_request_created
AFTER INSERT ON public.financing_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_financing_request_created();

DROP TRIGGER IF EXISTS trg_notify_financing_status_change ON public.financing_requests;
CREATE TRIGGER trg_notify_financing_status_change
AFTER UPDATE OF status ON public.financing_requests
FOR EACH ROW
WHEN (NEW.status IS DISTINCT FROM OLD.status)
EXECUTE FUNCTION public.notify_financing_status_change();

COMMENT ON FUNCTION public.notify_financing_request_created IS
'Emite notificación al proveedor cuando se crea una nueva solicitud de financiamiento (pending_supplier_review o legacy pending).';

COMMENT ON FUNCTION public.notify_financing_status_change IS
'Emite notificaciones buyer/supplier para hitos de status del flujo de financiamiento (aprobación/rechazo/firma/aprobación Sellsi).';

COMMIT;
