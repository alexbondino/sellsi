-- =====================================================
-- Migración: 20250903113000_notifications_create_wrapper.sql
-- Objetivo: Añadir wrapper flexible create_notification(jsonb) para absorber variaciones de payload
-- evitando 404 por mismatch de firma cuando el frontend envía parámetros legacy/adicionales.
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_notification(p_payload jsonb)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payload jsonb := COALESCE(p_payload, '{}'::jsonb);
  p_user uuid := NULL;
  p_supplier uuid := NULL;
  p_order uuid := NULL;
  p_product uuid := NULL;
  p_type text := NULL;
  p_title text := NULL;
  p_order_status text := NULL;
  p_role_context text := NULL;
  p_context_section text := NULL;
  p_body text := NULL;
  p_metadata jsonb := '{}'::jsonb;
BEGIN
  -- Extract core identifiers (ignore invalid casts silently)
  BEGIN p_user := NULLIF(payload->>'p_user_id','')::uuid; EXCEPTION WHEN others THEN p_user := NULL; END;
  BEGIN p_supplier := NULLIF(payload->>'p_supplier_id','')::uuid; EXCEPTION WHEN others THEN p_supplier := NULL; END;
  BEGIN p_order := NULLIF(payload->>'p_order_id','')::uuid; EXCEPTION WHEN others THEN p_order := NULL; END;
  BEGIN p_product := NULLIF(payload->>'p_product_id','')::uuid; EXCEPTION WHEN others THEN p_product := NULL; END;

  -- Canonical text fields (fallback to legacy names)
  p_type := COALESCE(payload->>'p_type', payload->>'type');
  p_title := COALESCE(payload->>'p_title', payload->>'title');
  p_order_status := COALESCE(payload->>'p_order_status', NULL);
  p_role_context := COALESCE(payload->>'p_role_context', payload->>'role_context', 'buyer');
  p_context_section := COALESCE(payload->>'p_context_section', payload->>'context_section', 'generic');
  p_body := COALESCE(payload->>'p_body', payload->>'p_message', payload->>'message', payload->>'body');

  -- Base metadata + enrich with optional related/action/message if provided
  p_metadata := COALESCE(payload->'p_metadata', '{}'::jsonb);
  IF payload ? 'p_related_id' THEN
    p_metadata := p_metadata || jsonb_build_object('related_id', payload->>'p_related_id');
  END IF;
  IF payload ? 'p_action_url' THEN
    p_metadata := p_metadata || jsonb_build_object('action_url', payload->>'p_action_url');
  END IF;
  IF payload ? 'p_message' THEN
    p_metadata := p_metadata || jsonb_build_object('message', payload->>'p_message');
  END IF;

  -- Delegate to canonical function (parameter order MUST match existing definition)
  RETURN public.create_notification(
    p_user,
    p_type,
    p_title,
    p_supplier,
    p_order,
    p_product,
    p_order_status,
    p_role_context,
    p_context_section,
    p_body,
    p_metadata
  );
END;
$$;

-- Grant execution to authenticated (idempotent)
DO $$ BEGIN
  BEGIN EXECUTE 'GRANT EXECUTE ON FUNCTION public.create_notification(jsonb) TO authenticated'; EXCEPTION WHEN others THEN NULL; END;
END $$;

-- =====================================================
-- FIN
-- =====================================================
