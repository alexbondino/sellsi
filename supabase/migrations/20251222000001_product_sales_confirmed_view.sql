-- Migration: Vista materializada para ventas confirmadas
-- Solo cuenta ventas donde el proveedor aceptó (accepted, in_transit, delivered)
-- Excluye: pending, rejected, cancelled
-- Date: 2025-12-22

-- Eliminar vista si existe
DROP MATERIALIZED VIEW IF EXISTS public.product_sales_confirmed CASCADE;

-- Crear vista materializada con ventas confirmadas
CREATE MATERIALIZED VIEW public.product_sales_confirmed AS
SELECT 
  ps.id,
  ps.product_id,
  ps.supplier_id,
  ps.quantity,
  ps.amount,
  ps.trx_date,
  ps.order_id,
  o.status as order_status,
  o.payment_status
FROM public.product_sales ps
INNER JOIN public.orders o ON ps.order_id = o.id
WHERE 
  -- Solo órdenes con pago confirmado
  o.payment_status = 'paid'
  -- Solo estados que confirman venta (aceptado o posterior)
  AND o.status IN ('accepted', 'in_transit', 'delivered')
  -- Excluir canceladas explícitamente
  AND o.cancelled_at IS NULL;

-- Crear índice único para refresh concurrente
CREATE UNIQUE INDEX idx_product_sales_confirmed_pk 
ON public.product_sales_confirmed(id);

-- Índices para performance de queries del dashboard
CREATE INDEX idx_product_sales_confirmed_supplier_date 
ON public.product_sales_confirmed(supplier_id, trx_date DESC);

CREATE INDEX idx_product_sales_confirmed_supplier 
ON public.product_sales_confirmed(supplier_id);

CREATE INDEX idx_product_sales_confirmed_order 
ON public.product_sales_confirmed(order_id);

CREATE INDEX idx_product_sales_confirmed_product 
ON public.product_sales_confirmed(product_id);

-- Comentarios para documentación
COMMENT ON MATERIALIZED VIEW public.product_sales_confirmed IS 
'Vista materializada que contiene solo ventas confirmadas por el proveedor (status: accepted, in_transit, delivered). Se actualiza automáticamente cada 5 minutos.';

COMMENT ON INDEX idx_product_sales_confirmed_supplier_date IS 
'Índice optimizado para queries del dashboard por supplier_id y rango de fechas';

-- Grant permisos
GRANT SELECT ON public.product_sales_confirmed TO authenticated;
GRANT SELECT ON public.product_sales_confirmed TO anon;

-- Función para refresh manual (opcional)
CREATE OR REPLACE FUNCTION public.refresh_product_sales_confirmed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_sales_confirmed;
END;
$$;

COMMENT ON FUNCTION public.refresh_product_sales_confirmed IS 
'Función para refrescar manualmente la vista de ventas confirmadas';

-- NOTA: Para programar refresh automático, se requiere pg_cron extension
-- Esto se configura por separado en el proyecto Supabase:
-- 
-- SELECT cron.schedule(
--   'refresh-product-sales-confirmed',
--   '*/5 * * * *',  -- Cada 5 minutos
--   'SELECT public.refresh_product_sales_confirmed();'
-- );
