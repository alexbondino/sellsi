BEGIN;

-- Eliminar TODAS las políticas existentes para productos
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.products', pol.policyname);
    END LOOP;
END
$$;

-- Habilitar RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Política para ver TODOS los productos activos (marketplace)
CREATE POLICY "marketplace_view_products"
ON public.products
FOR SELECT 
TO public
USING (true);

-- Política para control total del proveedor sobre sus productos
CREATE POLICY "supplier_manage_products"
ON public.products
FOR ALL
TO authenticated
USING (auth.uid()::uuid = supplier_id)
WITH CHECK (auth.uid()::uuid = supplier_id);

COMMIT;
