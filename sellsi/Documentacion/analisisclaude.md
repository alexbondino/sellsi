# ANÁLISIS EXTREMADAMENTE PROFUNDO: SHIPPING ADDRESS NO SE GUARDA EN ORDERS

## 📋 RESUMEN EJECUTIVO

### Problema Identificado
Las direcciones de envío (`shipping_address`) y facturación (`billing_address`) no se están guardando en la tabla `orders` durante el proceso de checkout con Khipu. A pesar de que el sistema captura correctamente las direcciones del perfil del usuario, estas se pierden en algún punto del flujo y llegan como `null` a la base de datos.

### Contexto
- **Afectación**: 3ra vez intentando corregir este problema
- **Impacto**: Órdenes creadas sin información de direcciones de entrega
- **Flujo analizado**: Cart → Payment Method → Checkout Service → Khipu Service → Edge Functions → Database

### Hallazgo Principal
El problema está en **múltiples puntos del flujo** donde las direcciones se capturan correctamente pero no se propagan a través de toda la cadena de servicios hasta llegar a la base de datos.

---

## 🔍 HALLAZGOS DETALLADOS

### 1. ANÁLISIS DEL FLUJO COMPLETO

#### ✅ PUNTOS QUE FUNCIONAN CORRECTAMENTE:
1. **`PaymentMethod.jsx`** (líneas 84-119): Captura direcciones del perfil usando `getUserProfile()`
2. **`useCheckout.js`** (líneas 52-53): Almacena direcciones en el estado del checkout
3. **`PaymentMethodSelector.jsx`** (líneas 193-194): Pasa direcciones a `createOrder()`
4. **`checkoutService.createOrder()`** (líneas 41-49): Serializa y guarda direcciones en DB

#### ❌ PUNTOS DONDE SE PIERDE LA INFORMACIÓN:

##### **PROBLEMA CRÍTICO #1: PaymentMethodSelector.jsx**
```javascript
// Línea 197-205: NO pasa direcciones a processKhipuPayment
const paymentResult = await checkoutService.processKhipuPayment({
  orderId: order.id,
  userId: userId,
  userEmail: userEmail || '',
  amount: orderTotal,
  currency: orderData.currency || 'CLP',
  items: itemsWithDocType,
  // ❌ FALTAN: shippingAddress y billingAddress
});
```

##### **PROBLEMA CRÍTICO #2: checkoutService.processKhipuPayment()**
```javascript
// Línea 130-137: NO recibe ni pasa direcciones al khipuService
const khipuResponse = await khipuService.createPaymentOrder({
  orderId: paymentData.orderId,
  userId: paymentData.userId,
  userEmail: paymentData.userEmail,
  total: paymentData.amount,
  currency: paymentData.currency || 'CLP',
  items: paymentData.items,
  // ❌ FALTAN: shippingAddress y billingAddress
});
```

##### **PROBLEMA CRÍTICO #3: khipuService.createPaymentOrder()**
```javascript
// Línea 8: Solo recibe { total, currency, orderId, userId, items }
async createPaymentOrder(orderDetails) {
  const { total, currency, orderId, userId, items } = orderDetails;
  // ❌ NO destructura shippingAddress ni billingAddress
```

##### **PROBLEMA CRÍTICO #4: Edge Function**
```javascript
// supabase/functions/create-payment-khipu/index.ts
// Línea 293-296: Actualiza orden SIN preservar direcciones existentes
const updateData: Record<string, any> = {
  khipu_payment_id: (normalized as any).payment_id || null,
  khipu_payment_url: (normalized as any).payment_url || null,
  // ... otros campos
  // ❌ NO incluye shipping_address ni billing_address
};
```

### 2. TRACE COMPLETO DEL FLUJO DE DATOS

```
[1] PaymentMethod.jsx
    ↓ ✅ Captura direcciones del perfil
[2] useCheckout.js  
    ↓ ✅ Guarda en estado: { shippingAddress, billingAddress }
[3] PaymentMethodSelector.jsx
    ↓ ✅ Pasa a createOrder: { shippingAddress, billingAddress }
    ↓ ❌ NO pasa a processKhipuPayment
[4] checkoutService.createOrder()
    ↓ ✅ Guarda en DB con direcciones
[5] checkoutService.processKhipuPayment()
    ↓ ❌ NO recibe direcciones
[6] khipuService.createPaymentOrder()
    ↓ ❌ NO recibe direcciones
[7] Edge Function create-payment-khipu
    ↓ ❌ Actualiza orden SIN direcciones → SOBRESCRIBE CON NULL
[8] Database
    ↓ ❌ shipping_address: null, billing_address: null
```

### 3. EVIDENCIA DEL PROBLEMA

#### Log de Orden Final:
```sql
INSERT INTO "public"."orders" (
  "shipping_address", "billing_address", ...
) VALUES (
  null, null, ... -- ❌ Direcciones perdidas
);
```

#### Diagnóstico:
1. **PRE-EDGE**: Direcciones se capturan correctamente
2. **DURANTE EDGE**: Edge function no recibe direcciones del frontend
3. **POST-EDGE**: Edge function actualiza orden sin preservar direcciones existentes

### 4. SOLUCIÓN IDENTIFICADA

#### Modificaciones Requeridas:

1. **`PaymentMethodSelector.jsx`**:
   ```javascript
   const paymentResult = await checkoutService.processKhipuPayment({
     // ... existing fields
     shippingAddress: orderData.shippingAddress, // ✅ AGREGAR
     billingAddress: orderData.billingAddress,   // ✅ AGREGAR
   });
   ```

2. **`checkoutService.processKhipuPayment()`**:
   ```javascript
   const khipuResponse = await khipuService.createPaymentOrder({
     // ... existing fields
     shippingAddress: paymentData.shippingAddress, // ✅ AGREGAR
     billingAddress: paymentData.billingAddress,   // ✅ AGREGAR
   });
   ```

3. **`khipuService.createPaymentOrder()`**:
   ```javascript
   const { total, currency, orderId, userId, items, shippingAddress, billingAddress } = orderDetails; // ✅ AGREGAR
   
   const paymentPayload = {
     // ... existing fields
     shipping_address: shippingAddress || null, // ✅ AGREGAR
     billing_address: billingAddress || null,   // ✅ AGREGAR
   };
   ```

4. **Edge Function `create-payment-khipu/index.ts`**:
   ```typescript
   const updateData: Record<string, any> = {
     // ... existing fields
     shipping_address: shipping_address ? JSON.stringify(shipping_address) : null, // ✅ AGREGAR
     billing_address: billing_address ? JSON.stringify(billing_address) : null,   // ✅ AGREGAR
   };
   ```

### 5. CONCLUSIONES

- **Causa Raíz**: Falta de propagación de direcciones a través del pipeline de pagos
- **Tipo de Problema**: Integración entre servicios (no bug individual)
- **Complejidad**: Media - requiere modificaciones en 4 archivos
- **Riesgo**: Bajo - cambios incrementales sin afectar funcionalidad existente
- **Prioridad**: Alta - afecta experiencia del usuario en entregas

---

## 📝 NOTAS TÉCNICAS

- Las direcciones se capturan correctamente del perfil del usuario
- El problema NO está en la captura inicial sino en la propagación
- La edge function está sobrescribiendo las direcciones con null
- Se requiere modificar tanto el frontend como la edge function
- Las modificaciones son backward-compatible
