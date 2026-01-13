-- ============================================================================
-- Migration: Fix Minimum Purchase Amount Default Value
-- ============================================================================
-- Fecha: 2026-01-13
-- Problema: minimum_purchase_amount tiene DEFAULT 0, permitiendo $0 como mínimo
-- Solución: Cambiar default a 1, actualizar registros existentes, modificar constraint
-- ============================================================================

BEGIN;

-- 1. Actualizar registros existentes con 0 a 1 (solo proveedores)
-- Solo actualizar usuarios que sean proveedores (main_supplier = true)
UPDATE public.users 
SET minimum_purchase_amount = 1 
WHERE minimum_purchase_amount = 0 
  AND main_supplier = true;

-- 2. Remover constraint existente
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_minimum_purchase_amount_check;

-- 3. Crear nuevo constraint condicional
-- Para PROVEEDORES (main_supplier = true): mínimo $1
-- Para COMPRADORES (main_supplier = false): puede ser $0
ALTER TABLE public.users 
ADD CONSTRAINT users_minimum_purchase_amount_check 
CHECK (
  (main_supplier = false AND minimum_purchase_amount >= 0) OR
  (main_supplier = true AND minimum_purchase_amount >= 1)
);

-- 4. Cambiar default de 0 a 1
ALTER TABLE public.users 
ALTER COLUMN minimum_purchase_amount SET DEFAULT 1;

-- 5. Actualizar comentario de la columna
COMMENT ON COLUMN public.users.minimum_purchase_amount IS 
'Monto mínimo de compra en CLP que debe alcanzar el comprador para productos de este proveedor. Para suppliers: valor mínimo permitido $1 CLP. Para buyers: puede ser $0 (no aplica).';

COMMIT;

-- ============================================================================
-- Validaciones post-migración
-- ============================================================================
-- Verificar que no existan registros con 0:
-- SELECT user_id, user_nm, minimum_purchase_amount 
-- FROM public.users 
-- WHERE minimum_purchase_amount = 0 AND main_supplier = true;
--
-- Verificar el constraint:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'public.users'::regclass 
--   AND conname = 'users_minimum_purchase_amount_check';
-- ============================================================================
