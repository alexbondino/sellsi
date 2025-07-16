-- =====================================================
-- 👥 IMPLEMENTACIÓN DE SISTEMA DE BANEO DE USUARIOS
-- =====================================================
-- 
-- Descripción: Agrega funcionalidad de baneo de usuarios al sistema.
-- Este script agrega la columna 'banned' a la tabla 'users' con valor 
-- por defecto 'false'. La lógica de baneo se maneja a través de la 
-- columna Estado en el panel administrativo.
--
-- Autor: Panel Administrativo Sellsi
-- Fecha: 16 de Julio de 2025
-- Versión: 1.0.0
-- 
-- NOTA: Este script es seguro para ejecutar en producción.
-- =====================================================

-- Verificar que no exista la columna banned antes de agregarla
DO $$
BEGIN
    -- Verificar si la columna banned ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'banned' 
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna banned con valor por defecto false
        ALTER TABLE public.users 
        ADD COLUMN banned boolean NOT NULL DEFAULT false;
        
        -- Agregar comentario descriptivo a la columna
        COMMENT ON COLUMN public.users.banned IS 'Indica si el usuario está baneado. false = activo, true = baneado. Se maneja a través de la columna Estado en el panel administrativo.';
        
        -- Crear índice para optimizar consultas por estado de baneo
        CREATE INDEX IF NOT EXISTS idx_users_banned ON public.users(banned);
        
        -- Mensaje de confirmación
        RAISE NOTICE 'Columna "banned" agregada exitosamente a la tabla users';
    ELSE
        RAISE NOTICE 'La columna "banned" ya existe en la tabla users';
    END IF;
    
    -- Verificar si la columna banned_at ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'banned_at' 
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna banned_at para registrar cuándo se baneó
        ALTER TABLE public.users 
        ADD COLUMN banned_at timestamp with time zone NULL;
        
        -- Agregar comentario descriptivo a la columna
        COMMENT ON COLUMN public.users.banned_at IS 'Fecha y hora cuando el usuario fue baneado. NULL si nunca ha sido baneado.';
        
        -- Crear índice para optimizar consultas por fecha de baneo
        CREATE INDEX IF NOT EXISTS idx_users_banned_at ON public.users(banned_at);
        
        -- Mensaje de confirmación
        RAISE NOTICE 'Columna "banned_at" agregada exitosamente a la tabla users';
    ELSE
        RAISE NOTICE 'La columna "banned_at" ya existe en la tabla users';
    END IF;
    
    -- Verificar si la columna banned_reason ya existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'banned_reason' 
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna banned_reason para registrar el motivo del ban
        ALTER TABLE public.users 
        ADD COLUMN banned_reason text NULL;
        
        -- Agregar comentario descriptivo a la columna
        COMMENT ON COLUMN public.users.banned_reason IS 'Razón del baneo del usuario. NULL si no está baneado o no se especificó razón.';
        
        -- Mensaje de confirmación
        RAISE NOTICE 'Columna "banned_reason" agregada exitosamente a la tabla users';
    ELSE
        RAISE NOTICE 'La columna "banned_reason" ya existe en la tabla users';
    END IF;
END $$;

-- =====================================================
-- 📊 VERIFICACIÓN DE LA IMPLEMENTACIÓN
-- =====================================================

-- Verificar que las columnas se crearon correctamente
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('banned', 'banned_at', 'banned_reason')
AND table_schema = 'public'
ORDER BY column_name;

-- Verificar que todos los usuarios existentes tengan banned = false
SELECT 
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN banned = false THEN 1 END) as usuarios_activos,
    COUNT(CASE WHEN banned = true THEN 1 END) as usuarios_baneados,
    COUNT(CASE WHEN banned_at IS NOT NULL THEN 1 END) as usuarios_con_fecha_ban
FROM public.users;

-- Verificar que el índice se creó correctamente
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname IN ('idx_users_banned', 'idx_users_banned_at');

-- =====================================================
-- 🔧 FUNCIONES AUXILIARES PARA EL SISTEMA DE BANEO
-- =====================================================

-- Función para banear un usuario (opcional - para uso administrativo)
CREATE OR REPLACE FUNCTION ban_user(target_user_id UUID, admin_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users 
    SET 
        banned = true,
        banned_at = now(),
        banned_reason = admin_reason,
        updatedt = now()
    WHERE user_id = target_user_id;
    
    -- Verificar que la actualización fue exitosa
    IF FOUND THEN
        -- Log de la acción (opcional - requiere tabla de logs)
        -- INSERT INTO admin_logs (action, target_user_id, admin_reason, created_at)
        -- VALUES ('USER_BANNED', target_user_id, admin_reason, now());
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para desbanear un usuario (opcional - para uso administrativo)
CREATE OR REPLACE FUNCTION unban_user(target_user_id UUID, admin_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users 
    SET 
        banned = false,
        banned_at = NULL,
        banned_reason = NULL,
        updatedt = now()
    WHERE user_id = target_user_id;
    
    -- Verificar que la actualización fue exitosa
    IF FOUND THEN
        -- Log de la acción (opcional - requiere tabla de logs)
        -- INSERT INTO admin_logs (action, target_user_id, admin_reason, created_at)
        -- VALUES ('USER_UNBANNED', target_user_id, admin_reason, now());
        
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para consultar información de baneo de un usuario
CREATE OR REPLACE FUNCTION get_user_ban_info(target_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    email TEXT,
    is_banned BOOLEAN,
    banned_at TIMESTAMP WITH TIME ZONE,
    banned_reason TEXT,
    days_banned INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.user_nm::TEXT,
        u.email::TEXT,
        u.banned,
        u.banned_at,
        u.banned_reason,
        CASE 
            WHEN u.banned_at IS NOT NULL THEN 
                EXTRACT(DAYS FROM (now() - u.banned_at))::INTEGER
            ELSE NULL
        END as days_banned
    FROM public.users u
    WHERE u.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Función para listar todos los usuarios baneados
CREATE OR REPLACE FUNCTION get_banned_users()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    email TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    banned_reason TEXT,
    days_banned INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.user_id,
        u.user_nm::TEXT,
        u.email::TEXT,
        u.banned_at,
        u.banned_reason,
        EXTRACT(DAYS FROM (now() - u.banned_at))::INTEGER as days_banned
    FROM public.users u
    WHERE u.banned = true
    ORDER BY u.banned_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 🛡️ POLÍTICAS DE SEGURIDAD (RLS)
-- =====================================================

-- Las políticas RLS existentes se mantienen sin cambios.
-- El campo 'banned' será gestionado únicamente por administradores
-- a través del panel administrativo.

-- =====================================================
-- ✅ CONFIRMACIÓN FINAL
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE '✅ IMPLEMENTACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Se han agregado las siguientes columnas a la tabla users:';
    RAISE NOTICE '- banned (boolean): Estado de baneo del usuario';
    RAISE NOTICE '- banned_at (timestamp): Fecha y hora del baneo';
    RAISE NOTICE '- banned_reason (text): Razón del baneo';
    RAISE NOTICE 'Índices creados para optimizar consultas';
    RAISE NOTICE 'Funciones disponibles:';
    RAISE NOTICE '- ban_user(uuid, text): Banear usuario';
    RAISE NOTICE '- unban_user(uuid, text): Desbanear usuario';
    RAISE NOTICE '- get_user_ban_info(uuid): Info de baneo de usuario';
    RAISE NOTICE '- get_banned_users(): Lista de usuarios baneados';
    RAISE NOTICE 'La lógica de baneo se maneja a través de la columna Estado';
    RAISE NOTICE '==============================================';
END $$;

-- =====================================================
-- 📖 EJEMPLOS DE USO
-- =====================================================

-- Ejemplo 1: Banear un usuario
-- SELECT ban_user('user-uuid-here', 'Violación de términos de servicio');

-- Ejemplo 2: Desbanear un usuario
-- SELECT unban_user('user-uuid-here', 'Apelación aprobada');

-- Ejemplo 3: Consultar información de baneo de un usuario específico
-- SELECT * FROM get_user_ban_info('user-uuid-here');

-- Ejemplo 4: Listar todos los usuarios baneados
-- SELECT * FROM get_banned_users();

-- Ejemplo 5: Consultar usuarios baneados en los últimos 30 días
-- SELECT 
--     user_name,
--     email,
--     banned_at,
--     banned_reason,
--     days_banned
-- FROM get_banned_users()
-- WHERE banned_at >= (now() - INTERVAL '30 days');

-- Ejemplo 6: Estadísticas de baneo
-- SELECT 
--     COUNT(CASE WHEN banned = true THEN 1 END) as total_baneados,
--     COUNT(CASE WHEN banned = true AND banned_at >= (now() - INTERVAL '7 days') THEN 1 END) as baneados_ultima_semana,
--     COUNT(CASE WHEN banned = true AND banned_at >= (now() - INTERVAL '30 days') THEN 1 END) as baneados_ultimo_mes
-- FROM users;
