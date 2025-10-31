-- Desactivar RLS temporalmente para diagnóstico
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Asegurar permisos públicos
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO public;

-- Limpiar todas las políticas existentes
DROP POLICY IF EXISTS "allow_public_products_read" ON products;
