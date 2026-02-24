-- 20260223140000_my_documents_perf_indexes.sql
-- Módulo: /my-documents - Índices de performance (buyer/supplier financings, docs, invoices)
-- Fecha/Version: 2026-02-23

-- NOTA TECH LEAD:
-- - Estos índices apuntan a optimizar queries con filtro+orden en /my-documents.
-- - En producción, si necesitas minimizar bloqueos, ejecutar manualmente con CONCURRENTLY.
-- - IMPORTANTE: algunas herramientas (y/o SQL editors) ejecutan migraciones dentro de una transacción.
--   Por compatibilidad con `supabase db push`, aquí NO usamos CONCURRENTLY.

BEGIN;

-- Financiamiento: listado por owner (buyer/supplier) ordenado por created_at DESC
CREATE INDEX IF NOT EXISTS idx_financing_requests_buyer_created_at
  ON public.financing_requests (buyer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financing_requests_supplier_created_at
  ON public.financing_requests (supplier_id, created_at DESC);

-- Documentos financiamiento: lookup por financing_request_id ordenado por uploaded_at DESC
CREATE INDEX IF NOT EXISTS idx_financing_documents_request_uploaded_at
  ON public.financing_documents (financing_request_id, uploaded_at DESC);

-- Facturas: supplier lista por supplier_id ordenado por created_at DESC
CREATE INDEX IF NOT EXISTS idx_invoices_meta_supplier_created_at
  ON public.invoices_meta (supplier_id, created_at DESC);

-- Facturas: buyer lista ordenado por created_at DESC (RLS filtra por ownership)
CREATE INDEX IF NOT EXISTS idx_invoices_meta_created_at
  ON public.invoices_meta (created_at DESC);

COMMIT;
