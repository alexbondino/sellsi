-- Migración para agregar campo de documento tributario
-- Fecha: 2025-08-05

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'document_types' 
        AND table_schema = 'public'
    ) THEN
        -- Agregar columna document_types a la tabla users
        ALTER TABLE public.users 
        ADD COLUMN document_types text[] DEFAULT '{}';
        
        -- Comentario para documentar el campo
        COMMENT ON COLUMN public.users.document_types IS 'Tipos de documentos tributarios que el usuario puede emitir: ninguno, boleta, factura';
        
        -- Crear índice para mejorar las consultas por tipo de documento
        CREATE INDEX idx_users_document_types ON public.users USING GIN (document_types);
        
        -- Agregar constraint para validar solo valores permitidos
        ALTER TABLE public.users 
        ADD CONSTRAINT check_document_types 
        CHECK (
            document_types <@ ARRAY['ninguno', 'boleta', 'factura']::text[]
        );
        
        RAISE NOTICE 'Campo document_types agregado exitosamente';
    ELSE
        RAISE NOTICE 'El campo document_types ya existe';
    END IF;
END $$;
