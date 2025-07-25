# 🚀 Guía de Integración: Supabase CLI para Admin Payment Requests

## 📋 Pasos para Implementar la Migración

### 1. 🔧 **Configurar Supabase CLI (si no está instalado)**

```bash
# Instalar Supabase CLI globalmente
npm install -g supabase

# Verificar instalación
supabase --version
```

### 2. 🔗 **Configurar Conexión a Proyectos**

```bash
# Inicializar Supabase en tu proyecto (si no está inicializado)
cd c:\Users\klaus\OneDrive\Documentos\sellsi
supabase init

# Linkear proyecto STAGING
supabase link --project-ref TU_PROJECT_REF_STAGING

# Para cambiar a MAIN después:
# supabase link --project-ref TU_PROJECT_REF_MAIN
```

### 3. 📁 **La Migración Ya Está Lista**

He creado el archivo: `supabase/migrations/20250724_admin_payment_requests.sql`

**Contenido incluye:**
- ✅ Tabla `admin_payment_requests` completa
- ✅ Funciones de auto-generación de tickets
- ✅ Triggers para timestamps automáticos
- ✅ Índices optimizados para performance
- ✅ Row Level Security (RLS) configurado
- ✅ Políticas de acceso para admins y proveedores

### 4. 🚀 **Aplicar la Migración**

#### **En STAGING:**
```bash
# Aplicar migración a staging
supabase db push

# Verificar que se aplicó correctamente
supabase db diff
```

#### **En MAIN (cuando esté listo):**
```bash
# Cambiar a proyecto main
supabase link --project-ref TU_PROJECT_REF_MAIN

# Aplicar la misma migración
supabase db push
```

### 5. ✅ **Verificar la Implementación**

```bash
# Ver estado de migraciones
supabase migration list

# Verificar esquema actual
supabase db diff --schema
```

### 6. 🔄 **Comandos Útiles para el Futuro**

```bash
# Crear nueva migración
supabase migration new nombre_nueva_migracion

# Resetear base de datos local (CUIDADO!)
supabase db reset

# Generar tipos de TypeScript
supabase gen types typescript --local > types/supabase.ts
```

## 🎯 **Beneficios de Esta Metodología**

### ✅ **Control de Versiones**
- Cada cambio queda registrado en Git
- Historial completo de modificaciones
- Rollback fácil si hay problemas

### ✅ **Sincronización Entre Entornos**
- Mismos cambios en `staging` y `main`
- No más inconsistencias entre bases de datos
- Deployments predecibles

### ✅ **Colaboración en Equipo**
- Tu colega puede aplicar las mismas migraciones
- Cambios documentados y trazables
- Menos conflictos en el equipo

## 🚨 **Comandos de Emergencia**

Si algo sale mal:

```bash
# Ver logs de la migración
supabase logs

# Revertir última migración (si es posible)
supabase migration repair --status reverted

# Reconectar proyecto
supabase link --project-ref TU_PROJECT_REF
```

## 📊 **Testing Post-Migración**

Para verificar que todo funciona:

```sql
-- Probar inserción básica
INSERT INTO admin_payment_requests (
  order_id, supplier_id, buyer_id, request_type, 
  requested_amount, supplier_name, buyer_name, delivery_address
) VALUES (
  'test-uuid', 'test-supplier-uuid', 'test-buyer-uuid', 'payment',
  50000, 'Test Supplier', 'Test Buyer', 'Test Address'
);

-- Verificar auto-generación de ticket
SELECT ticket_number, status, created_at FROM admin_payment_requests;
```

---

## 🎉 **¡Listo para Usar!**

Una vez aplicada la migración, tu `AdminPanelTable.jsx` podrá conectarse directamente a la tabla `admin_payment_requests` y todas las funcionalidades estarán disponibles.

**La tabla está 100% optimizada para:**
- Performance con índices estratégicos
- Seguridad con RLS configurado
- Mantenimiento con triggers automáticos
- Escalabilidad para el futuro
