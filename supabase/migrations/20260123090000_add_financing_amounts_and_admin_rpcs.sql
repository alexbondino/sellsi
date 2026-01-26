-- 20260123090000_add_financing_amounts_and_admin_rpcs.sql
-- Añade columnas amount_used/amount_paid/amount_refunded, asegura finance_id en transactions,
-- y crea RPCs administradores: admin_restore_financing_amount, admin_process_refund.
-- Idempotente y segura para ejecutar en entornos de staging; revisar notas para producción.

BEGIN;

-- 1) Añadir columnas a financing_requests si no existen
ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS amount_used numeric DEFAULT 0;

ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;

ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS amount_refunded numeric DEFAULT 0;

-- 2) Añadir constraints CHECK (si no existen)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'financing_requests_amount_used_check') THEN
    ALTER TABLE public.financing_requests ADD CONSTRAINT financing_requests_amount_used_check CHECK (amount_used >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'financing_requests_amount_paid_check') THEN
    ALTER TABLE public.financing_requests ADD CONSTRAINT financing_requests_amount_paid_check CHECK (amount_paid >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'financing_requests_amount_refunded_check') THEN
    ALTER TABLE public.financing_requests ADD CONSTRAINT financing_requests_amount_refunded_check CHECK (amount_refunded >= 0);
  END IF;
END;
$$;

-- 3) Añadir columna financing_id a financing_transactions si no existe (para compatibilidad futura)
ALTER TABLE public.financing_transactions
  ADD COLUMN IF NOT EXISTS financing_id uuid;

-- 4) Backfill de financing_id desde financing_request_id (solo si aplica)
-- Nota: este UPDATE es seguro (se hace solo cuando financing_id IS NULL y financing_request_id IS NOT NULL)
UPDATE public.financing_transactions
SET financing_id = financing_request_id
WHERE financing_id IS NULL AND financing_request_id IS NOT NULL;

-- 4b) Añadir FK hacia financing_requests de forma segura (NOT VALID para evitar validación costosa en tablas grandes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'fk_financing_transactions_financing'
  ) THEN
    ALTER TABLE public.financing_transactions
      ADD CONSTRAINT fk_financing_transactions_financing FOREIGN KEY (financing_id) REFERENCES public.financing_requests(id) NOT VALID;
  END IF;
END;
$$;

-- 4c) Intentar establecer NOT NULL en financing_id si ya no existen filas con NULL (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.financing_transactions WHERE financing_id IS NULL) THEN
    ALTER TABLE public.financing_transactions ALTER COLUMN financing_id SET NOT NULL;
  END IF;
END;
$$;

-- Nota: Para validar la constraint en entornos grandes ejecutar fuera de la transacción:
-- ALTER TABLE public.financing_transactions VALIDATE CONSTRAINT fk_financing_transactions_financing;  -- (puede tardar y bloquear)
-- Si la tabla es grande, ejecutar VALIDATE CONSTRAINT en una ventana de mantenimiento o usar VALIDATE CONSTRAINT CONCURRENTLY si disponible.

-- Añadir columnas de auditoría y metadatos en transacciones (idempotente)
ALTER TABLE public.financing_transactions ADD COLUMN IF NOT EXISTS restoration_reason text;
ALTER TABLE public.financing_transactions ADD COLUMN IF NOT EXISTS restored_by uuid REFERENCES public.control_panel_users(id);
ALTER TABLE public.financing_transactions ADD COLUMN IF NOT EXISTS is_automatic boolean DEFAULT false;

-- Corregir tipado histórico: 'refund' -> 'reposicion' (idempotente)
UPDATE public.financing_transactions SET type = 'reposicion' WHERE type = 'refund';

-- 5) Crear índices (no concurrentes aquí; en tablas grandes preferir CONCURRENTLY fuera de transacción)
CREATE INDEX IF NOT EXISTS idx_ftx_financing ON public.financing_transactions (financing_id, type, created_at);
-- Asegura la columna expires_at existe antes de crear índices que la usan
ALTER TABLE public.financing_requests ADD COLUMN IF NOT EXISTS expires_at timestamptz;
-- Índice de checkout según DISEÑO_BACKEND (usa expires_at)
CREATE INDEX IF NOT EXISTS idx_financing_checkout_lookup ON public.financing_requests (buyer_id, supplier_id, expires_at) WHERE status = 'approved_by_sellsi';
-- Índice para chequeo de mora según DISEÑO (status expired y amount_used > amount_paid)
CREATE INDEX IF NOT EXISTS idx_financing_buyer_overdue_check ON public.financing_requests (buyer_id) WHERE status = 'expired' AND amount_used > amount_paid;
CREATE INDEX IF NOT EXISTS idx_ftx_devolucion_type ON public.financing_transactions (type) WHERE type = 'devolucion';
CREATE INDEX IF NOT EXISTS idx_ftx_supplier_order ON public.financing_transactions (supplier_order_id) WHERE supplier_order_id IS NOT NULL;

-- 6) RPC: admin_restore_financing_amount
-- Reposición: reduce amount_used y registra transacción tipo 'reposicion'. No ajusta amount_paid (para rastrear saldo a favor).
CREATE OR REPLACE FUNCTION public.admin_restore_financing_amount(
  p_financing_id uuid, p_amount numeric, p_reason text, p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_new_amount_used numeric;
  v_invoking_admin uuid;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'El monto debe ser mayor a 0');
  END IF;

  -- Determinar admin que ejecuta la función
  v_invoking_admin := auth.uid()::uuid;
  IF v_invoking_admin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No se detectó admin (auth.uid() es NULL)');
  END IF;

  -- Verificar que el admin exista y esté activo
  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_invoking_admin AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Admin inválido');
  END IF;

  -- Si p_admin_id fue enviado, exigir que coincida con auth.uid()
  IF p_admin_id IS NOT NULL AND p_admin_id::uuid <> v_invoking_admin THEN
    RETURN json_build_object('success', false, 'error', 'p_admin_id debe coincidir con el admin autenticado');
  END IF;

  -- Intentar decrementar amount_used de forma atómica
  UPDATE public.financing_requests
  SET amount_used = amount_used - p_amount,
      updated_at = now()
  WHERE id = p_financing_id
    AND amount_used >= p_amount
  RETURNING amount_used INTO v_new_amount_used;
  IF NOT FOUND THEN
    IF NOT EXISTS (SELECT 1 FROM public.financing_requests WHERE id = p_financing_id) THEN
      RETURN json_build_object('success', false, 'error', 'Financiamiento no encontrado');
    ELSE
      RETURN json_build_object('success', false, 'error', 'El monto excede amount_used');
    END IF;
  END IF;

  -- Registrar transacción de reposición con referencia al admin (usando el admin invocador)
  INSERT INTO public.financing_transactions (financing_id, type, amount, restoration_reason, restored_by, is_automatic, metadata, created_at)
  VALUES (p_financing_id, 'reposicion', p_amount, COALESCE(p_reason, 'reposicion manual admin'), v_invoking_admin, false, jsonb_build_object('note','Reposición manual admin'), now());

  -- Registrar auditoría admin
  PERFORM public.log_admin_audit(v_invoking_admin, 'FINANCING_RESTORE', p_financing_id, jsonb_build_object('amount', p_amount, 'reason', COALESCE(p_reason, 'reposicion manual admin')), NULL, NULL);

  RETURN json_build_object('success', true, 'new_amount_used', v_new_amount_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

GRANT EXECUTE ON FUNCTION public.admin_restore_financing_amount(uuid, numeric, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_financing_amount(uuid, numeric, text, uuid) TO service_role;

-- 7) RPC: admin_process_refund
-- Procesar devolución: incrementa amount_refunded atómicamente solo si existe saldo suficiente (amount_paid - amount_used - amount_refunded >= p_amount)
CREATE OR REPLACE FUNCTION public.admin_process_refund(
  p_financing_id uuid, p_amount numeric, p_admin_id uuid
) RETURNS json AS $$
DECLARE
  v_updated_rows int;
  v_invoking_admin uuid;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'El monto debe ser mayor a 0');
  END IF;

  -- Determinar admin que ejecuta la función
  v_invoking_admin := auth.uid()::uuid;
  IF v_invoking_admin IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No se detectó admin (auth.uid() es NULL)');
  END IF;

  -- Verificar que el admin exista y esté activo
  IF NOT EXISTS (SELECT 1 FROM public.control_panel_users WHERE id = v_invoking_admin AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Admin inválido');
  END IF;

  -- Si p_admin_id fue enviado, exigir que coincida con auth.uid()
  IF p_admin_id IS NOT NULL AND p_admin_id::uuid <> v_invoking_admin THEN
    RETURN json_build_object('success', false, 'error', 'p_admin_id debe coincidir con el admin autenticado');
  END IF;

  UPDATE public.financing_requests
  SET amount_refunded = amount_refunded + p_amount,
      updated_at = now()
  WHERE id = p_financing_id
    AND (amount_paid - amount_used - amount_refunded) >= p_amount;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;

  IF v_updated_rows = 0 THEN
    IF NOT EXISTS (SELECT 1 FROM public.financing_requests WHERE id = p_financing_id) THEN
      RETURN json_build_object('success', false, 'error', 'Financiamiento no encontrado');
    ELSE
      RETURN json_build_object('success', false, 'error', 'Saldo insuficiente o modificado concurrentemente');
    END IF;
  END IF;

  INSERT INTO public.financing_transactions (financing_request_id, financing_id, type, amount, metadata, created_at, created_by)
  VALUES (p_financing_id, p_financing_id, 'devolucion', p_amount, jsonb_build_object('note', 'Devolución procesada por admin', 'processed_by_admin_id', v_invoking_admin), now(), v_invoking_admin);

  -- Registrar auditoría admin
  PERFORM public.log_admin_audit(v_invoking_admin, 'FINANCING_REFUND', p_financing_id, jsonb_build_object('amount', p_amount), NULL, NULL);

  RETURN json_build_object('success', true, 'refund_processed', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.admin_process_refund(uuid, numeric, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_process_refund(uuid, numeric, uuid) TO service_role;

-- 8) Normalizar históricos: 'refund' -> 'reposicion' o 'devolucion' (idempotente y guardado para tablas grandes)
DO $$
DECLARE cnt integer;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.financing_transactions WHERE type = 'refund';
  IF cnt = 0 THEN
    RAISE NOTICE 'No se encontraron filas con type = ''refund''.';
  ELSIF cnt > 10000 THEN
    -- Para tablas grandes, recomendamos ejecutar la migración correctiva en batches manualmente
    RAISE NOTICE 'Se encontraron % filas con type = ''refund'' (>10000). Saltando normalización masiva. Ejecutar el script batch manualmente.', cnt;
  ELSE
    -- Clasificar como reposicion si tiene supplier_order_id o metadata->'order_id', sino como devolucion
    UPDATE public.financing_transactions
    SET type = 'reposicion'
    WHERE type = 'refund' AND (supplier_order_id IS NOT NULL OR (metadata ? 'order_id'));

    UPDATE public.financing_transactions
    SET type = 'devolucion'
    WHERE type = 'refund' AND NOT (supplier_order_id IS NOT NULL OR (metadata ? 'order_id'));

    RAISE NOTICE 'Normalización completada para % filas.', cnt;
  END IF;
END;
$$;

-- 9) Backfill seguro de amount_used/amount_paid/amount_refunded desde transacciones (idempotente con guarda para tablas grandes)
DO $$
DECLARE fr_count integer;
BEGIN
  SELECT COUNT(*) INTO fr_count FROM public.financing_requests;
  IF fr_count = 0 THEN
    RAISE NOTICE 'No se encontraron financiamientos para backfill.';
  ELSIF fr_count > 100000 THEN
    RAISE NOTICE 'Hay % financiamientos (>100000). Saltando backfill masivo. Ejecutar el script batch manualmente.', fr_count;
  ELSE
    WITH agg AS (
      SELECT ft.financing_id::uuid AS id,
        COALESCE(SUM(CASE WHEN ft.type = 'consumo' THEN ft.amount ELSE 0 END),0) AS used_sum,
        COALESCE(SUM(CASE WHEN ft.type = 'pago' THEN ft.amount ELSE 0 END),0) AS paid_sum,
        COALESCE(SUM(CASE WHEN ft.type = 'devolucion' THEN ft.amount ELSE 0 END),0) AS refunded_sum
      FROM public.financing_transactions ft
      WHERE ft.financing_id IS NOT NULL
      GROUP BY ft.financing_id
    )
    UPDATE public.financing_requests fr
    SET amount_used = agg.used_sum,
        amount_paid = agg.paid_sum,
        amount_refunded = agg.refunded_sum,
        updated_at = now()
    FROM agg
    WHERE fr.id = agg.id
      AND (
        fr.amount_used IS DISTINCT FROM agg.used_sum
        OR fr.amount_paid IS DISTINCT FROM agg.paid_sum
        OR fr.amount_refunded IS DISTINCT FROM agg.refunded_sum
      );

    RAISE NOTICE 'Backfill aplicado para % financiamientos.', fr_count;
  END IF;
END;
$$;

-- Batch backfill ejemplo (ejecutar manualmente en ventana de mantenimiento si la tabla es grande):
-- WITH batch AS (
--   SELECT id FROM public.financing_requests ORDER BY id LIMIT 1000
-- )
-- UPDATE public.financing_requests fr
-- SET amount_used = tx.used_sum,
--     amount_paid = tx.paid_sum,
--     amount_refunded = tx.refunded_sum,
--     updated_at = now()
-- FROM (
--   SELECT ft.financing_id AS id,
--     SUM(CASE WHEN ft.type = 'consumo' THEN ft.amount ELSE 0 END) AS used_sum,
--     SUM(CASE WHEN ft.type = 'pago' THEN ft.amount ELSE 0 END) AS paid_sum,
--     SUM(CASE WHEN ft.type = 'devolucion' THEN ft.amount ELSE 0 END) AS refunded_sum
--   FROM public.financing_transactions ft
--   WHERE ft.financing_id IN (SELECT id FROM batch)
--   GROUP BY ft.financing_id
-- ) tx
-- WHERE fr.id = tx.id;

-- Limpieza de índice legacy (si existe) — revisar y ejecutar en ventana de mantenimiento si procede
-- DROP INDEX IF EXISTS idx_ftx_refund;

-- 10) Corregir trigger de reposición (idempotente)
-- Asegura que cuando supplier cancela/rechaza se inserte 'reposicion' en lugar de 'refund'
CREATE OR REPLACE FUNCTION public.restore_financing_on_supplier_order_cancel()
RETURNS trigger AS $$
DECLARE
  fr_id uuid;
  refunded_amount numeric;
BEGIN
  -- Actuar solo cuando la orden cambia a 'cancelled' o 'rejected'
  IF (TG_OP = 'UPDATE' AND NEW.status IN ('cancelled','rejected') AND OLD.status NOT IN ('cancelled','rejected')) THEN
    fr_id := NEW.financing_request_id;
    refunded_amount := COALESCE(NEW.amount, 0);

    IF fr_id IS NOT NULL AND refunded_amount > 0 THEN
      -- Aumentar available_amount y registrar transacción de reposición
      UPDATE public.financing_requests
      SET available_amount = available_amount + refunded_amount,
          updated_at = now()
      WHERE id = fr_id;

      INSERT INTO public.financing_transactions
      (financing_request_id, financing_id, type, amount, supplier_order_id, metadata, is_automatic, created_at)
      VALUES (fr_id, fr_id, 'reposicion', refunded_amount, NEW.id, jsonb_build_object('order_id', NEW.id), true, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_orders') THEN
    DROP TRIGGER IF EXISTS trg_restore_financing_on_supplier_order_cancel ON public.supplier_orders;
    CREATE TRIGGER trg_restore_financing_on_supplier_order_cancel
    AFTER UPDATE ON public.supplier_orders
    FOR EACH ROW
    WHEN (NEW.status IN ('cancelled','rejected') AND OLD.status NOT IN ('cancelled','rejected'))
    EXECUTE FUNCTION public.restore_financing_on_supplier_order_cancel();
  END IF;
END;
$$;

COMMIT;

-- IMPORTANT NOTES:
-- - If your table `public.financing_transactions` is very large, consider creating indexes CONCURRENTLY outside a transaction to avoid locking:
--   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ftx_financing_concurrent ON public.financing_transactions (financing_id, type, created_at);
-- - The functions are SECURITY DEFINER (run as migration owner) to allow the control_panel frontend (anon/auth) to call them via RPC while still enforcing RPC-level validation.
-- - Test the functions in staging before running in production.

-- Test examples (run after migration in staging):
-- SELECT public.admin_restore_financing_amount('11...-id', 1000, 'motivo', 'admin-uuid');
-- SELECT public.admin_process_refund('11...-id', 500, 'admin-uuid');
