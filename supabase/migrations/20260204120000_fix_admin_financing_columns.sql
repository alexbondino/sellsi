-- 20260204120000_fix_admin_financing_columns.sql
-- Migración: Agregar columnas faltantes para funcionalidad de admin en financing_requests y financing_documents
-- Fecha: 2026-02-04 12:00:00
-- Propósito: Resolver discrepancias entre código del control_panel y schema de BD
-- Ref: ANALISIS_COLUMNAS_FINANCING_ADMIN.md

BEGIN;

-- ============================================================================
-- PARTE 1: FINANCING_REQUESTS - Agregar columnas de aprobación/rechazo admin
-- ============================================================================

-- Columnas de aprobación por admin
ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS approved_by_admin_id uuid,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Columnas de rechazo (temporal)
ALTER TABLE public.financing_requests
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Agregar FK a control_panel_users (solo si la tabla existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='control_panel_users') THEN
    -- Verificar que la FK no existe antes de crearla
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid
      WHERE c.conname = 'financing_requests_approved_by_admin_id_fkey'
    ) THEN
      ALTER TABLE public.financing_requests
        ADD CONSTRAINT financing_requests_approved_by_admin_id_fkey 
        FOREIGN KEY (approved_by_admin_id) 
        REFERENCES public.control_panel_users(id)
        ON DELETE SET NULL;
    END IF;
  END IF;
END;
$$;

-- Backfill rejection_reason desde rejected_reason si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='financing_requests' AND column_name='rejected_reason'
  ) THEN
    -- Copiar datos de rejected_reason a rejection_reason
    UPDATE public.financing_requests
    SET rejection_reason = rejected_reason
    WHERE rejection_reason IS NULL AND rejected_reason IS NOT NULL;
  END IF;
END;
$$;

-- Comentarios para documentación
COMMENT ON COLUMN public.financing_requests.approved_by_admin_id IS 
  'ID del administrador de control_panel que aprobó este financiamiento por parte de Sellsi. NULL si aún no está aprobado.';

COMMENT ON COLUMN public.financing_requests.activated_at IS 
  'Fecha en que se activó el financiamiento (cuando se aprueba por Sellsi y queda disponible). Equivale a la fecha de aprobación.';

COMMENT ON COLUMN public.financing_requests.rejected_at IS 
  'Timestamp de cuándo se rechazó el financiamiento (por Sellsi o Supplier). NULL si no ha sido rechazado.';

COMMENT ON COLUMN public.financing_requests.rejection_reason IS 
  'Motivo por el cual se rechazó el financiamiento. Compatible con rejected_reason (alias/duplicado para compatibilidad). Solo se llena cuando status es rejected_by_sellsi o rejected_by_supplier.';

-- ============================================================================
-- PARTE 2: FINANCING_DOCUMENTS - Agregar uploaded_at para ordenamiento
-- ============================================================================

-- Agregar columna uploaded_at (para ordenamiento en queries admin)
ALTER TABLE public.financing_documents
  ADD COLUMN IF NOT EXISTS uploaded_at timestamptz DEFAULT now();

-- Backfill desde created_at para registros existentes
UPDATE public.financing_documents
SET uploaded_at = created_at
WHERE uploaded_at IS NULL AND created_at IS NOT NULL;

-- Establecer DEFAULT now() para nuevos registros
ALTER TABLE public.financing_documents
  ALTER COLUMN uploaded_at SET DEFAULT now();

COMMENT ON COLUMN public.financing_documents.uploaded_at IS 
  'Fecha/hora en que se cargó el documento. Usado para ordenamiento en listados admin. Por defecto usa el valor de created_at en backfill.';

-- ============================================================================
-- PARTE 3: ÍNDICES PARA OPTIMIZAR QUERIES ADMIN
-- ============================================================================

-- Índice para buscar financiamientos aprobados por un admin específico
CREATE INDEX IF NOT EXISTS idx_financing_approved_by_admin 
  ON public.financing_requests (approved_by_admin_id) 
  WHERE approved_by_admin_id IS NOT NULL;

-- Índice para buscar financiamientos por fecha de activación
CREATE INDEX IF NOT EXISTS idx_financing_activated_at 
  ON public.financing_requests (activated_at) 
  WHERE activated_at IS NOT NULL;

-- Índice para buscar financiamientos rechazados
CREATE INDEX IF NOT EXISTS idx_financing_rejected_at 
  ON public.financing_requests (rejected_at) 
  WHERE rejected_at IS NOT NULL;

-- Índice para ordenar documentos por fecha de subida
CREATE INDEX IF NOT EXISTS idx_financing_docs_uploaded_at 
  ON public.financing_documents (financing_id, uploaded_at DESC);

COMMIT;

-- ============================================================================
-- TESTING (ejecutar manualmente en dev/staging)
-- ============================================================================
-- Verificar que las columnas existen:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'financing_requests'
--   AND column_name IN ('approved_by_admin_id', 'activated_at', 'rejected_at', 'rejection_reason')
-- ORDER BY column_name;

-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'financing_documents'
--   AND column_name = 'uploaded_at';

-- Verificar FK:
-- SELECT conname, contype, confrelid::regclass
-- FROM pg_constraint
-- WHERE conname = 'financing_requests_approved_by_admin_id_fkey';

-- ============================================================================
-- ROLLBACK (solo para dev - NO ejecutar en producción sin backup)
-- ============================================================================
-- DROP INDEX IF EXISTS idx_financing_docs_uploaded_at;
-- DROP INDEX IF EXISTS idx_financing_rejected_at;
-- DROP INDEX IF EXISTS idx_financing_activated_at;
-- DROP INDEX IF EXISTS idx_financing_approved_by_admin;
-- ALTER TABLE public.financing_documents DROP COLUMN IF EXISTS uploaded_at;
-- ALTER TABLE public.financing_requests DROP CONSTRAINT IF EXISTS financing_requests_approved_by_admin_id_fkey;
-- ALTER TABLE public.financing_requests DROP COLUMN IF EXISTS rejection_reason;
-- ALTER TABLE public.financing_requests DROP COLUMN IF EXISTS rejected_at;
-- ALTER TABLE public.financing_requests DROP COLUMN IF EXISTS activated_at;
-- ALTER TABLE public.financing_requests DROP COLUMN IF EXISTS approved_by_admin_id;

-- ============================================================================
-- NOTAS DE DEPLOYMENT
-- ============================================================================
-- 1. Esta migración es IDEMPOTENTE - segura para ejecutar múltiples veces
-- 2. Ejecutar primero en dev/staging para validar
-- 3. Verificar que control_panel_users existe antes de ejecutar en prod
-- 4. Los índices pueden tardar en tablas grandes (considerar CONCURRENTLY fuera de transacción)
-- 5. Después de aplicar, verificar que adminFinancingService.js funciona correctamente
-- 6. rejection_reason es ADICIONAL a rejected_reason (compatibilidad código/frontend)
