BEGIN;

-- 1) Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 2) Eliminar políticas existentes
DROP POLICY IF EXISTS products_select_public ON public.products;
DROP POLICY IF EXISTS products_supplier_full_access ON public.products;
DROP POLICY IF EXISTS productos_publicos ON public.products;
DROP POLICY IF EXISTS productos_proveedor ON public.products;
DROP POLICY IF EXISTS products_select_owner ON public.products;
DROP POLICY IF EXISTS products_insert_authenticated ON public.products;
DROP POLICY IF EXISTS products_update_owner ON public.products;
DROP POLICY IF EXISTS products_delete_owner ON public.products;
DROP POLICY IF EXISTS products_insert_supplier ON public.products;
DROP POLICY IF EXISTS products_view_public ON public.products;
DROP POLICY IF EXISTS products_view_supplier ON public.products;
DROP POLICY IF EXISTS products_update_supplier ON public.products;
DROP POLICY IF EXISTS products_delete_supplier ON public.products;

-- 3) Crear nuevas políticas
-- Lectura pública: solo productos activos
CREATE POLICY products_select_public
ON public.products
FOR SELECT 
USING (is_active = true AND deletion_status IS NULL);

-- Control total para el proveedor sobre sus productos
CREATE POLICY products_supplier_full_access
ON public.products
FOR ALL
USING (auth.uid()::uuid = supplier_id)
WITH CHECK (auth.uid()::uuid = supplier_id);

COMMIT;
