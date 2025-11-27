-- ============================================================
-- Migración: Integración Facturación con Órdenes (VERSIÓN CORREGIDA)
-- 
-- CAMBIOS vs versión anterior:
-- 1. Usa supplier_orders en vez de order_items inexistente
-- 2. Obtiene datos del comprador desde users
-- 3. Referencia supplier_order_id no order_id
-- ============================================================

-- Agregar columnas de facturación a supplier_orders si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'supplier_orders' 
      AND column_name = 'dte_tipo'
  ) THEN
    ALTER TABLE supplier_orders ADD COLUMN dte_tipo SMALLINT 
      CHECK (dte_tipo IS NULL OR dte_tipo IN (33, 34, 39, 41, 52, 56, 61));
    ALTER TABLE supplier_orders ADD COLUMN dte_folio INTEGER
      CHECK (dte_folio IS NULL OR (dte_folio >= 1 AND dte_folio <= 999999999));
    ALTER TABLE supplier_orders ADD COLUMN dte_fecha_emision DATE;
    ALTER TABLE supplier_orders ADD COLUMN dte_estado VARCHAR(25)
      CHECK (dte_estado IS NULL OR dte_estado IN ('PENDIENTE', 'ENVIADO', 'ACEPTADO', 'RECHAZADO', 'ACEPTADO_CON_REPAROS', 'ANULADO', 'SIMULADO', 'ERROR'));
    ALTER TABLE supplier_orders ADD COLUMN dte_id UUID REFERENCES supplier_dtes(id);
  END IF;
END $$;

-- Índice para búsqueda de órdenes con DTE
CREATE INDEX IF NOT EXISTS idx_supplier_orders_dte 
  ON supplier_orders(dte_id) 
  WHERE dte_id IS NOT NULL;

-- Índice para filtrar por estado de DTE
CREATE INDEX IF NOT EXISTS idx_supplier_orders_dte_estado 
  ON supplier_orders(dte_estado) 
  WHERE dte_estado IS NOT NULL;

-- ============================================================
-- Función: Emitir DTE para una orden de supplier
-- ============================================================
CREATE OR REPLACE FUNCTION emit_dte_for_supplier_order(
  p_supplier_order_id UUID,
  p_tipo_dte SMALLINT DEFAULT 39  -- Default: Boleta Electrónica
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_supplier_order RECORD;
  v_buyer RECORD;
  v_billing_config RECORD;
  v_folio_record RECORD;
  v_folio INTEGER;
  v_monto_neto BIGINT;
  v_monto_exento BIGINT;
  v_iva BIGINT;
  v_monto_total BIGINT;
  v_es_exento BOOLEAN;
  v_dte_id UUID;
  v_tipos_validos SMALLINT[] := ARRAY[33, 34, 39, 41, 52, 56, 61];
BEGIN
  -- 0. Validar tipo_dte
  IF p_tipo_dte IS NULL OR NOT (p_tipo_dte = ANY(v_tipos_validos)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tipo DTE inválido. Valores permitidos: 33, 34, 39, 41, 52, 56, 61');
  END IF;

  -- 1. Obtener datos de la orden del supplier CON BLOQUEO para evitar race conditions
  SELECT so.*, o.user_id as buyer_user_id, o.shipping_address, o.billing_address
  INTO v_supplier_order
  FROM supplier_orders so
  JOIN orders o ON o.id = so.parent_order_id
  WHERE so.id = p_supplier_order_id
  FOR UPDATE OF so;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Orden de proveedor no encontrada');
  END IF;

  -- Verificar que el usuario autenticado sea el supplier (seguridad RLS)
  -- Service role puede emitir DTEs de cualquier supplier (usado por Edge Functions)
  IF COALESCE(auth.role(), 'anon') != 'service_role' THEN
    IF auth.uid() IS NULL OR v_supplier_order.supplier_id != auth.uid() THEN
      RETURN jsonb_build_object('success', false, 'error', 'No tiene permiso para emitir DTEs de esta orden');
    END IF;
  END IF;

  -- Verificar que no tenga DTE ya emitido
  IF v_supplier_order.dte_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'La orden ya tiene un DTE emitido');
  END IF;

  -- 2. Obtener datos del comprador
  SELECT u.user_id, u.rut, u.user_nm, u.email
  INTO v_buyer
  FROM users u
  WHERE u.user_id = v_supplier_order.buyer_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Comprador no encontrado en el sistema');
  END IF;

  -- 3. Obtener configuración de facturación del proveedor
  SELECT * INTO v_billing_config
  FROM supplier_billing_config
  WHERE supplier_id = v_supplier_order.supplier_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Proveedor sin configuración de facturación');
  END IF;

  -- 4. Verificar certificado activo
  IF NOT EXISTS (
    SELECT 1 FROM supplier_certificates 
    WHERE supplier_id = v_supplier_order.supplier_id 
      AND is_active = true 
      AND valid_to > NOW()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sin certificado digital vigente');
  END IF;

  -- 5. Obtener siguiente folio
  SELECT * INTO v_folio_record
  FROM supplier_cafs
  WHERE supplier_id = v_supplier_order.supplier_id
    AND tipo_dte = p_tipo_dte
    AND is_active = true
    AND agotado = false
    AND folio_actual <= folio_hasta
    AND (fecha_vencimiento IS NULL OR fecha_vencimiento >= CURRENT_DATE)
  ORDER BY folio_desde
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sin folios disponibles para tipo ' || p_tipo_dte);
  END IF;

  v_folio := v_folio_record.folio_actual;

  -- Incrementar folio
  UPDATE supplier_cafs
  SET 
    folio_actual = folio_actual + 1,
    agotado = (folio_actual + 1 > folio_hasta),
    updated_at = NOW()
  WHERE id = v_folio_record.id;

  -- 6. Calcular montos desde la orden del supplier
  v_es_exento := p_tipo_dte IN (34, 41);
  
  -- Total de la supplier_order (ya calculado previamente)
  v_monto_total := COALESCE(v_supplier_order.total, 0)::BIGINT;
  
  -- Validar que el monto total sea positivo
  IF v_monto_total <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'La orden debe tener un monto total mayor a 0 para emitir DTE');
  END IF;
  
  IF v_es_exento THEN
    v_monto_exento := v_monto_total;
    v_monto_neto := NULL;
    v_iva := NULL;
  ELSE
    -- Para boletas el monto ya incluye IVA
    IF p_tipo_dte = 39 THEN
      v_monto_neto := ROUND(v_monto_total / 1.19)::BIGINT;
      v_iva := v_monto_total - v_monto_neto;
    ELSE
      -- Para facturas, calculamos IVA sobre neto
      v_monto_neto := v_monto_total;
      v_iva := ROUND(v_monto_neto * 0.19)::BIGINT;
      v_monto_total := v_monto_neto + v_iva;
    END IF;
    v_monto_exento := NULL;
  END IF;

  -- 7. Determinar RUT y nombre del receptor
  -- Prioridad: billing_address > RUT del usuario > genérico
  DECLARE
    v_rut_receptor VARCHAR(12);
    v_nombre_receptor VARCHAR(200);
    v_ind_servicio SMALLINT;
  BEGIN
    -- Intentar obtener de billing_address
    IF v_supplier_order.billing_address IS NOT NULL 
       AND v_supplier_order.billing_address->>'rut' IS NOT NULL THEN
      v_rut_receptor := v_supplier_order.billing_address->>'rut';
      v_nombre_receptor := COALESCE(
        v_supplier_order.billing_address->>'razonSocial',
        v_supplier_order.billing_address->>'name',
        v_buyer.user_nm
      );
    ELSE
      -- Usar datos del usuario o RUT genérico SII para consumidor final
      v_rut_receptor := COALESCE(v_buyer.rut, '66666666-6'); -- RUT SII consumidor final
      v_nombre_receptor := COALESCE(v_buyer.user_nm, 'Consumidor Final');
    END IF;
    
    -- Validar formato RUT receptor (debe cumplir regex de supplier_dtes)
    IF v_rut_receptor !~ '^[0-9]{1,8}-[0-9Kk]$' THEN
      RETURN jsonb_build_object('success', false, 'error', 'RUT del receptor inválido: ' || v_rut_receptor);
    END IF;
    
    -- Validar longitud del nombre del receptor (máx 100 caracteres SII)
    IF LENGTH(v_nombre_receptor) > 100 THEN
      v_nombre_receptor := LEFT(v_nombre_receptor, 100);
    END IF;
    
    -- Para Boletas (39, 41) es obligatorio el IndServicio
    -- Default: 3 = Bienes o servicios no periódicos (marketplace)
    IF p_tipo_dte IN (39, 41) THEN
      v_ind_servicio := 3;
    ELSE
      v_ind_servicio := NULL;
    END IF;

    -- 8. Crear registro de DTE
    INSERT INTO supplier_dtes (
      supplier_id,
      tipo_dte,
      folio,
      fecha_emision,
      rut_receptor,
      razon_social_receptor,
      monto_neto,
      monto_exento,
      iva,
      monto_total,
      ind_servicio,
      forma_pago,
      supplier_order_id,
      parent_order_id,
      estado
    ) VALUES (
      v_supplier_order.supplier_id,
      p_tipo_dte,
      v_folio,
      CURRENT_DATE,
      v_rut_receptor,
      v_nombre_receptor,
      v_monto_neto,
      v_monto_exento,
      v_iva,
      v_monto_total,
      v_ind_servicio,  -- Requerido para boletas (39, 41)
      1,               -- 1 = Contado (default para marketplace)
      p_supplier_order_id,
      v_supplier_order.parent_order_id,
      CASE 
        WHEN v_billing_config.ambiente = 'CERT' THEN 'SIMULADO'
        ELSE 'PENDIENTE'
      END
    )
    RETURNING id INTO v_dte_id;

    -- 9. Actualizar la supplier_order con datos del DTE
    UPDATE supplier_orders
    SET 
      dte_tipo = p_tipo_dte,
      dte_folio = v_folio,
      dte_fecha_emision = CURRENT_DATE,
      dte_estado = CASE 
        WHEN v_billing_config.ambiente = 'CERT' THEN 'SIMULADO'
        ELSE 'PENDIENTE'
      END,
      dte_id = v_dte_id,
      updated_at = NOW()
    WHERE id = p_supplier_order_id;

    -- 10. Retornar resultado
    RETURN jsonb_build_object(
      'success', true,
      'dteId', v_dte_id,
      'tipoDte', p_tipo_dte,
      'folio', v_folio,
      'fechaEmision', CURRENT_DATE,
      'receptor', jsonb_build_object(
        'rut', v_rut_receptor,
        'razonSocial', v_nombre_receptor
      ),
      'totales', jsonb_build_object(
        'montoNeto', v_monto_neto,
        'montoExento', v_monto_exento,
        'iva', v_iva,
        'montoTotal', v_monto_total
      ),
      'estado', CASE 
        WHEN v_billing_config.ambiente = 'CERT' THEN 'SIMULADO'
        ELSE 'PENDIENTE'
      END
    );
  END;
END;
$$;

-- ============================================================
-- Función: Obtener DTE de una orden de supplier
-- ============================================================
CREATE OR REPLACE FUNCTION get_supplier_order_dte(p_supplier_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dte RECORD;
  v_supplier_id UUID;
BEGIN
  -- Primero verificar permisos
  SELECT supplier_id INTO v_supplier_id
  FROM supplier_orders
  WHERE id = p_supplier_order_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false, 'error', 'Orden no encontrada');
  END IF;
  
  -- Verificar que el usuario autenticado tenga acceso
  -- Service role puede ver cualquier DTE (usado por Edge Functions)
  IF COALESCE(auth.role(), 'anon') != 'service_role' THEN
    IF auth.uid() IS NULL OR v_supplier_id != auth.uid() THEN
      RETURN jsonb_build_object('found', false, 'error', 'Sin permiso para ver este DTE');
    END IF;
  END IF;

  SELECT 
    d.*,
    bc.razon_social as emisor_razon_social,
    bc.rut_emisor,
    bc.giro as emisor_giro,
    bc.direccion as emisor_direccion,
    bc.comuna as emisor_comuna,
    bc.ciudad as emisor_ciudad
  INTO v_dte
  FROM supplier_dtes d
  LEFT JOIN supplier_billing_config bc ON bc.supplier_id = d.supplier_id
  WHERE d.supplier_order_id = p_supplier_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'dte', jsonb_build_object(
      'id', v_dte.id,
      'tipoDte', v_dte.tipo_dte,
      'folio', v_dte.folio,
      'fechaEmision', v_dte.fecha_emision,
      'estado', v_dte.estado,
      'emisor', jsonb_build_object(
        'rut', v_dte.rut_emisor,
        'razonSocial', v_dte.emisor_razon_social,
        'giro', v_dte.emisor_giro,
        'direccion', v_dte.emisor_direccion,
        'comuna', v_dte.emisor_comuna,
        'ciudad', v_dte.emisor_ciudad
      ),
      'receptor', jsonb_build_object(
        'rut', v_dte.rut_receptor,
        'razonSocial', v_dte.razon_social_receptor
      ),
      'totales', jsonb_build_object(
        'montoNeto', v_dte.monto_neto,
        'montoExento', v_dte.monto_exento,
        'iva', v_dte.iva,
        'montoTotal', v_dte.monto_total
      ),
      'trackId', v_dte.track_id,
      'xmlFirmado', v_dte.xml_firmado IS NOT NULL,
      'tedXml', v_dte.ted_xml IS NOT NULL
    )
  );
END;
$$;

-- ============================================================
-- Función: Listar DTEs de un supplier con filtros
-- ============================================================
CREATE OR REPLACE FUNCTION list_supplier_dtes(
  p_supplier_id UUID,
  p_fecha_desde DATE DEFAULT NULL,
  p_fecha_hasta DATE DEFAULT NULL,
  p_tipo_dte SMALLINT DEFAULT NULL,
  p_estado VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  tipo_dte SMALLINT,
  folio INTEGER,
  fecha_emision DATE,
  rut_receptor VARCHAR,
  razon_social_receptor VARCHAR,
  monto_total BIGINT,
  estado VARCHAR,
  track_id VARCHAR,
  supplier_order_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario autenticado tenga acceso al supplier
  -- Service role puede listar DTEs de cualquier supplier (usado por Edge Functions/Admin)
  IF COALESCE(auth.role(), 'anon') != 'service_role' THEN
    IF auth.uid() IS NULL OR p_supplier_id != auth.uid() THEN
      RETURN;  -- Retorna vacío sin error para no revelar existencia
    END IF;
  END IF;
  
  -- Limitar máximo de resultados para evitar DoS
  IF p_limit > 500 THEN
    p_limit := 500;
  END IF;
  IF p_limit < 1 THEN
    p_limit := 50;
  END IF;
  IF p_offset < 0 THEN
    p_offset := 0;
  END IF;

  RETURN QUERY
  SELECT 
    d.id,
    d.tipo_dte,
    d.folio,
    d.fecha_emision,
    d.rut_receptor,
    d.razon_social_receptor,
    d.monto_total,
    d.estado,
    d.track_id,
    d.supplier_order_id,
    d.created_at
  FROM supplier_dtes d
  WHERE d.supplier_id = p_supplier_id
    AND (p_fecha_desde IS NULL OR d.fecha_emision >= p_fecha_desde)
    AND (p_fecha_hasta IS NULL OR d.fecha_emision <= p_fecha_hasta)
    AND (p_tipo_dte IS NULL OR d.tipo_dte = p_tipo_dte)
    AND (p_estado IS NULL OR d.estado = p_estado)
  ORDER BY d.fecha_emision DESC, d.folio DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================================
-- Comentarios
-- ============================================================
COMMENT ON FUNCTION emit_dte_for_supplier_order(UUID, SMALLINT) IS 'Emite un DTE para una orden de supplier. Retorna JSON con resultado.';
COMMENT ON FUNCTION get_supplier_order_dte(UUID) IS 'Obtiene el DTE asociado a una orden de supplier si existe.';
COMMENT ON FUNCTION list_supplier_dtes(UUID, DATE, DATE, SMALLINT, VARCHAR, INTEGER, INTEGER) IS 'Lista DTEs de un supplier con filtros opcionales.';
