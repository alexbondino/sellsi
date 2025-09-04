-- =====================================================
-- SISTEMA DE OFERTAS SELLSI - IMPLEMENTACIÓN HÍBRIDA
-- Versión: 1.0
-- Fecha: 2 de Septiembre, 2025
-- Migración: 20250902000000_offers_system.sql
-- =====================================================

-- =====================================================
-- 1. TABLA PRINCIPAL DE OFERTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.users(user_id),
  supplier_id uuid NOT NULL REFERENCES public.users(user_id),
  product_id uuid NOT NULL REFERENCES public.products(productid),
  
  -- Datos de la oferta
  offered_price numeric NOT NULL CHECK (offered_price > 0),
  offered_quantity integer NOT NULL CHECK (offered_quantity > 0),
  message text,
  
  -- Estados de la oferta
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected', 'expired', 'purchased')
  ),
  
  -- Timestamps críticos
  created_at timestamptz DEFAULT now() NOT NULL,
  expires_at timestamptz NOT NULL, -- 48h desde created_at
  accepted_at timestamptz,
  purchase_deadline timestamptz, -- 24h desde accepted_at
  purchased_at timestamptz,
  rejected_at timestamptz,
  expired_at timestamptz,
  
  -- Integración con price_tiers (CRÍTICO)
  tier_price_at_offer numeric,
  base_price_at_offer numeric NOT NULL,
  
  -- Stock management simplificado
  stock_reserved boolean DEFAULT false,
  reserved_at timestamptz,
  
  -- Campos adicionales
  rejection_reason text,
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints adicionales
  CONSTRAINT offers_valid_dates CHECK (expires_at > created_at),
  CONSTRAINT offers_buyer_supplier_different CHECK (buyer_id != supplier_id)
);

-- =====================================================
-- 2. TABLA DE LÍMITES DE OFERTAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.offer_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.users(user_id),
  product_id uuid NOT NULL REFERENCES public.products(productid),
  supplier_id uuid NOT NULL REFERENCES public.users(user_id),
  month_year text NOT NULL, -- 'YYYY-MM'
  
  -- Contadores
  product_offers_count integer DEFAULT 1 CHECK (product_offers_count >= 0),
  supplier_offers_count integer DEFAULT 1 CHECK (supplier_offers_count >= 0),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints únicos
  UNIQUE(buyer_id, product_id, month_year),
  UNIQUE(buyer_id, supplier_id, month_year)
);

-- =====================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para offers
CREATE INDEX IF NOT EXISTS idx_offers_buyer_status ON public.offers (buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_supplier_status ON public.offers (supplier_id, status);
CREATE INDEX IF NOT EXISTS idx_offers_product_id ON public.offers (product_id);
CREATE INDEX IF NOT EXISTS idx_offers_expires_at ON public.offers (expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_offers_purchase_deadline ON public.offers (purchase_deadline) WHERE status = 'accepted';
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON public.offers (created_at DESC);

-- Índices para offer_limits
CREATE INDEX IF NOT EXISTS idx_offer_limits_buyer_month ON public.offer_limits (buyer_id, month_year);
CREATE INDEX IF NOT EXISTS idx_offer_limits_product_month ON public.offer_limits (buyer_id, product_id, month_year);
CREATE INDEX IF NOT EXISTS idx_offer_limits_supplier_month ON public.offer_limits (buyer_id, supplier_id, month_year);

-- =====================================================
-- 4. FUNCIONES DE VALIDACIÓN
-- =====================================================

-- Función para validar ofertas contra price_tiers
CREATE OR REPLACE FUNCTION validate_offer_against_tiers(
  p_product_id uuid,
  p_offered_quantity integer,
  p_offered_price numeric
) RETURNS jsonb AS $$
DECLARE
  base_price numeric;
  tier_price numeric;
  product_exists boolean;
  result jsonb;
BEGIN
  -- Verificar que el producto existe y está activo
  SELECT 
    price,
    CASE WHEN productqty > 0 AND is_active = true THEN true ELSE false END
  INTO base_price, product_exists
  FROM products 
  WHERE productid = p_product_id;
  
  IF NOT FOUND OR NOT product_exists THEN
    RETURN json_build_object(
      'is_valid', false,
      'reason', 'Producto no encontrado o inactivo',
      'tier_price', null,
      'base_price', null
    );
  END IF;
  
  -- Buscar el precio del tramo correspondiente
  SELECT price INTO tier_price
  FROM product_quantity_ranges
  WHERE product_id = p_product_id
    AND p_offered_quantity >= min_quantity
    AND (max_quantity IS NULL OR p_offered_quantity <= max_quantity)
  ORDER BY min_quantity DESC
  LIMIT 1;
  
  -- Si no hay tramo específico, usar precio base
  IF tier_price IS NULL THEN
    tier_price := base_price;
  END IF;
  
  -- Construir resultado
  result := json_build_object(
    'is_valid', p_offered_price <= tier_price,
    'tier_price', tier_price,
    'base_price', base_price,
    'offered_price', p_offered_price,
    'message', CASE 
      WHEN p_offered_price > tier_price THEN 'Precio ofertado mayor al precio del tramo disponible'
      WHEN p_offered_price = tier_price THEN 'Precio ofertado igual al precio del tramo'
      ELSE 'Precio ofertado válido'
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar límites de ofertas
CREATE OR REPLACE FUNCTION validate_offer_limits(
  p_buyer_id uuid,
  p_supplier_id uuid,
  p_product_id uuid
) RETURNS jsonb AS $$
DECLARE
  current_month text;
  product_count integer;
  supplier_count integer;
  result jsonb;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Verificar límite por producto (máximo 2 por mes)
  SELECT COALESCE(product_offers_count, 0) INTO product_count
  FROM offer_limits
  WHERE buyer_id = p_buyer_id 
    AND product_id = p_product_id 
    AND month_year = current_month;
    
  IF product_count IS NULL THEN
    product_count := 0;
  END IF;
  
  -- Verificar límite por proveedor (máximo 5 por mes)
  SELECT COALESCE(supplier_offers_count, 0) INTO supplier_count
  FROM offer_limits
  WHERE buyer_id = p_buyer_id 
    AND supplier_id = p_supplier_id 
    AND month_year = current_month;
    
  IF supplier_count IS NULL THEN
    supplier_count := 0;
  END IF;
  
  -- Evaluar límites
  result := json_build_object(
    'allowed', true,
    'product_count', product_count,
    'supplier_count', supplier_count,
    'product_limit_reached', product_count >= 2,
    'supplier_limit_reached', supplier_count >= 5,
    'reason', null
  );
  
  -- Verificar violaciones
  IF product_count >= 2 THEN
    result := jsonb_set(result, '{allowed}', 'false');
    result := jsonb_set(result, '{reason}', '"Ya has hecho 2 ofertas para este producto este mes"');
  ELSIF supplier_count >= 5 THEN
    result := jsonb_set(result, '{allowed}', 'false');
    result := jsonb_set(result, '{reason}', '"Ya has hecho 5 ofertas a este proveedor este mes"');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNCIÓN PARA CREAR OFERTAS
-- =====================================================

CREATE OR REPLACE FUNCTION create_offer(
  p_buyer_id uuid,
  p_supplier_id uuid,
  p_product_id uuid,
  p_offered_price numeric,
  p_offered_quantity integer,
  p_message text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  limits_check jsonb;
  price_check jsonb;
  new_offer_id uuid;
  current_month text;
  expires_at_time timestamptz;
  result jsonb;
BEGIN
  -- Validar límites
  SELECT validate_offer_limits(p_buyer_id, p_supplier_id, p_product_id) INTO limits_check;
  
  IF NOT (limits_check->>'allowed')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', limits_check->>'reason',
      'error_type', 'limit_exceeded'
    );
  END IF;
  
  -- Validar precio contra tiers
  SELECT validate_offer_against_tiers(p_product_id, p_offered_quantity, p_offered_price) INTO price_check;
  
  IF NOT (price_check->>'is_valid')::boolean THEN
    RETURN json_build_object(
      'success', false,
      'error', price_check->>'message',
      'error_type', 'invalid_price',
      'details', price_check
    );
  END IF;
  
  -- Calcular fecha de expiración (48 horas)
  expires_at_time := now() + interval '48 hours';
  current_month := to_char(now(), 'YYYY-MM');
  
  -- Crear la oferta
  INSERT INTO offers (
    buyer_id,
    supplier_id,
    product_id,
    offered_price,
    offered_quantity,
    message,
    expires_at,
    base_price_at_offer,
    tier_price_at_offer
  ) VALUES (
    p_buyer_id,
    p_supplier_id,
    p_product_id,
    p_offered_price,
    p_offered_quantity,
    p_message,
    expires_at_time,
    (price_check->>'base_price')::numeric,
    (price_check->>'tier_price')::numeric
  ) RETURNING id INTO new_offer_id;
  
  -- Actualizar límites
  INSERT INTO offer_limits (
    buyer_id,
    product_id,
    supplier_id,
    month_year,
    product_offers_count,
    supplier_offers_count
  ) VALUES (
    p_buyer_id,
    p_product_id,
    p_supplier_id,
    current_month,
    1,
    1
  ) ON CONFLICT (buyer_id, product_id, month_year) 
  DO UPDATE SET 
    product_offers_count = offer_limits.product_offers_count + 1,
    updated_at = now();
  
  INSERT INTO offer_limits (
    buyer_id,
    product_id,
    supplier_id,
    month_year,
    product_offers_count,
    supplier_offers_count
  ) VALUES (
    p_buyer_id,
    p_product_id,
    p_supplier_id,
    current_month,
    0,
    1
  ) ON CONFLICT (buyer_id, supplier_id, month_year) 
  DO UPDATE SET 
    supplier_offers_count = offer_limits.supplier_offers_count + 1,
    updated_at = now();
  
  -- Retornar éxito
  RETURN json_build_object(
    'success', true,
    'offer_id', new_offer_id,
    'expires_at', expires_at_time,
    'price_validation', price_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. FUNCIÓN PARA ACEPTAR OFERTAS
-- =====================================================

CREATE OR REPLACE FUNCTION accept_offer_simple(p_offer_id uuid)
RETURNS jsonb AS $$
DECLARE
  offer_record record;
  available_stock integer;
  purchase_deadline_time timestamptz;
BEGIN
  -- Obtener oferta con lock para evitar race conditions
  SELECT * INTO offer_record 
  FROM offers 
  WHERE id = p_offer_id AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Oferta no encontrada o no está pendiente'
    );
  END IF;
  
  -- Verificar que la oferta no haya expirado
  IF now() > offer_record.expires_at THEN
    -- Marcar como expirada
    UPDATE offers SET 
      status = 'expired',
      expired_at = now(),
      updated_at = now()
    WHERE id = p_offer_id;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'La oferta ha expirado'
    );
  END IF;
  
  -- Verificar stock disponible
  SELECT productqty INTO available_stock
  FROM products 
  WHERE productid = offer_record.product_id;
  
  IF available_stock < offer_record.offered_quantity THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Stock insuficiente para aceptar la oferta'
    );
  END IF;
  
  -- Calcular deadline para compra (24 horas)
  purchase_deadline_time := now() + interval '24 hours';
  
  -- Actualizar oferta a aceptada y reservar stock atomicamente
  UPDATE offers SET
    status = 'accepted',
    accepted_at = now(),
    purchase_deadline = purchase_deadline_time,
    stock_reserved = true,
    reserved_at = now(),
    updated_at = now()
  WHERE id = p_offer_id;
  
  -- Decrementar stock del producto
  UPDATE products 
  SET productqty = productqty - offer_record.offered_quantity
  WHERE productid = offer_record.product_id;
  
  RETURN json_build_object(
    'success', true, 
    'offer_id', p_offer_id,
    'purchase_deadline', purchase_deadline_time,
    'reserved_quantity', offer_record.offered_quantity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNCIÓN PARA RECHAZAR OFERTAS
-- =====================================================

CREATE OR REPLACE FUNCTION reject_offer(
  p_offer_id uuid,
  p_rejection_reason text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  offer_record record;
BEGIN
  -- Obtener oferta con lock
  SELECT * INTO offer_record 
  FROM offers 
  WHERE id = p_offer_id AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Oferta no encontrada o no está pendiente'
    );
  END IF;
  
  -- Verificar que la oferta no haya expirado
  IF now() > offer_record.expires_at THEN
    -- Marcar como expirada en lugar de rechazada
    UPDATE offers SET 
      status = 'expired',
      expired_at = now(),
      updated_at = now()
    WHERE id = p_offer_id;
    
    RETURN json_build_object(
      'success', false, 
      'error', 'La oferta ya había expirado'
    );
  END IF;
  
  -- Rechazar la oferta
  UPDATE offers SET
    status = 'rejected',
    rejected_at = now(),
    rejection_reason = p_rejection_reason,
    updated_at = now()
  WHERE id = p_offer_id;
  
  RETURN json_build_object(
    'success', true, 
    'offer_id', p_offer_id,
    'rejected_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNCIÓN PARA EXPIRAR OFERTAS AUTOMÁTICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION expire_offers_automatically()
RETURNS jsonb AS $$
DECLARE
  expired_pending_count integer;
  expired_accepted_count integer;
  restored_stock_total integer := 0;
  offer_record record;
BEGIN
  -- Expirar ofertas pendientes después de 48h
  UPDATE offers 
  SET 
    status = 'expired',
    expired_at = now(),
    updated_at = now()
  WHERE 
    status = 'pending' 
    AND expires_at < now();
    
  GET DIAGNOSTICS expired_pending_count = ROW_COUNT;
  
  -- Expirar ofertas aceptadas después de 24h y reponer stock
  FOR offer_record IN 
    SELECT id, product_id, offered_quantity 
    FROM offers 
    WHERE status = 'accepted' 
      AND purchase_deadline < now()
      AND stock_reserved = true
  LOOP
    -- Reponer stock
    UPDATE products 
    SET productqty = productqty + offer_record.offered_quantity
    WHERE productid = offer_record.product_id;
    
    -- Marcar oferta como expirada
    UPDATE offers 
    SET 
      status = 'expired',
      expired_at = now(),
      stock_reserved = false,
      updated_at = now()
    WHERE id = offer_record.id;
    
    restored_stock_total := restored_stock_total + offer_record.offered_quantity;
  END LOOP;
  
  GET DIAGNOSTICS expired_accepted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'expired_pending', expired_pending_count,
    'expired_accepted', expired_accepted_count,
    'total_stock_restored', restored_stock_total,
    'processed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNCIÓN PARA MARCAR OFERTA COMO COMPRADA
-- =====================================================

CREATE OR REPLACE FUNCTION mark_offer_as_purchased(
  p_offer_id uuid,
  p_order_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  offer_record record;
BEGIN
  -- Obtener oferta con lock
  SELECT * INTO offer_record 
  FROM offers 
  WHERE id = p_offer_id AND status = 'accepted'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Oferta no encontrada o no está aceptada'
    );
  END IF;
  
  -- Verificar que esté dentro del plazo
  IF now() > offer_record.purchase_deadline THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'El plazo para comprar esta oferta ha expirado'
    );
  END IF;
  
  -- Marcar como comprada
  UPDATE offers SET
    status = 'purchased',
    purchased_at = now(),
    updated_at = now()
  WHERE id = p_offer_id;
  
  RETURN json_build_object(
    'success', true, 
    'offer_id', p_offer_id,
    'purchased_at', now(),
    'order_id', p_order_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. TRIGGERS PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a offers
DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at 
    BEFORE UPDATE ON public.offers
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Aplicar trigger a offer_limits
DROP TRIGGER IF EXISTS update_offer_limits_updated_at ON public.offer_limits;
CREATE TRIGGER update_offer_limits_updated_at 
    BEFORE UPDATE ON public.offer_limits
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. VISTAS PARA CONSULTAS COMUNES
-- =====================================================

-- Vista para ofertas con información de productos y usuarios
CREATE OR REPLACE VIEW offers_with_details AS
SELECT 
  o.*,
  -- Información del producto
  p.productnm as product_name,
  p.price as current_product_price,
  p.productqty as current_stock,
  pi.image_url as product_image,
  -- Información del comprador
  buyer.user_nm as buyer_name,
  buyer.email as buyer_email,
  -- Información del proveedor
  supplier.user_nm as supplier_name,
  supplier.email as supplier_email,
  -- Cálculos útiles
  CASE 
    WHEN o.status = 'pending' THEN 
      EXTRACT(EPOCH FROM (o.expires_at - now()))
    WHEN o.status = 'accepted' THEN 
      EXTRACT(EPOCH FROM (o.purchase_deadline - now()))
    ELSE 0
  END as seconds_remaining,
  -- Estados calculados
  CASE 
    WHEN o.status = 'pending' AND now() > o.expires_at THEN true
    WHEN o.status = 'accepted' AND now() > o.purchase_deadline THEN true
    ELSE false
  END as is_expired
FROM offers o
JOIN products p ON o.product_id = p.productid
JOIN users buyer ON o.buyer_id = buyer.user_id
JOIN users supplier ON o.supplier_id = supplier.user_id
LEFT JOIN product_images pi ON p.productid = pi.product_id AND pi.image_order = 1;

-- =====================================================
-- 12. POLÍTICAS RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_limits ENABLE ROW LEVEL SECURITY;

-- Política para que los compradores vean solo sus ofertas
CREATE POLICY "Buyers can view their own offers" ON public.offers
  FOR SELECT USING (buyer_id = auth.uid());

-- Política para que los proveedores vean ofertas dirigidas a ellos
CREATE POLICY "Suppliers can view offers directed to them" ON public.offers
  FOR SELECT USING (supplier_id = auth.uid());

-- Política para crear ofertas (solo compradores autenticados)
CREATE POLICY "Authenticated users can create offers" ON public.offers
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- Política para que proveedores actualicen ofertas dirigidas a ellos
CREATE POLICY "Suppliers can update their offers" ON public.offers
  FOR UPDATE USING (supplier_id = auth.uid());

-- Política para offer_limits (solo el propietario)
CREATE POLICY "Users can view their own limits" ON public.offer_limits
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Users can insert their own limits" ON public.offer_limits
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.offers IS 'Tabla principal para el sistema de ofertas - almacena todas las ofertas entre compradores y proveedores';

COMMENT ON COLUMN public.offers.status IS 'Estados: pending (48h), accepted (24h para comprar), rejected, expired, purchased';

COMMENT ON COLUMN public.offers.tier_price_at_offer IS 'Precio del tramo de cantidad al momento de crear la oferta (para referencia histórica)';

COMMENT ON COLUMN public.offers.stock_reserved IS 'Indica si el stock fue reservado cuando se aceptó la oferta';

COMMENT ON TABLE public.offer_limits IS 'Control de límites: máximo 2 ofertas por producto/mes y 5 por proveedor/mes';

COMMENT ON FUNCTION create_offer IS 'Función principal para crear ofertas con validaciones de límites y precios';

COMMENT ON FUNCTION accept_offer_simple IS 'Función para que proveedores acepten ofertas - reserva stock automáticamente';

COMMENT ON FUNCTION expire_offers_automatically IS 'Función para ejecutar via cron - expira ofertas vencidas y repone stock';
