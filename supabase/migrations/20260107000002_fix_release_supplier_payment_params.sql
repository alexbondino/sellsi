-- ============================================================================
-- 2026-01-07: Fix release_supplier_payment parameters
-- ============================================================================
-- Problema: El frontend envía (p_payment_release_id, p_admin_id, p_admin_notes, p_payment_proof_url)
--           pero la función espera (p_release_id, p_admin_notes, p_payment_proof_url)
--           y obtiene admin_id de auth.uid()
--
-- Síntomas: 
--   - Funciona en staging (función actualizada manualmente)
--   - Falla en producción con error 404: "Could not find the function..."
--
-- Solución: Actualizar firma de la función para coincidir con lo que envía el frontend
-- ============================================================================

BEGIN;

-- Dropear función existente (para cambiar firma)
DROP FUNCTION IF EXISTS public.release_supplier_payment(uuid, text, text);

-- Recrear con nuevos parámetros
CREATE OR REPLACE FUNCTION public.release_supplier_payment(
  p_payment_release_id uuid,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL,
  p_payment_proof_url text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_release_record payment_releases%ROWTYPE;
  v_supplier_email text;
  v_supplier_name text;
  v_order_code text;
BEGIN
  -- Validar que el admin existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = p_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'No autorizado: solo admins pueden liberar pagos';
  END IF;

  -- Obtener y bloquear el registro de payment_release
  SELECT * INTO v_release_record
  FROM payment_releases
  WHERE id = p_payment_release_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment release no encontrado';
  END IF;

  IF v_release_record.status != 'pending_release' THEN
    RAISE EXCEPTION 'Payment release ya fue procesado (status: %)', v_release_record.status;
  END IF;

  -- Actualizar el registro
  UPDATE payment_releases
  SET 
    status = 'released',
    released_by_admin_id = p_admin_id,
    released_at = now(),
    admin_notes = p_admin_notes,
    payment_proof_url = p_payment_proof_url,
    updated_at = now()
  WHERE id = p_payment_release_id;

  -- Obtener información para la notificación
  SELECT u.email, u.user_nm, o.id as order_code
  INTO v_supplier_email, v_supplier_name, v_order_code
  FROM users u
  CROSS JOIN orders o
  WHERE u.user_id = v_release_record.supplier_id
    AND o.id = v_release_record.order_id;

  -- Crear notificación para el proveedor
  BEGIN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      created_at
    ) VALUES (
      v_release_record.supplier_id,
      'payment_released',
      'Pago Liberado',
      format('Tu pago de $%s por la orden %s ha sido liberado', 
        v_release_record.amount, 
        COALESCE(v_order_code, 'N/A')
      ),
      now()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'No se pudo crear notificación: %', SQLERRM;
  END;

  -- Retornar información del pago liberado (mantener estructura original)
  RETURN jsonb_build_object(
    'success', true,
    'release_id', p_payment_release_id,
    'status', 'released',
    'amount', v_release_record.amount,
    'supplier_id', v_release_record.supplier_id,
    'released_at', now()
  );
END;
$$;

-- ============================================================================
-- PARTE 2: Fix cancel_supplier_payment_release parameters
-- ============================================================================

-- Dropear función existente (para cambiar firma)
DROP FUNCTION IF EXISTS public.cancel_supplier_payment_release(uuid, text);

-- Recrear con nuevos parámetros
CREATE OR REPLACE FUNCTION public.cancel_supplier_payment_release(
  p_payment_release_id uuid,
  p_admin_id uuid,
  p_cancel_reason text
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_release_record payment_releases%ROWTYPE;
BEGIN
  -- Validar que el admin existe y está activo
  IF NOT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = p_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'No autorizado: solo admins pueden cancelar liberaciones';
  END IF;

  -- Obtener y bloquear el registro
  SELECT * INTO v_release_record
  FROM payment_releases
  WHERE id = p_payment_release_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment release no encontrado';
  END IF;

  -- Mantener lógica original: no se puede cancelar si ya fue liberado
  IF v_release_record.status = 'released' THEN
    RAISE EXCEPTION 'No se puede cancelar un pago ya liberado';
  END IF;

  -- Actualizar a cancelled
  UPDATE payment_releases
  SET 
    status = 'cancelled',
    admin_notes = p_cancel_reason,
    updated_at = now()
  WHERE id = p_payment_release_id;

  -- Mantener estructura de respuesta original
  RETURN jsonb_build_object(
    'success', true,
    'release_id', p_payment_release_id,
    'status', 'cancelled',
    'reason', p_cancel_reason
  );
END;
$$;

COMMIT;

-- ============================================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================================
-- Cambios:
-- 1. release_supplier_payment:
--    - Parámetro p_release_id → p_payment_release_id (coincide con frontend)
--    - Añadido parámetro p_admin_id (ya no usa auth.uid())
--
-- 2. cancel_supplier_payment_release:
--    - Parámetro p_release_id → p_payment_release_id (coincide con frontend)
--    - Añadido parámetro p_admin_id (ya no usa auth.uid())
--
-- Frontend envía para release:
--   { p_payment_release_id, p_admin_id, p_admin_notes, p_payment_proof_url }
--
-- Frontend envía para cancel:
--   { p_payment_release_id, p_admin_id, p_cancel_reason }
--
-- Ambas funciones ahora coinciden con lo que envía el frontend
-- ============================================================================
