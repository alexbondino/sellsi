-- Garantizar que el rol anon tiene permisos de lectura
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON products TO anon;

-- Verificar y reforzar la política pública
DROP POLICY IF EXISTS "allow_public_products_read" ON products;
CREATE POLICY "allow_public_products_read"
ON products
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Asegurar que RLS está correctamente configurado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
