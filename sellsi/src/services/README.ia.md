# 🚀 Services Module - Advanced Technical Analysis for Refactoring

## 1. 🎯 Resumen ejecutivo del módulo
- **Problema de negocio que resuelve:** Centralización de la lógica de acceso a datos en Sellsi, proporcionando una capa de abstracción entre la UI y Supabase para operaciones de marketplace, usuarios, administración, pagos, media y seguridad
- **Responsabilidad principal:** Service Layer que maneja toda la comunicación con backend, validaciones de negocio y transformaciones de datos
- **Posición en la arquitectura:** Capa intermedia entre React Components/Hooks y Supabase Backend, actuando como API Gateway interno
- **Criticidad:** ALTA - Core fundamental de la aplicación, cualquier fallo afecta todas las funcionalidades
- **Usuarios objetivo:** Desarrolladores frontend (importan servicios), componentes React (consumen APIs), hooks personalizados (orquestan lógica)

## 2. 📊 Análisis de complejidad
- **Líneas de código:** ~3,500 líneas aproximadamente distribuidas en 15+ archivos
- **Complejidad ciclomática:** ALTA - Múltiples condicionales en validaciones, manejo de errores y flujos de autenticación
- **Acoplamiento:** MEDIO - Fuerte dependencia con Supabase, acoplamiento controlado entre dominios
- **Cohesión:** ALTA - Servicios bien organizados por dominio con responsabilidades claras
- **Deuda técnica estimada:** MEDIA-ALTA - Legacy service pendiente de migración, falta de testing, manejo de errores inconsistente

## 3. 🗂️ Inventario completo de archivos
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| index.js | Barrel | ~40 | BAJA | Punto de entrada con barrel exports | Ninguna |
| supabase.js | Client | ~50 | BAJA | Cliente Supabase y helpers | @supabase/supabase-js |
| user/cartService.js | Service | ~480 | ALTA | Gestión completa de carrito con validaciones | supabase, utils/quantityValidation |
| user/profileService.js | Service | ~900 | ALTA | CRUD perfil con manejo de imágenes | supabase |
| user/orderService.js | Service | ~650 | ALTA | Gestión de pedidos y estados | supabase |
| security/banService.js | Service | ~163 | MEDIA | Sistema de baneos por usuario/IP | supabase, ipTrackingService |
| security/ipTrackingService.js | Service | ~200 | MEDIA | Tracking de IPs y geolocalización | supabase, external APIs |
| payment/khipuService.js | Service | ~215 | ALTA | Integración completa con Khipu | supabase, crypto para HMAC |
| shared/services/upload/uploadService.js | Service | ~501 | ALTA | Upload de archivos con thumbnails y cleanup | supabase storage, StorageCleanupService |
| media/thumbnailService.js | Service | ~100 | BAJA | Generación de thumbnails | supabase functions |
| marketplace/productSpecificationsService.js | Service | ~120 | MEDIA | CRUD especificaciones productos | supabase |
| marketplace/productDeliveryRegionsService.js | Service | ~50 | BAJA | Gestión regiones entrega | supabase |
| admin/[múltiples] | Services | ~800 | ALTA | Servicios administrativos diversos | supabase, bcryptjs, otplib |
| adminPanelService.js | Legacy | ~300 | ALTA | Servicio legacy pendiente migración | Múltiples dependencias |

## 4. 🏗️ Arquitectura y patrones
- **Patrones de diseño identificados:** 
  - Service Layer Pattern (principal)
  - Singleton Pattern (instancias de servicios)
  - Barrel Export Pattern (organización)
  - Domain-Driven Design (carpetas por dominio)
  - Factory Pattern (creación de clientes)

- **Estructura de carpetas:** Organización por dominios de negocio (user/, admin/, security/, payment/, media/, marketplace/, auth/)

- **Flujo de datos principal:**
```
React Component/Hook → Domain Service → supabase.js → Supabase Backend
                                    ↓
                              Validation/Transform
                                    ↓
                               Business Logic
                                    ↓
                              Error Handling
```

- **Puntos de entrada:** 
  - `index.js` - Barrel exports centralizados
  - Cada `domain/index.js` - Exports por dominio

- **Puntos de salida:** 
  - Funciones exportadas por dominio
  - Instancias singleton de servicios complejos
  - Cliente supabase configurado

## 5. 🔗 Matriz de dependencias

#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @supabase/supabase-js | ^2.49.4 | Acceso a BD y storage | CRÍTICO - Core de toda la app | Firebase, AWS Amplify |
| bcryptjs | ^3.0.2 | Hash de contraseñas admin | ALTO - Seguridad crítica | argon2, scrypt |
| otplib | ^12.0.1 | 2FA para administradores | MEDIO - Feature específica | speakeasy, node-2fa |
| speakeasy | ^2.0.0 | Backup 2FA | BAJO - Redundancia | otplib únicamente |
| lodash.debounce | ^4.0.8 | Optimización requests | BAJO - Performance | implementación nativa |
| immer | ^10.1.1 | Estado inmutable | MEDIO - Patrón usado | Redux Toolkit, native |
| qrcode | ^1.5.4 | QR para 2FA | BAJO - Feature UI | react-qr-code |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| /utils/quantityValidation | Importa | Validación de cantidades carrito | MEDIO |
| supabase.js | Usa | Cliente configurado Supabase | ALTO |
| security/ipTrackingService | Importa | Tracking en banService | MEDIO |
| Cada domain/index.js | Exporta | Barrel exports por dominio | BAJO |

## 6. 🧩 API del módulo

#### Servicios exportados principales:
```javascript
// Importación completa por dominios
import { 
  // User services
  cartService, orderService, getUserProfile, updateUserProfile,
  // Admin services  
  loginAdmin, verify2FA, getUsers, banUser,
  // Security services
  updateUserIP, checkUserBanStatus, trackUserAction,
  // Payment services
  createPayment, getPaymentStatus, processWebhook,
  // Media services
  uploadImage, generateThumbnail, removeImage
} from '../services';
```

#### APIs detalladas por dominio:

**CartService Class**
| Método | Parámetros | Retorno | Validación | Descripción | Ejemplo |
|--------|------------|---------|------------|-------------|---------|
| getOrCreateActiveCart | userId: string | Promise<{cart_id, items}> | userId required | Obtiene carrito activo o crea uno nuevo | `await cartService.getOrCreateActiveCart('user123')` |
| addToCart | userId, productId, quantity | Promise<{success, cart}> | quantity > 0, productId válido | Agrega producto al carrito | `await cartService.addToCart('user123', 'prod456', 2)` |
| removeFromCart | cartId, itemId | Promise<{success}> | cartId y itemId válidos | Elimina item específico | `await cartService.removeFromCart('cart789', 'item012')` |
| updateCartItem | cartId, itemId, quantity | Promise<{success, item}> | quantity >= 0 | Actualiza cantidad de item | `await cartService.updateCartItem('cart789', 'item012', 5)` |
| clearCart | cartId | Promise<{success}> | cartId válido | Vacía carrito completo | `await cartService.clearCart('cart789')` |

**ProfileService Functions**
| Función | Parámetros | Retorno | Validación | Descripción | Ejemplo |
|---------|------------|---------|------------|-------------|---------|
| getUserProfile | userId: string | Promise<{user, bank, shipping, billing}> | userId required | Perfil completo con todas las relaciones | `await getUserProfile('user123')` |
| updateUserProfile | userId, profileData | Promise<{success, profile}> | Data schema validation | Actualiza datos de perfil | `await updateUserProfile('user123', {name: 'Juan'})` |
| uploadProfileImage | userId, imageFile | Promise<{success, imageUrl}> | File type validation | Sube imagen de perfil | `await uploadProfileImage('user123', file)` |

#### Hooks personalizados recomendados:
```javascript
// useCart - Estado reactivo del carrito
const { 
  cart, 
  loading, 
  error,
  addItem,
  removeItem,
  updateQuantity,
  clearCart
} = useCart(userId);

// useProfile - Gestión de perfil
const { 
  profile, 
  loading, 
  error,
  updateProfile,
  uploadImage
} = useProfile(userId);

// useAdminAuth - Autenticación administrativa
const { 
  isAuthenticated, 
  user, 
  login, 
  verify2FA, 
  logout 
} = useAdminAuth();
```

## 7. 🔍 Análisis de estado
- **Estado global usado:** No consume stores globales directamente, pero servicios son consumidos por Zustand stores
- **Estado local:** Cada servicio mantiene estado temporal durante operaciones async
- **Persistencia:** Datos persisten en Supabase, algunas configuraciones en localStorage (tokens, preferencias)
- **Sincronización:** Real-time subscriptions en algunos servicios críticos (cart, orders)
- **Mutaciones:** Todas las mutaciones son async y pasan por validaciones de negocio

## 8. 🎭 Lógica de negocio
- **Reglas de negocio implementadas:**
  - Validación de cantidades en carrito (min: 1, max: 99)
  - Sistema de baneos por usuario y por IP
  - Autenticación 2FA obligatoria para admins
  - Validación de regiones de entrega por producto
  - Procesamiento de pagos con confirmación webhook
  - Generación automática de thumbnails en uploads

- **Validaciones:** 
  - Sanitización de inputs en cartService
  - Validación de formatos de imagen en uploadService
  - Verificación HMAC en pagos Khipu
  - Validación de esquemas en profileService

- **Transformaciones de datos:**
  - Normalización de datos de perfil multi-tabla
  - Conversión de formatos de pago (CLP, USD)
  - Sanitización de URLs de imágenes
  - Formateo de fechas y timestamps

- **Casos especiales:**
  - Manejo de carritos huérfanos (sin usuario)
  - Recuperación de sesiones admin con 2FA
  - Fallback de thumbnails cuando falla generación
  - Retry logic en pagos críticos

- **Integraciones:**
  - Khipu API para pagos
  - Supabase Functions para thumbnails
  - APIs externas para geolocalización IP
  - Servicios de email para notificaciones

## 9. 🔄 Flujos de usuario

**Flujo principal - Compra de producto:**
1. Usuario agrega producto → cartService.addToCart() → Valida stock y permisos
2. Usuario procede al checkout → orderService.createOrder() → Crea pedido pendiente
3. Usuario inicia pago → khipuService.createPayment() → Redirige a Khipu
4. Webhook confirma pago → khipuService.processWebhook() → Actualiza estado pedido
5. Sistema notifica → orderService.updateStatus() → Estado "confirmado"

**Flujos alternativos:**
- **Error de pago:** Webhook con error → Estado "failed" → Usuario puede reintentar
- **Cancelación:** Usuario cancela en Khipu → Estado "cancelled" → Carrito restaurado
- **Timeout:** Sin confirmación en 24h → Auto-cancelación → Notificación usuario
- **Stock insuficiente:** Validación falla → Error específico → Sugerencias alternativas

**Flujo admin - Gestión de usuarios:**
1. Admin inicia sesión → loginAdmin() → Verifica credenciales
2. Sistema solicita 2FA → verify2FA() → Valida token TOTP
3. Admin busca usuario → getUsers() → Filtros y paginación
4. Admin aplica acción → banUser()/verifyUser() → Actualiza estado + log auditoría
5. Sistema registra acción → auditService.log() → Tracking de cambios

## 10. 🧪 Puntos de testing
- **Casos de prueba críticos:**
  - Cart: Validación de cantidades, productos duplicados, límites
  - Profile: Upload de imágenes, validación de datos, relaciones multi-tabla
  - Payment: Verificación HMAC, manejo de webhooks, estados de pago
  - Security: Detección de IPs sospechosas, sistema de baneos
  - Admin: Flujo 2FA completo, permisos por rol

- **Mocks necesarios:**
  - Supabase client (todas las operaciones)
  - Khipu API responses
  - File upload operations
  - External IP services
  - Email notifications

- **Datos de prueba:**
  - Usuarios con diferentes roles y estados
  - Productos con especificaciones variadas
  - Carritos en diferentes estados
  - Pedidos con todos los estados posibles
  - IPs de diferentes países/regiones

- **Escenarios de error:**
  - Network timeouts
  - Database constraints violations
  - Invalid webhooks/HMAC
  - File upload failures
  - Authentication failures

- **Performance:**
  - Tiempo de respuesta < 2s para operaciones comunes
  - Throughput de uploads de imágenes
  - Concurrencia en operaciones de carrito
  - Memory leaks en servicios singleton

## 11. 🚨 Puntos críticos para refactor

- **Código legacy:**
  - [CRÍTICO] `adminPanelService.js` - 300 LOC legacy, múltiples responsabilidades
  - [ALTO] Manejo de errores inconsistente entre servicios
  - [MEDIO] Validaciones duplicadas en varios servicios

- **Antipatrones:**
  - Servicios con demasiadas responsabilidades (profileService - 900 LOC)
  - Try-catch anidados sin estrategia clara
  - Logs de debug mezclados con lógica de negocio
  - Hardcoded configurations en lugar de centralizadas

- **Oportunidades de mejora:**
  - Implementar patrón Repository para abstraer Supabase
  - Centralizar manejo de errores con interceptors
  - Extraer validaciones comunes a utilities
  - Implementar cache layer para operaciones frecuentes
  - Agregar retry logic con exponential backoff

- **Riesgos:**
  - profileService demasiado grande, riesgo de conflictos en desarrollo
  - cartService con lógica crítica de negocio sin testing
  - Dependencia fuerte de Supabase sin abstracción
  - Falta de versionado en APIs de servicios

- **Orden de refactor:**
  1. [PRIORIDAD 1] Migrar adminPanelService.js a estructura modular
  2. [PRIORIDAD 2] Implementar testing para cartService y profileService
  3. [PRIORIDAD 3] Centralizar manejo de errores y logging
  4. [PRIORIDAD 4] Extraer y modularizar profileService
  5. [PRIORIDAD 5] Implementar layer de cache y retry logic

## 12. 🔧 Consideraciones técnicas

#### Limitaciones actuales:
- **Performance:** No hay cache, cada request va a Supabase
- **Memoria:** Servicios singleton pueden acumular estado
- **Escalabilidad:** Sin rate limiting interno, dependiente de Supabase limits
- **Compatibilidad:** Requiere navegadores con soporte ES2020+

#### Configuración requerida:
- **Variables de entorno:**
  ```
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJxxx
  VITE_KHIPU_RECEIVER_ID=xxx
  VITE_KHIPU_SECRET=xxx
  VITE_APP_URL=https://sellsi.cl
  ```

- **Inicialización:** Cliente Supabase se auto-configura al importar
- **Permisos:** RLS policies configuradas en Supabase para seguridad

## 13. 🔒 Seguridad y compliance
- **Datos sensibles:** Contraseñas (hasheadas), tokens 2FA, información bancaria
- **Validaciones de seguridad:** 
  - HMAC verification en webhooks
  - Input sanitization en uploads
  - SQL injection prevention via Supabase client
  - CSRF protection en operaciones críticas

- **Permisos:** Row Level Security (RLS) en Supabase + validación app-level
- **Auditoría:** Logs de acciones administrativas, tracking de IPs, historial de cambios

## 14. 📚 Referencias y documentación
- **Documentación técnica:** 
  - [Supabase Docs](https://supabase.com/docs)
  - [Khipu API](https://khipu.com/page/api-doc)
- **Decisiones de arquitectura:** Domain-driven design elegido para escalabilidad
- **Recursos externos:** 
  - Barrel exports pattern para tree-shaking
  - Service layer pattern para separación de concerns
- **Historial de cambios:** v1.0 → v2.0 migración de servicios monolíticos a modular

## 15. 🎨 Ejemplos de uso avanzados

```javascript
// Ejemplo 1: Uso básico - Agregar al carrito
import { cartService } from '../services/user';

const handleAddToCart = async (productId, quantity) => {
  try {
    const result = await cartService.addToCart(userId, productId, quantity);
    if (result.success) {
      toast.success('Producto agregado al carrito');
      // Actualizar estado local/global
    }
  } catch (error) {
    toast.error('Error al agregar producto');
    console.error(error);
  }
};

// Ejemplo 2: Uso avanzado - Checkout completo
import { 
  cartService, 
  orderService, 
  khipuService 
} from '../services';

const CompleteCheckoutFlow = async (userId, shippingInfo) => {
  try {
    // 1. Obtener carrito actual
    const cart = await cartService.getOrCreateActiveCart(userId);
    
    // 2. Validar stock antes de proceder
    const stockValidation = await orderService.validateCartStock(cart.cart_id);
    if (!stockValidation.valid) {
      throw new Error(`Stock insuficiente: ${stockValidation.issues.join(', ')}`);
    }
    
    // 3. Crear orden pendiente
    const order = await orderService.createOrder({
      cartId: cart.cart_id,
      shippingInfo,
      paymentMethod: 'khipu'
    });
    
    // 4. Iniciar proceso de pago
    const payment = await khipuService.createPayment({
      orderId: order.order_id,
      amount: order.total,
      currency: 'CLP',
      returnUrl: `${window.location.origin}/checkout/success`,
      cancelUrl: `${window.location.origin}/checkout/cancel`
    });
    
    // 5. Redirigir a Khipu
    window.location.href = payment.payment_url;
    
  } catch (error) {
    console.error('Error en checkout:', error);
    // Manejo específico por tipo de error
    if (error.code === 'INSUFFICIENT_STOCK') {
      // Mostrar productos sin stock
    } else if (error.code === 'PAYMENT_ERROR') {
      // Mostrar opciones de pago alternativas
    }
    throw error;
  }
};

// Ejemplo 3: Integración con hooks React
import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/user';

const useUserProfile = (userId) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);
  
  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileData = await getUserProfile(userId);
      setProfile(profileData);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      const updated = await updateUserProfile(userId, updates);
      setProfile(updated);
      return updated;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: loadProfile
  };
};

// Ejemplo 4: Manejo de errores con retry
import { uploadImage } from '../services/media';

const uploadWithRetry = async (file, bucket, path, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadImage(file, bucket, path);
      return result; // Éxito, retornar resultado
    } catch (error) {
      lastError = error;
      
      // No reintentar en ciertos errores
      if (error.code === 'FILE_TOO_LARGE' || error.code === 'INVALID_FORMAT') {
        throw error;
      }
      
      // Esperar antes del siguiente intento (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw lastError;
};
```

## 16. 🔄 Guía de migración
- **Desde versión anterior:** v1.0 (servicios monolíticos) → v2.0 (modular por dominios)
- **Breaking changes:** 
  - Cambio de imports: `from './orderService'` → `from '../services/user'`
  - Algunos servicios ahora son clases con instancias singleton
  - APIs normalizadas para consistencia

- **Checklist de migración:**
  ```javascript
  // ❌ Antes (v1.0)
  import { orderService } from './services/orderService';
  import { uploadImage } from './services/uploadService';
  
  // ✅ Después (v2.0)
  import { orderService } from '../services/user';
  import { uploadImage } from '../services/media';
  ```

- **Rollback:** Git revert + restaurar imports legacy si hay problemas críticos

## 17. 📋 Metadatos del documento
- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** services-v2.0-modular
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 18/08/2025 (mensual)
- **Cobertura de análisis:** 100% de archivos .js en /src/services/
- **Herramientas utilizadas:** Manual analysis + código inspection + dependencias package.json
