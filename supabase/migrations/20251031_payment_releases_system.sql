-- ============================================================================
-- 💰 MIGRATION: Sistema de Liberación de Pagos a Proveedores
-- ============================================================================
-- Fecha: 31 de Octubre de 2025
-- Descripción: Crea tabla payment_releases, trigger automático y RPC functions
--              para gestionar liberación de pagos cuando proveedores entregan
-- 
-- IMPORTANTE: Esta migración es IDEMPOTENTE (puede ejecutarse múltiples veces)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREAR TABLA: payment_releases (con IF NOT EXISTS)
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
  delivery_confirmed_at timestamp with time zone NOT NULL,
  payment_received_at timestamp with time zone NOT NULL,
  
  -- Estado de Liberación
  status text NOT NULL DEFAULT 'pending_release' 
    CHECK (status IN ('pending_release', 'released', 'cancelled', 'disputed')),
  
  -- Información de Liberación por Admin
  released_by_admin_id uuid REFERENCES public.control_panel_users(id),
  released_at timestamp with time zone,
  admin_notes text,
  payment_proof_url text,
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Agregar constraint solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_releases_unique_per_supplier'
  ) THEN
    ALTER TABLE public.payment_releases
      ADD CONSTRAINT payment_releases_unique_per_supplier 
      UNIQUE (order_id, supplier_id);
  END IF;
END$$;

-- ============================================================================
-- 2. ÍNDICES PARA PERFORMANCE (con IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_payment_releases_status 
  ON public.payment_releases(status);

CREATE INDEX IF NOT EXISTS idx_payment_releases_pending 
  ON public.payment_releases(status, created_at DESC) 
  WHERE status = 'pending_release';

CREATE INDEX IF NOT EXISTS idx_payment_releases_supplier 
  ON public.payment_releases(supplier_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_releases_order 
  ON public.payment_releases(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_releases_created_at 
  ON public.payment_releases(created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.payment_releases ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Admins can view all payment releases" ON public.payment_releases;
DROP POLICY IF EXISTS "Admins can update payment releases via RPC" ON public.payment_releases;
DROP POLICY IF EXISTS "System can insert payment releases" ON public.payment_releases;

-- Recrear políticas
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

CREATE POLICY "System can insert payment releases"
  ON public.payment_releases
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

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

  IF NEW.supplier_parts_meta IS NULL OR NEW.supplier_parts_meta = '{}'::jsonb THEN
    RETURN NEW;
  END IF;

  buyer_id := NEW.user_id;
  order_paid_at := NEW.paid_at;
  
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

  FOR supplier_key IN SELECT jsonb_object_keys(NEW.supplier_parts_meta)
  LOOP
    supplier_data := NEW.supplier_parts_meta -> supplier_key;
    supplier_status := supplier_data ->> 'status';
    supplier_delivered_at := (supplier_data ->> 'delivered_at')::timestamp with time zone;

    IF supplier_status = 'delivered' AND supplier_delivered_at IS NOT NULL THEN
      
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

      IF supplier_total > 0 THEN
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
        ) VALUES (
          NEW.id,
          supplier_key::uuid,
          buyer_id,
          supplier_total,
          'CLP',
          supplier_delivered_at,
          order_paid_at,
          'pending_release',
          now(),
          now()
        )
        ON CONFLICT (order_id, supplier_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. TRIGGER: Ejecutar función en UPDATE de orders
-- ============================================================================

DROP TRIGGER IF EXISTS trg_create_payment_release ON public.orders;

CREATE TRIGGER trg_create_payment_release
  AFTER UPDATE OF payment_status, supplier_parts_meta ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_create_payment_release();

-- ============================================================================
-- 6. RPC FUNCTION: Liberar pago a proveedor
-- ============================================================================

CREATE OR REPLACE FUNCTION public.release_supplier_payment(
  p_release_id uuid,
  p_admin_notes text DEFAULT NULL,
  p_payment_proof_url text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_admin_id uuid;
  v_release_record payment_releases%ROWTYPE;
  v_supplier_email text;
  v_supplier_name text;
  v_order_code text;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'No autorizado: solo admins pueden liberar pagos';
  END IF;

  SELECT * INTO v_release_record
  FROM payment_releases
  WHERE id = p_release_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment release no encontrado';
  END IF;

  IF v_release_record.status != 'pending_release' THEN
    RAISE EXCEPTION 'Payment release ya fue procesado (status: %)', v_release_record.status;
  END IF;

  UPDATE payment_releases
  SET 
    status = 'released',
    released_by_admin_id = v_admin_id,
    released_at = now(),
    admin_notes = p_admin_notes,
    payment_proof_url = p_payment_proof_url,
    updated_at = now()
  WHERE id = p_release_id;

  SELECT u.email, u.display_name, o.order_code
  INTO v_supplier_email, v_supplier_name, v_order_code
  FROM users u
  CROSS JOIN orders o
  WHERE u.user_id = v_release_record.supplier_id
    AND o.id = v_release_record.order_id;

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

  RETURN jsonb_build_object(
    'success', true,
    'release_id', p_release_id,
    'status', 'released',
    'amount', v_release_record.amount,
    'supplier_id', v_release_record.supplier_id,
    'released_at', now()
  );
END;
$$;

-- ============================================================================
-- 7. RPC FUNCTION: Cancelar liberación de pago
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cancel_supplier_payment_release(
  p_release_id uuid,
  p_cancellation_reason text
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_admin_id uuid;
  v_release_record payment_releases%ROWTYPE;
BEGIN
  v_admin_id := auth.uid();

  IF NOT EXISTS (
    SELECT 1 FROM control_panel_users 
    WHERE id = v_admin_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'No autorizado: solo admins pueden cancelar liberaciones';
  END IF;

  SELECT * INTO v_release_record
  FROM payment_releases
  WHERE id = p_release_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment release no encontrado';
  END IF;

  IF v_release_record.status = 'released' THEN
    RAISE EXCEPTION 'No se puede cancelar un pago ya liberado';
  END IF;

  UPDATE payment_releases
  SET 
    status = 'cancelled',
    admin_notes = p_cancellation_reason,
    updated_at = now()
  WHERE id = p_release_id;

  RETURN jsonb_build_object(
    'success', true,
    'release_id', p_release_id,
    'status', 'cancelled',
    'reason', p_cancellation_reason
  );
END;
$$;

-- ============================================================================
-- 8. VIEW: payment_releases con información enriquecida
-- ============================================================================

CREATE OR REPLACE VIEW public.payment_releases_with_details AS
SELECT 
  pr.*,
  o.order_code,
  o.payment_status as order_payment_status,
  s.email as supplier_email,
  s.display_name as supplier_name,
  b.email as buyer_email,
  b.display_name as buyer_name,
  a.email as admin_email,
  a.display_name as admin_name,
  EXTRACT(DAYS FROM (COALESCE(pr.released_at, now()) - pr.delivery_confirmed_at))::integer as days_since_delivery
FROM payment_releases pr
LEFT JOIN orders o ON pr.order_id = o.id
LEFT JOIN users s ON pr.supplier_id = s.user_id
LEFT JOIN users b ON pr.buyer_id = b.user_id
LEFT JOIN control_panel_users a ON pr.released_by_admin_id = a.id;

-- ============================================================================
-- 9. FUNCIÓN HELPER: Backfill histórico (opcional, no ejecutar automáticamente)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.backfill_payment_releases()
RETURNS TABLE (
  processed_orders integer,
  created_releases integer,
  errors text[]
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_order record;
  v_processed integer := 0;
  v_created integer := 0;
  v_errors text[] := ARRAY[]::text[];
BEGIN
  FOR v_order IN 
    SELECT id, user_id, payment_status, paid_at, supplier_parts_meta, items
    FROM orders
    WHERE payment_status = 'paid'
      AND supplier_parts_meta IS NOT NULL
      AND supplier_parts_meta != '{}'::jsonb
  LOOP
    BEGIN
      PERFORM trigger_create_payment_release_logic(v_order);
      v_processed := v_processed + 1;
      
      IF EXISTS (
        SELECT 1 FROM payment_releases WHERE order_id = v_order.id
      ) THEN
        v_created := v_created + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := array_append(v_errors, 
        format('Order %s: %s', v_order.id, SQLERRM));
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_created, v_errors;
END;
$$;

COMMIT;

-- ============================================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================================
-- Tabla: payment_releases ✓
-- Índices: 5 índices optimizados ✓
-- RLS: 3 políticas de seguridad ✓
-- Trigger: Creación automática en UPDATE ✓
-- RPCs: release_supplier_payment, cancel_supplier_payment_release ✓
-- View: payment_releases_with_details ✓
-- Helper: backfill_payment_releases (manual) ✓
-- ============================================================================
