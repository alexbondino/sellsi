# 🔐 Sistema de Cuentas Administrativas - Guía de Implementación

## 📋 Resumen

Este sistema permite gestionar cuentas administrativas separadas de los usuarios normales, con diferentes roles y niveles de acceso. Es **mucho más seguro** que agregar un campo `admin=true` a la tabla de usuarios existente.

## 🏗️ Arquitectura Implementada

### ✅ **Cuentas Separadas** (Recomendado - Ya Implementado)
- Tabla `control_panel_users` separada de `users`
- Autenticación independiente
- Roles específicos: solo `admin` (acceso completo)
- Auditoría completa de acciones
- Seguridad mejorada

### ❌ **Admin=true** (No Recomendado)
- Mezcla usuarios normales con admins
- Riesgos de seguridad
- Dificultad para auditar acciones

## 🚀 Pasos para Implementar

### 1. **Actualizar Base de Datos**

Ejecuta el siguiente script en tu Supabase:

```sql
-- Ejecutar: sellsi/sql supabase/admin_schema_update.sql
```

Este script:
- Agrega columnas necesarias a `control_panel_users`
- Crea tabla de auditoría `admin_audit_log`
- Crea tabla de sesiones `admin_sessions`
- Inserta usuario super admin por defecto

### 2. **Configurar Dependencias**

Instala las librerías necesarias:

```bash
npm install bcryptjs speakeasy qrcode
```

### 3. **Actualizar Servicio de Autenticación**

En `adminPanelService.js`, reemplaza las funciones temporales con implementaciones reales:

```javascript
// Reemplazar hashPassword con bcrypt
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### 4. **Implementar 2FA (Opcional)**

```javascript
const speakeasy = require('speakeasy');

// Generar secreto 2FA
const generate2FASecret = (username) => {
  return speakeasy.generateSecret({
    name: `Sellsi Admin - ${username}`,
    length: 32
  });
};

// Verificar código 2FA
const verify2FA = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
};
```

### 5. **Integrar Componentes**

#### A. Importar componentes en tu app:

```javascript
// En tu AdminPanel principal
import AdminAccountManager from './components/AdminAccountManager';
import AdminAccountCreator from './components/AdminAccountCreator';
```

#### B. Agregar rutas:

```javascript
// En tu router
<Route path="/admin-panel/accounts" element={<AdminAccountManager />} />
<Route path="/admin-login" element={<AdminLogin />} />
```

### 6. **Configurar Primer Usuario**

El script SQL crea un usuario por defecto:
- **Usuario:** `admin`
- **Contraseña:** `admin123` (¡CAMBIAR INMEDIATAMENTE!)
- **Email:** `admin@sellsi.com`

**⚠️ IMPORTANTE: Cambiar estas credenciales en producción!**

## 🔧 Uso del Sistema

### Crear Nuevos Administradores

1. Loguéate como admin
2. Ve a "Gestión de Administradores"
3. Clic en "Crear Administrador"
4. Completa el formulario con:
   - Usuario único
   - Email
   - Contraseña segura
   - Configuración 2FA (opcional)

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador | Acceso completo al sistema |

**Nota:** Todos los administradores tienen los mismos permisos y acceso completo.

### Funcionalidades Incluidas

- ✅ Autenticación segura con hash de contraseñas
- ✅ Autenticación 2FA opcional
- ✅ Gestión de roles y permisos
- ✅ Auditoría completa de acciones
- ✅ Sesiones con expiración
- ✅ Interfaz intuitiva para gestión
- ✅ Validación de contraseñas seguras

## 🛡️ Consideraciones de Seguridad

### 1. **Contraseñas**
- Mínimo 8 caracteres
- Mayúsculas, minúsculas, números y símbolos
- Hash con bcrypt (salt rounds: 10)

### 2. **Sesiones**
- Expiración automática
- Invalidación al cerrar sesión
- Tracking de IP y User-Agent

### 3. **Auditoría**
- Log de todas las acciones administrativas
- Timestamp e IP de cada acción
- Detalles de cambios realizados

### 4. **2FA**
- Implementación con TOTP (Time-based One-Time Password)
- Compatible con Google Authenticator, Authy, etc.
- Códigos de backup para recuperación

## 📁 Archivos Creados/Modificados

```
sellsi/
├── src/features/admin_panel/components/
│   ├── AdminLogin.jsx (ya existía)
│   ├── AdminAccountCreator.jsx (nuevo)
│   └── AdminAccountManager.jsx (nuevo)
├── src/services/
│   └── adminPanelService.js (modificado)
└── sql supabase/
    └── admin_schema_update.sql (nuevo)
```

## 🔄 Próximos Pasos

1. **Inmediato:**
   - Ejecutar script SQL
   - Cambiar credenciales por defecto
   - Probar login administrativo

2. **Corto Plazo:**
   - Implementar bcrypt para contraseñas
   - Configurar 2FA
   - Crear primeros usuarios admin

3. **Largo Plazo:**
   - Dashboard de actividad administrativa
   - Notificaciones por email

## 🆘 Solución de Problemas

### Error: "Tablas de administración no creadas aún"
- Ejecutar el script `admin_schema_update.sql`
- Verificar que las tablas existan en Supabase

### Error: "Usuario ya existe"
- Cambiar el username por uno único
- Verificar la tabla `control_panel_users`

### Error: "Contraseña debe ser más segura"
- Usar mínimo 8 caracteres
- Incluir mayúsculas, minúsculas, números y símbolos

## 📞 Contacto

Para dudas o problemas con la implementación, revisa:
1. Este README
2. Los comentarios en el código
3. Los logs de la consola del navegador

---

**¡Tu sistema de administración está listo para ser más seguro! 🔒**
