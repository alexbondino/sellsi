-- =====================================================
-- OFERS QUERIES MIGRATION
-- Fecha: 2025-09-02
-- Crea vista de detalles y RPCs de lectura para ofertas
-- =====================================================

-- Crear la vista solo si no existe (evita errores al reemplazar vistas con columnas distintas)
DO $do$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v' AND c.relname = 'offers_with_details'
  ) THEN
    EXECUTE $view$
    CREATE VIEW public.offers_with_details AS
    SELECT o.id,
           o.buyer_id,
           o.supplier_id,
           o.product_id,
           o.offered_price,
           o.offered_quantity,
           o.message,
           o.status,
           o.created_at,
           o.expires_at,
           o.accepted_at,
           o.purchase_deadline,
           o.purchased_at,
           o.rejected_at,
           o.expired_at,
           o.rejection_reason,
           o.tier_price_at_offer,
           o.base_price_at_offer,
           o.stock_reserved,
           o.reserved_at,
           o.updated_at,
           p.spec_name AS product_name,
           p.price AS current_product_price,
           p.productqty AS current_stock,
           u.user_nm AS buyer_name,
           s.user_nm AS supplier_name
    FROM public.offers o
    LEFT JOIN public.products p ON p.productid = o.product_id
    LEFT JOIN public.users u ON u.user_id = o.buyer_id
    LEFT JOIN public.users s ON s.user_id = o.supplier_id;
    $view$;
  END IF;
END $do$;

-- =====================================================
-- RPC: get_buyer_offers
-- =====================================================
create or replace function public.get_buyer_offers(p_buyer_id uuid)
returns setof public.offers_with_details
language sql
stable
security definer
as $$
  select *
  from public.offers_with_details
  where buyer_id = p_buyer_id
  order by created_at desc;
$$;

-- =====================================================
-- RPC: get_supplier_offers
-- =====================================================
create or replace function public.get_supplier_offers(p_supplier_id uuid)
returns setof public.offers_with_details
language sql
stable
security definer
as $$
  select *
  from public.offers_with_details
  where supplier_id = p_supplier_id
  order by created_at desc;
$$;

-- =====================================================
-- GRANTS (ajusta roles según tus policies)
-- =====================================================
-- grant select on public.offers_with_details to anon, authenticated;
-- grant execute on function public.get_buyer_offers(uuid) to anon, authenticated;
-- grant execute on function public.get_supplier_offers(uuid) to anon, authenticated;

-- Nota: Ajustar RLS / policies según sea necesario para limitar acceso a las filas.

-- =====================================================
-- GRANTS MÍNIMOS (solo autenticados) - idempotentes
-- =====================================================
DO $$ BEGIN
  -- Vista
  BEGIN EXECUTE 'GRANT SELECT ON public.offers_with_details TO authenticated'; EXCEPTION WHEN others THEN NULL; END;
  -- Funciones
  BEGIN EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_buyer_offers(uuid) TO authenticated'; EXCEPTION WHEN others THEN NULL; END;
  BEGIN EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_supplier_offers(uuid) TO authenticated'; EXCEPTION WHEN others THEN NULL; END;
END $$;

-- =====================================================
-- RLS (Row Level Security) CONDICIONAL PARA offers
-- Permite que comprador o proveedor vean sus propias filas.
-- Seguridad: No habilita INSERT/UPDATE/DELETE; solo SELECT.
-- =====================================================
DO $$ BEGIN
  -- Habilitar RLS si aún no está activo
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'offers'
      AND c.relrowsecurity = true
  ) THEN
    EXECUTE 'ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- Crear políticas solo si no existen (buyer)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='offers' AND policyname='offers_select_buyer'
  ) THEN
    EXECUTE 'CREATE POLICY offers_select_buyer ON public.offers FOR SELECT USING (auth.uid() = buyer_id)';
  END IF;
END $$;

-- Crear políticas solo si no existen (supplier)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='offers' AND policyname='offers_select_supplier'
  ) THEN
    EXECUTE 'CREATE POLICY offers_select_supplier ON public.offers FOR SELECT USING (auth.uid() = supplier_id)';
  END IF;
END $$;

-- Nota: Si necesitas que el mismo usuario pueda ver líneas siendo buyer o supplier,
-- las dos políticas se combinan (OR) automáticamente.

-- Para administración / service_role no hace falta política (service_role bypass RLS).

