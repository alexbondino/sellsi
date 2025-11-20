-- ============================================================================
-- Migración: Hacer spec_name y spec_value NOT NULL en products
-- ============================================================================
-- Fecha: 2025-11-15
-- Propósito: Garantizar integridad de datos en especificaciones de productos
--            Estos campos siempre deben tener un valor (aunque sea 'N/A')
-- ============================================================================

BEGIN;

-- 1. Backfill: Actualizar valores NULL a 'N/A' en spec_name
UPDATE public.products 
SET spec_name = 'N/A'::character varying 
WHERE spec_name IS NULL;

-- 2. Backfill: Actualizar valores NULL a 'N/A' en spec_value
UPDATE public.products 
SET spec_value = 'N/A'::text 
WHERE spec_value IS NULL;

-- 3. Verificar cuántos registros fueron actualizados
DO $$
DECLARE
  count_spec_name integer;
  count_spec_value integer;
BEGIN
  SELECT COUNT(*) INTO count_spec_name FROM public.products WHERE spec_name IS NULL;
  SELECT COUNT(*) INTO count_spec_value FROM public.products WHERE spec_value IS NULL;
  
  RAISE NOTICE 'Productos con spec_name NULL después del backfill: %', count_spec_name;
  RAISE NOTICE 'Productos con spec_value NULL después del backfill: %', count_spec_value;
  
  IF count_spec_name > 0 OR count_spec_value > 0 THEN
    RAISE EXCEPTION 'Aún existen valores NULL en spec_name o spec_value. Revisar datos.';
  END IF;
END $$;

-- 4. Aplicar NOT NULL a spec_name
ALTER TABLE public.products 
ALTER COLUMN spec_name SET NOT NULL;

-- 5. Aplicar NOT NULL a spec_value  
ALTER TABLE public.products 
ALTER COLUMN spec_value SET NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'Constraints NOT NULL aplicados a spec_name y spec_value';
END $$;

-- 6. Comentarios para documentación
COMMENT ON COLUMN public.products.spec_name IS 
  'Nombre de la especificación técnica principal del producto. Valor por defecto: N/A. No puede ser NULL.';

COMMENT ON COLUMN public.products.spec_value IS 
  'Valor de la especificación técnica principal del producto. Valor por defecto: N/A. No puede ser NULL.';

COMMIT;
