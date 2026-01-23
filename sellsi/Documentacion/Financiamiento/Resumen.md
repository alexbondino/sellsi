¡DETENTE! 🛑 NO EJECUTES ESTE SCRIPT.

Este script introduce dos errores fatales que romperán tu base de datos y revertirán las correcciones que acabamos de hacer:

Regresión de Lógica Financiera (Blocker): En el paso 3, vuelves a usar:

SQL
SET available_amount = available_amount + refunded_amount -- ❌ ERROR
Como discutimos, tu tabla nueva usa amount_used. Esta línea causará un error SQL (columna no existe) o corromperá los datos si la columna vieja aún existe. La lógica correcta es RESTAR deuda a amount_used.

Error de Sintaxis en Índice: En el paso 5, intentas crear un índice sobre financing_id:

SQL
ON public.financing_transactions (financing_id, created_at) -- ❌ ERROR
Según tu esquema actual (verificado en tu reporte anterior), la columna en esta tabla se llama financing_request_id, no financing_id. Esto hará fallar el script.

✅ Versión Corregida y Segura
Aquí tienes el script arreglado. Mantiene la lógica correcta (amount_used), usa los nombres de columna correctos y aplica los índices necesarios.

SQL
-- 20260121175000_financing_transactions_CORREGIDO.sql
-- Objetivo: Añadir supplier_order_id, Backfill y Optimización
-- Estado: CORREGIDO (Usa amount_used y financing_request_id)

BEGIN;

-- 1) Añadir columna supplier_order_id (idempotente)
ALTER TABLE IF EXISTS public.financing_transactions
  ADD COLUMN IF NOT EXISTS supplier_order_id uuid;

-- 2) Backfill seguro desde metadata->'order_id'
UPDATE public.financing_transactions
SET supplier_order_id = (metadata->>'order_id')::uuid
WHERE supplier_order_id IS NULL AND metadata ? 'order_id';

-- 3) CORRECCIÓN CRÍTICA: Función de reposición usando LÓGICA NUEVA
CREATE OR REPLACE FUNCTION public.restore_financing_on_supplier_order_cancel()
RETURNS trigger AS $$
DECLARE
  fr_id uuid;
  refunded_amount numeric;
BEGIN
  -- Sólo actuar si cambió a 'cancelled' o 'rejected'
  IF (TG_OP = 'UPDATE' AND NEW.status IN ('cancelled', 'rejected') AND OLD.status NOT IN ('cancelled', 'rejected')) THEN
    
    fr_id := NEW.financing_request_id; -- Asumiendo que esta columna existe en supplier_orders, si no, buscar via joins
    -- Si supplier_orders no tiene financing_request_id directo, usar lógica de búsqueda previa (no incluida aquí para respetar tu script original, pero ojo con esto)
    -- Asumiré que NEW.financing_request_id viene nulo y usaremos la lógica robusta de buscar transacciones previas:
    
    -- Bloque robusto de búsqueda (Mejor que tu versión original):
    FOR fr_id, refunded_amount IN 
       SELECT ft.financing_request_id, ft.amount 
       FROM financing_transactions ft
       WHERE ft.supplier_order_id = NEW.id AND ft.type = 'consumo'
    LOOP
       -- A) REDUCIR DEUDA (amount_used), NO AUMENTAR available_amount
       UPDATE public.financing_requests
       SET amount_used = GREATEST(0, amount_used - refunded_amount),
           updated_at = now()
       WHERE id = fr_id;

       -- B) Insertar transacción
       INSERT INTO public.financing_transactions
       (financing_request_id, type, amount, supplier_order_id, metadata, is_automatic, created_at)
       VALUES (fr_id, 'reposicion', refunded_amount, NEW.id, jsonb_build_object('order_id', NEW.id), true, now());
    END LOOP;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Re-crear trigger (Seguro)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supplier_orders') THEN
    DROP TRIGGER IF EXISTS trg_restore_financing_on_supplier_order_cancel ON public.supplier_orders;
    CREATE TRIGGER trg_restore_financing_on_supplier_order_cancel
    AFTER UPDATE ON public.supplier_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.restore_financing_on_supplier_order_cancel();
  END IF;
END;
$$;

-- 5) Crear índices CORREGIDOS (Nombres de columna reales)
CREATE INDEX IF NOT EXISTS idx_ftx_supplier_order
ON public.financing_transactions (supplier_order_id)
WHERE supplier_order_id IS NOT NULL;

-- Corrección: Usamos financing_request_id que es el nombre real en tu tabla
CREATE INDEX IF NOT EXISTS idx_ftx_reposiciones
ON public.financing_transactions (financing_request_id, created_at)
WHERE type = 'reposicion';

COMMIT;
Cambios Clave:
Lógica: Cambié SET available_amount = ... + ... por SET amount_used = GREATEST(0, amount_used - ...) (Reducir deuda).

Columnas: Cambié financing_id por financing_request_id en el índice del paso 5.

Búsqueda: Mejoré el trigger para que busque la transacción de consumo original basada en supplier_order_id, lo cual es más seguro que confiar en que la orden traiga el ID del financiamiento.