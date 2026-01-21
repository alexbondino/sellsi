-- 003_security_automation.sql
-- Plan: Policies RLS y funciones auxiliares para crons
-- Fecha: 2026-01-20
-- Autor: GitHub Copilot (generado)

-- NOTA: Supabase usa funciones como auth.uid() y auth.role() en policies.
-- Estas políticas deben revisarse en el dashboard para adaptarlas a tus claims.

BEGIN;

-- Habilitar RLS en tablas clave
ALTER TABLE IF EXISTS public.financing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.financing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.buyer ENABLE ROW LEVEL SECURITY;

-- Policy: Buyers pueden acceder solo a sus financiamientos
CREATE POLICY IF NOT EXISTS "buyer_access_financing" ON public.financing_requests
  FOR ALL
  USING (buyer_id::text = auth.uid() OR auth.role() = 'service_role' OR auth.role() = 'admin');

-- Policy: Suppliers pueden ver financiamientos donde son supplier
CREATE POLICY IF NOT EXISTS "supplier_access_financing" ON public.financing_requests
  FOR SELECT USING (supplier_id::text = auth.uid() OR auth.role() = 'service_role' OR auth.role() = 'admin');

-- Policy: Admin completo
CREATE POLICY IF NOT EXISTS "admin_all" ON public.financing_requests
  FOR ALL
  TO public
  USING (auth.role() = 'admin');

-- Policies para financings_transactions y documents (lectura sólo si pertenecen al financing)
CREATE POLICY IF NOT EXISTS "fin_tx_access" ON public.financing_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.financing_requests fr
      WHERE fr.id = public.financing_transactions.financing_request_id AND (fr.buyer_id::text = auth.uid() OR fr.supplier_id::text = auth.uid() OR auth.role() = 'admin')
    )
  );

CREATE POLICY IF NOT EXISTS "fin_doc_access" ON public.financing_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.financing_requests fr
      WHERE fr.id = public.financing_documents.financing_request_id AND (fr.buyer_id::text = auth.uid() OR fr.supplier_id::text = auth.uid() OR auth.role() = 'admin')
    )
  );

-- Ejemplo de función para expiración de financiamientos (para usar con pg_cron o scheduler externo)
CREATE OR REPLACE FUNCTION public.expire_due_financings()
RETURNS void AS $$
BEGIN
  UPDATE public.financing_requests
  SET status = 'expired', has_overdue = true, updated_at = now()
  WHERE due_date IS NOT NULL AND due_date < now()::date AND status = 'approved';

  -- Actualizar flags de buyer en bloque
  UPDATE public.buyer b
  SET has_overdue_financing = true
  FROM (
    SELECT DISTINCT buyer_id FROM public.financing_requests WHERE status = 'expired'
  ) t
  WHERE b.id = t.buyer_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ===== Cron jobs (configurar en Supabase Dashboard / CLI) =====
-- Plan de cron (Horario Chile):
-- 1) Expiración financiamientos: 1 3 * * * -> ejecutar SELECT public.expire_due_financings();
-- 2) Actualización mora: 5 3 * * * -> (podría re-ejecutar funciones adicionales)
-- 3) Notificaciones: 10 3 * * * -> llamar a un Edge Function que envíe notificaciones
-- Si usas pg_cron y tienes permisos: 
-- SELECT cron.schedule('expire_financings', '1 3 * * *', $$SELECT public.expire_due_financings();$$);

-- ===== Rollback =====
-- ALTER TABLE public.financing_requests DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.financing_transactions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.financing_documents DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.supplier DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.buyer DISABLE ROW LEVEL SECURITY;
-- DROP FUNCTION IF EXISTS public.expire_due_financings();
