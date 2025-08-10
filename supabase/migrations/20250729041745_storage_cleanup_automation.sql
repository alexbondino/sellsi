-- ============================================================================
-- STORAGE CLEANUP AUTOMATION - AUTOMATIZACIÓN DE LIMPIEZA DE ALMACENAMIENTO
-- ============================================================================
-- 
-- Este script configura la limpieza automática del almacenamiento mediante:
-- 1. Tabla para logs de limpieza
-- 2. Función para triggear la Edge Function
-- 3. Cron job para ejecución diaria
-- 4. Función de reporte semanal
-- 5. Mejora del sistema de ordenamiento de imágenes

-- ============================================================================
-- SECCIÓN 1: MEJORA SISTEMA DE ORDENAMIENTO DE IMÁGENES
-- ============================================================================

-- Agregar columna para mantener orden de imágenes
ALTER TABLE public.product_images 
ADD COLUMN IF NOT EXISTS image_order INTEGER DEFAULT 0;

-- Actualizar imágenes existentes con orden basado en la URL (temporal)
UPDATE public.product_images 
SET image_order = (
  SELECT ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY image_url) - 1
  FROM (
    SELECT DISTINCT product_id, image_url 
    FROM public.product_images
  ) AS ordered_images 
  WHERE ordered_images.product_id = product_images.product_id 
    AND ordered_images.image_url = product_images.image_url
)
WHERE image_order = 0;

-- Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_product_images_order 
ON public.product_images(product_id, image_order);

-- ============================================================================
-- SECCIÓN 2: AUTOMATIZACIÓN DE LIMPIEZA DE ALMACENAMIENTO
-- ============================================================================

-- 2. Crear tabla para logs de limpieza (opcional)
CREATE TABLE IF NOT EXISTS storage_cleanup_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    products_processed INTEGER NOT NULL DEFAULT 0,
    files_removed INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER NOT NULL DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    success BOOLEAN NOT NULL DEFAULT true,
    trigger_type TEXT DEFAULT 'scheduled', -- 'scheduled', 'manual', 'webhook'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_executed_at ON storage_cleanup_logs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_cleanup_logs_success ON storage_cleanup_logs(success);

-- 3. Habilitar la extensión de HTTP para llamadas a Edge Functions
CREATE EXTENSION IF NOT EXISTS http;

-- 4. Función para triggear la limpieza diaria
-- 4. Función para triggear la limpieza diaria
CREATE OR REPLACE FUNCTION trigger_daily_storage_cleanup()
RETURNS void AS $$
DECLARE
    function_url text;
    service_key text;
    cleanup_token text;
    response record;
BEGIN
    -- Obtener configuración desde variables de entorno o configuración
    -- ⚠️ IMPORTANTE: Configurar estos valores de forma segura en producción
    function_url := 'https://your-project-id.supabase.co/functions/v1/daily-cleanup';
    service_key := current_setting('app.supabase_service_key', true);
    cleanup_token := current_setting('app.cleanup_secret_token', true);
    
    -- Validar que tenemos las credenciales necesarias
    IF cleanup_token IS NULL OR cleanup_token = '' THEN
        RAISE WARNING 'Token de limpieza no configurado. Abortando limpieza automática.';
        RETURN;
    END IF;
    
    -- Log del inicio
    RAISE NOTICE 'Iniciando limpieza automática robusta de storage...';
    
    -- Llamar a la Edge Function con token secreto
    SELECT INTO response
        status,
        content::json as body
    FROM http((
        'POST',
        function_url,
        ARRAY[
            http_header('Authorization', 'Bearer ' || cleanup_token),
            http_header('Content-Type', 'application/json')
        ],
        'application/json',
        '{"dryRun": false, "maxProducts": 1000}'
    )::http_request);
    
    -- Log del resultado detallado
    IF response.status = 200 THEN
        RAISE NOTICE 'Limpieza robusta completada exitosamente: %', response.body;
    ELSIF response.status = 207 THEN
        RAISE NOTICE 'Limpieza completada con advertencias: %', response.body;
    ELSE
        RAISE WARNING 'Error en limpieza automática. Status: %, Body: %', response.status, response.body;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error ejecutando limpieza automática robusta: %', SQLERRM;
        
        -- Insertar log de error
        INSERT INTO storage_cleanup_logs (
            executed_at,
            products_processed,
            files_removed,
            execution_time_ms,
            errors,
            success,
            trigger_type
        ) VALUES (
            NOW(),
            0,
            0,
            0,
            jsonb_build_array(SQLERRM),
            false,
            'scheduled_robust'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Programar ejecución diaria a las 2:00 AM
-- Nota: Requiere la extensión pg_cron habilitada en Supabase
SELECT cron.schedule(
    'daily-storage-cleanup',
    '0 2 * * *',
    'SELECT trigger_daily_storage_cleanup();'
);

-- 6. Función para generar reporte semanal
CREATE OR REPLACE FUNCTION generate_weekly_cleanup_report()
RETURNS TABLE (
    week_start date,
    week_end date,
    total_executions bigint,
    successful_executions bigint,
    total_products_processed bigint,
    total_files_removed bigint,
    avg_execution_time_ms numeric,
    success_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH weekly_stats AS (
        SELECT 
            date_trunc('week', executed_at)::date as week_start,
            COUNT(*) as executions,
            COUNT(*) FILTER (WHERE success = true) as successful,
            SUM(products_processed) as products,
            SUM(files_removed) as files,
            AVG(execution_time_ms) as avg_time
        FROM storage_cleanup_logs
        WHERE executed_at >= NOW() - INTERVAL '4 weeks'
        GROUP BY date_trunc('week', executed_at)
        ORDER BY week_start DESC
    )
    SELECT 
        ws.week_start,
        (ws.week_start + INTERVAL '6 days')::date as week_end,
        ws.executions,
        ws.successful,
        ws.products,
        ws.files,
        ROUND(ws.avg_time, 2) as avg_execution_time_ms,
        CASE 
            WHEN ws.executions = 0 THEN 0
            ELSE ROUND((ws.successful::numeric / ws.executions::numeric) * 100, 1)
        END as success_rate
    FROM weekly_stats ws;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Programar reporte semanal los lunes a las 8:00 AM
SELECT cron.schedule(
    'weekly-cleanup-report',
    '0 8 * * 1',
    'SELECT * FROM generate_weekly_cleanup_report();'
);

-- 8. Función para limpieza manual (emergency)
CREATE OR REPLACE FUNCTION manual_storage_cleanup()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Ejecutando limpieza manual de storage...';
    PERFORM trigger_daily_storage_cleanup();
    
    -- Marcar como manual en los logs
    UPDATE storage_cleanup_logs 
    SET trigger_type = 'manual'
    WHERE executed_at >= NOW() - INTERVAL '1 minute'
      AND trigger_type = 'scheduled';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Función para obtener estadísticas actuales
CREATE OR REPLACE FUNCTION get_storage_health_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'last_cleanup', (
            SELECT json_build_object(
                'executed_at', executed_at,
                'success', success,
                'files_removed', files_removed,
                'products_processed', products_processed,
                'execution_time_ms', execution_time_ms
            )
            FROM storage_cleanup_logs
            ORDER BY executed_at DESC
            LIMIT 1
        ),
        'total_products', (
            SELECT COUNT(*) FROM products
        ),
        'products_with_images', (
            SELECT COUNT(DISTINCT product_id) FROM product_images
        ),
        'total_images', (
            SELECT COUNT(*) FROM product_images
        ),
        'cleanup_stats_last_30_days', (
            SELECT json_build_object(
                'total_executions', COUNT(*),
                'successful_executions', COUNT(*) FILTER (WHERE success = true),
                'total_files_removed', COALESCE(SUM(files_removed), 0),
                'avg_execution_time_ms', ROUND(AVG(execution_time_ms), 2)
            )
            FROM storage_cleanup_logs
            WHERE executed_at >= NOW() - INTERVAL '30 days'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Vista para monitoreo fácil
CREATE OR REPLACE VIEW storage_health_dashboard AS
SELECT 
    scl.executed_at,
    scl.success,
    scl.products_processed,
    scl.files_removed,
    scl.execution_time_ms,
    scl.trigger_type,
    CASE 
        WHEN scl.success THEN '✅ Exitoso'
        ELSE '❌ Falló'
    END as status_display,
    CASE 
        WHEN scl.execution_time_ms < 5000 THEN '⚡ Rápido'
        WHEN scl.execution_time_ms < 15000 THEN '⏱️ Normal'
        ELSE '🐌 Lento'
    END as performance_display
FROM storage_cleanup_logs scl
ORDER BY scl.executed_at DESC;

-- 11. Comentarios para administradores
COMMENT ON TABLE storage_cleanup_logs IS 'Log de ejecuciones de limpieza automática del almacenamiento';
COMMENT ON FUNCTION trigger_daily_storage_cleanup() IS 'Función para triggear la limpieza diaria de archivos huérfanos';
COMMENT ON FUNCTION generate_weekly_cleanup_report() IS 'Genera reporte semanal de estadísticas de limpieza';
COMMENT ON FUNCTION manual_storage_cleanup() IS 'Ejecuta limpieza manual de emergencia';
COMMENT ON FUNCTION get_storage_health_stats() IS 'Obtiene estadísticas actuales de salud del almacenamiento';
COMMENT ON VIEW storage_health_dashboard IS 'Dashboard de monitoreo de limpieza de almacenamiento';
COMMENT ON COLUMN product_images.image_order IS 'Orden de inserción de las imágenes para mantener secuencia original';
COMMENT ON INDEX idx_product_images_order IS 'Índice para optimizar consultas de imágenes ordenadas por producto';

-- ============================================================================
-- INSTRUCCIONES DE USO CON CORRECCIONES APLICADAS
-- ============================================================================
/*
🔧 CONFIGURACIÓN INICIAL REQUERIDA:
1. Variables de entorno en Edge Function:
   - SUPABASE_URL: URL de tu proyecto Supabase
   - SUPABASE_SERVICE_ROLE_KEY: Clave de servicio
   - CLEANUP_SECRET_TOKEN: Token secreto personalizado (generalo único)

2. Variables de entorno en PostgreSQL (usando pg_settings):
   ALTER DATABASE postgres SET app.cleanup_secret_token = 'tu-token-secreto-aqui';
   ALTER DATABASE postgres SET app.supabase_service_key = 'tu-service-key';

📋 COMANDOS DE USO:

1. Para ejecutar limpieza manual:
   SELECT manual_storage_cleanup();

2. Para ver estadísticas actuales:
   SELECT get_storage_health_stats();

3. Para ver dashboard de monitoreo:
   SELECT * FROM storage_health_dashboard LIMIT 10;

4. Para generar reporte semanal:
   SELECT * FROM generate_weekly_cleanup_report();

5. Para verificar cron jobs activos:
   SELECT * FROM cron.job WHERE jobname LIKE '%cleanup%';

6. Para pausar limpieza automática:
   SELECT cron.unschedule('daily-storage-cleanup');

7. Para reactivar limpieza automática:
   SELECT cron.schedule('daily-storage-cleanup', '0 2 * * *', 'SELECT trigger_daily_storage_cleanup();');

8. Para probar Edge Function manualmente (con curl):
   curl -X POST 'https://your-project.supabase.co/functions/v1/daily-cleanup' \
        -H 'Authorization: Bearer tu-cleanup-secret-token' \
        -H 'Content-Type: application/json' \
        -d '{"dryRun": true, "maxProducts": 10}'

🛡️ CORRECCIONES APLICADAS:
✅ Autenticación robusta con token secreto personalizado
✅ Paginación completa para listar archivos (sin límite de 1000)  
✅ URL parsing robusto usando constructor URL
✅ Filtrado preciso sin falsos positivos usando patrones exactos
✅ Tasa de éxito calculada por productos únicos fallidos
✅ Validación completa del cuerpo de la request
✅ Validación de variables de entorno al inicio

🚀 MEJORAS DE RENDIMIENTO:
- Procesamiento en lotes optimizado
- Manejo robusto de errores
- Logging detallado para debugging
- Métricas precisas de performance
- Soporte para dry-run y testing
*/
