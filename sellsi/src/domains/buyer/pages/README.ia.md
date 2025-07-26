# 🚀 README.ia.md - Módulo Buyer (Features/Buyer)

---

## 1. 🎯 Resumen ejecutivo del módulo

- **Problema de negocio que resuelve:** Centraliza y orquesta la experiencia completa de compra para usuarios compradores en Sellsi, eliminando la dispersión de lógica de usuario comprador y proporcionando una experiencia unificada de marketplace, carrito, historial de pedidos y gestión de perfil.

- **Responsabilidad principal:** Gestionar todas las funcionalidades relacionadas con usuarios compradores: navegación del marketplace, carrito de compras avanzado, historial de pedidos, métricas de rendimiento y perfil de usuario.

- **Posición en la arquitectura:** Módulo frontend de alto nivel que actúa como orchestrador de la experiencia del usuario comprador, consumiendo servicios de marketplace, autenticación, y backend de Supabase.

- **Criticidad:** ALTA - Es el módulo principal que define la experiencia de usuario comprador y contiene lógica crítica del carrito de compras y procesamiento de pedidos.

- **Usuarios objetivo:** Usuarios compradores finales de la plataforma Sellsi que necesitan navegar productos, gestionar carrito, realizar compras y consultar historial.

---

## 2. 📊 Análisis de complejidad

- **Líneas de código:** ~6,200 líneas aproximadamente (31 archivos)
- **Complejidad ciclomática:** ALTA - Alto nivel de condicionales y ramificaciones en carrito, validaciones de envío, y gestión de estado
- **Acoplamiento:** MEDIO - Fuerte dependencia con marketplace, servicios de usuario, y Supabase, pero interfaces bien definidas
- **Cohesión:** ALTA - Todas las funcionalidades están relacionadas con la experiencia del usuario comprador
- **Deuda técnica estimada:** MEDIA - Algunos datos mockeados, oportunidades de modularización en hooks del carrito, y necesidad de sincronización backend

---

## 3. 🗂️ Inventario completo de archivos

| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| cartStore.js | Hook/Store | ~906 | ALTA | Store global Zustand para gestión de carrito con persistencia | zustand, lodash.debounce |
| BuyerCart.jsx | Componente | ~786 | ALTA | Carrito de compras principal con funcionalidades avanzadas | framer-motion, react-hot-toast |
| CartItem.jsx | Componente | ~574 | ALTA | Item individual del carrito con validaciones y opciones | @mui/material, framer-motion |
| BuyerOrders.jsx | Componente | ~308 | MEDIA | Vista del historial de pedidos del comprador | useBuyerOrders hook |
| CartHeader.jsx | Componente | ~295 | MEDIA | Header del carrito con acciones principales | @mui/material, framer-motion |
| useShippingValidation.js | Hook | ~265 | ALTA | Validación avanzada de compatibilidad de envíos | Custom validation logic |
| ShippingDisplay.jsx | Componente | ~265 | MEDIA | Display de opciones de envío por producto | @mui/material |
| useCoupons.js | Hook | ~264 | MEDIA | Gestión de cupones de descuento | Custom coupon logic |
| QuantitySelector.jsx | Componente | ~251 | MEDIA | Selector de cantidad con validaciones | @mui/material |
| useWishlist.js | Hook | ~244 | MEDIA | Gestión de lista de deseos | Custom wishlist logic |
| useShipping.js | Hook | ~235 | MEDIA | Opciones y cálculos de envío | Shipping calculation logic |
| BuyerPerformance.jsx | Componente | ~225 | BAJA | Métricas y estadísticas de compra | @mui/material, datos mock |
| OrderSummary.jsx | Componente | ~201 | MEDIA | Resumen de orden con cálculos | Price calculation utils |
| useCartHistory.js | Hook | ~189 | MEDIA | Historial y funcionalidad undo/redo | Custom history logic |
| EmptyCartState.jsx | Componente | ~186 | BAJA | Estado vacío del carrito | @mui/material, framer-motion |
| BuyerProfile.jsx | Componente | ~173 | MEDIA | Perfil del comprador con servicios de usuario | Profile service, Supabase |
| ShippingCompatibilityModal.jsx | Componente | ~157 | MEDIA | Modal de compatibilidad de envíos | @mui/material |
| useBuyerOrders.js | Hook | ~120 | MEDIA | Hook para gestión de pedidos del comprador | Supabase, datos mock |
| ShippingOptions.jsx | Componente | ~112 | BAJA | Opciones de envío disponibles | @mui/material |
| WishlistSection.jsx | Componente | ~103 | BAJA | Sección de lista de deseos | useWishlist hook |
| ShippingToggle.jsx | Componente | ~99 | BAJA | Toggle para opciones de envío | @mui/material |
| PriceBreakdown.jsx | Componente | ~98 | BAJA | Desglose detallado de precios | Price calculation utils |
| MarketplaceBuyer.jsx | Componente | ~92 | BAJA | Vista principal del marketplace para compradores | marketplace hooks/sections |
| SavingsCalculator.jsx | Componente | ~64 | BAJA | Calculadora de ahorros y descuentos | Custom calculation logic |
| useCartNotifications.js | Hook | ~63 | BAJA | Notificaciones del carrito | react-hot-toast |
| StatCard.jsx | Componente | ~49 | BAJA | Tarjeta de estadística reutilizable | @mui/material |
| ShippingProgressBar.jsx | Componente | ~44 | BAJA | Barra de progreso de envío | @mui/material |
| DiscountSection.jsx | Componente | ~34 | BAJA | Sección de descuentos aplicados | @mui/material |
| index.js | Barrel | ~21 | BAJA | Exportaciones centralizadas del módulo | N/A |
| cart/index.js | Barrel | ~11 | BAJA | Exportaciones de componentes del carrito | N/A |
| QuantitySelector/index.js | Barrel | ~1 | BAJA | Exportación del selector de cantidad | N/A |

---

## 4. 🏗️ Arquitectura y patrones

- **Patrones de diseño identificados:**
  - **Observer Pattern:** Zustand store con suscripciones reactivas
  - **Strategy Pattern:** Múltiples estrategias de envío y cálculo de precios
  - **Factory Pattern:** Creación de notificaciones y componentes dinámicos
  - **Module Pattern:** Separación clara de responsabilidades en hooks especializados
  - **Composite Pattern:** Composición de componentes del carrito

- **Estructura de carpetas:**
```
buyer/
├── index.js (barrel principal)
├── [MainComponents].jsx (componentes principales)
├── cart/ (módulo del carrito)
│   ├── index.js
│   ├── [CartComponents].jsx
│   ├── components/ (componentes específicos del carrito)
│   └── hooks/ (hooks del carrito)
├── components/ (componentes reutilizables)
├── hooks/ (hooks personalizados)
└── QuantitySelector/ (componente independiente)
```

- **Flujo de datos principal:**
```
Usuario Interactúa → Componente UI → Hook Personalizado → Zustand Store → Persistencia Local
                                   ↓
                            Servicios Backend ← Supabase ← Validaciones
```

- **Puntos de entrada:**
  - `index.js`: Exportaciones principales del módulo
  - `MarketplaceBuyer.jsx`: Vista principal del marketplace
  - `BuyerCart.jsx`: Carrito de compras principal

- **Puntos de salida:**
  - Componentes: MarketplaceBuyer, BuyerCart, BuyerOrders, BuyerPerformance, BuyerProfile
  - Hooks: useCartStore, hooks especializados del carrito
  - Componentes reutilizables: StatCard, QuantitySelector

```
Diagrama de flujo detallado:
User Action → UI Component → Custom Hook → Store/Service → Backend
├── Validaciones (quantity, shipping, coupons)
├── Transformaciones (price calculations, data mapping)
└── Side effects (notifications, persistence, analytics)
```

---

## 5. 🔗 Matriz de dependencias

#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @mui/material | ^5.x | UI components y theming | ALTO - Toda la interfaz | Chakra UI, Ant Design |
| @mui/icons-material | ^5.x | Iconografía del sistema | MEDIO - Puede reemplazarse | React Icons, Heroicons |
| zustand | ^4.x | Estado global del carrito | ALTO - Core del state management | Redux Toolkit, Jotai |
| framer-motion | ^10.x | Animaciones y transiciones | MEDIO - UX mejorada | React Spring, CSS transitions |
| react-hot-toast | ^2.x | Sistema de notificaciones | BAJO - Fácil reemplazo | React Toastify, custom |
| lodash.debounce | ^4.x | Optimización de performance | BAJO - Función específica | Custom debounce |
| react-intersection-observer | ^9.x | Lazy loading y scroll detection | BAJO - Performance | Intersection Observer API |
| supabase-js | ^2.x | Backend y autenticación | ALTO - Core backend | Firebase, custom backend |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| /services/user | Importa | Gestión de perfil y autenticación | ALTO |
| /services/supabase | Importa | Configuración de base de datos | ALTO |
| /utils/priceCalculation | Importa | Cálculos de precios y descuentos | MEDIO |
| /utils/quantityValidation | Importa | Validaciones de cantidad | MEDIO |
| ../marketplace/* | Importa | Componentes del marketplace | ALTO |
| ../profile/Profile | Importa | Componente de perfil reutilizable | MEDIO |
| ../layout/SideBar | Importa | Layout y navegación | ALTO |
| ../../styles/dashboardThemeCore | Importa | Theming consistente | MEDIO |
| ../ui/Modal | Importa | Componentes UI reutilizables | BAJO |

---

## 6. 🧩 API del módulo

#### Componentes exportados:
```jsx
// Ejemplo de uso completo
import { 
  MarketplaceBuyer, 
  BuyerCart, 
  BuyerOrders, 
  BuyerPerformance,
  BuyerProfile,
  useCartStore 
} from './buyer';

// Uso del marketplace
<MarketplaceBuyer />

// Uso del carrito
<BuyerCart />

// Uso del perfil con callback
<BuyerProfile onProfileUpdated={() => alert('Perfil actualizado!')} />

// Hook del carrito
const { items, addItem, removeItem, clearCart } = useCartStore();
```

#### Props detalladas:

**BuyerProfile**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| onProfileUpdated | function | ❌ | undefined | function type | Callback ejecutado tras actualizar perfil | `() => console.log('Updated')` |

**MarketplaceBuyer, BuyerCart, BuyerOrders, BuyerPerformance**
- No requieren props externas; gestionan estado interno mediante hooks y contexto

#### Hooks personalizados:

**useCartStore()**
- **Propósito:** Store global para gestión completa del carrito de compras
- **Parámetros:** Ninguno (selector automático)
- **Retorno:** Objeto con estado del carrito y funciones de manipulación
- **Estados internos:** items, wishlist, coupons, shipping, loading, error
- **Efectos:** Persistencia automática, validaciones, cálculos de precio
- **Casos de uso:** Cualquier componente que necesite acceso al carrito
- **Limitaciones:** No sincroniza automáticamente con backend (pendiente)

```jsx
// Ejemplo de uso del hook principal
const { 
  items,           // Array de productos en carrito
  loading,         // Estado de carga
  error,           // Errores del carrito
  wishlist,        // Lista de deseos
  appliedCoupons,  // Cupones aplicados
  
  // Funciones de manipulación
  addItem,         // Agregar producto
  removeItem,      // Eliminar producto
  updateQuantity,  // Actualizar cantidad
  clearCart,       // Limpiar carrito
  
  // Funciones de cálculo
  getSubtotal,     // Subtotal
  getDiscount,     // Descuento total
  getTotal,        // Total final
  
  // Funciones de wishlist
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
  
  // Funciones de cupones
  applyCoupon,
  removeCoupon
} = useCartStore();
```

**useBuyerOrders(buyerId)**
- **Propósito:** Gestión del historial de pedidos del comprador
- **Parámetros:** buyerId (string) - ID del usuario comprador
- **Retorno:** orders, loading, error, utility functions
- **Estados internos:** lista de pedidos, estado de carga
- **Efectos:** Fetch inicial de pedidos, formateo de datos
- **Casos de uso:** Mostrar historial de compras
- **Limitaciones:** Datos actualmente mockeados, pendiente integración real

---

## 7. 🔍 Análisis de estado

- **Estado global usado:**
  - Zustand cartStore: Carrito, wishlist, cupones, configuración de envío
  - ThemeProvider: Tema de la aplicación
  - SideBarProvider: Estado de navegación lateral

- **Estado local:**
  - Loading states en componentes individuales
  - Form states para edición de perfil
  - UI states (modales, acordeones, selecciones)
  - Temporary states para animaciones

- **Persistencia:**
  - localStorage: Estado completo del carrito (automático via Zustand persist)
  - sessionStorage: Estados temporales de UI
  - Supabase: Perfil de usuario, pedidos, datos de negocio

- **Sincronización:**
  - Local first approach: cambios inmediatos en UI
  - Debounced persistence: auto-guardado cada 50ms
  - Backend sync: manual para operaciones críticas

- **Mutaciones:**
  - Carrito: add/remove/update items, aplicar cupones
  - Wishlist: add/remove productos favoritos
  - Perfil: actualización de datos personales
  - Shipping: selección de opciones de envío

---

## 8. 🎭 Lógica de negocio

- **Reglas de negocio implementadas:**
  - Validación de cantidad mínima/máxima por producto
  - Cálculo de descuentos por volumen y cupones
  - Compatibilidad de envío entre productos
  - Límites de stock por producto
  - Aplicación de impuestos según región
  - Validación de cupones por fecha y condiciones

- **Validaciones:**
  - Quantity validation: min/max limits, stock availability
  - Shipping validation: compatibility between products
  - Coupon validation: expiry dates, usage limits, conditions
  - Profile validation: required fields, format validation
  - Payment validation: amount limits, currency checks

- **Transformaciones de datos:**
  - Backend → Frontend mapping en BuyerProfile
  - Price calculations con descuentos y impuestos
  - Date formatting para display de fechas
  - Currency formatting según configuración regional
  - Image URL transformations y fallbacks

- **Casos especiales:**
  - Productos sin stock: mostrar estado y opciones alternativas
  - Incompatibilidad de envío: modal de resolución
  - Cupones expirados: auto-removal y notificación
  - Carrito vacío: estado especial con recomendaciones
  - Errores de red: retry logic y fallbacks

- **Integraciones:**
  - Supabase: autenticación, perfil, pedidos
  - Marketplace API: productos, stock, precios
  - Payment gateway: procesamiento de pagos (futuro)
  - Shipping API: cálculo de costos y tiempos
  - Analytics: tracking de eventos de carrito

---

## 9. 🔄 Flujos de usuario

**Flujo principal de compra:**
1. Usuario navega marketplace → Sistema carga productos → Muestra catálogo filtrable
2. Usuario selecciona producto → Sistema valida stock → Muestra opciones
3. Usuario agrega al carrito → Sistema valida cantidad → Actualiza carrito con feedback
4. Usuario revisa carrito → Sistema calcula totales → Muestra breakdown de precios
5. Usuario procede a checkout → Sistema valida final → Redirige a pago

**Flujo de gestión de carrito:**
1. Usuario modifica cantidad → Sistema valida → Actualiza totales automáticamente
2. Usuario aplica cupón → Sistema valida cupón → Aplica descuento y notifica
3. Usuario selecciona envío → Sistema valida compatibilidad → Actualiza opciones
4. Usuario guarda en wishlist → Sistema persiste → Notifica guardado exitoso

**Flujos alternativos:**
- **Flujo de error:** Validación falla → Muestra mensaje específico → Usuario puede corregir
- **Flujo de cancelación:** Usuario cancela operación → Sistema restaura estado anterior
- **Flujo de carga:** Operación async → Muestra loading state → Completa con feedback
- **Flujo de reintento:** Error temporal → Sistema ofrece retry → Ejecuta automáticamente

**Flujo de perfil:**
1. Usuario accede a perfil → Sistema carga datos → Muestra formulario pre-llenado
2. Usuario edita campos → Sistema valida en tiempo real → Muestra errores inline
3. Usuario guarda cambios → Sistema valida completo → Actualiza backend y notifica

---

## 10. 🧪 Puntos de testing

- **Casos de prueba críticos:**
  - Adición/eliminación de productos del carrito
  - Cálculos de precios con descuentos múltiples
  - Validación de cantidades límite
  - Aplicación y remoción de cupones
  - Compatibilidad de opciones de envío
  - Persistencia del carrito en localStorage
  - Actualización de perfil con validaciones

- **Mocks necesarios:**
  - Supabase client y métodos de autenticación
  - Servicios de usuario (getUserProfile, updateUserProfile)
  - APIs de marketplace (productos, stock)
  - localStorage para persistencia
  - Services de shipping y pricing

- **Datos de prueba:**
  - Productos con diferentes configuraciones de precio/stock
  - Cupones válidos e inválidos con diferentes condiciones
  - Perfiles de usuario con datos completos e incompletos
  - Escenarios de envío compatible e incompatible
  - Estados de error de red y timeout

- **Escenarios de error:**
  - Pérdida de conexión durante operaciones críticas
  - Stock insuficiente después de agregado al carrito
  - Cupones que expiran durante la sesión
  - Errores de validación de backend
  - Timeouts en servicios externos

- **Performance:**
  - Tiempo de renderizado con carritos grandes (100+ items)
  - Memoria utilizada en sesiones largas
  - Frecuencia de re-renders innecesarios
  - Tamaño de bundles de lazy components

---

## 11. 🚨 Puntos críticos para refactor

- **Código legacy:**
  - Algunos datos mockeados en BuyerOrders y BuyerPerformance
  - URLs de imagen con lógica de reparación compleja en BuyerProfile
  - Validaciones inline que podrían centralizarse

- **Antipatrones:**
  - Componentes con más de 500 LOC (BuyerCart, CartItem)
  - Lógica de negocio mezclada con presentación
  - Props drilling en algunos componentes del carrito
  - Uso de localStorage directo sin abstracción

- **Oportunidades de mejora:**
  - Separar hooks de negocio de hooks de UI
  - Implementar error boundaries
  - Migrar a React Query para server state
  - Implementar code splitting más granular
  - Centralizar validaciones en esquemas
  - Implementar testing automático

- **Riesgos:**
  - Cambios en cartStore pueden afectar múltiples componentes
  - Dependencia fuerte de estructura de datos de Supabase
  - Performance degradation con carritos muy grandes
  - Breaking changes en APIs de marketplace

- **Orden de refactor:**
  1. **Prioridad ALTA:** Separar lógica de negocio de componentes grandes
  2. **Prioridad ALTA:** Implementar error boundaries y manejo centralizado
  3. **Prioridad MEDIA:** Migrar datos mockeados a servicios reales
  4. **Prioridad MEDIA:** Implementar testing unitario e integración
  5. **Prioridad BAJA:** Optimizaciones de performance y bundle size

---

## 12. 🔧 Consideraciones técnicas

#### Limitaciones actuales:
- **Performance:** 
  - Re-renders frecuentes en cartStore con muchos suscriptores
  - Cálculos de precio síncronos que podrían ser async
  - Falta de virtualización para listas grandes
  
- **Memoria:**
  - Persistencia completa del carrito en memoria
  - Imágenes no optimizadas pueden causar memory leaks
  - Event listeners no limpiados en algunos componentes

- **Escalabilidad:**
  - Store monolítico del carrito puede ser limitante
  - Falta de paginación en historial de pedidos
  - Sin optimistic updates para operaciones lentas

- **Compatibilidad:**
  - Dependencia de localStorage (no funciona en modo privado)
  - Algunos hooks requieren APIs modernas (IntersectionObserver)
  - No hay fallbacks para navegadores sin JavaScript

#### Configuración requerida:
- **Variables de entorno:**
  - VITE_SUPABASE_URL: URL de Supabase
  - VITE_SUPABASE_ANON_KEY: Key pública de Supabase
  - VITE_APP_ENV: Entorno de ejecución

- **Inicialización:**
  - ThemeProvider debe envolver la aplicación
  - SideBarProvider requerido para layout
  - Supabase client debe estar configurado

- **Permisos:**
  - localStorage access para persistencia
  - Network access para APIs
  - Storage access para imágenes

---

## 13. 🛡️ Seguridad y compliance

- **Datos sensibles:**
  - Información personal del usuario (nombre, dirección, teléfono)
  - Datos de facturación y envío
  - Historial de compras y preferencias
  - RUT y datos bancarios (solo display, no procesamiento)

- **Validaciones de seguridad:**
  - Sanitización de inputs en todos los formularios
  - Validación de cantidades para evitar overflow
  - Escape de HTML en contenido dinámico
  - Validación de URLs de imágenes

- **Permisos:**
  - Usuario autenticado requerido para todas las operaciones
  - Verificación de ownership en datos de perfil
  - Rate limiting implícito en debounced operations

- **Auditoría:**
  - Logs de errores en console (development)
  - Tracking de eventos críticos del carrito
  - Historial de cambios en perfil de usuario

---

## 14. 📚 Referencias y documentación

- **Documentación técnica:**
  - [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
  - [Material-UI Documentation](https://mui.com/material-ui/getting-started/overview/)
  - [Framer Motion Documentation](https://www.framer.com/motion/)
  - [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

- **Decisiones de arquitectura:**
  - Zustand elegido sobre Redux por simplicidad y performance
  - Material-UI para consistencia de diseño
  - Local-first approach para mejor UX
  - Modularización de hooks para reusabilidad

- **Recursos externos:**
  - Price calculation utilities específicos de Sellsi
  - Shipping validation logic customizado
  - Image handling con fallbacks y reparación

- **Historial de cambios:**
  - v1.0: Implementación inicial del módulo
  - v1.1: Refactorización de cartStore con módulos separados
  - v1.2: Adición de validaciones de envío avanzadas
  - v1.3: Optimizaciones de performance y memoización

---

## 15. 🎨 Ejemplos de uso avanzados

```jsx
// Ejemplo 1: Uso básico del carrito
import { BuyerCart, useCartStore } from './buyer';

function CarritoBasico() {
  return <BuyerCart />;
}

// Ejemplo 2: Acceso directo al store del carrito
function ComponentePersonalizado() {
  const { items, addItem, getTotal } = useCartStore();
  
  const handleAddProduct = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image
    });
  };
  
  return (
    <div>
      <p>Items en carrito: {items.length}</p>
      <p>Total: ${getTotal()}</p>
    </div>
  );
}

// Ejemplo 3: Integración con otros módulos
import { BuyerProfile, BuyerOrders } from './buyer';

function DashboardComprador() {
  const handleProfileUpdate = (updatedProfile) => {
    console.log('Perfil actualizado:', updatedProfile);
    // Lógica adicional como refresh de datos
  };

  return (
    <div>
      <BuyerProfile onProfileUpdated={handleProfileUpdate} />
      <BuyerOrders />
    </div>
  );
}

// Ejemplo 4: Manejo de errores y loading states
function CarritoConManejo() {
  const { items, loading, error, clearCart } = useCartStore();
  
  if (loading) {
    return <CircularProgress />;
  }
  
  if (error) {
    return (
      <Alert severity="error">
        Error: {error.message}
        <Button onClick={clearCart}>Limpiar carrito</Button>
      </Alert>
    );
  }
  
  return <BuyerCart />;
}

// Ejemplo 5: Hook personalizado para analytics
function useCarritoAnalytics() {
  const { items, getTotal } = useCartStore();
  
  useEffect(() => {
    // Track eventos del carrito
    if (items.length > 0) {
      analytics.track('cart_viewed', {
        items_count: items.length,
        total_value: getTotal()
      });
    }
  }, [items, getTotal]);
}
```

---

## 16. 🔄 Guía de migración

- **Desde versión anterior:**
  - Migrar de Redux a Zustand requiere actualizar imports
  - Cambiar `useSelector` por `useCartStore`
  - Actualizar actions a métodos directos del store

- **Breaking changes:**
  - Estructura de datos del carrito cambió en v1.1
  - Hooks de cupones y wishlist ahora son separados
  - APIs de servicios de usuario requieren nuevos parámetros

- **Checklist de migración:**
  - [ ] Actualizar imports de stores
  - [ ] Migrar custom hooks que usen el carrito
  - [ ] Verificar persistencia de datos en localStorage
  - [ ] Probar flujos críticos de compra
  - [ ] Validar integración con marketplace

- **Rollback:**
  - Restaurar versión anterior de cartStore
  - Revertir cambios en localStorage structure
  - Restaurar imports de hooks legacy

---

## 17. 📋 Metadatos del documento

- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** staging branch
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 01/08/2025
- **Cobertura de análisis:** 31 archivos, ~6,200 LOC
- **Nivel de detalle:** Completo para refactor y mantenimiento
