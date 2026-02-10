-- 20260205000000_add_financing_amount_to_orders.sql
-- Agrega columna financing_amount a la tabla orders para registrar el monto
-- cubierto por financiamiento en cada orden.
-- Esta columna permite al sistema calcular correctamente el monto a pagar
-- restando el financiamiento del total base.

BEGIN;

-- Agregar columna financing_amount a orders (si no existe)
-- Representa el monto total cubierto por financiamiento en esta orden
-- NOT NULL con DEFAULT 0 para consistencia con otras columnas monetarias (subtotal, tax, shipping, total)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS financing_amount numeric DEFAULT 0 NOT NULL;

-- Agregar constraint CHECK para asegurar que financing_amount no sea negativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'orders_financing_amount_check'
  ) THEN
    ALTER TABLE public.orders 
      ADD CONSTRAINT orders_financing_amount_check 
      CHECK (financing_amount >= 0);
  END IF;
END;
$$;

-- ⭐ NUEVO: Agregar constraint CHECK para asegurar que financing_amount <= total
-- NOTA: Este constraint se valida en INSERT/UPDATE, pero finalize_order_pricing
-- puede ajustar total después. Por eso la validación principal está en la RPC.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
    WHERE c.conname = 'orders_financing_amount_max_total'
  ) THEN
    ALTER TABLE public.orders 
      ADD CONSTRAINT orders_financing_amount_max_total 
      CHECK (financing_amount <= total OR total = 0);
  END IF;
END;
$$;

-- Comentario sobre la columna para documentación
COMMENT ON COLUMN public.orders.financing_amount IS 
  'Monto total cubierto por financiamiento en esta orden. Se resta del total para calcular el monto real a pagar.';

COMMIT;
