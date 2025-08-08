# Profile Backend - Análisis y Documentación

## 📊 Estado Actual de la Base de Datos vs Frontend

### ✅ Campos que YA EXISTEN y se pueden mapear directamente:

| Fron## 💳 ANÁLISIS: Sistema de Pagos - Reutilizar Tablas Existentes

### ✅ **TABLAS QUE YA EXISTEN y pueden reutilizarse:**

#### 🎯 **1. `sales` (YA EXISTE) - Extender en lugar de crear nueva**
```sql
-- TABLA ACTUAL (básica pero útil)
CREATE TABLE public.sales (
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  trx_date timestamp with time zone DEFAULT now(),
  trx_id uuid NOT NULL DEFAULT gen_random_uuid()
);

-- CAMPOS A AGREGAR a la tabla sales existente:
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES requests(request_id),
ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method varchar DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS payment_proof_url text,
ADD COLUMN IF NOT EXISTS transfer_reference varchar,
ADD COLUMN IF NOT EXISTS paid_at timestamp,
ADD COLUMN IF NOT EXISTS confirmed_at timestamp;
```

#### 🎯 **2. `requests` (YA EXISTE) - Ya tiene la estructura necesaria**
```sql
-- Esta tabla YA tiene los campos de delivery que necesitamos
-- Solo necesita algunos campos adicionales para el flujo completo:
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES users(user_id);
```

### ❌ **ÚNICAS TABLAS NUEVAS realmente necesarias:**

#### 📄 **Solo para comprobantes de pago (opcional si usamos `sales.payment_proof_url`)**
```sql
-- SOLO si queremos múltiples comprobantes por transacción
CREATE TABLE public.payment_proofs (
  proof_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sales_trx_id uuid NOT NULL REFERENCES sales(trx_id),
  file_url text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES users(user_id),
  uploaded_at timestamp DEFAULT now()
);
```

### 🔧 **Script de Migración OPTIMIZADO (reutilizando tablas existentes):**

```sql
-- 1. Extender tabla sales existente
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES requests(request_id),
ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method varchar DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS payment_proof_url text,
ADD COLUMN IF NOT EXISTS transfer_reference varchar,
ADD COLUMN IF NOT EXISTS paid_at timestamp,
ADD COLUMN IF NOT EXISTS confirmed_at timestamp;

-- 2. Extender tabla requests existente
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES users(user_id);

-- 3. Agregar constraints útiles
ALTER TABLE public.sales 
ADD CONSTRAINT IF NOT EXISTS valid_sales_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));

ALTER TABLE public.requests 
ADD CONSTRAINT IF NOT EXISTS valid_request_status 
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
```

### 🔄 **Flujo simplificado con tablas existentes:**

1. **Usuario crea pedido** → `requests` (con delivery info)
2. **Sistema calcula total** → `sales` (con request_id, buyer_id, supplier_id)
3. **Usuario sube comprobante** → `sales.payment_proof_url`
4. **Supplier confirma** → `sales.status = 'confirmed'`end | Base de Datos | Mapeo |
|----------|---------------|-------|
| `email` | `email` | ✅ Directo |
| `phone` | `phone_nbr` | ✅ Mapear phone ↔ phone_nbr |
| `full_name` | `user_nm` | ✅ Mapear full_name ↔ user_nm |
| `role` | `main_supplier` | ✅ Convertir boolean a string: `main_supplier: true` = "supplier", `false` = "buyer" |

### 🌍 Campo EXISTENTE pero no usado en Profile:
- `country` - **DEBE agregarse al frontend** para mostrar/editar país

### 🔄 Diferenciación entre campos de `requests` vs `users`:

**IMPORTANTE**: Los campos de delivery en `requests` son para **envíos específicos de cada pedido**, mientras que los del Profile son para la **dirección por defecto del usuario**.

| Concepto | Frontend (Profile) | BD Requests (por pedido) | BD Users (por defecto) | 
|----------|-------------------|-------------------------|----------------------|
| Región | `shippingRegion` | `delivery_region` | `shipping_region` ✅ NUEVO |
| Comuna | `shippingComuna` | `delivery_commune` | `shipping_comuna` ✅ NUEVO |
| Dirección | `shippingAddress` | `delivery_direction` | `shipping_address` ✅ NUEVO |
| Número | `shippingNumber` | `delivery_direction_number` | `shipping_number` ✅ NUEVO |
| Depto | `shippingDept` | `delivery_direction_dept` | `shipping_dept` ✅ NUEVO |

**Flujo esperado:**
1. Usuario configura dirección por defecto en **Profile** → tabla `users`
2. Al hacer un pedido, se pre-llena con datos del perfil → tabla `requests`
3. Usuario puede modificar dirección específica para ese pedido

## ❌ Campos FALTANTES que necesitan ser agregados a la BD

### 📋 Información General (agregar a tabla `users`):
```sql
ALTER TABLE public.users ADD COLUMN rut character varying;
```

### 🚚 Información de Despacho (agregar a tabla `users`):
```sql
ALTER TABLE public.users ADD COLUMN shipping_region text;
ALTER TABLE public.users ADD COLUMN shipping_comuna text;
ALTER TABLE public.users ADD COLUMN shipping_address text;
ALTER TABLE public.users ADD COLUMN shipping_number text;
ALTER TABLE public.users ADD COLUMN shipping_dept text;
```

### 💰 Información de Transferencia (agregar a tabla `users`):
```sql
ALTER TABLE public.users ADD COLUMN account_holder character varying;
ALTER TABLE public.users ADD COLUMN account_type character varying DEFAULT 'corriente';
ALTER TABLE public.users ADD COLUMN bank character varying;
ALTER TABLE public.users ADD COLUMN account_number character varying;
ALTER TABLE public.users ADD COLUMN transfer_rut character varying;
ALTER TABLE public.users ADD COLUMN confirmation_email text;
```

### 🧾 Facturación (agregar a tabla `users`):
```sql
ALTER TABLE public.users ADD COLUMN business_name character varying;
ALTER TABLE public.users ADD COLUMN billing_rut character varying;
ALTER TABLE public.users ADD COLUMN business_line character varying;
ALTER TABLE public.users ADD COLUMN billing_address text;
ALTER TABLE public.users ADD COLUMN billing_region text;
ALTER TABLE public.users ADD COLUMN billing_comuna text;
```

## 🔧 Script de Migración Completo - COPIAR Y PEGAR

```sql
-- ========================================
-- SCRIPT COMPLETO DE MIGRACIÓN - PROFILE BACKEND
-- ========================================

-- 1. AGREGAR CAMPOS FALTANTES A LA TABLA USERS
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS rut character varying,
ADD COLUMN IF NOT EXISTS shipping_region text,
ADD COLUMN IF NOT EXISTS shipping_comuna text,
ADD COLUMN IF NOT EXISTS shipping_address text,
ADD COLUMN IF NOT EXISTS shipping_number text,
ADD COLUMN IF NOT EXISTS shipping_dept text,
ADD COLUMN IF NOT EXISTS account_holder character varying,
ADD COLUMN IF NOT EXISTS account_type character varying DEFAULT 'corriente',
ADD COLUMN IF NOT EXISTS bank character varying,
ADD COLUMN IF NOT EXISTS account_number character varying,
ADD COLUMN IF NOT EXISTS transfer_rut character varying,
ADD COLUMN IF NOT EXISTS confirmation_email text,
ADD COLUMN IF NOT EXISTS business_name character varying,
ADD COLUMN IF NOT EXISTS billing_rut character varying,
ADD COLUMN IF NOT EXISTS business_line character varying,
ADD COLUMN IF NOT EXISTS billing_address text,
ADD COLUMN IF NOT EXISTS billing_region text,
ADD COLUMN IF NOT EXISTS billing_comuna text;

-- 2. EXTENDER TABLA SALES PARA SISTEMA DE PAGOS
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS request_id uuid REFERENCES requests(request_id),
ADD COLUMN IF NOT EXISTS buyer_id uuid REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method varchar DEFAULT 'bank_transfer',
ADD COLUMN IF NOT EXISTS payment_proof_url text,
ADD COLUMN IF NOT EXISTS transfer_reference varchar,
ADD COLUMN IF NOT EXISTS paid_at timestamp,
ADD COLUMN IF NOT EXISTS confirmed_at timestamp;

-- 3. EXTENDER TABLA REQUESTS PARA GESTIÓN DE PEDIDOS
ALTER TABLE public.requests 
ADD COLUMN IF NOT EXISTS status varchar DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES users(user_id);

-- 4. AGREGAR CONSTRAINTS DE VALIDACIÓN
ALTER TABLE public.sales 
ADD CONSTRAINT IF NOT EXISTS valid_sales_status 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));

ALTER TABLE public.requests 
ADD CONSTRAINT IF NOT EXISTS valid_request_status 
CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

-- 5. CREAR ÍNDICES PARA OPTIMIZACIÓN (OPCIONAL)
CREATE INDEX IF NOT EXISTS idx_sales_request_id ON sales(request_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_id ON sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_supplier_id ON sales(supplier_id);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_supplier_id ON requests(supplier_id);
```

## ✅ **Resumen de cambios incluidos:**

### 📋 **Tabla `users` (18 campos nuevos):**
- `rut` - RUT de la empresa
- Información de Despacho (5 campos)
- Información de transferencia (6 campos) 
- Facturación (6 campos)

### 💰 **Tabla `sales` (9 campos nuevos):**
- `request_id` - Referencia al pedido
- `buyer_id`, `supplier_id` - Participantes
- `status` - Estado del pago
- `payment_method` - Método de pago
- `payment_proof_url` - Comprobante
- `transfer_reference` - Referencia bancaria
- `paid_at`, `confirmed_at` - Fechas

### 📦 **Tabla `requests` (2 campos nuevos):**
- `status` - Estado del pedido
- `supplier_id` - Proveedor asignado

### 🔒 **Validaciones agregadas:**
- Estados válidos para `sales`
- Estados válidos para `requests`

### ⚡ **Índices para performance:**
- Búsquedas por request_id, buyer_id, supplier_id
- Filtros por status en ambas tablas

## 🔗 Mapeo de Campos en el Código

### En el servicio de Profile (JavaScript/TypeScript):

```javascript
// Mapeo de campos de BD a Frontend
const mapUserFromDB = (dbUser) => ({
  email: dbUser.email,
  phone: dbUser.phone_nbr,
  full_name: dbUser.user_nm,
  role: dbUser.main_supplier ? 'supplier' : 'buyer',
  country: dbUser.country,
  rut: dbUser.rut,
  
  // Información de Despacho
  shipping_region: dbUser.shipping_region,
  shipping_comuna: dbUser.shipping_comuna,
  shipping_address: dbUser.shipping_address,
  shipping_number: dbUser.shipping_number,
  shipping_dept: dbUser.shipping_dept,
  
  // Información de transferencia
  account_holder: dbUser.account_holder,
  account_type: dbUser.account_type,
  bank: dbUser.bank,
  account_number: dbUser.account_number,
  transfer_rut: dbUser.transfer_rut,
  confirmation_email: dbUser.confirmation_email,
  
  // Facturación
  business_name: dbUser.business_name,
  billing_rut: dbUser.billing_rut,
  business_line: dbUser.business_line,
  billing_address: dbUser.billing_address,
  billing_region: dbUser.billing_region,
  billing_comuna: dbUser.billing_comuna,
});

// Mapeo de Frontend a BD para updates
const mapUserToDB = (frontendData) => ({
  phone_nbr: frontendData.phone,
  user_nm: frontendData.full_name,
  main_supplier: frontendData.role === 'supplier',
  country: frontendData.country,
  rut: frontendData.rut,
  
  // Información de Despacho
  shipping_region: frontendData.shipping_region,
  shipping_comuna: frontendData.shipping_comuna,
  shipping_address: frontendData.shipping_address,
  shipping_number: frontendData.shipping_number,
  shipping_dept: frontendData.shipping_dept,
  
  // Información de transferencia
  account_holder: frontendData.account_holder,
  account_type: frontendData.account_type,
  bank: frontendData.bank,
  account_number: frontendData.account_number,
  transfer_rut: frontendData.transfer_rut,
  confirmation_email: frontendData.confirmation_email,
  
  // Facturación
  business_name: frontendData.business_name,
  billing_rut: frontendData.billing_rut,
  business_line: frontendData.business_line,
  billing_address: frontendData.billing_address,
  billing_region: frontendData.billing_region,
  billing_comuna: frontendData.billing_comuna,
});
```

## ⚠️ Consideraciones Importantes

1. **Validaciones**: Implementar validaciones de RUT en el backend
2. **Seguridad**: Los campos sensibles (números de cuenta, RUTs) deben ser encriptados
3. **Indices**: Considerar agregar índices a campos que se consulten frecuentemente
4. **Migración de datos**: Si ya hay usuarios, considerar valores por defecto
5. **Campo country**: Agregar al frontend del Profile para edición

## � CRÍTICO: Sistema de Pagos COMPLETAMENTE FALTANTE

### �️ **Frontend Profile - Información de Transferencia YA CUBRE:**

La sección "Información de Transferencia" del Profile **YA tiene todos los campos necesarios** para pagos:
- `account_holder` - Nombre del titular
- `account_type` - Tipo de cuenta (corriente/vista) 
- `bank` - Banco
- `account_number` - Número de cuenta
- `transfer_rut` - RUT del titular
- `confirmation_email` - Email de confirmación

**Estos campos del Profile servirán como la información bancaria por defecto del usuario.**

## 🚀 Próximos Pasos OPTIMIZADOS

1. ✅ Ejecutar script de migración para campos de perfil en Supabase
2. � **Extender tablas existentes** (`sales` y `requests`) en lugar de crear nuevas
3. ⭐ Actualizar Profile.jsx para incluir campo `country`
4. ⭐ Crear/actualizar servicios de API para mapeo de campos
5. 🔐 **Implementar encriptación para datos bancarios en `users`**
6. ⭐ Implementar validaciones de backend para RUT y email
7. 📱 **Crear flujos de subida de comprobantes usando `sales.payment_proof_url`**

## 🔗 CONEXIONES QUE YA SE PUEDEN IMPLEMENTAR SIN MIGRACIÓN

### ✅ **Campos que YA funcionan hoy mismo:**

#### 📧 **Información básica (mapeo directo):**
```javascript
// Estos campos ya están en la BD y se pueden usar inmediatamente
const currentUserData = {
  email: userProfile.email,           // ✅ Directo desde BD
  phone: userProfile.phone_nbr,       // ✅ Mapear phone_nbr → phone  
  full_name: userProfile.user_nm,     // ✅ Mapear user_nm → full_name
  role: userProfile.main_supplier ? 'supplier' : 'buyer', // ✅ Convertir boolean
  country: userProfile.country        // ✅ Agregar al frontend (ya existe en BD)
};
```

### 🖼️ **AVATAR - Usar logo_url existente:**

**Problema identificado:** El Profile actualmente usa iniciales en lugar del logo de la empresa.

**Solución inmediata:**
```javascript
// En Profile.jsx - CAMBIAR ESTO:
<Avatar sx={{ width: 96, height: 96, mr: 2, bgcolor: 'primary.main', fontSize: 29 }}>
  {getInitials()} // ❌ Solo muestra iniciales "U"
</Avatar>

// POR ESTO:
<Avatar 
  src={userProfile?.logo_url || undefined}
  sx={{ width: 96, height: 96, mr: 2, bgcolor: 'primary.main', fontSize: 29 }}
>
  {!userProfile?.logo_url && getInitials()} // ✅ Iniciales solo si no hay logo
</Avatar>
```

### 🔧 **Implementación inmediata del Avatar:**
```javascript
// Función mejorada para el Avatar
const getAvatarProps = () => {
  const logoUrl = userProfile?.logo_url;
  
  if (logoUrl) {
    return {
      src: logoUrl,
      alt: `Logo de ${getFullName()}`,
      children: null // No mostrar iniciales si hay logo
    };
  }
  
  return {
    src: undefined,
    children: getInitials(), // Mostrar iniciales si no hay logo
    sx: { bgcolor: 'primary.main' }
  };
};

// Uso en el JSX:
<Avatar 
  {...getAvatarProps()}
  sx={{ width: 96, height: 96, mr: 2, fontSize: 29 }}
/>
```

### 📱 **Consistencia con TopBar:**

**Importante:** El Avatar del Profile debe usar la **misma lógica** que el TopBar para mantener consistencia visual.

```javascript
// Si el TopBar ya usa logo_url, copiar esa lógica exacta al Profile
// Ejemplo de lógica consistente:
const useUserAvatar = () => {
  const logoUrl = userProfile?.logo_url;
  const userName = userProfile?.user_nm || userProfile?.full_name;
  
  return {
    src: logoUrl,
    alt: `Logo de ${userName}`,
    fallback: userName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  };
};
```

### 🚀 **Otras mejoras inmediatas posibles:**

#### 1. **Validación de email en tiempo real:**
```javascript
// Ya se puede implementar sin migración
const validateEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};
```

#### 2. **Mostrar país en el frontend:**
```javascript
// Agregar campo país al Profile (ya existe en BD)
<TextField
  label="País"
  value={formData.country}
  onChange={handleInputChange('country')}
  fullWidth
  variant="outlined"
  size="small"
/>
```

#### 3. **Mapeo de roles más claro:**
```javascript
// Mejor visualización del rol actual
const getRoleDisplay = (mainSupplier) => {
  return {
    value: mainSupplier ? 'supplier' : 'buyer',
    label: mainSupplier ? 'Proveedor' : 'Comprador',
    color: mainSupplier ? 'success' : 'info'
  };
};
```

### ⚡ **TAREAS INMEDIATAS (sin migración):**

1. **🖼️ Arreglar Avatar** - Usar `logo_url` en lugar de iniciales
2. **🌍 Agregar campo País** - Mostrar `country` en el frontend  
3. **📱 Sincronizar con TopBar** - Misma lógica de avatar
4. **✅ Validaciones frontend** - Email, teléfono, etc.
5. **🎨 Mejorar UX de roles** - Mostrar rol actual más claro