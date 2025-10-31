-- Limpiar políticas existentes
DROP POLICY IF EXISTS "allow_public_select_products" ON products;
DROP POLICY IF EXISTS "Lectura pública de productos" ON products;
DROP POLICY IF EXISTS "Productos visibles públicamente" ON products;
DROP POLICY IF EXISTS "products_policy" ON products;

-- Resetear RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Crear política simple de lectura pública
CREATE POLICY "products_public_read"
ON products
FOR SELECT
TO public
USING (true);
