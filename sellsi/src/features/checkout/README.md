# Checkout Module (`src/features/checkout`)

> **Fecha de creación:** 11/07/2025
> **Última actualización:** 11/07/2025

## 1. Resumen funcional del módulo

El módulo **checkout** gestiona todo el proceso de pago y finalización de compra en Sellsi. Proporciona una experiencia de checkout moderna, segura y optimizada, incluyendo selección de métodos de pago, validaciones, procesamiento de pagos y confirmación de órdenes.

- **Problema que resuelve:** Centraliza y optimiza el flujo de pago, garantizando una experiencia fluida desde el carrito hasta la confirmación de compra.
- **Función principal:** Proveer componentes y lógica para el proceso completo de checkout con integración a múltiples métodos de pago.
- **Arquitectura:** Basado en hooks especializados, componentes modulares y servicios para integración con APIs de pago.

## 2. Listado de archivos principales

| Archivo                    | Tipo        | Descripción                                    |
|--------------------------- |-------------|------------------------------------------------|
| PaymentMethod.jsx          | Componente  | Página principal de selección de método de pago |
| PaymentMethodSelector.jsx  | Componente  | Selector de métodos de pago disponibles        |
| CheckoutSummary.jsx        | Componente  | Resumen del pedido y totales                   |
| hooks/useCheckout.js       | Hook        | Gestión de estado del proceso de checkout      |
| hooks/usePaymentMethods.js | Hook        | Lógica de métodos de pago                      |
| services/checkoutService.js| Servicio    | Integración con APIs de pago                   |
| constants/paymentMethods.js| Constantes  | Configuración de métodos de pago               |
| constants/checkoutSteps.js | Constantes  | Definición de pasos del checkout               |

## 3. Relaciones internas del módulo

```
PaymentMethod (página principal)
├── PaymentMethodSelector (selector)
├── CheckoutSummary (resumen)
├── useCheckout (estado)
├── usePaymentMethods (métodos)
└── checkoutService (integración)
```

- **PaymentMethod**: Página principal con layout y gestión de estado
- **PaymentMethodSelector**: Lógica visual de selección de métodos
- **CheckoutSummary**: Resumen del pedido y botones de acción
- **Hooks**: Gestión de estado y lógica de negocio
- **Services**: Integración con APIs externas y backend

## 4. Props principales de los componentes

### PaymentMethodSelector
- **Autónomo**: No requiere props, utiliza hooks internos
- **Navegación**: Maneja rutas /buyer/cart ↔ /buyer/paymentmethod

### CheckoutSummary
| Prop          | Tipo     | Requerido | Descripción                          |
|---------------|----------|-----------|--------------------------------------|
| orderData     | object   | Sí        | Datos del pedido (items, totales)    |
| selectedMethod| object   | No        | Método de pago seleccionado          |
| onContinue    | function | Sí        | Callback para continuar              |
| onBack        | function | Sí        | Callback para volver                 |
| isProcessing  | boolean  | No        | Estado de procesamiento              |
| canContinue   | boolean  | No        | Si puede continuar                   |

## 5. Hooks personalizados

### useCheckout
- **Estados:** currentStep, orderData, paymentMethod, isProcessing
- **Funciones:** initializeCheckout, selectPaymentMethod, processPayment, nextStep, previousStep

### usePaymentMethods
- **Estados:** availableMethods, selectedMethod, isValidating
- **Funciones:** selectMethod, validateMethod, getMethodFees, calculateTotalWithFees

## 6. Servicios

### checkoutService
- **Órdenes:** createOrder, updateOrderStatus
- **Pagos:** processKhipuPayment, verifyPaymentStatus
- **Validaciones:** validateCheckoutData
- **Utilidades:** formatPrice, calculateTax, generatePaymentReference

## 7. Integración con el sistema

### Flujo principal:
1. Usuario en `/buyer/cart` → click "Continuar al pago"
2. Navegación a `/buyer/paymentmethod`
3. Selección de método de pago (Khipu)
4. Validación y procesamiento
5. Confirmación y redirección a `/buyer/orders`

### Integración con carrito:
- Mantiene productos en el carrito durante el proceso
- Utiliza `useCartStore` para obtener datos del pedido
- Solo limpia el carrito después de pago exitoso

## 8. Flujo del Stepper (Actualizado)

### Estados del Stepper:
1. **🛒 Carrito** - Productos agregados, ir a checkout
2. **💳 Método de Pago** - Seleccionar Khipu (NO preseleccionado)
   - Al seleccionar método → ✅ Este paso se marca como completado
3. **⏳ Procesando** - Redirigiendo/procesando en Khipu
   - Durante la transacción en sitio web de Khipu
4. **✅ Completado** - Pago confirmado por Khipu
   - Mostrar resumen de compra y opciones

### Flujo Real con Khipu:
```javascript
// 1. Usuario selecciona Khipu → Paso 2 se marca como ✅
selectPaymentMethod(khipuMethod)

// 2. Usuario confirma → Redirige a Khipu → Paso 3 (Procesando)
startPaymentProcessing()
window.location.href = khipuPaymentUrl

// 3. Khipu confirma → Webhook/callback → Paso 4 (Completado)
completePayment(transactionData)

// 4. Mostrar resumen y opciones de navegación
```

### Simulación Actual (Sin Khipu real):
- Seleccionar método → ✅ marcado
- Confirmar pago → 3 segundos simulando proceso
- Completado → opciones finales

### Khipu (Activo)
- **Tipo:** Transferencia bancaria
- **Comisiones:** 0%
- **Límites:** $1.000 - $10.000.000 CLP
- **Procesamiento:** Inmediato
- **Seguridad:** SSL, encriptado, verificado

### Futuros métodos
- **Webpay Plus:** Tarjetas de crédito/débito
- **Mercado Pago:** Múltiples métodos
- **Otros:** Fácil extensión mediante constantes

## 9. Características técnicas

### Validaciones:
- ✅ Validación de montos mínimos/máximos
- ✅ Verificación de moneda soportada
- ✅ Validación de datos del pedido
- ✅ Verificación de productos en carrito

### Seguridad:
- ✅ Encriptación de datos sensibles
- ✅ Validación de transacciones
- ✅ Manejo seguro de referencias de pago

### UX/UI:
- ✅ Interfaz moderna y profesional
- ✅ Animaciones suaves con Framer Motion
- ✅ Responsive design
- ✅ Feedback visual de estados

## 10. Extensión y mantenimiento

### Agregar nuevo método de pago:
1. Definir en `constants/paymentMethods.js`
2. Implementar lógica en `services/checkoutService.js`
3. Actualizar validaciones en `usePaymentMethods.js`
4. Agregar icono en `/public/Checkout/`

### Personalizar flujo:
- Modificar `constants/checkoutSteps.js`
- Extender `useCheckout.js`
- Agregar nuevos componentes según necesidad

## 11. Consideraciones de rendimiento

- ✅ Lazy loading del módulo completo
- ✅ Memoización de cálculos costosos
- ✅ Persistencia de estado con Zustand
- ✅ Optimización de re-renderizado

## 12. Testing y debugging

### Estados a verificar:
- Carrito vacío → redirección
- Método no seleccionado → bloqueo
- Validaciones de monto → mensajes de error
- Procesamiento exitoso → confirmación

### Logs importantes:
- Inicialización del checkout
- Selección de método de pago
- Validaciones fallidas
- Procesamiento de pago
- Errores de integración

## 13. Roadmap futuro

- [ ] Integración real con API de Khipu
- [ ] Implementación de Webpay Plus
- [ ] Sistema de reembolsos
- [ ] Checkout express (1-click)
- [ ] Pagos recurrentes
- [ ] Integración con billeteras digitales

---

*Este módulo está diseñado para ser escalable, mantenible y fácil de extender con nuevos métodos de pago y funcionalidades.*
