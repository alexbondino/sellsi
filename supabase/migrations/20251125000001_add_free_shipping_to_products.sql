-- ============================================================================
-- MIGRATION: Add Free Shipping Fields to Products
-- ============================================================================
-- 
-- Feature: Despacho Gratuito por Umbral de Cantidad
-- 
-- Permite a los proveedores ofrecer despacho gratuito cuando el comprador
-- alcanza una cantidad mínima de unidades.
--
-- Campos:
--   - free_shipping_enabled: boolean - Indica si el proveedor ofrece despacho gratis
--   - free_shipping_min_quantity: integer - Cantidad mínima para aplicar despacho gratis
--
-- ============================================================================

-- Agregar columnas a la tabla products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS free_shipping_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS free_shipping_min_quantity INTEGER DEFAULT NULL;

-- Agregar constraint para validar que min_quantity sea positivo cuando está habilitado
ALTER TABLE products 
ADD CONSTRAINT chk_free_shipping_min_quantity 
CHECK (
  (free_shipping_enabled = FALSE) OR 
  (free_shipping_enabled = TRUE AND free_shipping_min_quantity IS NOT NULL AND free_shipping_min_quantity > 0)
);

-- Agregar índice para consultas de productos con despacho gratuito
CREATE INDEX IF NOT EXISTS idx_products_free_shipping 
ON products(free_shipping_enabled) 
WHERE free_shipping_enabled = TRUE;

-- Comentarios para documentación
COMMENT ON COLUMN products.free_shipping_enabled IS 'Indica si el producto ofrece despacho gratuito al alcanzar cantidad mínima';
COMMENT ON COLUMN products.free_shipping_min_quantity IS 'Cantidad mínima de unidades para aplicar despacho gratuito';

