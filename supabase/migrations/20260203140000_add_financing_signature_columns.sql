-- 20260203140000_add_financing_signature_columns.sql
-- Módulo: Financiamiento - Columnas de Firmas
-- Fecha/Version: 2026-02-03 14:00:00
-- Objetivo: Agregar columnas de firma requeridas por los triggers de financing_documents
--           que ya existen pero hacen referencia a columnas que no fueron creadas

BEGIN;

-- Agregar columnas de timestamps de firmas a financing_requests
ALTER TABLE public.financing_requests 
  ADD COLUMN IF NOT EXISTS signed_buyer_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_supplier_at timestamptz,
  ADD COLUMN IF NOT EXISTS signed_sellsi_at timestamptz;

-- Índices para consultas de estado de firmas
CREATE INDEX IF NOT EXISTS idx_financing_requests_signed_buyer 
  ON public.financing_requests(signed_buyer_at) 
  WHERE signed_buyer_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financing_requests_signed_supplier 
  ON public.financing_requests(signed_supplier_at) 
  WHERE signed_supplier_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_financing_requests_signed_sellsi 
  ON public.financing_requests(signed_sellsi_at) 
  WHERE signed_sellsi_at IS NOT NULL;

COMMIT;

-- ===== Rollback =====
-- DROP INDEX IF EXISTS idx_financing_requests_signed_sellsi;
-- DROP INDEX IF EXISTS idx_financing_requests_signed_supplier;
-- DROP INDEX IF EXISTS idx_financing_requests_signed_buyer;
-- ALTER TABLE public.financing_requests DROP COLUMN IF EXISTS signed_sellsi_at, DROP COLUMN IF EXISTS signed_supplier_at, DROP COLUMN IF EXISTS signed_buyer_at;
