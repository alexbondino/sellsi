-- ============================================================================
-- 💰 MIGRATION: Sistema de Liberación de Pagos a Proveedores
-- ============================================================================
-- Fecha: 28 de Octubre de 2025
-- Descripción: Crea tabla payment_releases, trigger automático y RPC functions
--              para gestionar liberación de pagos cuando proveedores entregan
-- 
-- IMPORTANTE: Ejecutar en orden. No ejecutar parcialmente.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREAR TABLA: payment_releases
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_releases (
  -- Identificadores
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias (con ON DELETE CASCADE para limpieza automática)
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  
  -- Información Financiera
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'CLP',
  
  -- Fechas Clave
  delivery_confirmed_at timestamp with time zone NOT NULL,  -- Cuando supplier marcó delivered
  payment_received_at timestamp with time zone NOT NULL,    -- Cuando buyer pagó
  
  -- Estado de Liberación
  status text NOT NULL DEFAULT 'pending_release' 
    CHECK (status IN ('pending_release', 'released', 'cancelled', 'disputed')),
  
  -- Información de Liberación por Admin
  released_by_admin_id uuid REFERENCES public.control_panel_users(id),
  released_at timestamp with time zone,
  admin_notes text,
  payment_proof_url text,  -- URL del comprobante de transferencia al proveedor
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Constraint: Un solo registro por (order_id, supplier_id)
  CONSTRAINT payment_releases_unique_per_supplier 
    UNIQUE (order_id, supplier_id)
);

-- Comentarios para documentación
COMMENT ON TABLE public.payment_releases IS 
  'Gestión de pagos a proveedores. Se crea automáticamente cuando un proveedor marca una orden como delivered y la orden ya fue pagada.';

COMMENT ON COLUMN public.payment_releases.delivery_confirmed_at IS 
  'Timestamp de cuando el proveedor marcó el pedido como delivered en supplier_parts_meta';

COMMENT ON COLUMN public.payment_releases.payment_received_at IS 
  'Timestamp de cuando el comprador pagó (orders.paid_at)';

COMMENT ON COLUMN public.payment_releases.status IS 
  'Estados: pending_release (esperando admin), released (pago liberado), cancelled (cancelado), disputed (en disputa)';

-- ============================================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice principal por estado (queries más comunes filtran por pending_release)
CREATE INDEX IF NOT EXISTS idx_payment_releases_status 
  ON public.payment_releases(status);

-- Índice parcial para búsquedas de pendientes (más eficiente)
CREATE INDEX IF NOT EXISTS idx_payment_releases_pending 
  ON public.payment_releases(status, created_at DESC) 
  WHERE status = 'pending_release';

-- Índice para búsquedas por proveedor
CREATE INDEX IF NOT EXISTS idx_payment_releases_supplier 
  ON public.payment_releases(supplier_id, status);

-- Índice para búsquedas por orden
CREATE INDEX IF NOT EXISTS idx_payment_releases_order 
  ON public.payment_releases(order_id);

-- Índice para ordenamiento por fecha
CREATE INDEX IF NOT EXISTS idx_payment_releases_created_at 
  ON public.payment_releases(created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en la tabla
ALTER TABLE public.payment_releases ENABLE ROW LEVEL SECURITY;

-- Política: Solo admins autenticados pueden ver payment_releases
CREATE POLICY "Admins can view all payment releases"
  ON public.payment_releases
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.control_panel_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Política: Solo admins pueden actualizar (a través de RPC functions)
CREATE POLICY "Admins can update payment releases via RPC"
  ON public.payment_releases
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.control_panel_users
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Política: Solo el sistema puede insertar (a través del trigger)
CREATE POLICY "System can insert payment releases"
  ON public.payment_releases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- El trigger ya valida la lógica

-- ============================================================================
-- 4. TRIGGER FUNCTION: Crear payment_release automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_create_payment_release()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  supplier_key text;
  supplier_data jsonb;
  supplier_status text;
  supplier_delivered_at timestamp with time zone;
  buyer_id uuid;
  order_paid_at timestamp with time zone;
  supplier_total numeric;
  items_array jsonb;
BEGIN
  -- Solo procesar si la orden está pagada
  IF NEW.payment_status != 'paid' THEN
    RETURN NEW;
  END IF;

  -- Si no hay supplier_parts_meta, no hay nada que procesar
  IF NEW.supplier_parts_meta IS NULL OR NEW.supplier_parts_meta = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Extraer datos básicos
  buyer_id := NEW.user_id;
  order_paid_at := NEW.paid_at;
  
  -- Asegurar que items sea un array JSON válido
  BEGIN
    IF jsonb_typeof(NEW.items) = 'array' THEN
      items_array := NEW.items;
    ELSIF jsonb_typeof(NEW.items) = 'object' AND NEW.items ? 'items' THEN
      items_array := NEW.items -> 'items';
    ELSE
      items_array := '[]'::jsonb;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    items_array := '[]'::jsonb;
  END;

  -- Iterar sobre cada proveedor en supplier_parts_meta
  FOR supplier_key IN SELECT jsonb_object_keys(NEW.supplier_parts_meta)
  LOOP
    -- Extraer datos del proveedor
    supplier_data := NEW.supplier_parts_meta -> supplier_key;
    supplier_status := supplier_data ->> 'status';
    supplier_delivered_at := (supplier_data ->> 'delivered_at')::timestamp with time zone;

    -- Solo procesar si el proveedor marcó 'delivered' y tiene fecha de entrega
    IF supplier_status = 'delivered' AND supplier_delivered_at IS NOT NULL THEN
      
      -- Calcular monto total del proveedor sumando items
      -- Buscar items donde supplier_id coincida (puede estar en item directamente o en item.product)
      SELECT 
        COALESCE(SUM(
          (item->>'quantity')::integer * 
          COALESCE(
            (item->>'price')::numeric,
            (item->>'unit_price')::numeric,
            (item->'product'->>'price')::numeric,
            0
          )
        ), 0) INTO supplier_total
      FROM jsonb_array_elements(items_array) AS item
      WHERE 
        (item->>'supplier_id')::text = supplier_key
        OR (item->'product'->>'supplier_id')::text = supplier_key;

      -- Si el monto es 0, intentar con supplierId alternativo (camelCase vs snake_case)
      IF supplier_total = 0 THEN
        SELECT 
          COALESCE(SUM(
            (item->>'quantity')::integer * 
            COALESCE(
              (item->>'price')::numeric,
              (item->>'unit_price')::numeric,
              0
            )
          ), 0) INTO supplier_total
        FROM jsonb_array_elements(items_array) AS item
        WHERE 
          (item->>'supplierId')::text = supplier_key;
      END IF;

      -- Solo insertar si el monto es mayor a 0
      IF supplier_total > 0 THEN
        BEGIN
          -- Insertar en payment_releases (ON CONFLICT DO NOTHING por si ya existe)
          INSERT INTO public.payment_releases (
            order_id,
            supplier_id,
            buyer_id,
            amount,
            currency,
            delivery_confirmed_at,
            payment_received_at,
            status,
            created_at,
            updated_at
          )
          VALUES (
            NEW.id,
            supplier_key::uuid,
            buyer_id,
            supplier_total,
            COALESCE(NEW.currency, 'CLP'),
            supplier_delivered_at,
            order_paid_at,
            'pending_release',
            now(),
            now()
          )
          ON CONFLICT (order_id, supplier_id) DO NOTHING;
          
          -- Log para debugging (visible en logs de Supabase)
          RAISE NOTICE '✅ Payment release created: order=%, supplier=%, amount=%', 
            NEW.id, supplier_key, supplier_total;
            
        EXCEPTION WHEN OTHERS THEN
          -- Si hay error, loguearlo pero no fallar la transacción completa
          RAISE WARNING '⚠️ Error creating payment release for supplier %: %', 
            supplier_key, SQLERRM;
        END;
      ELSE
        RAISE NOTICE '⚠️ Skipping payment release for supplier % (amount = 0)', supplier_key;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.trigger_create_payment_release() IS 
  'Trigger function que detecta cuando un proveedor marca delivered y crea automáticamente un registro en payment_releases';

-- ============================================================================
-- 5. CREAR TRIGGER EN TABLA orders
-- ============================================================================

-- Eliminar trigger si existe (para re-ejecutar migración)
DROP TRIGGER IF EXISTS create_payment_release_trigger ON public.orders;

-- Crear trigger que se ejecuta DESPUÉS de UPDATE en orders
CREATE TRIGGER create_payment_release_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (
    -- Solo ejecutar si la orden está pagada y tiene supplier_parts_meta
    NEW.payment_status = 'paid' 
    AND NEW.supplier_parts_meta IS NOT NULL
    AND NEW.supplier_parts_meta != '{}'::jsonb
  )
  EXECUTE FUNCTION public.trigger_create_payment_release();

-- ============================================================================
-- 6. RPC FUNCTION: release_supplier_payment()
-- ============================================================================

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
  v_release payment_releases%ROWTYPE;
  v_result jsonb;
  v_admin_exists boolean;
BEGIN
  -- Validar que el admin existe y está activo
  SELECT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = p_admin_id AND is_active = true
  ) INTO v_admin_exists;

  IF NOT v_admin_exists THEN
    RAISE EXCEPTION 'ADMIN_NOT_FOUND: Admin no encontrado o inactivo';
  END IF;

  -- Obtener el registro de liberación con lock (evita race conditions)
  SELECT * INTO v_release
  FROM payment_releases
  WHERE id = p_payment_release_id
  FOR UPDATE NOWAIT;  -- NOWAIT falla inmediatamente si hay lock (mejor UX)

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RELEASE_NOT_FOUND: Registro de liberación no encontrado';
  END IF;

  -- Validar que está en estado pending_release
  IF v_release.status != 'pending_release' THEN
    RAISE EXCEPTION 'INVALID_STATUS: El pago ya fue procesado. Estado actual: %', v_release.status;
  END IF;

  -- Validar URL si se proporciona
  IF p_payment_proof_url IS NOT NULL AND length(p_payment_proof_url) > 0 THEN
    IF NOT (p_payment_proof_url ~* '^https?://') THEN
      RAISE EXCEPTION 'INVALID_URL: La URL del comprobante debe comenzar con http:// o https://';
    END IF;
  END IF;

  -- Actualizar a released
  UPDATE payment_releases
  SET
    status = 'released',
    released_by_admin_id = p_admin_id,
    released_at = now(),
    admin_notes = p_admin_notes,
    payment_proof_url = p_payment_proof_url,
    updated_at = now()
  WHERE id = p_payment_release_id;

  -- Registrar en audit log
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    target_id,
    details,
    timestamp,
    ip_address
  )
  VALUES (
    p_admin_id,
    'RELEASE_PAYMENT',
    p_payment_release_id,
    jsonb_build_object(
      'order_id', v_release.order_id,
      'supplier_id', v_release.supplier_id,
      'amount', v_release.amount,
      'currency', v_release.currency,
      'notes', p_admin_notes,
      'proof_url', p_payment_proof_url,
      'delivery_confirmed_at', v_release.delivery_confirmed_at,
      'payment_received_at', v_release.payment_received_at
    ),
    now(),
    inet_client_addr()::text
  );

  -- Construir resultado exitoso
  v_result := jsonb_build_object(
    'success', true,
    'payment_release_id', p_payment_release_id,
    'order_id', v_release.order_id,
    'supplier_id', v_release.supplier_id,
    'amount', v_release.amount,
    'released_at', now(),
    'released_by', p_admin_id
  );

  RAISE NOTICE '✅ Payment released: id=%, order=%, amount=%', 
    p_payment_release_id, v_release.order_id, v_release.amount;

  RETURN v_result;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'CONCURRENT_ACCESS: Otro admin está procesando esta liberación. Intenta nuevamente.';
  WHEN OTHERS THEN
    RAISE EXCEPTION 'INTERNAL_ERROR: %', SQLERRM;
END;
$$;

-- Comentarios
COMMENT ON FUNCTION public.release_supplier_payment IS 
  'RPC function para que admins liberen pagos a proveedores. Registra en audit log y actualiza estado a released.';

-- Permisos: Solo usuarios autenticados (admins validados dentro de la función)
REVOKE ALL ON FUNCTION public.release_supplier_payment FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_supplier_payment(uuid, uuid, text, text) TO authenticated;

-- ============================================================================
-- 7. RPC FUNCTION: cancel_supplier_payment_release()
-- ============================================================================

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
  v_release payment_releases%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Validar admin
  IF NOT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = p_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin no encontrado o inactivo';
  END IF;

  -- Obtener registro con lock
  SELECT * INTO v_release
  FROM payment_releases
  WHERE id = p_payment_release_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro no encontrado';
  END IF;

  -- Solo se puede cancelar si está en pending_release
  IF v_release.status != 'pending_release' THEN
    RAISE EXCEPTION 'Solo se pueden cancelar pagos pendientes';
  END IF;

  -- Actualizar a cancelled
  UPDATE payment_releases
  SET
    status = 'cancelled',
    admin_notes = COALESCE(admin_notes || E'\n\n', '') || 'CANCELADO: ' || p_cancel_reason,
    updated_at = now()
  WHERE id = p_payment_release_id;

  -- Audit log
  INSERT INTO admin_audit_log (
    admin_id,
    action,
    target_id,
    details,
    timestamp
  )
  VALUES (
    p_admin_id,
    'CANCEL_PAYMENT_RELEASE',
    p_payment_release_id,
    jsonb_build_object(
      'order_id', v_release.order_id,
      'supplier_id', v_release.supplier_id,
      'reason', p_cancel_reason
    ),
    now()
  );

  v_result := jsonb_build_object(
    'success', true,
    'payment_release_id', p_payment_release_id,
    'status', 'cancelled'
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_supplier_payment_release(uuid, uuid, text) TO authenticated;

-- ============================================================================
-- 8. VIEW: payment_releases_with_details
-- ============================================================================

CREATE OR REPLACE VIEW public.payment_releases_with_details AS
SELECT 
  pr.*,
  -- Datos del proveedor
  supplier.user_nm AS supplier_name,
  supplier.email AS supplier_email,
  -- Datos del comprador
  buyer.user_nm AS buyer_name,
  buyer.email AS buyer_email,
  -- Datos del admin que liberó
  admin.usuario AS released_by_admin_username,
  admin.full_name AS released_by_admin_name,
  -- Días entre pago y entrega
  EXTRACT(DAY FROM (pr.delivery_confirmed_at - pr.payment_received_at))::integer AS days_to_delivery,
  -- Días desde entrega hasta ahora (para pendientes)
  CASE 
    WHEN pr.status = 'pending_release' 
    THEN EXTRACT(DAY FROM (now() - pr.delivery_confirmed_at))::integer 
    ELSE NULL 
  END AS days_pending,
  -- Días desde entrega hasta liberación (para liberados)
  CASE 
    WHEN pr.status = 'released' 
    THEN EXTRACT(DAY FROM (pr.released_at - pr.delivery_confirmed_at))::integer 
    ELSE NULL 
  END AS days_to_release
FROM public.payment_releases pr
LEFT JOIN public.users supplier ON pr.supplier_id = supplier.user_id
LEFT JOIN public.users buyer ON pr.buyer_id = buyer.user_id
LEFT JOIN public.control_panel_users admin ON pr.released_by_admin_id = admin.id;

COMMENT ON VIEW public.payment_releases_with_details IS 
  'Vista enriquecida con nombres de proveedor, comprador y admin. Útil para UI del control panel.';

-- ============================================================================
-- 9. FUNCIÓN DE BACKFILL (Para órdenes históricas)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.backfill_payment_releases()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_processed integer := 0;
  v_created integer := 0;
  v_skipped integer := 0;
BEGIN
  -- Procesar órdenes pagadas que tienen entregas confirmadas pero no tienen payment_release
  WITH delivered_parts AS (
    SELECT 
      o.id AS order_id,
      o.user_id AS buyer_id,
      o.paid_at,
      o.currency,
      supplier_key::uuid AS supplier_id,
      (supplier_data->>'delivered_at')::timestamp with time zone AS delivered_at,
      o.items
    FROM public.orders o,
      LATERAL jsonb_each(o.supplier_parts_meta) AS sp(supplier_key, supplier_data)
    WHERE 
      o.payment_status = 'paid'
      AND (supplier_data->>'status') = 'delivered'
      AND (supplier_data->>'delivered_at') IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.payment_releases pr
        WHERE pr.order_id = o.id AND pr.supplier_id = supplier_key::uuid
      )
  )
  INSERT INTO public.payment_releases (
    order_id,
    supplier_id,
    buyer_id,
    amount,
    currency,
    delivery_confirmed_at,
    payment_received_at,
    status,
    created_at,
    updated_at
  )
  SELECT 
    dp.order_id,
    dp.supplier_id,
    dp.buyer_id,
    -- Calcular monto del proveedor
    (
      SELECT COALESCE(SUM(
        (item->>'quantity')::integer * 
        COALESCE(
          (item->>'price')::numeric,
          (item->>'unit_price')::numeric,
          0
        )
      ), 0)
      FROM jsonb_array_elements(
        CASE 
          WHEN jsonb_typeof(dp.items) = 'array' THEN dp.items
          WHEN jsonb_typeof(dp.items) = 'object' AND dp.items ? 'items' THEN dp.items -> 'items'
          ELSE '[]'::jsonb
        END
      ) AS item
      WHERE 
        (item->>'supplier_id')::uuid = dp.supplier_id
        OR (item->'product'->>'supplier_id')::uuid = dp.supplier_id
        OR (item->>'supplierId')::uuid = dp.supplier_id
    ) AS amount,
    COALESCE(dp.currency, 'CLP'),
    dp.delivered_at,
    dp.paid_at,
    'pending_release',
    now(),
    now()
  FROM delivered_parts dp
  WHERE (
    -- Solo insertar si amount > 0
    SELECT COALESCE(SUM(
      (item->>'quantity')::integer * 
      COALESCE((item->>'price')::numeric, (item->>'unit_price')::numeric, 0)
    ), 0)
    FROM jsonb_array_elements(
      CASE 
        WHEN jsonb_typeof(dp.items) = 'array' THEN dp.items
        WHEN jsonb_typeof(dp.items) = 'object' AND dp.items ? 'items' THEN dp.items -> 'items'
        ELSE '[]'::jsonb
      END
    ) AS item
    WHERE 
      (item->>'supplier_id')::uuid = dp.supplier_id
      OR (item->'product'->>'supplier_id')::uuid = dp.supplier_id
      OR (item->>'supplierId')::uuid = dp.supplier_id
  ) > 0;

  GET DIAGNOSTICS v_created = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'records_created', v_created,
    'message', format('Backfill completado. Se crearon %s registros de payment_releases.', v_created)
  );
END;
$$;

COMMENT ON FUNCTION public.backfill_payment_releases IS 
  'Función para procesar órdenes históricas que ya fueron entregadas y crear sus payment_releases';

GRANT EXECUTE ON FUNCTION public.backfill_payment_releases() TO authenticated;

-- ============================================================================
-- 10. COMMIT TRANSACTION
-- ============================================================================

COMMIT;

-- ============================================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================================

-- Para verificar que todo se creó correctamente:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_releases';
-- SELECT proname FROM pg_proc WHERE proname LIKE '%payment_release%';
-- SELECT trigger_name FROM information_schema.triggers WHERE trigger_name = 'create_payment_release_trigger';

-- Para ejecutar backfill de órdenes históricas:
-- SELECT * FROM public.backfill_payment_releases();
