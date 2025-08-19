-- Migration: RLS policies for invoices_meta to fix client insert denial
-- Fecha: 2025-08-19
-- Objetivo: Permitir que el usuario autenticado (supplier) inserte y lea sus propias filas de invoices_meta.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'invoices_meta'
  ) THEN
    -- Enable RLS if not enabled
    PERFORM 1 FROM pg_tables WHERE schemaname='public' AND tablename='invoices_meta' AND rowsecurity;
    IF NOT FOUND THEN
      EXECUTE 'ALTER TABLE public.invoices_meta ENABLE ROW LEVEL SECURITY';
    END IF;

    -- Insert policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices_meta' AND policyname='Allow insert own invoice meta'
    ) THEN
      EXECUTE $pol$CREATE POLICY "Allow insert own invoice meta" ON public.invoices_meta
        FOR INSERT
        WITH CHECK ( auth.uid() = user_id OR auth.uid() = supplier_id )$pol$;
    END IF;

    -- Select policy
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices_meta' AND policyname='Allow select own invoice meta'
    ) THEN
      EXECUTE $pol$CREATE POLICY "Allow select own invoice meta" ON public.invoices_meta
        FOR SELECT
        USING ( auth.uid() = user_id OR auth.uid() = supplier_id )$pol$;
    END IF;

    -- Update policy (optional)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices_meta' AND policyname='Allow update own invoice meta'
    ) THEN
      EXECUTE $pol$CREATE POLICY "Allow update own invoice meta" ON public.invoices_meta
        FOR UPDATE
        USING ( auth.uid() = user_id OR auth.uid() = supplier_id )
        WITH CHECK ( auth.uid() = user_id OR auth.uid() = supplier_id )$pol$;
    END IF;

    -- Delete policy (optional)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices_meta' AND policyname='Allow delete own invoice meta'
    ) THEN
      EXECUTE $pol$CREATE POLICY "Allow delete own invoice meta" ON public.invoices_meta
        FOR DELETE
        USING ( auth.uid() = user_id OR auth.uid() = supplier_id )$pol$;
    END IF;
  END IF;
END;$$;

-- Optional index on order_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='invoices_meta' AND column_name='order_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='invoices_meta' AND indexname='invoices_meta_order_id_idx'
    ) THEN
      EXECUTE 'CREATE INDEX invoices_meta_order_id_idx ON public.invoices_meta(order_id)';
    END IF;
  END IF;
END;$$;

-- -----------------------------------------------------------------------------
-- (Merged) Buyer read access + storage objects policies from former
--         20250819130500_invoices_access_buyer.sql
-- Fecha: 2025-08-19 (unificada)
-- Objetivo adicional: permitir que el comprador lea metadata y archivos PDF.
-- Suposición path bucket 'invoices': supplier_id/order_id/archivo.pdf
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices_meta') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices_meta' AND policyname='Allow buyer select invoice meta'
    ) THEN
      EXECUTE $pol$CREATE POLICY "Allow buyer select invoice meta" ON public.invoices_meta
        FOR SELECT
        USING (
          auth.uid() = user_id
          OR auth.uid() = supplier_id
          OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = invoices_meta.order_id AND o.user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.carts c WHERE c.cart_id = invoices_meta.order_id AND c.user_id = auth.uid())
        )$pol$;
    END IF;
  END IF;
END;$$;

-- storage.objects (bucket 'invoices') policies
DO $$
BEGIN
  -- SELECT policy (supplier owner or buyer if order/cart belongs to them)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='invoices select supplier or buyer'
  ) THEN
    EXECUTE $pol$CREATE POLICY "invoices select supplier or buyer" ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'invoices' AND (
          auth.uid() = split_part(name,'/',1)::uuid
          OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = split_part(name,'/',2)::uuid AND o.user_id = auth.uid())
          OR EXISTS (SELECT 1 FROM public.carts c WHERE c.cart_id = split_part(name,'/',2)::uuid AND c.user_id = auth.uid())
        )
      )$pol$;
  END IF;

  -- INSERT policy (only supplier/owner)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='invoices insert supplier'
  ) THEN
    EXECUTE $pol$CREATE POLICY "invoices insert supplier" ON storage.objects
      FOR INSERT
      WITH CHECK (
  bucket_id = 'invoices' AND auth.uid() = split_part(name,'/',1)::uuid
      )$pol$;
  END IF;
END;$$;

-- Fin migración unificada
