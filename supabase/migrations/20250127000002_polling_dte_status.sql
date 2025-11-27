-- ============================================================
-- Migration: Polling automático de estados DTE con pg_cron
-- ============================================================
-- 
-- PROPÓSITO:
-- Configura un cron job que llama a la Edge Function poll-dte-status
-- cada 5 minutos para actualizar estados de DTEs enviados al SII.
--
-- REQUISITOS:
-- 1. Extensión pg_cron habilitada (ya existe en 20240803160008)
-- 2. Extensión pg_net habilitada (para HTTP requests)
-- 3. Edge Function poll-dte-status desplegada
--
-- NOTA: Reemplazar YOUR_PROJECT_REF y YOUR_SERVICE_ROLE_KEY
-- con los valores reales de tu proyecto Supabase.
-- ============================================================

-- 1. Habilitar extensión pg_net (pg_cron ya existe en schema extensions)
-- pg_cron ya está habilitado en 20240803160008_enable_pg_cron_extension.sql
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Agregar columnas para estados SII en supplier_dtes (si no existen)
-- NOTA: La tabla supplier_dtes ya tiene 'estado' y 'glosa_estado' (M1).
-- Estas nuevas columnas almacenan el estado CRUDO del SII (código y glosa literal).
-- - estado: Estado interno normalizado (ACEPTADO, RECHAZADO, etc.)
-- - estado_sii: Código crudo del SII (DOK, RCH, EPR, etc.)
-- - glosa_estado: Mensaje interno de la aplicación (ya existe en M1)
-- - glosa_sii: Mensaje literal de respuesta del SII
DO $$
BEGIN
    -- Columna para el código de estado crudo del SII
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_dtes' 
        AND column_name = 'estado_sii'
    ) THEN
        ALTER TABLE supplier_dtes ADD COLUMN estado_sii VARCHAR(10);
        COMMENT ON COLUMN supplier_dtes.estado_sii IS 'Código de estado crudo del SII (DOK, RCH, EPR, etc.). Diferente de "estado" que es el estado interno normalizado.';
    END IF;

    -- Columna para la glosa/mensaje del SII
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_dtes' 
        AND column_name = 'glosa_sii'
    ) THEN
        ALTER TABLE supplier_dtes ADD COLUMN glosa_sii TEXT;
        COMMENT ON COLUMN supplier_dtes.glosa_sii IS 'Mensaje/glosa literal de respuesta del SII. Diferente de "glosa_estado" que es el mensaje interno de la app.';
    END IF;
END $$;

-- 3. Crear tabla de logs de polling (opcional pero recomendado)
CREATE TABLE IF NOT EXISTS polling_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name VARCHAR(100) NOT NULL,
    processed INT DEFAULT 0,
    updated INT DEFAULT 0,
    errors INT DEFAULT 0,
    duration_ms INT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas por fecha
CREATE INDEX IF NOT EXISTS idx_polling_logs_created_at 
ON polling_logs(created_at DESC);

-- Nota: No se crea índice parcial con NOW() porque no es inmutable.
-- La limpieza de logs antiguos se hace via la función cleanup_old_polling_logs()

COMMENT ON TABLE polling_logs IS 'Registro de ejecuciones del polling de estados DTE';

-- Habilitar RLS en polling_logs (solo service_role puede escribir, admins pueden leer)
ALTER TABLE polling_logs ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede insertar (Edge Functions)
CREATE POLICY "Service role can insert polling_logs"
  ON polling_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role puede leer todo
CREATE POLICY "Service role can read polling_logs"
  ON polling_logs FOR SELECT
  USING (auth.role() = 'service_role');

-- 4. Crear índice para optimizar la consulta de DTEs pendientes
-- Incluye supplier_id para filtros manuales por proveedor
CREATE INDEX IF NOT EXISTS idx_supplier_dtes_pending_status
ON supplier_dtes(supplier_id, estado, created_at)
WHERE estado = 'ENVIADO' AND track_id IS NOT NULL AND track_id != '';

-- 4b. Registrar TODAS las Edge Functions del módulo Invoicer en el catálogo
INSERT INTO edge_functions (function_name, display_name, category, owner, sla_ms, is_active)
VALUES 
  ('billing-status', 'Estado Facturación', 'invoicer', 'invoicer-team', 1500, true),
  ('emit-dte', 'Emisión DTE', 'invoicer', 'invoicer-team', 5000, true),
  ('upload-certificate', 'Subida Certificado', 'invoicer', 'invoicer-team', 3000, true),
  ('upload-caf', 'Subida Folios CAF', 'invoicer', 'invoicer-team', 3000, true),
  ('get-invoice-url', 'URL Factura PDF', 'invoicer', 'invoicer-team', 2000, true),
  ('poll-dte-status', 'Polling Estado DTE SII', 'invoicer', 'invoicer-team', 30000, true),
  ('preview-invoice', 'Vista Previa Factura', 'invoicer', 'invoicer-team', 2000, true)
ON CONFLICT (function_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category = EXCLUDED.category,
  owner = EXCLUDED.owner,
  sla_ms = EXCLUDED.sla_ms,
  is_active = true;

-- ============================================================
-- 5. CONFIGURAR CRON JOB
-- ============================================================
-- 
-- IMPORTANTE: Ejecutar este bloque MANUALMENTE después de:
-- 1. Desplegar la Edge Function poll-dte-status
-- 2. Reemplazar los valores de configuración
--
-- Opción A: Desde el Dashboard de Supabase (SQL Editor)
-- Opción B: Desde psql con los valores correctos
--
-- NOTA: pg_cron está en schema 'extensions' pero sus funciones 
-- se exponen via pg_catalog, así que se llaman como cron.schedule()
-- ============================================================

-- Descomentar y ejecutar manualmente con valores reales:
-- SELECT cron.schedule(
--     'poll-dte-status-job',           -- nombre único del job
--     '*/5 * * * *',                    -- cada 5 minutos
--     $$
--     SELECT net.http_post(
--         url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/poll-dte-status',
--         headers := jsonb_build_object(
--             'Content-Type', 'application/json',
--             'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--         ),
--         body := '{}'::jsonb
--     );
--     $$
-- );

-- ============================================================
-- COMANDOS ÚTILES PARA GESTIÓN DEL CRON
-- ============================================================

-- Ver jobs programados:
-- SELECT * FROM cron.job;

-- Ver historial de ejecuciones:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Pausar el job:
-- SELECT cron.unschedule('poll-dte-status-job');

-- Reactivar el job (volver a ejecutar el schedule):
-- SELECT cron.schedule(...);

-- Ejecutar manualmente (para testing):
-- SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/poll-dte-status',
--     headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body := '{}'::jsonb
-- );

-- ============================================================
-- 6. FUNCIÓN PARA LIMPIAR LOGS ANTIGUOS (opcional)
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_polling_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM polling_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Programar limpieza semanal (domingo a las 3 AM)
-- Descomentar y ejecutar manualmente:
/*
SELECT cron.schedule(
    'cleanup-polling-logs',
    '0 3 * * 0',  -- Domingo 3 AM
    'SELECT cleanup_old_polling_logs();'
);
*/

-- ============================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================
-- 
-- 1. El cron se ejecuta cada 5 minutos
-- 2. Solo procesa DTEs con estado 'ENVIADO' y track_id válido
-- 3. Ignora DTEs muy recientes (< 2 min) para dar tiempo al SII
-- 4. Ignora DTEs muy antiguos (> 7 días) para no saturar
-- 5. Procesa máximo 50 DTEs por ejecución
-- 6. Los logs se guardan en polling_logs para auditoría
--
-- HÍBRIDO: Además del polling automático, el UI debería tener
-- un botón "Actualizar Estado" que llame a la misma función
-- bajo demanda (filtrado por supplierId o dteId específico).
-- ============================================================
