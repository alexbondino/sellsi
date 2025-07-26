# Services

## 1. Resumen funcional del módulo
El módulo `services` centraliza la lógica de acceso a datos y comunicación con el backend en Sellsi. Proporciona una arquitectura modular y organizada por dominio para interactuar con Supabase, gestionar autenticación, usuarios, marketplace, pagos, media y seguridad, desacoplando la UI de la capa de datos.

- **Problema que resuelve:** Abstrae y centraliza la comunicación con APIs y bases de datos, facilitando el mantenimiento, testing y reutilización a través de una arquitectura modular por dominios.
- **Arquitectura:** Servicios organizados por carpetas temáticas con barrel exports, cada uno con responsabilidad única y API clara.
- **Patrones:** Service layer, separación de concerns, single responsibility, barrel exports, domain-driven design.
- **Flujo de datos:** Componentes/hooks → Services (por dominio) → Backend/Supabase → Respuesta → Componentes/hooks.

## 2. Listado de archivos
| Archivo/Carpeta                | Tipo      | Descripción                                 | Responsabilidad principal                |
|------------------------------- |-----------|---------------------------------------------|------------------------------------------|
| index.js                       | Barrel    | Punto de entrada centralizado para servicios| Exportaciones centralizadas            |
| supabase.js                    | Servicio  | Cliente Supabase y helpers de conexión      | Acceso a base de datos y storage        |
| admin/                         | Carpeta   | Servicios administrativos                   | Gestión administrativa completa         |
| ├─ auth/                       | Carpeta   | Autenticación de administradores            | Login, 2FA, gestión de sesiones admin   |
| ├─ users/                      | Carpeta   | Gestión de usuarios por admins              | CRUD usuarios, baneos, verificaciones   |
| ├─ accounts/                   | Carpeta   | Cuentas administrativas                     | Gestión de cuentas de administradores   |
| ├─ audit/                      | Carpeta   | Auditoría y logs                           | Tracking de acciones administrativas    |
| ├─ core/                       | Carpeta   | Funcionalidades core de admin              | Métricas, reportes, funciones centrales |
| ├─ files/                      | Carpeta   | Gestión de archivos administrativos        | Upload/gestión de archivos por admins   |
| ├─ products/                   | Carpeta   | Gestión administrativa de productos        | CRUD productos desde panel admin        |
| ├─ requests/                   | Carpeta   | Gestión de solicitudes administrativas     | Solicitudes pendientes, aprobaciones    |
| auth/                          | Carpeta   | Servicios de autenticación general          | Login, registro, recuperación de cuenta |
| user/                          | Carpeta   | Servicios del usuario final                 | Perfil, carrito, pedidos de usuarios    |
| ├─ profileService.js           | Servicio  | Gestión de datos de perfil de usuario       | CRUD de perfil y validaciones           |
| ├─ cartService.js              | Servicio  | Gestión de carrito de compras               | CRUD de carrito y lógica de usuario     |
| ├─ orderService.js             | Servicio  | Gestión de pedidos y estados                | CRUD de pedidos, filtros y estadísticas |
| marketplace/                   | Carpeta   | Servicios del marketplace                   | Productos, especificaciones, búsqueda   |
| ├─ productSpecificationsService.js| Servicio| Gestión de especificaciones de productos   | CRUD de specs y validaciones            |
| ├─ productDeliveryRegionsService.js| Servicio| Gestión de regiones de entrega            | Configuración de zonas de delivery      |
| payment/                       | Carpeta   | Servicios de pago                          | Procesamiento de transacciones          |
| ├─ khipuService.js             | Servicio  | Integración con Khipu                      | Procesamiento de pagos con Khipu        |
| media/                         | Carpeta   | Servicios de archivos multimedia           | Upload, thumbnails, gestión de media    |
| ├─ uploadService.js            | Servicio  | Lógica de subida de archivos e imágenes     | Upload y gestión de media               |
| ├─ thumbnailService.js         | Servicio  | Gestión de thumbnails automáticos          | Generación y gestión de thumbnails      |
| security/                      | Carpeta   | Servicios de seguridad                     | Baneos, tracking, medidas de seguridad  |
| ├─ banService.js               | Servicio  | Sistema de baneos de usuarios              | Lógica de baneos y restricciones        |
| ├─ ipTrackingService.js        | Servicio  | Tracking de IPs y geolocalización          | Monitoreo de actividad por IP           |
| adminPanelService.js           | Servicio  | Servicio legacy de administración          | Funcionalidades legacy (en migración)   |
| README.md                      | Doc       | Documentación de los servicios              | Explicar uso y API de cada servicio     |

## 3. Relaciones internas del módulo
```
Services (index.js - Barrel Exports)
├── 🔧 supabase.js (cliente base)
├── 🔐 auth/ (servicios de autenticación)
├── 👤 user/ (servicios de usuario final)
│   ├── profileService.js (usa supabase.js)
│   ├── cartService.js (usa supabase.js)
│   └── orderService.js (usa supabase.js)
├── 🏪 marketplace/ (servicios de marketplace)
│   ├── productSpecificationsService.js (usa supabase.js)
│   └── productDeliveryRegionsService.js (usa supabase.js)
├── 💳 payment/ (servicios de pago)
│   └── khipuService.js (integración externa)
├── 📦 media/ (servicios de media)
│   ├── uploadService.js (usa supabase.js)
│   └── thumbnailService.js (usa supabase.js)
├── 🔒 security/ (servicios de seguridad)
│   ├── banService.js (usa supabase.js)
│   └── ipTrackingService.js (usa supabase.js)
└── 👑 admin/ (servicios administrativos)
    ├── auth/ (autenticación admin)
    ├── users/ (gestión de usuarios)
    ├── accounts/ (cuentas admin)
    ├── audit/ (auditoría)
    ├── core/ (funcionalidades centrales)
    ├── files/ (gestión de archivos)
    ├── products/ (gestión de productos)
    └── requests/ (solicitudes admin)
```
- Comunicación por funciones y promesas async/await.
- Barrel exports para importaciones limpias.
- No hay dependencias circulares.
- Arquitectura por dominios para mejor organización.

## 4. API de los servicios principales
### 🔐 Admin Services
**Propósito:** Servicios para funcionalidades administrativas completas

**API principales:**
- `loginAdmin(credentials)`: Autenticación de administradores
- `verify2FA(token)`: Verificación de doble factor
- `getUsers(filters)`: Obtener lista de usuarios con filtros
- `banUser(userId, reason)`: Banear usuario con motivo
- `getUserStats()`: Obtener estadísticas de usuarios

### 👤 User Services
**Propósito:** Servicios del usuario final (perfil, carrito, pedidos)

**cartService API:**
- `getOrCreateActiveCart(userId)`: Obtener o crear carrito activo
- `addToCart(userId, productId, quantity)`: Agregar producto al carrito
- `removeFromCart(cartId, itemId)`: Eliminar item del carrito
- `updateCartItem(cartId, itemId, quantity)`: Actualizar cantidad
- `clearCart(cartId)`: Limpiar carrito completo

**orderService API:**
- `getOrdersForSupplier(supplierId, filters)`: Obtener pedidos de proveedor
- `updateOrderStatus(orderId, status)`: Actualizar estado del pedido
- `getOrderStats(supplierId)`: Obtener estadísticas de pedidos
- `searchOrders(query, filters)`: Buscar pedidos con filtros

**profileService API:**
- `getProfile(userId)`: Obtener perfil de usuario
- `updateProfile(userId, data)`: Actualizar datos del perfil
- `validateProfileData(data)`: Validar datos del perfil

### 🏪 Marketplace Services
**Propósito:** Servicios del marketplace (productos, especificaciones)

**productSpecificationsService API:**
- CRUD de especificaciones de productos
- Validaciones de especificaciones
- Gestión de categorías y atributos

**productDeliveryRegionsService API:**
- Configuración de regiones de entrega
- Gestión de zonas de delivery
- Cálculo de costos de envío

### 💳 Payment Services
**Propósito:** Procesamiento de pagos y transacciones

**khipuService API:**
- `createPayment(paymentData)`: Crear pago en Khipu
- `getPaymentStatus(paymentId)`: Consultar estado del pago
- `processWebhook(webhookData)`: Procesar webhook de Khipu

### 📦 Media Services
**Propósito:** Gestión de archivos multimedia

**uploadService API:**
- `uploadImage(file, bucket, path)`: Subir imagen a storage
- `removeImage(path, bucket)`: Eliminar imagen del storage
- `getImageUrl(path, bucket)`: Obtener URL de imagen

**thumbnailService API:**
- `generateThumbnail(imagePath)`: Generar thumbnail automático
- `getThumbnailUrl(imagePath)`: Obtener URL del thumbnail

### 🔒 Security Services
**Propósito:** Servicios de seguridad y protección

**banService API:**
- `checkUserBanStatus(userId)`: Verificar estado de baneo
- `getBanHistory(userId)`: Obtener historial de baneos
- `isUserBanned(userId)`: Verificar si usuario está baneado

**ipTrackingService API:**
- `updateUserIP(userId, ipAddress)`: Actualizar IP del usuario
- `getIPHistory(userId)`: Obtener historial de IPs
- `trackSuspiciousActivity(userId, activity)`: Rastrear actividad sospechosa

### 🔧 Base Services
**supabase.js:**
- Exporta el cliente Supabase configurado
- Helpers de conexión y configuración
- Manejo de autenticación base

**Notas:**
- Todos los servicios implementan manejo de errores consistente
- APIs diseñadas para async/await
- Validaciones integradas en cada servicio

## 5. Hooks personalizados
Los servicios no exportan hooks directamente, sino que proporcionan funciones que pueden ser utilizadas dentro de custom hooks en la capa de hooks (`src/hooks/`). Esto mantiene la separación de responsabilidades donde:
- **Services:** Lógica de negocio y comunicación con backend
- **Hooks:** Lógica reactiva y manejo de estado local

**Patrón recomendado:**
```javascript
// En src/hooks/useCart.js
import { addToCart, getOrCreateActiveCart } from '../services/user';

export function useCart(userId) {
  const [cart, setCart] = useState(null);
  
  const addItem = async (productId, quantity) => {
    const result = await addToCart(userId, productId, quantity);
    setCart(result.cart);
    return result;
  };
  
  return { cart, addItem };
}
```

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| @supabase/supabase-js| ^2.49.4  | Acceso a base de datos y storage | Core - Fundamental       |
| bcryptjs            | ^3.0.2    | Hashing de contraseñas          | Seguridad                |
| otplib              | ^12.0.1   | Generación de códigos 2FA       | Autenticación segura     |
| speakeasy           | ^2.0.0    | Códigos de verificación         | Autenticación 2FA        |
| lodash.debounce     | ^4.0.8    | Optimización de requests        | Performance              |
| immer               | ^10.1.1   | Manipulación inmutable de estado| Estado y performance     |
| qrcode              | ^1.5.4    | Generación de códigos QR        | 2FA y funcionalidades    |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- Los servicios asumen configuración previa de Supabase y variables de entorno
- Manejo de errores específico por dominio (admin, user, security, etc.)
- Rate limiting implementado en algunos servicios críticos (baneos, pagos)
- Algunos servicios legacy (`adminPanelService.js`) están en proceso de migración
- Servicios de payment requieren configuración externa (Khipu API keys)

### Deuda técnica relevante:
- [ALTA] Migrar completamente `adminPanelService.js` a la nueva estructura modular
- [ALTA] Implementar testing unitario completo para todos los servicios
- [MEDIA] Agregar cache local y estrategias de retry para servicios críticos
- [MEDIA] Estandarizar manejo de errores across todos los dominios
- [MEDIA] Implementar logging centralizado y métricas de performance
- [BAJA] Agregar documentación JSDoc más detallada en todos los servicios

## 8. Puntos de extensión
- **Nuevos dominios:** Agregar carpetas para nuevos dominios (ej: `notifications/`, `analytics/`)
- **Integraciones externas:** Estructura preparada para agregar nuevos providers de pago o servicios
- **Servicios híbridos:** Posibilidad de crear servicios que combinen múltiples dominios
- **Middleware:** Implementar interceptores para logging, analytics o cache
- **API Gateway:** Estructura permite evolucionar hacia un patrón de API Gateway interno
- **Microservicios:** Arquitectura modular facilita migración a microservicios si es necesario

### Cómo extender:
```javascript
// Para agregar un nuevo dominio:
// 1. Crear carpeta src/services/newDomain/
// 2. Agregar index.js con barrel exports
// 3. Exportar desde src/services/index.js
export * from './newDomain';

// Para agregar nuevo servicio a dominio existente:
// 1. Crear archivo en la carpeta del dominio
// 2. Exportar desde el index.js del dominio
export * from './newService';
```

## 9. Ejemplos de uso
### Ejemplo básico - Importaciones con barrel exports:
```javascript
// Importación específica por dominio
import { addToCart, getOrCreateActiveCart } from '../services/user';
import { banUser, getUsers } from '../services/admin';
import { uploadImage } from '../services/media';
import { createPayment } from '../services/payment';

// Uso en componente
function MyComponent() {
  const handleAddToCart = async () => {
    try {
      const result = await addToCart(userId, productId, 2);
      console.log('Producto agregado:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };
}
```

### Ejemplo avanzado - Múltiples servicios:
```javascript
import { 
  getOrCreateActiveCart, 
  addToCart 
} from '../services/user';
import { 
  createPayment, 
  getPaymentStatus 
} from '../services/payment';
import { 
  uploadImage 
} from '../services/media';

async function CompleteCheckoutFlow() {
  try {
    // 1. Obtener carrito
    const cart = await getOrCreateActiveCart(userId);
    
    // 2. Crear pago
    const payment = await createPayment({
      amount: cart.total,
      currency: 'CLP',
      orderId: cart.cart_id
    });
    
    // 3. Verificar estado del pago
    const paymentStatus = await getPaymentStatus(payment.id);
    
    return { cart, payment, paymentStatus };
  } catch (error) {
    console.error('Error en checkout:', error);
    throw error;
  }
}
```

### Ejemplo con administración:
```javascript
import { 
  loginAdmin, 
  verify2FA, 
  getUsers, 
  banUser 
} from '../services/admin';

async function AdminPanel() {
  // Autenticación admin
  const authResult = await loginAdmin({
    email: 'admin@sellsi.com',
    password: 'password'
  });
  
  // Verificar 2FA
  await verify2FA(authResult.token, '123456');
  
  // Obtener usuarios
  const users = await getUsers({
    page: 1,
    limit: 20,
    status: 'active'
  });
  
  // Banear usuario si es necesario
  await banUser(userId, 'Violación de términos');
}
```

## 10. Rendimiento y optimización
### Estrategias implementadas:
- **Barrel exports:** Importaciones optimizadas y tree-shaking efectivo
- **Async/await:** Patrones de concurrencia para mejor performance
- **Debouncing:** Implementado en servicios de búsqueda y validación
- **Validación temprana:** Reducción de requests innecesarios
- **Manejo de errores:** Recuperación graceful y fallbacks

### Consideraciones de rendimiento:
- Servicios optimizados para uso con promesas y async/await
- Estructura modular permite code-splitting por dominio
- Lazy loading posible a nivel de dominio completo
- Cache local implementable por servicio sin afectar otros

### Áreas de mejora identificadas:
- **Cache distribuido:** Implementar Redis o similar para cache compartido
- **Request batching:** Agrupar múltiples operaciones relacionadas
- **Retry logic:** Reintentos automáticos con backoff exponencial
- **Connection pooling:** Optimizar conexiones a Supabase
- **Metrics y monitoring:** Instrumentación para identificar bottlenecks

## 11. Actualización
- **Creado:** 03/07/2025
- **Última actualización:** 18/07/2025
- **Versión:** v2.0 - Arquitectura modular por dominios
- **Migración desde:** Servicios monolíticos a estructura modular
- **Próximas mejoras:** Testing completo, cache distribuido, monitoring
