-- =====================================================
-- 📊 MIGRACIÓN: Admin Payment Requests Dashboard - CORREGIDA
-- Fecha: 2025-07-24
-- Descripción: Tabla para gestión administrativa de solicitudes de pago basada en ORDERS y REQUESTS reales
-- =====================================================

-- Crear tabla principal - BASADA EN TU FLUJO REAL
CREATE TABLE public.admin_payment_requests (
  -- Identificación
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE, -- Auto-generado: TKT-001, TKT-002, etc.
  
  -- Relaciones con tu esquema REAL
  order_id uuid, -- Puede ser NULL si viene de requests
  request_id_ref uuid, -- Referencia a requests table si aplica
  supplier_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  
  -- Información de la solicitud
  request_type text NOT NULL CHECK (request_type IN ('payment_confirmation', 'refund', 'dispute')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'rechazado', 'devuelto', 'en_proceso')),
  
  -- Montos - BASADOS EN TU ESTRUCTURA REAL
  requested_amount numeric NOT NULL CHECK (requested_amount > 0),
  original_order_total numeric, -- Total original del pedido
  currency text NOT NULL DEFAULT 'CLP',
  
  -- Información contextual - DESNORMALIZADA PARA PERFORMANCE
  proveedor text NOT NULL, -- Copiado de users.user_nm
  comprador text NOT NULL, -- Copiado de users.user_nm  
  direccion_entrega text, -- De shipping_address o requests
  
  -- Información adicional
  supplier_message text,
  admin_notes text,
  rejection_reason text,
  
  -- Documentos y comprobantes
  payment_proof_url text,
  additional_documents jsonb DEFAULT '[]',
  
  -- Fechas - USANDO TUS NOMBRES REALES
  fecha_solicitada date NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega date,
  delivery_date date, -- Para compatibilidad con requests
  
  -- Metadatos administrativos
  processed_by uuid, -- FK a control_panel_users
  processed_at timestamp with time zone,
  
  -- Información de contacto - CRÍTICA PARA NOTIFICACIONES
  supplier_email text, -- Copiado de users.email
  buyer_email text, -- Copiado de users.email
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Claves primarias y foráneas - BASADAS EN TU ESQUEMA
  CONSTRAINT admin_payment_requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT admin_payment_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
  CONSTRAINT admin_payment_requests_request_ref_fkey FOREIGN KEY (request_id_ref) REFERENCES public.requests(request_id) ON DELETE SET NULL,
  CONSTRAINT admin_payment_requests_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id),
  CONSTRAINT admin_payment_requests_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id),
  CONSTRAINT admin_payment_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.control_panel_users(id)
);

-- =====================================================
-- 🔧 FUNCIONES MEJORADAS
-- =====================================================

-- Crear secuencia para ticket numbers (thread-safe)
CREATE SEQUENCE IF NOT EXISTS admin_ticket_sequence 
  START 1 
  INCREMENT 1 
  MINVALUE 1 
  MAXVALUE 999999
  CACHE 1;

-- Función para generar ticket numbers automáticamente (thread-safe)
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  ticket_num text;
BEGIN
  -- Usar secuencia para garantizar unicidad en concurrencia
  next_number := nextval('admin_ticket_sequence');
  
  -- Formatear con padding de ceros
  ticket_num := 'TKT-' || LPAD(next_number::text, 3, '0');
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger solo para updated_at (ligero y necesario)
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_payment_requests_updated_at
  BEFORE UPDATE ON admin_payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- =====================================================
-- 📈 ÍNDICES PARA PERFORMANCE - OPTIMIZADOS PARA TU ESQUEMA
-- =====================================================

CREATE INDEX idx_admin_payment_requests_status ON public.admin_payment_requests(status);
CREATE INDEX idx_admin_payment_requests_created_at ON public.admin_payment_requests(created_at DESC);
CREATE INDEX idx_admin_payment_requests_supplier_id ON public.admin_payment_requests(supplier_id);
CREATE INDEX idx_admin_payment_requests_buyer_id ON public.admin_payment_requests(buyer_id);
CREATE INDEX idx_admin_payment_requests_order_id ON public.admin_payment_requests(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_admin_payment_requests_request_ref ON public.admin_payment_requests(request_id_ref) WHERE request_id_ref IS NOT NULL;
CREATE INDEX idx_admin_payment_requests_ticket ON public.admin_payment_requests(ticket_number);
CREATE INDEX idx_admin_payment_requests_fecha_solicitada ON public.admin_payment_requests(fecha_solicitada DESC);
CREATE INDEX idx_admin_payment_requests_type_status ON public.admin_payment_requests(request_type, status);

-- =====================================================
-- 🔒 ROW LEVEL SECURITY (RLS) - ADAPTADO A TU AUTH
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE public.admin_payment_requests ENABLE ROW LEVEL SECURITY;

-- Política para administradores (acceso total)
CREATE POLICY "Admins can manage all payment requests" ON public.admin_payment_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.control_panel_users 
      WHERE id = auth.uid() AND is_active = true
    )
  );

-- Política para proveedores (solo ver sus propias solicitudes)
CREATE POLICY "Suppliers can view their own requests" ON public.admin_payment_requests
  FOR SELECT USING (supplier_id = auth.uid());

-- Política para compradores (solo ver sus propias solicitudes)  
CREATE POLICY "Buyers can view their own requests" ON public.admin_payment_requests
  FOR SELECT USING (buyer_id = auth.uid());

-- =====================================================
-- 📊 FUNCIÓN HELPER: Crear solicitud desde ORDER (con validaciones robustas y datos poblados)
-- =====================================================

CREATE OR REPLACE FUNCTION create_payment_request_from_order(
  p_order_id uuid,
  p_request_type text DEFAULT 'payment_confirmation',
  p_requested_amount numeric DEFAULT NULL,
  p_supplier_message text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  order_data RECORD;
  supplier_data RECORD;
  buyer_data RECORD;
  new_request_id uuid;
  populated_address text;
BEGIN
  -- Validar parámetros de entrada
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'Order ID cannot be NULL';
  END IF;
  
  -- Obtener datos del pedido con validaciones (UNA SOLA CONSULTA)
  SELECT 
    o.user_id as buyer_id,
    o.total,
    o.shipping_address,
    o.status as order_status,
    p.supplier_id,
    u_supplier.user_nm as supplier_name,
    u_supplier.email as supplier_email,
    u_buyer.user_nm as buyer_name,
    u_buyer.email as buyer_email
  INTO order_data
  FROM orders o
  LEFT JOIN LATERAL (
    SELECT DISTINCT supplier_id 
    FROM products p2 
    WHERE p2.productid = ANY(
      SELECT (jsonb_array_elements(o.items)->>'product_id')::uuid
    )
    LIMIT 1
  ) p ON true
  LEFT JOIN users u_supplier ON p.supplier_id = u_supplier.user_id
  LEFT JOIN users u_buyer ON o.user_id = u_buyer.user_id
  WHERE o.id = p_order_id;
  
  -- Validar que el pedido existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found with ID: %', p_order_id;
  END IF;
  
  -- Validar que tiene supplier (productos válidos)
  IF order_data.supplier_id IS NULL THEN
    RAISE EXCEPTION 'No valid supplier found for order: %. Order may have invalid products.', p_order_id;
  END IF;
  
  -- Validar que el comprador existe
  IF order_data.buyer_id IS NULL THEN
    RAISE EXCEPTION 'No buyer found for order: %', p_order_id;
  END IF;
  
  -- Validar monto
  IF COALESCE(p_requested_amount, order_data.total) <= 0 THEN
    RAISE EXCEPTION 'Requested amount must be greater than 0. Order total: %, Requested: %', 
      order_data.total, p_requested_amount;
  END IF;
  
  -- Construir dirección de entrega de forma segura
  IF order_data.shipping_address IS NOT NULL THEN
    populated_address := CONCAT_WS(', ',
      order_data.shipping_address->>'address',
      order_data.shipping_address->>'city',
      order_data.shipping_address->>'region'
    );
  END IF;
  
  -- Crear la solicitud con TODOS los datos poblados (SIN TRIGGER)
  INSERT INTO admin_payment_requests (
    ticket_number,
    order_id,
    supplier_id,
    buyer_id,
    request_type,
    requested_amount,
    original_order_total,
    proveedor,
    comprador,
    supplier_email,
    buyer_email,
    direccion_entrega,
    supplier_message
  ) VALUES (
    generate_ticket_number(),
    p_order_id,
    order_data.supplier_id,
    order_data.buyer_id,
    p_request_type,
    COALESCE(p_requested_amount, order_data.total),
    order_data.total,
    order_data.supplier_name,
    order_data.buyer_name,
    order_data.supplier_email,
    order_data.buyer_email,
    populated_address,
    p_supplier_message
  ) RETURNING request_id INTO new_request_id;
  
  RETURN new_request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log detallado del error para debugging
    RAISE EXCEPTION 'Failed to create payment request from order %: %', p_order_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 📊 FUNCIÓN HELPER: Crear solicitud desde REQUEST (con validaciones robustas y datos poblados)
-- =====================================================

CREATE OR REPLACE FUNCTION create_payment_request_from_request(
  p_request_id uuid,
  p_request_type text DEFAULT 'payment_confirmation',
  p_requested_amount numeric DEFAULT NULL,
  p_supplier_message text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  request_data RECORD;
  new_request_id uuid;
  populated_address text;
BEGIN
  -- Validar parámetros de entrada
  IF p_request_id IS NULL THEN
    RAISE EXCEPTION 'Request ID cannot be NULL';
  END IF;
  
  -- Obtener datos de la solicitud con validaciones (UNA SOLA CONSULTA)
  SELECT 
    r.buyer_id,
    r.total_sale,
    r.request_dt,
    r.delivery_dt,
    p.supplier_id,
    u_supplier.user_nm as supplier_name,
    u_supplier.email as supplier_email,
    u_buyer.user_nm as buyer_name,
    u_buyer.email as buyer_email,
    CONCAT_WS(', ', r.delivery_direction, r.delivery_direction_number, r.delivery_commune, r.delivery_region) as full_address
  INTO request_data
  FROM requests r
  LEFT JOIN request_products rp ON r.request_id = rp.request_id
  LEFT JOIN products p ON rp.product_id = p.productid
  LEFT JOIN users u_supplier ON p.supplier_id = u_supplier.user_id
  LEFT JOIN users u_buyer ON r.buyer_id = u_buyer.user_id
  WHERE r.request_id = p_request_id
  LIMIT 1;
  
  -- Validar que la solicitud existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found with ID: %', p_request_id;
  END IF;
  
  -- Validar que tiene supplier
  IF request_data.supplier_id IS NULL THEN
    RAISE EXCEPTION 'No supplier found for request: %. Request may have no products or invalid products.', p_request_id;
  END IF;
  
  -- Validar que el comprador existe
  IF request_data.buyer_id IS NULL THEN
    RAISE EXCEPTION 'No buyer found for request: %', p_request_id;
  END IF;
  
  -- Validar monto
  IF COALESCE(p_requested_amount, request_data.total_sale) <= 0 THEN
    RAISE EXCEPTION 'Requested amount must be greater than 0. Request total: %, Requested: %', 
      request_data.total_sale, p_requested_amount;
  END IF;
  
  -- Crear la solicitud administrativa con TODOS los datos poblados (SIN TRIGGER)
  INSERT INTO admin_payment_requests (
    ticket_number,
    request_id_ref,
    supplier_id,
    buyer_id,
    request_type,
    requested_amount,
    original_order_total,
    proveedor,
    comprador,
    supplier_email,
    buyer_email,
    direccion_entrega,
    delivery_date,
    supplier_message
  ) VALUES (
    generate_ticket_number(),
    p_request_id,
    request_data.supplier_id,
    request_data.buyer_id,
    p_request_type,
    COALESCE(p_requested_amount, request_data.total_sale),
    request_data.total_sale,
    request_data.supplier_name,
    request_data.buyer_name,
    request_data.supplier_email,
    request_data.buyer_email,
    request_data.full_address,
    request_data.delivery_dt,
    p_supplier_message
  ) RETURNING request_id INTO new_request_id;
  
  RETURN new_request_id;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log detallado del error para debugging
    RAISE EXCEPTION 'Failed to create payment request from request %: %', p_request_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 📊 VISTA: Resumen para Dashboard
-- =====================================================

CREATE OR REPLACE VIEW admin_payment_requests_summary AS
SELECT 
  status,
  COUNT(*) as count,
  SUM(requested_amount) as total_amount,
  AVG(requested_amount) as avg_amount,
  MIN(created_at) as oldest_request,
  MAX(created_at) as newest_request
FROM admin_payment_requests
GROUP BY status;

-- =====================================================
-- 📊 DATOS DE EJEMPLO REALISTAS (SOLO PARA TESTING)
-- =====================================================

-- Descomentar solo para testing en desarrollo
/*
-- Ejemplo de solicitud de confirmación de pago
SELECT create_payment_request_from_order(
  (SELECT id FROM orders WHERE payment_status = 'pending' LIMIT 1),
  'payment_confirmation',
  NULL,
  'Solicito confirmación de pago por pedido completado'
);

-- Ejemplo de solicitud de reembolso
INSERT INTO admin_payment_requests (
  order_id, supplier_id, buyer_id, request_type, status, requested_amount,
  supplier_message
) 
SELECT 
  o.id,
  (SELECT supplier_id FROM products WHERE productid = (o.items->0->>'product_id')::uuid LIMIT 1),
  o.user_id,
  'refund',
  'pendiente',
  o.total * 0.5, -- Reembolso parcial
  'Solicito reembolso parcial por producto defectuoso'
FROM orders o
WHERE o.payment_status = 'paid'
LIMIT 1;
*/
