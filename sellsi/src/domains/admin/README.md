# 🏗️ Dominio Admin - Servicios Migrados

## 📋 Resumen de Migración

Este directorio contiene la nueva estructura del dominio administrativo de Sellsi, migrado desde la estructura legacy según el **PLANREFACTOR.md paso 4**.

### ✅ Migración Completada

**Fecha**: 21 de Julio de 2025  
**Estado**: ✅ COMPLETADA  
**Problema Resuelto**: `adminPanelService.js` legacy + estructura inconsistente

## 🗂️ Estructura del Dominio Admin

```
src/domains/admin/
├── services/               # Servicios específicos del dominio admin
│   ├── adminAuthService.js         # Autenticación administrativa
│   ├── adminUserService.js         # Gestión de usuarios  
│   ├── adminAccountService.js      # Cuentas administrativas
│   ├── adminProductService.js      # Gestión de productos
│   ├── adminRequestService.js      # Solicitudes de pago
│   ├── adminFileService.js         # Gestión de archivos
│   ├── adminAuditService.js        # Auditoría y logs
│   ├── adminApiService.js          # Servicio API principal
│   ├── banService.js              # Sistema de baneos
│   ├── ipTrackingService.js       # Tracking de IPs
│   └── index.js                   # Barrel exports
├── index.js                # Punto de entrada del dominio
└── README.md              # Esta documentación
```

## 🔄 Migración de Imports

### ❌ Antes (Legacy)
```javascript
// ❌ DEPRECATED
import { loginAdmin, getUsers } from '../services/adminPanelService'
import { BanService } from '../services/security/banService'
import { updateUserIP } from '../services/security/ipTrackingService'
```

### ✅ Después (Nueva Estructura)
```javascript
// ✅ RECOMENDADO - Import directo del dominio
import { loginAdmin, getUsers } from '../domains/admin'

// ✅ ALTERNATIVA - Import con namespace
import { AdminServices } from '../domains/admin'
const user = await AdminServices.getUsers()

// ✅ ALTERNATIVA - Import específico de servicios
import { 
  loginAdmin, 
  getUsers, 
  BanService, 
  updateUserIP 
} from '../domains/admin/services'
```

## 📦 Servicios Disponibles

### 🔐 Autenticación
- `loginAdmin` - Login administrativo
- `verify2FA` - Verificación 2FA
- `generate2FASecret` - Generar secreto 2FA
- `disable2FA` - Deshabilitar 2FA
- `mark2FAAsConfigured` - Marcar 2FA configurado
- `verifyAdminSession` - Verificar sesión admin

### 👥 Gestión de Usuarios
- `getUsers` - Obtener usuarios
- `getUserStats` - Estadísticas de usuarios
- `banUser` / `unbanUser` - Gestión de baneos
- `verifyUser` / `unverifyUser` - Verificación de usuarios
- `deleteUser` / `deleteMultipleUsers` - Eliminación de usuarios
- `getUserBanHistory` - Historial de baneos

### 👤 Cuentas Administrativas
- `createAdminAccount` - Crear cuenta admin
- `getAdminAccounts` - Obtener cuentas admin
- `updateAdminStatus` - Actualizar estado admin
- `deleteAdminAccount` - Eliminar cuenta admin
- `canCreateAdmins` - Verificar permisos de creación

### 🛒 Gestión de Productos
- `getMarketplaceProducts` - Productos del marketplace
- `getProductStats` - Estadísticas de productos
- `deleteProduct` / `deleteMultipleProducts` - Eliminación de productos
- `updateProductName` - Actualizar nombre de producto

### 📋 Gestión de Solicitudes
- `getSolicitudes` - Obtener solicitudes
- `confirmarPago` - Confirmar pago
- `rechazarPago` - Rechazar pago
- `devolverPago` - Devolver pago
- `enviarNotificacion` - Enviar notificación

### 📎 Gestión de Archivos
- `subirComprobante` - Subir comprobante
- `subirAdjuntos` - Subir adjuntos
- `validarArchivo` - Validar archivo

### 📊 Auditoría y Logs
- `registrarAccion` - Registrar acción
- `getLogs` - Obtener logs

### 🔒 Seguridad
- `BanService` - Servicio de baneos (clase)
- `banService` - Instancia del servicio de baneos
- `updateUserIP` - Actualizar IP de usuario
- `getCurrentUserIP` - Obtener IP actual del usuario
- `checkIPBanStatus` - Verificar estado de ban por IP
- `trackLoginIP` - Trackear IP en login
- `trackUserAction` - Trackear IP en acciones
- `debugCurrentIP` - Debug de IP actual
- `trackRouteVisit` - Trackear visitas a rutas

### 🔧 Utilidades
- `AdminApiService` - Servicio API principal
- `getEstadisticas` - Estadísticas generales

## 🔗 Compatibilidad Legacy

La migración mantiene **100% compatibilidad** con el código existente:

```javascript
// ✅ Estos imports siguen funcionando (temporalmente)
import { loginAdmin } from '../services/adminPanelService'  // DEPRECATED pero funcional
```

Sin embargo, se recomienda migrar gradualmente a la nueva estructura.

## 🎯 Beneficios de la Migración

### ✅ Estructura Consistente
- Todos los servicios admin organizados en un dominio
- Separación clara de responsabilidades
- Mejor organización del código

### ✅ Mejor Mantenibilidad  
- Servicios por funcionalidad específica
- Documentación centralizada
- Testing más enfocado

### ✅ Escalabilidad
- Preparado para futuras features del dominio admin
- Estructura extensible para hooks, types, utils
- Base sólida para TypeScript migration

### ✅ Desarrollo Más Eficiente
- Imports más claros y semánticos
- Menos acoplamiento entre dominios
- Onboarding más fácil para nuevos desarrolladores

## 🔮 Próximos Pasos

1. **Fase 3 del PLANREFACTOR.md**: Migrar otros dominios (marketplace, buyer, supplier)
2. **Agregar hooks específicos**: `domains/admin/hooks/`
3. **Agregar tipos TypeScript**: `domains/admin/types/`
4. **Agregar utilidades específicas**: `domains/admin/utils/`

## 📚 Referencias

- **PLANREFACTOR.md**: Documento completo del plan de refactor
- **Paso 4**: Services Legacy - MIGRACIÓN INMEDIATA
- **Arquitectura objetivo**: Domain-Driven Design + Feature-First

---

**Migrado por**: GitHub Copilot  
**Fecha**: 21 de Julio de 2025  
**Estado**: ✅ Completado
