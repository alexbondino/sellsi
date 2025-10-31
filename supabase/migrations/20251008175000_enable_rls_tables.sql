-- Activar RLS en ambas tablas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Crear políticas públicas de lectura
CREATE POLICY "allow_public_products_read"
ON products
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_public_users_read"
ON users
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

-- Mantener los permisos de lectura
GRANT SELECT ON products TO public;
GRANT SELECT ON users TO public;
