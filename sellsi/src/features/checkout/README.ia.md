# 🚀 README.ia.md - Módulo Checkout (Features/Checkout)

---

## 1. 🎯 Resumen ejecutivo del módulo

- **Problema de negocio que resuelve:** Centraliza y gestiona todo el proceso de pago y finalización de compra en Sellsi, proporcionando una experiencia de checkout moderna, segura y optimizada que elimina la fricción entre el carrito y la confirmación de compra.

- **Responsabilidad principal:** Orquestar el flujo completo de checkout desde la selección de método de pago hasta la confirmación de la transacción, incluyendo validaciones, procesamiento de pagos e integración con servicios externos como Khipu.

- **Posición en la arquitectura:** Módulo frontend crítico que actúa como puente entre el carrito de compras (buyer) y los servicios de pago/backend, gestionando estado de transacciones y flujo de navegación.

- **Criticidad:** ALTA - Es el punto crítico que convierte el carrito en ventas reales, contiene lógica de pagos y transacciones financieras.

- **Usuarios objetivo:** Usuarios compradores que han agregado productos al carrito y necesitan completar la compra a través de métodos de pago seguros.

---

## 2. 📊 Análisis de complejidad

- **Líneas de código:** ~2,540 líneas aproximadamente (14 archivos)
- **Complejidad ciclomática:** ALTA - Múltiples flujos de pago, validaciones complejas, manejo de estados de transacción y integración con APIs externas
- **Acoplamiento:** ALTO - Fuerte dependencia con servicios de pago (Khipu), carrito, autenticación, y backend de Supabase
- **Cohesión:** ALTA - Todas las funcionalidades están enfocadas en el proceso de checkout y pago
- **Deuda técnica estimada:** BAJA - Código bien estructurado, servicios modularizados, manejo centralizado de estado

---

## 3. 🗂️ Inventario completo de archivos

| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| CheckoutSummary.jsx | Componente | ~466 | ALTA | Resumen completo del pedido con cálculos y validaciones | useMinithumb, checkoutService |
| PaymentMethodSelector.jsx | Componente | ~346 | ALTA | Selector avanzado de métodos de pago con animaciones | framer-motion, usePaymentMethods |
| CheckoutSuccess.jsx | Componente | ~294 | MEDIA | Página de confirmación exitosa con opciones de navegación | react-router, useCartStore |
| useCheckout.js | Hook/Store | ~232 | ALTA | Store principal del checkout con persistencia y flujo | zustand, checkoutSteps |
| checkoutService.js | Servicio | ~232 | ALTA | Integración con backend y servicios de pago | supabase, khipuService |
| checkoutStyles.js | Estilos | ~177 | BAJA | Estilos centralizados del módulo checkout | @mui/material |
| checkoutConfig.js | Configuración | ~175 | MEDIA | Configuración general del checkout y validaciones | payment methods |
| CheckoutCancel.jsx | Componente | ~146 | BAJA | Página de cancelación de pago con recuperación | react-router |
| useCheckoutFormatting.js | Hook | ~145 | MEDIA | Formateo de precios, fechas y datos del checkout | utility functions |
| PaymentMethod.jsx | Componente | ~106 | MEDIA | Wrapper principal de la página de método de pago | useCheckout, navigation |
| usePaymentMethods.js | Hook | ~83 | MEDIA | Gestión de métodos de pago disponibles | payment constants |
| paymentMethods.js | Constantes | ~68 | BAJA | Definición de métodos de pago y configuraciones | N/A |
| checkoutSteps.js | Constantes | ~52 | BAJA | Definición del flujo de pasos del checkout | N/A |
| index.js | Barrel | ~16 | BAJA | Exportaciones centralizadas del módulo | N/A |

---

## 4. 🏗️ Arquitectura y patrones

- **Patrones de diseño identificados:**
  - **State Machine Pattern:** Flujo de pasos del checkout con transiciones controladas
  - **Strategy Pattern:** Múltiples métodos de pago con interfaces consistentes
  - **Service Layer Pattern:** Separación clara entre UI y lógica de negocio
  - **Observer Pattern:** Zustand store con suscripciones reactivas
  - **Factory Pattern:** Creación dinámica de componentes de pago
  - **Command Pattern:** Acciones del checkout encapsuladas

- **Estructura de carpetas:**
```
checkout/
├── index.js (barrel principal)
├── [MainComponents].jsx (componentes principales)
├── hooks/ (hooks especializados)
├── services/ (integración backend)
├── constants/ (configuraciones y flujos)
├── config/ (configuración general)
└── styles/ (estilos centralizados)
```

- **Flujo de datos principal:**
```
Carrito → Checkout Init → Payment Selection → Processing → Confirmation
    ↓           ↓              ↓             ↓           ↓
  Validate   Store State   API Integration Backend   Clear Cart
```

- **Puntos de entrada:**
  - `PaymentMethod.jsx`: Entrada principal desde carrito
  - `CheckoutSuccess.jsx`: Callback desde servicios de pago
  - `CheckoutCancel.jsx`: Manejo de cancelaciones

- **Puntos de salida:**
  - Redirección a servicios de pago externos (Khipu)
  - Navegación a páginas de confirmación
  - Limpieza del carrito y actualización de estado

```
Diagrama de flujo detallado:
Cart Data → Checkout Init → Payment Method → Processing → Confirmation
├── Validaciones (amounts, availability, user auth)
├── Transformaciones (tax calculations, shipping, formatting)
└── Side effects (API calls, storage persistence, notifications)
```

---

## 5. 🔗 Matriz de dependencias

#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| @mui/material | ^5.x | UI components y layout | ALTO - Toda la interfaz | Ant Design, Chakra UI |
| @mui/icons-material | ^5.x | Iconografía del checkout | MEDIO - Visual feedback | React Icons, Heroicons |
| zustand | ^4.x | Estado del checkout y persistencia | ALTO - Core state management | Redux Toolkit, Jotai |
| framer-motion | ^10.x | Animaciones de transición | MEDIO - UX enhancement | React Spring, CSS animations |
| react-router-dom | ^6.x | Navegación entre pasos | ALTO - Routing crítico | Reach Router, Next.js Router |
| react-hot-toast | ^2.x | Notificaciones de estado | BAJO - User feedback | React Toastify, custom |
| supabase-js | ^2.x | Backend y base de datos | ALTO - Core persistence | Firebase, custom backend |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| ../buyer/hooks/cartStore | Importa | Datos del carrito para checkout | ALTO |
| ../../services/supabase | Importa | Configuración de base de datos | ALTO |
| ../../services/payment | Importa | Integración con Khipu | ALTO |
| ../../services/security | Importa | Tracking y seguridad | MEDIO |
| ../../utils/priceCalculation | Importa | Cálculos de precios y taxes | MEDIO |
| ../../utils/shippingCalculation | Importa | Cálculos de envío reales | MEDIO |
| ../../hooks/useResponsiveThumbnail | Importa | Optimización de imágenes | BAJO |
| ../ui/SecurityBadge | Importa | Componentes de seguridad | BAJO |
| ../../styles/dashboardThemeCore | Importa | Theming consistente | MEDIO |
| ../../styles/layoutSpacing | Importa | Espaciado consistente | BAJO |

---

## 6. 🧩 API del módulo

#### Componentes exportados:
```jsx
// Ejemplo de uso completo
import {
  PaymentMethodSelector,
  CheckoutSummary,
  PaymentMethod,
  useCheckout,
  usePaymentMethods,
  checkoutService
} from './checkout';

// Flujo básico de checkout
<PaymentMethod />

// Selector independiente de métodos
<PaymentMethodSelector 
  onMethodSelected={(method) => console.log(method)}
  selectedMethod={currentMethod}
/>

// Resumen personalizable
<CheckoutSummary
  orderData={orderInfo}
  selectedMethod={paymentMethod}
  onContinue={handleContinue}
  onBack={handleBack}
  isProcessing={processing}
/>
```

#### Props detalladas:

**CheckoutSummary**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| orderData | object | ✅ | - | order schema | Datos completos del pedido | `{items: [], total: 1000}` |
| selectedMethod | object | ❌ | null | method schema | Método de pago seleccionado | `{id: 'khipu', name: '...'}` |
| onContinue | function | ✅ | - | function type | Callback para continuar | `() => processPayment()` |
| onBack | function | ✅ | - | function type | Callback para regresar | `() => goBack()` |
| isProcessing | boolean | ❌ | false | boolean | Estado de procesamiento | `true/false` |
| canContinue | boolean | ❌ | true | boolean | Si puede continuar | `method != null` |

**PaymentMethodSelector**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| onMethodSelected | function | ❌ | undefined | function type | Callback al seleccionar método | `(method) => setMethod(method)` |
| selectedMethod | object | ❌ | null | method schema | Método actualmente seleccionado | `{id: 'khipu'}` |
| availableMethods | array | ❌ | all enabled | array of methods | Métodos disponibles | `[KHIPU, WEBPAY]` |

**PaymentMethod, CheckoutSuccess, CheckoutCancel**
- No requieren props externas; gestionan estado mediante hooks y navegación

#### Hooks personalizados:

**useCheckout()**
- **Propósito:** Store centralizado para gestión completa del proceso de checkout
- **Parámetros:** Ninguno (selector automático)
- **Retorno:** Estado del checkout y funciones de control
- **Estados internos:** currentStep, orderData, paymentMethod, paymentStatus, error
- **Efectos:** Persistencia automática, validaciones, seguimiento de flujo
- **Casos de uso:** Cualquier componente que participe en el checkout
- **Limitaciones:** Requiere inicialización con datos válidos del carrito

```jsx
// Ejemplo de uso del hook principal
const {
  // Estado actual
  currentStep,        // Paso actual del checkout
  completedSteps,     // Pasos completados
  orderData,          // Datos del pedido
  paymentMethod,      // Método seleccionado
  paymentStatus,      // Estado del pago
  isProcessing,       // Procesando transacción
  error,              // Errores del proceso
  
  // Funciones de control
  initializeCheckout, // Inicializar con datos del carrito
  selectPaymentMethod,// Seleccionar método de pago
  nextStep,           // Avanzar paso
  previousStep,       // Retroceder paso
  goToStep,           // Ir a paso específico
  startProcessing,    // Iniciar procesamiento
  completePayment,    // Completar pago
  resetCheckout       // Resetear estado
} = useCheckout();
```

**usePaymentMethods()**
- **Propósito:** Gestión de métodos de pago disponibles y validaciones
- **Parámetros:** Ninguno
- **Retorno:** Métodos disponibles y funciones de validación
- **Estados internos:** availableMethods, selectedMethod, fees
- **Efectos:** Validación de montos, cálculo de comisiones
- **Casos de uso:** Componentes de selección de pago
- **Limitaciones:** Solo métodos configurados en constants

**useCheckoutFormatting()**
- **Propósito:** Formateo consistente de datos del checkout
- **Parámetros:** Ninguno
- **Retorno:** Funciones de formateo para precios, fechas, etc.
- **Casos de uso:** Display de información formateada
- **Limitaciones:** Solo soporta formato CLP y español

---

## 7. 🔍 Análisis de estado

- **Estado global usado:**
  - Zustand checkoutStore: Flujo de checkout, datos del pedido, método de pago
  - useCartStore: Datos del carrito para inicialización
  - ThemeProvider: Tema de la aplicación
  - Router state: Navegación entre pasos

- **Estado local:**
  - Loading states para operaciones async
  - Form validation states
  - UI interaction states (expandido, seleccionado)
  - Error states específicos por componente

- **Persistencia:**
  - localStorage: Estado completo del checkout (via Zustand persist)
  - sessionStorage: Estados temporales de navegación
  - Supabase: Órdenes creadas, transacciones, historial
  - URL params: Estado de callbacks de pago

- **Sincronización:**
  - Real-time: Estado del checkout local
  - Event-driven: Callbacks de servicios de pago
  - Manual: Verificación de estado de transacciones

- **Mutaciones:**
  - Checkout: inicializar, avanzar/retroceder pasos
  - Payment: seleccionar método, procesar pago
  - Order: crear, actualizar estado
  - Cart: limpiar después de compra exitosa

---

## 8. 🎭 Lógica de negocio

- **Reglas de negocio implementadas:**
  - Validación de monto mínimo/máximo por método de pago
  - Cálculo automático de IVA (19%) y comisión de servicio (2%)
  - Verificación de productos en carrito antes de checkout
  - Validación de usuario autenticado
  - Cálculo real de costos de envío por región
  - Tracking de IP para seguridad

- **Validaciones:**
  - Amount validation: límites por método de pago
  - Cart validation: productos disponibles, stock
  - User validation: autenticación y perfil completo
  - Payment validation: método soportado, datos válidos
  - Order validation: estructura correcta de datos

- **Transformaciones de datos:**
  - Cart data → Order data con cálculos de taxes
  - Payment method selection → Checkout state update
  - Khipu response → Order status update
  - Price calculations con descuentos y shipping
  - Currency formatting para display

- **Casos especiales:**
  - Carrito vacío: redirección automática
  - Usuario no autenticado: redirección a login
  - Pago cancelado: recuperación de estado
  - Timeout de pago: limpieza y notificación
  - Error de red: retry logic con exponential backoff

- **Integraciones:**
  - Khipu API: creación de órdenes de pago y callbacks
  - Supabase: persistencia de órdenes y transacciones
  - Security service: tracking de acciones críticas
  - Cart service: sincronización y limpieza
  - User service: datos de usuario para pago

---

## 9. 🔄 Flujos de usuario

**Flujo principal de checkout:**
1. Usuario en carrito → Click "Proceder al pago" → Navegación a PaymentMethod
2. Sistema valida carrito → Inicializa checkout → Muestra método de pago
3. Usuario selecciona Khipu → Sistema valida método → Marca paso completado
4. Usuario confirma pago → Sistema crea orden → Redirige a Khipu
5. Usuario completa pago → Khipu callback → Sistema confirma → Muestra success
6. Sistema limpia carrito → Actualiza historial → Ofrece opciones de navegación

**Flujo de validación:**
1. Sistema verifica carrito no vacío → Usuario autenticado → Productos disponibles
2. Calcula totales con taxes → Valida montos → Inicializa checkout state
3. Usuario selecciona método → Sistema valida límites → Habilita continuar
4. Sistema crea orden en backend → Genera referencia → Procede a pago

**Flujos alternativos:**
- **Flujo de cancelación:** Usuario cancela → Sistema preserva carrito → Ofrece retry
- **Flujo de error:** Error en pago → Sistema notifica → Mantiene estado → Permite reintentar
- **Flujo de timeout:** Timeout en servicio → Sistema limpia estado temporal → Notifica error
- **Flujo de navegación:** Usuario navega atrás → Sistema preserva estado → Permite continuar

**Flujo de recuperación:**
1. Usuario regresa de pago cancelado → Sistema detecta → Restaura estado anterior
2. Sistema verifica estado del carrito → Actualiza si necesario → Permite continuar
3. Si orden ya existe → Consulta estado → Actualiza UI según resultado

---

## 10. 🧪 Puntos de testing

- **Casos de prueba críticos:**
  - Inicialización de checkout con carrito válido/inválido
  - Selección de métodos de pago y validaciones de monto
  - Cálculos de taxes, shipping y totales
  - Flujo completo de pago con Khipu (mock)
  - Manejo de errores y timeouts
  - Persistencia de estado en localStorage
  - Navegación entre pasos del checkout

- **Mocks necesarios:**
  - Khipu payment service y callbacks
  - Supabase client y operaciones de DB
  - Router y navegación
  - localStorage/sessionStorage
  - useCartStore con datos de prueba
  - Security service para tracking

- **Datos de prueba:**
  - Carritos con diferentes configuraciones (vacío, productos válidos/inválidos)
  - Usuarios autenticados/no autenticados
  - Métodos de pago con diferentes límites
  - Respuestas de API exitosas/fallidas
  - Estados de navegación y callbacks

- **Escenarios de error:**
  - Red desconectada durante checkout
  - Timeout en servicios de pago
  - Usuario cancela pago en gateway externo
  - Productos agotados durante checkout
  - Errores de validación de backend
  - Inconsistencias en estado del carrito

- **Performance:**
  - Tiempo de inicialización del checkout
  - Latencia en cálculos de totales
  - Memoria utilizada en sesiones largas
  - Renderizado de listas de productos grandes

---

## 11. 🚨 Puntos críticos para refactor

- **Código legacy:**
  - Ninguno identificado - módulo relativamente nuevo y bien estructurado

- **Antipatrones:**
  - Algunos componentes con lógica de negocio mixta (CheckoutSummary)
  - Hardcoded tax rates (19% IVA) que deberían ser configurables
  - Direct localStorage access sin abstracción en algunos lugares

- **Oportunidades de mejora:**
  - Separar completamente UI de lógica de negocio
  - Implementar error boundaries específicos
  - Migrar a React Query para server state
  - Implementar optimistic updates
  - Centralizar configuraciones de tax/fees
  - Mejorar typing con TypeScript

- **Riesgos:**
  - Cambios en Khipu API pueden romper integración
  - Dependencia fuerte de estructura específica del carrito
  - Estados inconsistentes si localStorage se corrompe
  - Race conditions en callbacks de pago

- **Orden de refactor:**
  1. **Prioridad ALTA:** Separar lógica de negocio de componentes UI
  2. **Prioridad ALTA:** Implementar error boundaries y manejo centralizado
  3. **Prioridad MEDIA:** Migrar configuraciones hardcoded a constantes
  4. **Prioridad MEDIA:** Implementar testing integral
  5. **Prioridad BAJA:** Optimizaciones de performance y bundle

---

## 12. 🔧 Consideraciones técnicas

#### Limitaciones actuales:
- **Performance:**
  - Cálculos síncronos de taxes que podrían ser async
  - Re-renders durante cambios de estado del checkout
  - Sin memoización en cálculos complejos

- **Memoria:**
  - Persistencia completa del estado en localStorage
  - Referencias a objetos grandes del carrito
  - Event listeners no limpiados en navegación

- **Escalabilidad:**
  - Hardcoded para un solo método de pago activo
  - Sin paginación para órdenes grandes
  - Falta de queue system para operaciones fallidas

- **Compatibilidad:**
  - Dependencia de localStorage (problemas en modo privado)
  - Requiere JavaScript habilitado para funcionamiento
  - Sin fallbacks para navegadores antiguos

#### Configuración requerida:
- **Variables de entorno:**
  - VITE_SUPABASE_URL: Base de datos principal
  - VITE_SUPABASE_ANON_KEY: Autenticación
  - VITE_KHIPU_RECEIVER_ID: Configuración Khipu
  - VITE_APP_URL: URL para callbacks

- **Inicialización:**
  - Supabase client configurado
  - Router setup con rutas del checkout
  - Carrito inicializado con productos

- **Permisos:**
  - localStorage access para persistencia
  - Network access para APIs externas
  - User authentication tokens

---

## 13. 🛡️ Seguridad y compliance

- **Datos sensibles:**
  - Información de órdenes de compra
  - Referencias de transacciones
  - Datos de usuario para facturación
  - IPs de usuarios para tracking

- **Validaciones de seguridad:**
  - Sanitización de datos de entrada
  - Validación de montos para evitar manipulación
  - Verificación de autenticación en cada paso
  - Encriptación de datos en tránsito

- **Permisos:**
  - Usuario autenticado requerido
  - Verificación de ownership de carrito/orden
  - Rate limiting en operaciones críticas

- **Auditoría:**
  - Tracking de todas las acciones del checkout
  - Logs de errores y transacciones fallidas
  - Historial de cambios en órdenes

---

## 14. 📚 Referencias y documentación

- **Documentación técnica:**
  - [Khipu API Documentation](https://khipu.com/page/api-docs)
  - [Zustand Persistence Guide](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
  - [Supabase Real-time](https://supabase.com/docs/guides/realtime)
  - [Material-UI Stepper Component](https://mui.com/material-ui/react-stepper/)

- **Decisiones de arquitectura:**
  - Zustand elegido para estado del checkout por simplicidad vs Redux
  - State machine pattern para flujo controlado de pasos
  - Service layer para separar lógica de negocio
  - Khipu como método principal por ser específico del mercado chileno

- **Recursos externos:**
  - Khipu integration guide específico de Sellsi
  - Tax calculation utilities para Chile
  - Security best practices para checkout flows

- **Historial de cambios:**
  - v1.0: Implementación básica con Khipu
  - v1.1: Adición de manejo de errores robusto
  - v1.2: Implementación de tracking de seguridad
  - v1.3: Optimizaciones de UX y performance

---

## 15. 🎨 Ejemplos de uso avanzados

```jsx
// Ejemplo 1: Checkout básico desde carrito
import { PaymentMethod } from './checkout';

function CheckoutBasico() {
  // El componente maneja automáticamente la inicialización
  return <PaymentMethod />;
}

// Ejemplo 2: Checkout personalizado con hooks
function CheckoutPersonalizado() {
  const {
    currentStep,
    orderData,
    selectPaymentMethod,
    startProcessing
  } = useCheckout();

  const handleKhipuPayment = async () => {
    selectPaymentMethod(PAYMENT_METHODS.KHIPU);
    await startProcessing();
  };

  return (
    <div>
      <h2>Paso actual: {currentStep.name}</h2>
      <p>Total: ${orderData.total}</p>
      <button onClick={handleKhipuPayment}>
        Pagar con Khipu
      </button>
    </div>
  );
}

// Ejemplo 3: Integración con analytics
function CheckoutConAnalytics() {
  const { orderData, paymentMethod } = useCheckout();

  useEffect(() => {
    if (paymentMethod) {
      analytics.track('payment_method_selected', {
        method: paymentMethod.id,
        amount: orderData.total,
        currency: orderData.currency
      });
    }
  }, [paymentMethod, orderData]);

  return <PaymentMethodSelector />;
}

// Ejemplo 4: Manejo de errores avanzado
function CheckoutConErrores() {
  const { error, resetCheckout } = useCheckout();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      await resetCheckout();
      // Lógica de retry
    } else {
      // Escalate error
      toast.error('Error persistente, contacta soporte');
    }
  };

  if (error) {
    return (
      <ErrorBoundary
        error={error}
        onRetry={handleRetry}
        canRetry={retryCount < 3}
      />
    );
  }

  return <PaymentMethod />;
}

// Ejemplo 5: Checkout con callback personalizado
function CheckoutConCallback() {
  const navigate = useNavigate();
  
  const handleSuccessfulPayment = useCallback((orderData) => {
    // Lógica post-pago
    analytics.track('purchase_completed', {
      order_id: orderData.id,
      value: orderData.total
    });
    
    // Navegación personalizada
    navigate('/orders', { 
      state: { newOrder: orderData.id } 
    });
  }, [navigate]);

  return (
    <CheckoutSummary
      onContinue={handleSuccessfulPayment}
      // ... otras props
    />
  );
}
```

---

## 16. 🔄 Guía de migración

- **Desde versión anterior:**
  - No aplica - es un módulo relativamente nuevo

- **Breaking changes potenciales:**
  - Cambios en estructura de orderData requieren migración de localStorage
  - Actualizaciones de Khipu API pueden requerir cambios en service
  - Modificaciones en flow de pasos afectan navegación

- **Checklist de migración:**
  - [ ] Verificar compatibilidad con nueva versión de Khipu
  - [ ] Migrar datos persisted en localStorage si cambia schema
  - [ ] Actualizar configuraciones de tax rates si se centralizan
  - [ ] Probar flujos completos de checkout en staging
  - [ ] Verificar callbacks y webhooks funcionando

- **Rollback:**
  - Revertir cambios en checkoutService para compatibilidad API
  - Restaurar schema anterior en localStorage
  - Revertir configuraciones de routing si cambiaron

---

## 17. 📋 Metadatos del documento

- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** staging branch
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 01/08/2025
- **Cobertura de análisis:** 14 archivos, ~2,540 LOC
- **Nivel de detalle:** Completo para refactor y mantenimiento
- **Estado del módulo:** Producción activa con integración Khipu
