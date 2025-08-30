# Sistema de Tracking de IP - Documentación Completa

## Resumen del Sistema

El sistema de tracking de IP ha sido profesionalizado e incluye ahora mecanismos de reducción de ruido: batching de acciones, TTL cliente/servidor y envío oportunista en eventos de cierre de pestaña.

## Componentes Principales

### 1. Edge Function (Backend)
**Archivo:** `supabase/functions/update-lastip/index.ts`

**Características:**
- ✅ Manejo de errores robusto
- ✅ Headers CORS configurados correctamente
- ✅ Validación de IP desde múltiples fuentes (x-forwarded-for, cf-connecting-ip, etc.)
- ✅ Verificación de IPs baneadas antes de actualización
- ✅ Validación de usuario autenticado
- ✅ Logging de auditoría completo
- ✅ Manejo de errores granular
- ✅ Guard server-side con TTL (`IP_UPDATE_MIN_INTERVAL_SEC`)
- ✅ Reconoce batches (`actions_summary`) para auditoría sin spam de IP

**Funcionalidades:**
```typescript
- Extracción de IP real del usuario
- Validación de formato de IP
- Verificación contra tabla banned_ips
- Actualización segura de last_ip en users
- Registro de auditoría de cambios
```

### 2. Servicio Frontend
**Archivo:** `src/services/security/ipTrackingService.js`

**Novedades (Batching & Throttling):**
- Cola en memoria de acciones (`pendingActions`)
- TTL configurable (`VITE_IP_UPDATE_MIN_INTERVAL_MS`, default 15 min)
- Flush automático por:
  - Expiración de TTL
  - Acumulación ≥ 5 acciones
  - Login (flush inmediato)
  - `visibilitychange` (cuando la pestaña se oculta)
  - `beforeunload` (con `sendBeacon` si disponible)
- Batching genera `session_info.actions_summary` que el backend usa para auditoría sin forzar update de IP si no cambió
 - Coordinación multi‑tab: BroadcastChannel + lock en localStorage (evita flush duplicados)

**Métodos expuestos (sin romper interfaz):**
- `updateUserIP(userId, sessionInfo?)`
- `trackLoginIP(userId, method?)`
- `trackUserAction(userId, action)` (ahora encola; retorna `{queued:true}`)
- `trackRouteVisit(userId, route)` (usa la cola)
- `getCurrentUserIP()`
- `checkIPBanStatus(ip)`
- `__flushIPTrackingQueue()` (interno/debug)

### 3. Integraciones Realizadas

#### 3.1 Sistema de Autenticación
**Archivo:** `src/features/login/hooks/useLoginForm.js`
- ✅ Tracking de IP en login exitoso
- ✅ Integración con `trackLoginIP()`

#### 3.2 Sistema de Checkout
**Archivos modificados:**
- `src/features/checkout/PaymentMethodSelector.jsx`
- `src/features/checkout/hooks/useCheckout.js`  
- `src/features/checkout/services/checkoutService.js`

**Tracking implementado:**
- ✅ Selección de método de pago
- ✅ Inicio de proceso de pago
- ✅ Completación de pago
- ✅ Fallos de pago
- ✅ Creación de órdenes

#### 3.3 Sistema de Perfil
**Archivos modificados:**
- `src/features/profile/Profile.jsx`
- `src/features/profile/ChangePasswordModal.jsx`

**Tracking implementado:**
- ✅ Actualización de perfil
- ✅ Cambio de contraseña

#### 3.4 Panel de Administración
**Archivo:** `src/features/admin_panel/modals/UserDetailsModal.jsx`
- ✅ Visualización de última IP del usuario
- ✅ Información formateada con iconos
- ✅ Integración con sistema de bans

## Acciones Rastreadas

### Autenticación y Seguridad
- `login_success` - Login exitoso
- `password_changed` - Cambio de contraseña
- `profile_updated` - Actualización de perfil

### Proceso de Compra (se agrupa en batch salvo login / acciones críticas)
- `payment_method_selected_{method}` - Selección de método de pago
- `payment_process_started_{method}` - Inicio de proceso de pago
- `payment_completed_{method}` - Pago completado
- `payment_failed_{method}` - Pago fallido
- `order_created_{method}` - Orden creada

## Base de Datos

### Tablas Involucradas
1. **users** - Campo `last_ip` para almacenar última IP
2. **banned_ips** - Tabla para IPs baneadas
3. **audit_logs** - Registro de acciones (si existe)

## Seguridad Implementada

### Validaciones de IP
- ✅ Verificación de formato de IP válido
- ✅ Extracción de IP real (proxy/CDN aware)
- ✅ Verificación contra lista de IPs baneadas
- ✅ Validación de usuario autenticado

### Manejo de Errores
- ✅ Errores de red
- ✅ Errores de validación
- ✅ Errores de base de datos
- ✅ Errores de autenticación

## Capacidades de Auditoría

### Para Administradores
- Visualización de última IP de usuarios
- Capacidad de banear IPs
- Historial de acciones por IP
- Detección de patrones sospechosos

### Para Seguridad
- Tracking de todas las acciones críticas
- Registro temporal de actividades
- Identificación de usuarios por IP
- Prevención de acceso desde IPs baneadas

## Implementación Técnica

### Edge Function
```typescript
// Características profesionales implementadas
- CORS headers completos
- Validación de entrada robusta
- Manejo de errores granular
- Logging estructurado
- Verificación de seguridad
```

### Servicio Frontend (Batch Simplificado)
```javascript
trackUserAction(userId, 'payment_process_started_tarjeta'); // encola
// ... otras acciones
// flush automático cuando TTL expira o se acumulan >=5
```

### Variables de Entorno Relevantes
| Variable | Lado | Descripción | Default |
|----------|------|-------------|---------|
| `VITE_IP_UPDATE_MIN_INTERVAL_MS` | Cliente | Intervalo mínimo entre flush reales | 900000 (15m) |
| `IP_UPDATE_MIN_INTERVAL_SEC` | Edge | TTL server-side para omitir updates redundantes si IP no cambió | 600 (10m) |

### Integración en Componentes
```javascript
// Ejemplo de uso
import { trackUserAction } from '../../services/ipTrackingService'

// En cualquier acción crítica
await trackUserAction('action_name')
```

## Estado del Sistema

### ✅ Completado
- Edge Function con TTL server-side
- Servicio frontend con batching y throttling
- Integración en login / checkout / perfil / admin
- SendBeacon en `beforeunload`
- Documentación actualizada

### 🔄 En Progreso
- Métricas agregadas (posible consolidación en dashboard)
- Validación multi-tab (BroadcastChannel pendiente)

### 📋 Pendiente
- Dashboard de análisis de IPs
- Alertas automáticas por IP
- Geolocalización de IPs
- Reportes de seguridad
- Persistencia local cross-tab / BroadcastChannel
 - Persistencia en IndexedDB de acciones en cola si se desea durabilidad superior

## Conclusión

El sistema de tracking de IP está **profesionalizado**, **optimizado** (menos llamadas redundantes) y **funcionalmente integrado**. Proporciona:

1. **Seguridad** - Prevención de acceso desde IPs baneadas
2. **Auditoría** - Registro completo de acciones críticas
3. **Administración** - Herramientas para gestión de usuarios
4. **Monitoreo** - Capacidades de detección de patrones

El sistema está listo para producción y cumple con estándares profesionales de seguridad y auditoría.
