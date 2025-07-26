# 📊 Análisis Exhaustivo: Tablas SQL Necesarias para Admin Dashboard

## 🎯 Análisis de la Estructura Actual

### 📋 Componentes Analizados
1. **AdminDashboard.jsx**: Panel principal con 3 pestañas (Solicitudes, Usuarios, Productos)
2. **resumenorders.md**: Sistema de órdenes B2B con gestión de estados
3. **querynew.sql**: Esquema actual de Supabase con 20+ tablas
4. **Servicios Admin**: AdminPanelTable, UserManagementTable, ProductMarketplaceTable

### 🔍 Funcionalidades Identificadas

#### 1. Panel de Solicitudes de Pago
- Gestión de solicitudes de pagos/reembolsos
- Estados: pendiente, confirmado, rechazado, devuelto, en_proceso
- Filtros por estado, fecha, proveedor, comprador
- Acciones: confirmar, rechazar, devolver pagos

#### 2. Panel de Gestión de Usuarios
- Banear/desbanear usuarios con razones
- Verificar/desverificar cuentas
- Filtros: activos, baneados, proveedores, compradores, verificados
- Estadísticas de usuarios
- Eliminación múltiple de usuarios

#### 3. Panel de Productos Marketplace
- Visualizar productos disponibles
- Eliminar productos del marketplace
- Filtros por disponibilidad y stock
- Estadísticas de productos

---

## 📚 TABLAS SQL NECESARIAS PARA DASHBOARD ADMINISTRATIVO

### 1. 🎟️ Tabla: `admin_payment_requests`

**Propósito**: Gestionar solicitudes de pagos y reembolsos que los administradores deben procesar.

```sql
CREATE TABLE public.admin_payment_requests (
  -- Identificación
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE, -- Número de ticket visible (ej: TKT-001)
  
  -- Relaciones
  order_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  
  -- Información de la solicitud
  request_type text NOT NULL CHECK (request_type IN ('payment', 'refund', 'dispute')),
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmado', 'rechazado', 'devuelto', 'en_proceso')),
  
  -- Montos y detalles financieros
  requested_amount numeric NOT NULL CHECK (requested_amount > 0),
  currency text NOT NULL DEFAULT 'CLP',
  
  -- Información contextual del pedido
  supplier_name text NOT NULL, -- Nombre del proveedor (desnormalizado para performance)
  buyer_name text NOT NULL, -- Nombre del comprador (desnormalizado para performance)
  delivery_address text NOT NULL, -- Dirección de entrega completa
  
  -- Información adicional
  supplier_message text,
  admin_notes text,
  rejection_reason text,
  
  -- Documentos y comprobantes
  payment_proof_url text,
  additional_documents jsonb DEFAULT '[]',
  
  -- Fechas de entrega y procesamiento
  delivery_date date,
  requested_delivery_date date,
  fecha_solicitada date NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega date,
  
  -- Metadatos administrativos
  processed_by uuid, -- FK a control_panel_users
  processed_at timestamp with time zone,
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Claves primarias y foráneas
  CONSTRAINT admin_payment_requests_pkey PRIMARY KEY (request_id),
  CONSTRAINT admin_payment_requests_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT admin_payment_requests_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.users(user_id),
  CONSTRAINT admin_payment_requests_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(user_id),
  CONSTRAINT admin_payment_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.control_panel_users(id)
);

-- Función para generar ticket numbers automáticamente
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS text AS $$
DECLARE
  next_number integer;
  ticket_num text;
BEGIN
  -- Obtener el siguiente número de secuencia
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 5) AS integer)), 0) + 1
  INTO next_number
  FROM admin_payment_requests
  WHERE ticket_number ~ '^TKT-[0-9]+$';
  
  -- Formatear con padding de ceros
  ticket_num := 'TKT-' || LPAD(next_number::text, 3, '0');
  
  RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar ticket numbers
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_payment_requests_ticket_trigger
  BEFORE INSERT ON admin_payment_requests
  FOR EACH ROW EXECUTE FUNCTION set_ticket_number();

-- Trigger para updated_at
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

-- Índices para performance
CREATE INDEX idx_admin_payment_requests_status ON public.admin_payment_requests(status);
CREATE INDEX idx_admin_payment_requests_created_at ON public.admin_payment_requests(created_at DESC);
CREATE INDEX idx_admin_payment_requests_supplier_id ON public.admin_payment_requests(supplier_id);
CREATE INDEX idx_admin_payment_requests_order_id ON public.admin_payment_requests(order_id);
CREATE INDEX idx_admin_payment_requests_ticket ON public.admin_payment_requests(ticket_number);
CREATE INDEX idx_admin_payment_requests_fecha_solicitada ON public.admin_payment_requests(fecha_solicitada DESC);
```

**Justificación**: Esta tabla es esencial porque el dashboard actual maneja solicitudes de pago que no están representadas en el esquema actual. Los administradores necesitan:
- Gestionar pagos pendientes de proveedores
- Procesar reembolsos a compradores  
- Mantener registro de quién procesó cada solicitud
- Filtrar por estados y fechas
- **Campos añadidos críticos**:
  - `ticket_number`: Identificador único visible (TKT-001, TKT-002, etc.)
  - Estados corregidos: `pendiente`, `confirmado`, `rechazado`, `devuelto`, `en_proceso` (coinciden con frontend)
  - Campos desnormalizados (`supplier_name`, `buyer_name`, `delivery_address`) para performance del dashboard
  - Auto-generación de tickets con triggers para consistencia

---

### 2. 🔐 Tabla: `admin_user_actions` (Mejorar auditoría existente)

**Propósito**: Registro detallado de todas las acciones administrativas sobre usuarios.

```sql
CREATE TABLE public.admin_user_actions (
  -- Identificación
  action_id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Relaciones
  admin_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  
  -- Tipo de acción
  action_type text NOT NULL CHECK (action_type IN ('ban', 'unban', 'verify', 'unverify', 'delete', 'modify_profile', 'reset_password')),
  
  -- Detalles de la acción
  reason text,
  previous_status jsonb, -- Estado anterior del usuario
  new_status jsonb, -- Nuevo estado del usuario
  
  -- Contexto adicional
  notes text,
  duration_days integer, -- Para bans temporales
  expires_at timestamp with time zone, -- Para acciones temporales
  
  -- Metadatos técnicos
  ip_address text,
  user_agent text,
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Claves
  CONSTRAINT admin_user_actions_pkey PRIMARY KEY (action_id),
  CONSTRAINT admin_user_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id),
  CONSTRAINT admin_user_actions_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(user_id)
);

-- Índices
CREATE INDEX idx_admin_user_actions_target_user ON public.admin_user_actions(target_user_id);
CREATE INDEX idx_admin_user_actions_admin_id ON public.admin_user_actions(admin_id);
CREATE INDEX idx_admin_user_actions_created_at ON public.admin_user_actions(created_at DESC);
CREATE INDEX idx_admin_user_actions_action_type ON public.admin_user_actions(action_type);
```

**Justificación**: El sistema actual de auditoría (`admin_audit_log`) es genérico. Esta tabla específica permite:
- Rastrear historial completo de acciones sobre usuarios
- Implementar bans temporales con expiración automática
- Mantener contexto completo de cambios de estado
- Generar reportes de actividad administrativa

---

### 3. 📊 Tabla: `admin_dashboard_metrics`

**Propósito**: Cache de métricas y estadísticas para el dashboard administrativo.

```sql
CREATE TABLE public.admin_dashboard_metrics (
  -- Identificación
  metric_id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Tipo de métrica
  metric_type text NOT NULL CHECK (metric_type IN ('user_stats', 'payment_stats', 'product_stats', 'order_stats')),
  metric_name text NOT NULL,
  
  -- Valores de la métrica
  metric_value numeric,
  metric_data jsonb, -- Para métricas complejas
  
  -- Período de la métrica
  period_type text CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  period_start date,
  period_end date,
  
  -- Metadatos
  calculated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_current boolean DEFAULT true,
  
  -- Claves
  CONSTRAINT admin_dashboard_metrics_pkey PRIMARY KEY (metric_id),
  CONSTRAINT admin_dashboard_metrics_unique_current UNIQUE (metric_type, metric_name, period_type, period_start, is_current) WHERE is_current = true
);

-- Índices
CREATE INDEX idx_admin_dashboard_metrics_type_name ON public.admin_dashboard_metrics(metric_type, metric_name);
CREATE INDEX idx_admin_dashboard_metrics_current ON public.admin_dashboard_metrics(is_current) WHERE is_current = true;
CREATE INDEX idx_admin_dashboard_metrics_calculated_at ON public.admin_dashboard_metrics(calculated_at DESC);
```

**Justificación**: Las estadísticas se calculan frecuentemente y pueden ser costosas. Esta tabla permite:
- Cache de métricas calculadas para mejorar performance
- Histórico de estadísticas para análisis de tendencias
- Evitar recálculos costosos en cada carga del dashboard
- Métricas personalizadas por períodos de tiempo

---

### 4. 🛒 Tabla Mejorada: `orders` (Extender tabla existente)

**Modificaciones necesarias a la tabla existente**:

```sql
-- Agregar columnas faltantes para gestión administrativa
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_status text CHECK (admin_status IN ('pending_review', 'approved', 'flagged', 'requires_action'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.control_panel_users(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_confirmed_at timestamp with time zone;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS supplier_confirmed_delivery boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS buyer_confirmed_receipt boolean DEFAULT false;

-- Índices adicionales para dashboard administrativo
CREATE INDEX IF NOT EXISTS idx_orders_admin_status ON public.orders(admin_status);
CREATE INDEX IF NOT EXISTS idx_orders_reviewed_by ON public.orders(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
```

**Justificación**: La tabla orders existente necesita campos adicionales para:
- Revisión administrativa de pedidos
- Confirmación de entregas por ambas partes
- Estados administrativos separados de estados de negocio
- Trazabilidad de quién revisó cada pedido

---

### 5. 🏪 Tabla: `marketplace_product_management`

**Propósito**: Gestión administrativa específica de productos en el marketplace.

```sql
CREATE TABLE public.marketplace_product_management (
  -- Identificación
  management_id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Relación con producto
  product_id uuid NOT NULL,
  
  -- Estados administrativos
  admin_status text NOT NULL DEFAULT 'active' CHECK (admin_status IN ('active', 'under_review', 'suspended', 'banned', 'featured')),
  visibility_status text NOT NULL DEFAULT 'public' CHECK (visibility_status IN ('public', 'hidden', 'admin_only')),
  
  -- Razones administrativas
  suspension_reason text,
  review_notes text,
  
  -- Gestión de contenido
  content_flags jsonb DEFAULT '[]', -- Reportes de contenido inapropiado
  quality_score numeric CHECK (quality_score >= 0 AND quality_score <= 100),
  
  -- Promoción y destacados
  is_featured boolean DEFAULT false,
  featured_until timestamp with time zone,
  promotional_tags jsonb DEFAULT '[]',
  
  -- Metadatos administrativos
  managed_by uuid, -- FK a control_panel_users
  last_review_date timestamp with time zone,
  next_review_date timestamp with time zone,
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Claves
  CONSTRAINT marketplace_product_management_pkey PRIMARY KEY (management_id),
  CONSTRAINT marketplace_product_management_product_id_key UNIQUE (product_id),
  CONSTRAINT marketplace_product_management_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(productid),
  CONSTRAINT marketplace_product_management_managed_by_fkey FOREIGN KEY (managed_by) REFERENCES public.control_panel_users(id)
);

-- Índices
CREATE INDEX idx_marketplace_product_admin_status ON public.marketplace_product_management(admin_status);
CREATE INDEX idx_marketplace_product_visibility ON public.marketplace_product_management(visibility_status);
CREATE INDEX idx_marketplace_product_featured ON public.marketplace_product_management(is_featured) WHERE is_featured = true;
CREATE INDEX idx_marketplace_product_next_review ON public.marketplace_product_management(next_review_date) WHERE next_review_date IS NOT NULL;
```

**Justificación**: El dashboard necesita gestión administrativa avanzada de productos:
- Suspender productos por violaciones de políticas
- Sistema de productos destacados/promocionados
- Revisiones programadas de calidad
- Gestión de reportes y flags de contenido

---

### 6. 🎯 Tabla: `admin_dashboard_filters`

**Propósito**: Guardar filtros personalizados y configuraciones del dashboard por administrador.

```sql
CREATE TABLE public.admin_dashboard_filters (
  -- Identificación
  filter_id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Relación con administrador
  admin_id uuid NOT NULL,
  
  -- Configuración del filtro
  filter_name text NOT NULL,
  dashboard_section text NOT NULL CHECK (dashboard_section IN ('payment_requests', 'user_management', 'product_management')),
  
  -- Filtros guardados
  filter_config jsonb NOT NULL, -- Configuración completa de filtros
  
  -- Metadatos
  is_default boolean DEFAULT false,
  is_shared boolean DEFAULT false, -- Para compartir con otros admins
  
  -- Auditoría
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone,
  
  -- Claves
  CONSTRAINT admin_dashboard_filters_pkey PRIMARY KEY (filter_id),
  CONSTRAINT admin_dashboard_filters_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.control_panel_users(id),
  CONSTRAINT admin_dashboard_filters_unique_name UNIQUE (admin_id, filter_name, dashboard_section)
);

-- Índices
CREATE INDEX idx_admin_dashboard_filters_admin_section ON public.admin_dashboard_filters(admin_id, dashboard_section);
CREATE INDEX idx_admin_dashboard_filters_shared ON public.admin_dashboard_filters(is_shared) WHERE is_shared = true;
```

**Justificación**: Mejora la UX administrativa permitiendo:
- Guardar filtros complejos frecuentemente usados
- Filtros por defecto personalizados por administrador
- Compartir configuraciones entre equipo administrativo
- Análisis de patrones de uso del dashboard

---

### 7. 📈 Vista: `admin_dashboard_summary`

**Propósito**: Vista optimizada que consolida datos para el dashboard principal.

```sql
CREATE OR REPLACE VIEW public.admin_dashboard_summary AS
SELECT 
  -- Estadísticas de usuarios
  (SELECT COUNT(*) FROM users WHERE banned = false) as active_users,
  (SELECT COUNT(*) FROM users WHERE banned = true) as banned_users,
  (SELECT COUNT(*) FROM users WHERE main_supplier = true AND banned = false) as active_suppliers,
  (SELECT COUNT(*) FROM users WHERE main_supplier = false AND banned = false) as active_buyers,
  (SELECT COUNT(*) FROM users WHERE verified = true) as verified_users,
  
  -- Estadísticas de productos
  (SELECT COUNT(*) FROM products WHERE is_active = true) as active_products,
  (SELECT COUNT(*) FROM products p 
   JOIN marketplace_product_management mpm ON p.productid = mpm.product_id 
   WHERE mpm.admin_status = 'suspended') as suspended_products,
  
  -- Estadísticas de solicitudes de pago
  (SELECT COUNT(*) FROM admin_payment_requests WHERE status = 'pending') as pending_payment_requests,
  (SELECT COUNT(*) FROM admin_payment_requests WHERE status = 'processing') as processing_payment_requests,
  (SELECT COALESCE(SUM(requested_amount), 0) FROM admin_payment_requests WHERE status = 'pending') as pending_amount,
  
  -- Estadísticas de órdenes
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) as orders_today,
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as orders_this_week,
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE created_at >= CURRENT_DATE) as revenue_today,
  
  -- Última actualización
  now() as last_updated;
```

**Justificación**: Performance crítica para dashboard que se actualiza frecuentemente:
- Una sola consulta para todas las métricas principales
- Evita múltiples llamadas SQL desde el frontend
- Fácil de mantener y optimizar
- Base para métricas en tiempo real

---

## 🔧 FUNCIONES Y TRIGGERS NECESARIOS

### 1. Función: Actualizar métricas automáticamente

```sql
-- Función para recalcular métricas del dashboard
CREATE OR REPLACE FUNCTION refresh_admin_dashboard_metrics()
RETURNS void AS $$
BEGIN
  -- Limpiar métricas obsoletas
  UPDATE admin_dashboard_metrics SET is_current = false 
  WHERE metric_type = 'user_stats' AND is_current = true;
  
  -- Insertar nuevas métricas de usuarios
  INSERT INTO admin_dashboard_metrics (metric_type, metric_name, metric_value, metric_data, period_type)
  SELECT 
    'user_stats',
    'daily_summary',
    NULL,
    jsonb_build_object(
      'total_users', COUNT(*),
      'active_users', COUNT(*) FILTER (WHERE banned = false),
      'new_users_today', COUNT(*) FILTER (WHERE createdt >= CURRENT_DATE),
      'suppliers', COUNT(*) FILTER (WHERE main_supplier = true),
      'buyers', COUNT(*) FILTER (WHERE main_supplier = false)
    ),
    'daily'
  FROM users;
  
  -- Métricas de productos
  UPDATE admin_dashboard_metrics SET is_current = false 
  WHERE metric_type = 'product_stats' AND is_current = true;
  
  INSERT INTO admin_dashboard_metrics (metric_type, metric_name, metric_value, metric_data, period_type)
  SELECT 
    'product_stats',
    'daily_summary',
    NULL,
    jsonb_build_object(
      'total_products', COUNT(*),
      'active_products', COUNT(*) FILTER (WHERE is_active = true),
      'products_added_today', COUNT(*) FILTER (WHERE createddt >= CURRENT_DATE)
    ),
    'daily'
  FROM products;
END;
$$ LANGUAGE plpgsql;
```

### 2. Trigger: Auto-actualización de métricas

```sql
-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas administrativas
CREATE TRIGGER admin_payment_requests_updated_at
  BEFORE UPDATE ON admin_payment_requests
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER marketplace_product_management_updated_at
  BEFORE UPDATE ON marketplace_product_management
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
```

---

## 🎯 RESUMEN EJECUTIVO

### Tablas Críticas Necesarias:
1. **`admin_payment_requests`** - Gestión de solicitudes de pago (CRÍTICA)
2. **`admin_user_actions`** - Auditoría detallada de acciones (MUY IMPORTANTE)
3. **`admin_dashboard_metrics`** - Cache de métricas (IMPORTANTE para performance)
4. **`marketplace_product_management`** - Gestión administrativa de productos (IMPORTANTE)
5. **`admin_dashboard_filters`** - Configuración personalizada (NICE TO HAVE)

### Modificaciones a Tablas Existentes:
- **`orders`**: Agregar campos administrativos y de confirmación
- **`users`**: Ya tiene campos necesarios para gestión administrativa

### Beneficios de Esta Arquitectura:

#### 🚀 Performance
- Cache de métricas evita cálculos costosos
- Vistas optimizadas para consultas frecuentes
- Índices estratégicos en campos de filtrado

#### 🔒 Seguridad y Auditoría
- Registro completo de acciones administrativas
- Trazabilidad de cambios por administrador
- Metadatos de contexto (IP, user agent)

#### 📊 Escalabilidad
- Diseño modular que permite agregar nuevas funcionalidades
- Separación clara entre lógica de negocio y administrativa
- Soporte para métricas históricas y trending

#### 🎯 Mantenibilidad
- Estructura clara y documentada
- Constraints que garantizan integridad de datos
- Funciones reutilizables para operaciones comunes

Esta arquitectura soporta completamente las funcionalidades identificadas en el AdminDashboard actual y proporciona bases sólidas para futuras expansiones del sistema administrativo.
