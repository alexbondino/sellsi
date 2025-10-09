-- Ver todas las políticas actuales en products
SELECT *
FROM pg_policies
WHERE tablename = 'products';

-- Ver si RLS está habilitado
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'products';

-- Ver permisos de la tabla
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'products';

-- Información de debug en consola
DO $$
BEGIN 
    RAISE NOTICE 'Estado actual de RLS en products:';
    -- Verificar si hay políticas que puedan estar bloqueando el acceso
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' 
        AND permissive = 'PERMISSIVE'
        AND cmd = 'SELECT'
    ) THEN
        RAISE NOTICE 'No hay políticas PERMISSIVE para SELECT en products';
    END IF;
END $$;
