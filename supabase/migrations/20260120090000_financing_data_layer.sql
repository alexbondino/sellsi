-- 20260120090000_financing_data_layer.sql
-- Módulo: Financiamiento - Data Layer
-- Fecha/Version: 2026-01-20 09:00:00
-- Autor: GitHub Copilot (generado)

-- ===== Recomendación =====
-- Ejecutar en una transacción en el entorno dev. Asegurarse que la extensión pgcrypto está habilitada:
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

BEGIN;

-- Tabla: buyer
CREATE TABLE IF NOT EXISTS public.buyer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL, -- referencia opcional al user auth
  name text NOT NULL,
  email text UNIQUE,
  has_overdue_financing boolean NOT NULL DEFAULT false,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: supplier
CREATE TABLE IF NOT EXISTS public.supplier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL, -- referencia opcional al user auth
  name text NOT NULL,
  legal_rut text NULL,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: financing_requests
CREATE TABLE IF NOT EXISTS public.financing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.buyer(id) ON DELETE CASCADE,
  supplier_id uuid NOT NULL REFERENCES public.supplier(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL,
  available_amount numeric(14,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, paid, expired, cancelled
  due_date date NULL,
  has_overdue boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: financing_transactions
CREATE TABLE IF NOT EXISTS public.financing_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financing_request_id uuid NOT NULL REFERENCES public.financing_requests(id) ON DELETE CASCADE,
  type text NOT NULL, -- use, refund, repayment
  amount numeric(14,2) NOT NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tabla: financing_documents
CREATE TABLE IF NOT EXISTS public.financing_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financing_request_id uuid NOT NULL REFERENCES public.financing_requests(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  uploaded_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices recomendados (objetivo: 8 índices)
CREATE INDEX IF NOT EXISTS idx_buyer_created_at ON public.buyer(created_at);
CREATE INDEX IF NOT EXISTS idx_supplier_created_at ON public.supplier(created_at);
CREATE INDEX IF NOT EXISTS idx_financing_requests_buyer_id ON public.financing_requests(buyer_id);
CREATE INDEX IF NOT EXISTS idx_financing_requests_supplier_id ON public.financing_requests(supplier_id);
CREATE INDEX IF NOT EXISTS idx_financing_requests_status ON public.financing_requests(status);
CREATE INDEX IF NOT EXISTS idx_financing_requests_due_date ON public.financing_requests(due_date);
CREATE INDEX IF NOT EXISTS idx_financing_transactions_financing_request_id ON public.financing_transactions(financing_request_id);
CREATE INDEX IF NOT EXISTS idx_financing_documents_financing_request_id ON public.financing_documents(financing_request_id);

-- Inicializar available_amount = amount cuando se crea (si aplica)
CREATE OR REPLACE FUNCTION public.financing_set_available_amount()
RETURNS trigger AS $$
BEGIN
  IF NEW.available_amount IS NULL THEN
    NEW.available_amount := NEW.amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_financing_set_available_amount ON public.financing_requests;
CREATE TRIGGER trg_financing_set_available_amount
BEFORE INSERT ON public.financing_requests
FOR EACH ROW
EXECUTE FUNCTION public.financing_set_available_amount();

-- Fin de transacción
COMMIT;

-- ===== Tests manuales (copiar/pegar en SQL editor de dev) =====
-- INSERT INTO public.buyer(name, email) VALUES ('Test Buyer', 'buyer@example.com');
-- INSERT INTO public.supplier(name, legal_rut) VALUES ('Test Supplier', '12345678-9');
-- -- Crear financiamiento
-- INSERT INTO public.financing_requests(buyer_id, supplier_id, amount, due_date) VALUES (
--   (SELECT id FROM public.buyer LIMIT 1),
--   (SELECT id FROM public.supplier LIMIT 1),
--   100000.00,
--   now()::date + 30
-- );

-- ===== Rollback (en caso de error) =====
-- DROP TABLE IF EXISTS public.financing_documents CASCADE;
-- DROP TABLE IF EXISTS public.financing_transactions CASCADE;
-- DROP TABLE IF EXISTS public.financing_requests CASCADE;
-- DROP TABLE IF EXISTS public.supplier CASCADE;
-- DROP TABLE IF EXISTS public.buyer CASCADE;
