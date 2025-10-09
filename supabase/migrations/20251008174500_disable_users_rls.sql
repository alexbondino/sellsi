-- Desactivar RLS en users
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Asegurar permisos públicos para users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON users TO public;

-- Limpiar políticas existentes de users
DROP POLICY IF EXISTS "allow_public_users_read" ON users;
