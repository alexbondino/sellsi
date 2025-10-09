-- Eliminar políticas existentes
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "allow_public_select_products" ON products;
DROP POLICY IF EXISTS "Lectura pública de productos" ON products;
DROP POLICY IF EXISTS "Productos visibles públicamente" ON products;

-- Resetear RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Crear política permisiva para lectura pública
CREATE POLICY "allow_public_products_read"
ON products
AS PERMISSIVE
FOR SELECT
TO public
USING (true);
