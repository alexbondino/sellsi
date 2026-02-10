-- ============================================================================
-- MIGRACIÓN: Limpieza de duplicados en financing_documents
-- ============================================================================
-- Fecha: 2026-02-03 16:50:00
-- Módulo: Financiamiento
-- 
-- PROBLEMA:
-- Existen registros duplicados en financing_documents con el mismo par
-- (financing_request_id, document_type) que impiden crear constraint único
--
-- SOLUCIÓN:
-- Eliminar duplicados manteniendo el registro más reciente (por created_at)
-- ============================================================================

-- Paso 1: Identificar y loggear duplicados
DO $$
DECLARE
  v_duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO v_duplicate_count
  FROM (
    SELECT financing_request_id, document_type, COUNT(*) as cnt
    FROM public.financing_documents
    WHERE financing_request_id IS NOT NULL 
      AND document_type IS NOT NULL
    GROUP BY financing_request_id, document_type
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_duplicate_count > 0 THEN
    RAISE NOTICE 'Encontrados % grupos de duplicados', v_duplicate_count;
  ELSE
    RAISE NOTICE 'No hay duplicados, migración no necesaria';
  END IF;
END $$;

-- Paso 2: Eliminar duplicados manteniendo el más reciente
-- Usa CTE para identificar qué registros mantener
WITH ranked_documents AS (
  SELECT 
    id,
    financing_request_id,
    document_type,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY financing_request_id, document_type 
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) as rn
  FROM public.financing_documents
  WHERE financing_request_id IS NOT NULL 
    AND document_type IS NOT NULL
)
DELETE FROM public.financing_documents
WHERE id IN (
  SELECT id 
  FROM ranked_documents 
  WHERE rn > 1
);

-- Paso 3: Verificar que no quedan duplicados
DO $$
DECLARE
  v_remaining_duplicates integer;
BEGIN
  SELECT COUNT(*) INTO v_remaining_duplicates
  FROM (
    SELECT financing_request_id, document_type, COUNT(*) as cnt
    FROM public.financing_documents
    WHERE financing_request_id IS NOT NULL 
      AND document_type IS NOT NULL
    GROUP BY financing_request_id, document_type
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF v_remaining_duplicates > 0 THEN
    RAISE EXCEPTION 'Aún existen % duplicados después de limpieza', v_remaining_duplicates;
  ELSE
    RAISE NOTICE '✅ Limpieza completada exitosamente, no quedan duplicados';
  END IF;
END $$;

-- ============================================================================
-- NOTAS
-- ============================================================================
-- - Mantiene el registro MÁS RECIENTE (created_at DESC)
-- - Si created_at es NULL, usa id DESC como fallback
-- - Solo afecta registros con financing_request_id y document_type NOT NULL
-- - Registros legacy sin estos campos no se tocan

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- No es posible recuperar registros eliminados
-- Hacer backup ANTES si es necesario:
-- CREATE TABLE financing_documents_backup AS SELECT * FROM financing_documents;
