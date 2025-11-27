-- ============================================================
-- Migración: Facturación Electrónica SII
-- Tablas para gestión de certificados, CAFs y DTEs por supplier
-- ============================================================
DO $$
BEGIN
  -- Verificar que users existe (dependencia principal)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    RAISE EXCEPTION 'La tabla users debe existir antes de ejecutar esta migración';
  END IF;
  
  -- Verificar que supplier_orders existe (dependencia)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_orders') THEN
    RAISE EXCEPTION 'La tabla supplier_orders debe existir antes de ejecutar esta migración';
  END IF;
  
  -- Verificar que orders existe (dependencia)
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    RAISE EXCEPTION 'La tabla orders debe existir antes de ejecutar esta migración';
  END IF;
  
  -- Si las tablas de facturación ya existen con datos, abortar
  -- Verificamos TODAS las tablas que vamos a eliminar, no solo supplier_dtes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_dtes') THEN
    IF EXISTS (SELECT 1 FROM supplier_dtes LIMIT 1) THEN
      RAISE EXCEPTION 'La tabla supplier_dtes ya contiene datos. Use una migración de actualización en lugar de recrear.';
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_cafs') THEN
    IF EXISTS (SELECT 1 FROM supplier_cafs LIMIT 1) THEN
      RAISE EXCEPTION 'La tabla supplier_cafs ya contiene datos. Use una migración de actualización en lugar de recrear.';
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_certificates') THEN
    IF EXISTS (SELECT 1 FROM supplier_certificates LIMIT 1) THEN
      RAISE EXCEPTION 'La tabla supplier_certificates ya contiene datos. Use una migración de actualización en lugar de recrear.';
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_billing_config') THEN
    IF EXISTS (SELECT 1 FROM supplier_billing_config LIMIT 1) THEN
      RAISE EXCEPTION 'La tabla supplier_billing_config ya contiene datos. Use una migración de actualización en lugar de recrear.';
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_secrets') THEN
    IF EXISTS (SELECT 1 FROM supplier_secrets LIMIT 1) THEN
      RAISE EXCEPTION 'La tabla supplier_secrets ya contiene datos. Use una migración de actualización en lugar de recrear.';
    END IF;
  END IF;
END $$;

-- Eliminar tablas SOLO si están vacías (ya verificado arriba)
DROP TABLE IF EXISTS supplier_secrets CASCADE;
DROP TABLE IF EXISTS supplier_dtes CASCADE;
DROP TABLE IF EXISTS supplier_cafs CASCADE;
DROP TABLE IF EXISTS supplier_certificates CASCADE;
DROP TABLE IF EXISTS supplier_billing_config CASCADE;

-- ============================================================
-- Tabla: Certificados digitales de proveedores
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- supplier_id es el user_id del proveedor en la tabla users
  supplier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  rut_titular VARCHAR(12) NOT NULL CHECK (rut_titular ~ '^[0-9]{1,8}-[0-9Kk]$'),
  nombre_titular VARCHAR(100) NOT NULL, -- Máx 100 chars según SII
  
  -- Certificado cifrado con AES-256-GCM
  pfx_encrypted TEXT NOT NULL,
  iv VARCHAR(64) NOT NULL,
  auth_tag VARCHAR(64) NOT NULL,
  
  -- Hash de passphrase para verificación
  passphrase_hash VARCHAR(128),
  
  -- Fechas de validez
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  
  -- Identificación única del certificado
  fingerprint VARCHAR(128) NOT NULL,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (valid_from < valid_to),
  UNIQUE(supplier_id, fingerprint)
);

-- Índice para búsqueda de certificado activo (is_active en WHERE, no en columnas)
CREATE INDEX IF NOT EXISTS idx_supplier_certificates_active 
  ON supplier_certificates(supplier_id) 
  WHERE is_active = true;

-- Índice para alertas de vencimiento de certificados
CREATE INDEX IF NOT EXISTS idx_supplier_certificates_vencimiento
  ON supplier_certificates(supplier_id, valid_to)
  WHERE is_active = true;

-- ============================================================
-- Tabla: CAFs (Códigos de Autorización de Folios)
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_cafs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  tipo_dte SMALLINT NOT NULL CHECK (tipo_dte IN (33, 34, 39, 41, 52, 56, 61)),
  
  -- Rango de folios (SII permite 1-999999999)
  folio_desde INTEGER NOT NULL CHECK (folio_desde >= 1 AND folio_desde <= 999999999),
  folio_hasta INTEGER NOT NULL CHECK (folio_hasta >= 1 AND folio_hasta <= 999999999),
  -- El límite superior de folio_actual se valida con el CHECK de rango más abajo
  folio_actual INTEGER NOT NULL CHECK (folio_actual >= 1),
  
  -- CAF cifrado (AES-256-GCM) - siempre cifrado, por eso IV y auth_tag son NOT NULL
  caf_xml_encrypted TEXT NOT NULL,
  caf_iv VARCHAR(64) NOT NULL,
  caf_auth_tag VARCHAR(64) NOT NULL,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  agotado BOOLEAN DEFAULT false,
  
  -- Fechas
  fecha_autorizacion DATE NOT NULL,
  fecha_vencimiento DATE,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (folio_desde <= folio_hasta),
  CHECK (folio_actual >= folio_desde AND folio_actual <= folio_hasta + 1),
  CHECK (fecha_vencimiento IS NULL OR fecha_vencimiento >= fecha_autorizacion),
  UNIQUE(supplier_id, tipo_dte, folio_desde)
);

-- Índice para obtener CAF activo por tipo (columnas filtradas en WHERE ya no van en índice)
CREATE INDEX IF NOT EXISTS idx_supplier_cafs_active 
  ON supplier_cafs(supplier_id, tipo_dte)
  WHERE is_active = true AND agotado = false;

-- Índice para consultar CAFs por fecha de vencimiento
CREATE INDEX IF NOT EXISTS idx_supplier_cafs_vencimiento 
  ON supplier_cafs(supplier_id, fecha_vencimiento)
  WHERE fecha_vencimiento IS NOT NULL;

-- ============================================================
-- Tabla: DTEs emitidos
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_dtes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  
  -- Identificación del documento
  tipo_dte SMALLINT NOT NULL CHECK (tipo_dte IN (33, 34, 39, 41, 52, 56, 61)),
  folio INTEGER NOT NULL CHECK (folio >= 1 AND folio <= 999999999),
  fecha_emision DATE NOT NULL CHECK (fecha_emision <= CURRENT_DATE),
  
  -- Receptor (tamaños según normativa SII - Manual de Codificación XML)
  rut_receptor VARCHAR(12) NOT NULL CHECK (rut_receptor ~ '^[0-9]{1,8}-[0-9Kk]$'),
  razon_social_receptor VARCHAR(100) NOT NULL, -- Máx 100 chars SII (RznSocRecep)
  giro_receptor VARCHAR(40),                   -- Máx 40 chars SII (GiroRecep)
  direccion_receptor VARCHAR(70),              -- Máx 70 chars SII (DirRecep)
  comuna_receptor VARCHAR(20),                 -- Máx 20 chars SII (CmnaRecep)
  ciudad_receptor VARCHAR(20),                 -- Máx 20 chars SII (CiudadRecep)
  
  -- Montos (BIGINT para soportar montos grandes)
  monto_neto BIGINT CHECK (monto_neto IS NULL OR monto_neto >= 0),
  monto_exento BIGINT CHECK (monto_exento IS NULL OR monto_exento >= 0),
  iva BIGINT CHECK (iva IS NULL OR iva >= 0),
  monto_total BIGINT NOT NULL CHECK (monto_total >= 0),
  
  -- Campos adicionales requeridos por SII
  -- IndServicio: 1=Serv. periódico dom., 2=Serv. periódico otros, 3=Bienes o serv. no periódicos
  -- Requerido para Boletas (39, 41)
  ind_servicio SMALLINT CHECK (ind_servicio IS NULL OR ind_servicio IN (1, 2, 3)),
  -- FmaPago: 1=Contado, 2=Crédito, 3=Sin costo (gratuito)
  forma_pago SMALLINT CHECK (forma_pago IS NULL OR forma_pago IN (1, 2, 3)),
  
  -- Estado SII (con valores permitidos)
  track_id VARCHAR(50),
  estado VARCHAR(25) DEFAULT 'PENDIENTE' 
    CHECK (estado IN ('PENDIENTE', 'ENVIADO', 'ACEPTADO', 'RECHAZADO', 'ACEPTADO_CON_REPAROS', 'ANULADO', 'SIMULADO', 'ERROR')),
  glosa_estado VARCHAR(2000),  -- Limitar tamaño para evitar abuso
  fecha_aceptacion TIMESTAMPTZ,
  
  -- Referencia a DTE original (requerido para NC tipo 61 y ND tipo 56)
  -- ON DELETE RESTRICT: no se puede eliminar un DTE si está referenciado por NC/ND
  dte_referencia_id UUID REFERENCES supplier_dtes(id) ON DELETE RESTRICT,
  dte_referencia_tipo SMALLINT CHECK (dte_referencia_tipo IS NULL OR dte_referencia_tipo IN (33, 34, 39, 41, 52, 56, 61)),
  dte_referencia_folio INTEGER CHECK (dte_referencia_folio IS NULL OR (dte_referencia_folio >= 1 AND dte_referencia_folio <= 999999999)),
  dte_referencia_fecha DATE,
  -- Código de Referencia SII (requerido para NC/ND):
  -- 1=Anula documento, 2=Corrige texto, 3=Corrige montos
  codigo_referencia SMALLINT CHECK (codigo_referencia IS NULL OR codigo_referencia IN (1, 2, 3)),
  razon_referencia VARCHAR(90), -- Máx 90 chars SII (RazonRef)
  
  -- XML firmado (comprimido con gzip, Base64)
  xml_firmado TEXT,
  
  -- TED para PDF417
  ted_xml TEXT,
  
  -- Detalle de items (JSONB para regenerar XML/PDF)
  detalle_items JSONB,
  
  -- Referencia a orden (usa supplier_order_id, no order_id directamente)
  -- ON DELETE SET NULL preserva el DTE si se elimina la orden (documento tributario legal)
  supplier_order_id UUID REFERENCES supplier_orders(id) ON DELETE SET NULL,
  -- También guardamos parent_order_id para queries rápidas
  parent_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Documento único por emisor
  UNIQUE(supplier_id, tipo_dte, folio),
  
  -- NC (61) y ND (56) DEBEN referenciar un documento original con código de referencia
  -- Puede ser por ID interno (dte_referencia_id) o por datos externos (tipo/folio/fecha)
  CHECK (
    (tipo_dte NOT IN (56, 61)) OR 
    (
      codigo_referencia IS NOT NULL AND
      (dte_referencia_id IS NOT NULL OR 
       (dte_referencia_tipo IS NOT NULL AND dte_referencia_folio IS NOT NULL AND dte_referencia_fecha IS NOT NULL))
    )
  ),
  
  -- Boletas (39, 41) DEBEN tener IndServicio (campo obligatorio SII)
  CHECK (
    (tipo_dte NOT IN (39, 41)) OR 
    (ind_servicio IS NOT NULL)
  ),
  
  -- NC (61) y ND (56) no pueden referenciar documentos del mismo tipo
  -- NC debe referenciar Factura(33,34), Boleta(39,41) o Guía(52)
  -- ND debe referenciar Factura(33,34), Boleta(39,41), Guía(52) o NC(61)
  CHECK (
    dte_referencia_tipo IS NULL OR
    (tipo_dte = 61 AND dte_referencia_tipo IN (33, 34, 39, 41, 52)) OR  -- NC puede ref F, B, GD
    (tipo_dte = 56 AND dte_referencia_tipo IN (33, 34, 39, 41, 52, 61)) OR  -- ND puede ref F, B, GD, NC
    (tipo_dte NOT IN (56, 61))  -- Otros tipos sin restricción
  )
);

-- Índices para consultas comunes
CREATE INDEX IF NOT EXISTS idx_supplier_dtes_fecha 
  ON supplier_dtes(supplier_id, fecha_emision DESC);

-- Índice para reportes por tipo y período
CREATE INDEX IF NOT EXISTS idx_supplier_dtes_tipo_fecha 
  ON supplier_dtes(supplier_id, tipo_dte, fecha_emision DESC);

CREATE INDEX IF NOT EXISTS idx_supplier_dtes_receptor 
  ON supplier_dtes(supplier_id, rut_receptor);

CREATE INDEX IF NOT EXISTS idx_supplier_dtes_estado 
  ON supplier_dtes(supplier_id, estado);

CREATE INDEX IF NOT EXISTS idx_supplier_dtes_track 
  ON supplier_dtes(track_id) 
  WHERE track_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_dtes_supplier_order 
  ON supplier_dtes(supplier_order_id) 
  WHERE supplier_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_dtes_parent_order 
  ON supplier_dtes(parent_order_id) 
  WHERE parent_order_id IS NOT NULL;

-- Índice para referencias de NC/ND al documento original
CREATE INDEX IF NOT EXISTS idx_supplier_dtes_referencia 
  ON supplier_dtes(dte_referencia_id) 
  WHERE dte_referencia_id IS NOT NULL;

-- ============================================================
-- Tabla: Configuración de facturación por supplier
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_billing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
  
  -- Datos tributarios (estos pueden diferir del RUT del usuario)
  rut_emisor VARCHAR(12) NOT NULL CHECK (rut_emisor ~ '^[0-9]{1,8}-[0-9Kk]$'),
  razon_social VARCHAR(100) NOT NULL,  -- Máx 100 chars SII (RznSoc)
  giro VARCHAR(80) NOT NULL,           -- Máx 80 chars SII (GiroEmis)
  direccion VARCHAR(70) NOT NULL,      -- Máx 70 chars SII (DirOrigen)
  comuna VARCHAR(20) NOT NULL,         -- Máx 20 chars SII (CmnaOrigen)
  ciudad VARCHAR(20),                  -- Máx 20 chars SII (CiudadOrigen) - Opcional
  -- Códigos de actividad económica SII (6 dígitos, ej: 469000)
  -- La validación de rango (100000-999999) se hace en la capa de aplicación
  actividades_economicas INTEGER[] DEFAULT '{469000}'
    CHECK (actividades_economicas IS NULL OR array_length(actividades_economicas, 1) > 0),
  
  -- Sucursal (opcional)
  sucursal VARCHAR(100),
  codigo_sucursal INTEGER CHECK (codigo_sucursal IS NULL OR codigo_sucursal >= 0),
  
  -- Resolución SII (valores por defecto para ambiente CERT)
  -- En producción, estos valores deben actualizarse según la resolución real del contribuyente
  numero_resolucion INTEGER DEFAULT 0 CHECK (numero_resolucion >= 0),
  fecha_resolucion DATE,
  
  -- Ambiente
  ambiente VARCHAR(4) DEFAULT 'CERT' CHECK (ambiente IN ('CERT', 'PROD')),
  
  -- Email para notificaciones del SII (validación básica de formato)
  email_dte VARCHAR(100) CHECK (email_dte IS NULL OR email_dte ~ '^[^@]+@[^@]+\.[^@]+$'),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- En ambiente PROD, la resolución SII es obligatoria
  CHECK (
    ambiente = 'CERT' OR 
    (numero_resolucion > 0 AND fecha_resolucion IS NOT NULL)
  )
);

-- Índice para búsqueda por RUT emisor
CREATE INDEX IF NOT EXISTS idx_supplier_billing_config_rut
  ON supplier_billing_config(rut_emisor);

-- Índice para optimizar política RLS "Buyers can view DTEs of their orders"
-- Requerido para que el EXISTS sea eficiente con muchos usuarios
CREATE INDEX IF NOT EXISTS idx_orders_user_id_for_dte_policy
  ON orders(user_id, id);

-- ============================================================
-- Tabla: Secretos del proveedor
-- ============================================================
CREATE TABLE IF NOT EXISTS supplier_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
  
  -- Passphrase del certificado (cifrada con AES-256-GCM)
  -- Todos los campos son nullable porque el passphrase es opcional
  -- Pero si uno tiene valor, todos deben tenerlo (consistencia de cifrado)
  passphrase_encrypted TEXT,
  passphrase_iv VARCHAR(64),
  passphrase_auth_tag VARCHAR(64),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- CHECK de consistencia: si hay passphrase cifrado, debe tener IV y auth_tag
  CHECK (
    (passphrase_encrypted IS NULL AND passphrase_iv IS NULL AND passphrase_auth_tag IS NULL) OR
    (passphrase_encrypted IS NOT NULL AND passphrase_iv IS NOT NULL AND passphrase_auth_tag IS NOT NULL)
  )
);

-- ============================================================
-- Funciones RPC para gestión atómica de folios
-- ============================================================

-- Función: Obtener siguiente folio disponible
CREATE OR REPLACE FUNCTION get_next_folio(
  p_supplier_id UUID,
  p_tipo_dte SMALLINT
)
RETURNS TABLE (
  id UUID,
  supplier_id UUID,
  tipo_dte SMALLINT,
  folio_desde INTEGER,
  folio_hasta INTEGER,
  folio_actual INTEGER,
  -- caf_xml_encrypted se obtiene por separado con get_caf_xml() por seguridad
  is_active BOOLEAN,
  agotado BOOLEAN,
  fecha_autorizacion DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caf supplier_cafs%ROWTYPE;
  v_tipos_validos SMALLINT[] := ARRAY[33, 34, 39, 41, 52, 56, 61];
BEGIN
  -- Validar tipo_dte sea válido
  IF NOT (p_tipo_dte = ANY(v_tipos_validos)) THEN
    RAISE EXCEPTION 'Tipo DTE inválido: %. Valores permitidos: 33, 34, 39, 41, 52, 56, 61', p_tipo_dte;
  END IF;
  
  -- Validar que el usuario solo puede obtener folios de su propio supplier_id
  -- Service role puede obtener folios de cualquier supplier (usado por Edge Functions)
  IF COALESCE(auth.role(), 'anon') != 'service_role' AND p_supplier_id != auth.uid() THEN
    RAISE EXCEPTION 'Acceso denegado: no puedes obtener folios de otro supplier';
  END IF;
  
  -- Obtener CAF activo con lock para evitar race conditions
  SELECT * INTO v_caf
  FROM supplier_cafs sc
  WHERE sc.supplier_id = p_supplier_id
    AND sc.tipo_dte = p_tipo_dte
    AND sc.is_active = true
    AND sc.agotado = false
    AND sc.folio_actual <= sc.folio_hasta
    AND (sc.fecha_vencimiento IS NULL OR sc.fecha_vencimiento >= CURRENT_DATE)
  ORDER BY sc.folio_desde
  LIMIT 1
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No hay CAF disponible para tipo DTE %', p_tipo_dte;
  END IF;
  
  -- Incrementar folio actual (usamos v_caf capturado para consistencia)
  -- NOTA: updated_at se actualiza automáticamente via trigger
  UPDATE supplier_cafs
  SET 
    folio_actual = v_caf.folio_actual + 1,
    agotado = (v_caf.folio_actual + 1 > v_caf.folio_hasta)
  WHERE supplier_cafs.id = v_caf.id;
  
  -- Retornar el CAF con el folio asignado (sin XML cifrado por seguridad)
  RETURN QUERY
  SELECT 
    v_caf.id,
    v_caf.supplier_id,
    v_caf.tipo_dte,
    v_caf.folio_desde,
    v_caf.folio_hasta,
    v_caf.folio_actual,  -- Este es el folio asignado
    v_caf.is_active,
    v_caf.agotado,
    v_caf.fecha_autorizacion;
END;
$$;

-- Función: Obtener CAF XML cifrado (solo para Edge Functions vía service_role)
-- Esta función está separada por seguridad - el XML nunca viaja en get_next_folio
CREATE OR REPLACE FUNCTION get_caf_xml(
  p_caf_id UUID,
  p_supplier_id UUID DEFAULT NULL  -- Opcional: para validar ownership
)
RETURNS TABLE (
  caf_xml_encrypted TEXT,
  caf_iv VARCHAR,
  caf_auth_tag VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo service_role puede obtener el XML cifrado
  -- Usamos COALESCE para manejar NULL (usuario anónimo)
  IF COALESCE(auth.role(), 'anon') != 'service_role' THEN
    RAISE EXCEPTION 'Acceso denegado: solo service_role puede obtener el CAF XML';
  END IF;
  
  -- Si se proporciona supplier_id, validar que el CAF pertenece a ese supplier
  -- Esto previene que un service_role comprometido lea CAFs de otros suppliers
  IF p_supplier_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM supplier_cafs sc 
      WHERE sc.id = p_caf_id AND sc.supplier_id = p_supplier_id
    ) THEN
      RAISE EXCEPTION 'Acceso denegado: el CAF no pertenece al supplier especificado';
    END IF;
  END IF;
  
  RETURN QUERY
  SELECT sc.caf_xml_encrypted, sc.caf_iv, sc.caf_auth_tag
  FROM supplier_cafs sc
  WHERE sc.id = p_caf_id;
END;
$$;

-- Función: Obtener estadísticas de folios
CREATE OR REPLACE FUNCTION get_folio_stats(p_supplier_id UUID)
RETURNS TABLE (
  tipo_dte SMALLINT,
  nombre_tipo VARCHAR,
  total_autorizados BIGINT,
  usados BIGINT,
  disponibles BIGINT,
  porcentaje_usado NUMERIC,
  alerta_baja BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validar que el usuario solo puede ver stats de su propio supplier_id
  -- Service role puede ver stats de cualquier supplier (usado por Edge Functions/Admin)
  IF COALESCE(auth.role(), 'anon') != 'service_role' AND p_supplier_id != auth.uid() THEN
    RAISE EXCEPTION 'Acceso denegado: no puedes ver estadísticas de otro supplier';
  END IF;
  
  RETURN QUERY
  SELECT 
    sc.tipo_dte,
    CASE sc.tipo_dte
      WHEN 33 THEN 'Factura Electrónica'::VARCHAR
      WHEN 34 THEN 'Factura Exenta'::VARCHAR
      WHEN 39 THEN 'Boleta Electrónica'::VARCHAR
      WHEN 41 THEN 'Boleta Exenta'::VARCHAR
      WHEN 52 THEN 'Guía de Despacho'::VARCHAR
      WHEN 56 THEN 'Nota de Débito'::VARCHAR
      WHEN 61 THEN 'Nota de Crédito'::VARCHAR
      ELSE 'Tipo ' || sc.tipo_dte::VARCHAR
    END AS nombre_tipo,
    SUM(sc.folio_hasta - sc.folio_desde + 1)::BIGINT AS total_autorizados,
    SUM(sc.folio_actual - sc.folio_desde)::BIGINT AS usados,
    -- GREATEST evita valores negativos en caso de race condition
    GREATEST(SUM(sc.folio_hasta - sc.folio_actual + 1), 0)::BIGINT AS disponibles,
    ROUND(
      SUM(sc.folio_actual - sc.folio_desde)::NUMERIC / 
      NULLIF(SUM(sc.folio_hasta - sc.folio_desde + 1), 0) * 100, 
      2
    ) AS porcentaje_usado,
    GREATEST(SUM(sc.folio_hasta - sc.folio_actual + 1), 0) < 100 AS alerta_baja
  FROM supplier_cafs sc
  WHERE sc.supplier_id = p_supplier_id
    AND sc.is_active = true
    AND sc.agotado = false
    AND (sc.fecha_vencimiento IS NULL OR sc.fecha_vencimiento >= CURRENT_DATE)
  GROUP BY sc.tipo_dte
  ORDER BY sc.tipo_dte;
END;
$$;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE supplier_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_cafs ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_dtes ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_secrets ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo el supplier puede ver/gestionar sus propios datos
-- (supplier_id = auth.uid() porque supplier_id ES el user_id)

-- Certificates: solo lectura para suppliers (upload via Edge Function)
CREATE POLICY "Suppliers can view own certificates"
  ON supplier_certificates FOR SELECT
  USING (supplier_id = auth.uid());

-- CAFs: solo lectura para suppliers (upload via Edge Function)
CREATE POLICY "Suppliers can view own CAFs"
  ON supplier_cafs FOR SELECT
  USING (supplier_id = auth.uid());

-- DTEs: solo lectura para suppliers (creación via Edge Function)
CREATE POLICY "Suppliers can view own DTEs"
  ON supplier_dtes FOR SELECT
  USING (supplier_id = auth.uid());

-- Los compradores pueden ver DTEs de sus propias órdenes (la factura que les emitieron)
-- Usamos EXISTS en lugar de IN para mejor performance con muchas órdenes
-- NOTA: Para óptimo rendimiento, asegurarse de que exista índice en orders(user_id, id)
--       CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE POLICY "Buyers can view DTEs of their orders"
  ON supplier_dtes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.id = supplier_dtes.parent_order_id 
        AND o.user_id = auth.uid()
    )
  );

-- Billing Config: suppliers pueden ver, crear y actualizar su config
CREATE POLICY "Suppliers can view own billing config"
  ON supplier_billing_config FOR SELECT
  USING (supplier_id = auth.uid());

CREATE POLICY "Suppliers can insert own billing config"
  ON supplier_billing_config FOR INSERT
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Suppliers can update own billing config"
  ON supplier_billing_config FOR UPDATE
  USING (supplier_id = auth.uid())
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Suppliers can delete own billing config"
  ON supplier_billing_config FOR DELETE
  USING (supplier_id = auth.uid());

-- Secrets: solo lectura (gestión via Edge Function por seguridad)
CREATE POLICY "Suppliers can view own secrets"
  ON supplier_secrets FOR SELECT
  USING (supplier_id = auth.uid());

-- Service role puede hacer todo (para Edge Functions)
CREATE POLICY "Service role full access certificates"
  ON supplier_certificates FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access CAFs"
  ON supplier_cafs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access DTEs"
  ON supplier_dtes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access billing config"
  ON supplier_billing_config FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access secrets"
  ON supplier_secrets FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- Triggers para auditoría
-- ============================================================

-- Función genérica para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función: Marcar CAF como agotado automáticamente (defensa en profundidad)
-- Garantiza consistencia incluso si la lógica de las funciones RPC falla
CREATE OR REPLACE FUNCTION tr_update_caf_agotado()
RETURNS TRIGGER AS $$
BEGIN
  NEW.agotado := (NEW.folio_actual > NEW.folio_hasta);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para marcar agotado automáticamente en supplier_cafs
DROP TRIGGER IF EXISTS tr_supplier_cafs_agotado ON supplier_cafs;
CREATE TRIGGER tr_supplier_cafs_agotado
  BEFORE INSERT OR UPDATE ON supplier_cafs
  FOR EACH ROW EXECUTE FUNCTION tr_update_caf_agotado();

-- Función para validar códigos de actividad económica SII (6 dígitos: 100000-999999)
CREATE OR REPLACE FUNCTION validate_actividades_economicas()
RETURNS TRIGGER AS $$
DECLARE
  codigo INTEGER;
BEGIN
  IF NEW.actividades_economicas IS NOT NULL THEN
    FOREACH codigo IN ARRAY NEW.actividades_economicas LOOP
      IF codigo < 100000 OR codigo > 999999 THEN
        RAISE EXCEPTION 'Código de actividad económica inválido: %. Debe estar entre 100000 y 999999', codigo;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para validar actividades económicas
DROP TRIGGER IF EXISTS tr_supplier_billing_config_validate_acteco ON supplier_billing_config;
CREATE TRIGGER tr_supplier_billing_config_validate_acteco
  BEFORE INSERT OR UPDATE ON supplier_billing_config
  FOR EACH ROW EXECUTE FUNCTION validate_actividades_economicas();

-- Triggers de updated_at
DROP TRIGGER IF EXISTS tr_supplier_certificates_updated ON supplier_certificates;
CREATE TRIGGER tr_supplier_certificates_updated
  BEFORE UPDATE ON supplier_certificates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_supplier_cafs_updated ON supplier_cafs;
CREATE TRIGGER tr_supplier_cafs_updated
  BEFORE UPDATE ON supplier_cafs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_supplier_dtes_updated ON supplier_dtes;
CREATE TRIGGER tr_supplier_dtes_updated
  BEFORE UPDATE ON supplier_dtes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_supplier_billing_config_updated ON supplier_billing_config;
CREATE TRIGGER tr_supplier_billing_config_updated
  BEFORE UPDATE ON supplier_billing_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS tr_supplier_secrets_updated ON supplier_secrets;
CREATE TRIGGER tr_supplier_secrets_updated
  BEFORE UPDATE ON supplier_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Comentarios de documentación
-- ============================================================

COMMENT ON TABLE supplier_certificates IS 'Certificados digitales PFX de proveedores para firma electrónica SII';
COMMENT ON TABLE supplier_cafs IS 'Códigos de Autorización de Folios asignados por el SII';
COMMENT ON TABLE supplier_dtes IS 'Documentos Tributarios Electrónicos emitidos';
COMMENT ON TABLE supplier_billing_config IS 'Configuración tributaria del proveedor';
COMMENT ON TABLE supplier_secrets IS 'Secretos cifrados del proveedor (passphrase certificado)';

-- COMMENT ON FUNCTION requiere firma completa con tipos de parámetros
COMMENT ON FUNCTION get_next_folio(UUID, SMALLINT) IS 'Obtiene el siguiente folio disponible de forma atómica. Retorna el folio asignado.';
COMMENT ON FUNCTION get_caf_xml(UUID, UUID) IS 'Obtiene el CAF XML cifrado. Solo accesible por service_role. El segundo parámetro opcional valida ownership.';
COMMENT ON FUNCTION get_folio_stats(UUID) IS 'Retorna estadísticas de uso de folios por tipo de DTE para un supplier.';
