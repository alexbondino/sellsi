BEGIN;

-- 1) Eliminar políticas existentes
DROP POLICY IF EXISTS products_select_public ON public.products;
DROP POLICY IF EXISTS products_supplier_full_access ON public.products;
DROP POLICY IF EXISTS productos_publicos ON public.products;
DROP POLICY IF EXISTS productos_proveedor ON public.products;

-- 2) Crear nuevas políticas
-- Lectura pública: cualquiera puede ver productos activos
CREATE POLICY products_view_marketplace
ON public.products
FOR SELECT 
USING (is_active = true AND deletion_status IS NULL);

-- Control total para el proveedor sobre sus productos
CREATE POLICY products_supplier_control
ON public.products
FOR ALL
USING (auth.uid()::uuid = supplier_id)
WITH CHECK (auth.uid()::uuid = supplier_id);

COMMIT;
