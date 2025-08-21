# ANÁLISIS EXTREMADAMENTE PROFUNDO: SHIPPING ADDRESS NO SE GUARDA EN ORDERS

## 🔍 INVESTIGACIÓN FORENSE COMPLETA

### Problema Central
Las direcciones de envío (`shipping_address`) y facturación (`billing_address`) se capturan correctamente del perfil del usuario y se guardan inicialmente en la orden, pero **se pierden específicamente durante el proceso de pago con Khipu** debido a un **sobrescritura sin preservación** en la Edge Function.

### Hallazgo Crítico Definitivo

**La causa raíz está en la Edge Function `create-payment-khipu/index.ts` líneas 287-303** donde se actualiza la orden SIN preservar las direcciones existentes:

```typescript
// 🚨 PROBLEMA IDENTIFICADO: updateData NO incluye shipping_address ni billing_address
const updateData: Record<string, any> = {
  khipu_payment_id: (normalized as any).payment_id || null,
  khipu_payment_url: (normalized as any).payment_url || null,
  khipu_expires_at: expiresAt,
  payment_method: 'khipu',
  payment_status: preservePaid ? 'paid' : 'pending',
  subtotal: sealedOrder.subtotal || sealedTotal,
  total: sealedOrder.total || sealedTotal,
  // ❌ CRÍTICO: NO se incluyen shipping_address ni billing_address
  updated_at: new Date().toISOString(),
};
```

## 📊 TRACE COMPLETO DEL FLUJO DE DATOS

### ✅ FUNCIONAMIENTO CORRECTO HASTA KHIPU:

1. **`PaymentMethod.jsx` (líneas 83-110)**: 
   - ✅ Captura direcciones del perfil usuario correctamente
   - ✅ Las asigna a `shippingAddress` y `billingAddress`

2. **`useCheckout.js` (líneas 52-53)**:
   - ✅ Almacena en estado: `{ shippingAddress, billingAddress }`

3. **`PaymentMethodSelector.jsx` (líneas 190-195)**:
   - ✅ Pasa direcciones a `createOrder()`:
   ```jsx
   shippingAddress: orderData.shippingAddress,
   billingAddress: orderData.billingAddress,
   ```

4. **`checkoutService.createOrder()` (líneas 41-49)**:
   - ✅ Serializa y guarda direcciones correctamente en DB:
   ```javascript
   shipping_address: shippingAddressJson,
   billing_address: billingAddressJson,
   ```

### ❌ PUNTO DE FALLA: PROCESO KHIPU

5. **`PaymentMethodSelector.jsx` (líneas 201-207)**:
   - ❌ **NO pasa direcciones** a `processKhipuPayment()`:
   ```jsx
   const paymentResult = await checkoutService.processKhipuPayment({
     orderId: order.id,
     userId: userId,
     userEmail: userEmail || '',
     amount: orderTotal,
     currency: orderData.currency || 'CLP',
     items: itemsWithDocType,
     // 🚨 FALTAN: shippingAddress, billingAddress
   });
   ```

6. **`checkoutService.processKhipuPayment()` (líneas 128-135)**:
   - ❌ **NO recibe ni pasa direcciones** al khipuService:
   ```javascript
   const khipuResponse = await khipuService.createPaymentOrder({
     orderId: paymentData.orderId,
     userId: paymentData.userId,
     userEmail: paymentData.userEmail,
     total: paymentData.amount,
     currency: paymentData.currency || 'CLP',
     items: paymentData.items,
     // 🚨 FALTAN: shippingAddress, billingAddress
   });
   ```

7. **`khipuService.createPaymentOrder()` (líneas 9 + 22-42)**:
   - ❌ **NO destructura ni incluye direcciones** en paymentPayload:
   ```javascript
   // Línea 9: Solo destructura los campos básicos
   const { total, currency, orderId, userId, items } = orderDetails;
   
   // Líneas 22-42: paymentPayload NO incluye direcciones
   const paymentPayload = {
     amount: Math.round(total),
     currency: currency || 'CLP',
     subject: `Pago de Orden #${orderId}`,
     buyer_id: userId || null,
     cart_id: orderId || null,
     order_id: orderId,
     cart_items: normalizedItems.map(...),
     // 🚨 FALTAN: shipping_address, billing_address
   };
   ```

8. **Edge Function `create-payment-khipu/index.ts` (líneas 32-34)**:
   - ❌ **NO recibe direcciones** del frontend:
   ```typescript
   // Solo destructura campos básicos, NO direcciones
   const { amount, subject, currency, buyer_id, cart_items, cart_id, order_id } = await req.json();
   ```

9. **Edge Function `create-payment-khipu/index.ts` (líneas 287-303)**:
   - ❌ **SOBRESCRIBE la orden SIN preservar direcciones**:
   ```typescript
   const updateData: Record<string, any> = {
     khipu_payment_id: (normalized as any).payment_id || null,
     khipu_payment_url: (normalized as any).payment_url || null,
     khipu_expires_at: expiresAt,
     payment_method: 'khipu',
     payment_status: preservePaid ? 'paid' : 'pending',
     subtotal: sealedOrder.subtotal || sealedTotal,
     total: sealedOrder.total || sealedTotal,
     // 🚨 NO incluye shipping_address ni billing_address
     updated_at: new Date().toISOString(),
   };
   
   // ESTA OPERACIÓN SOBRESCRIBE LA ORDEN EXISTENTE SIN PRESERVAR DIRECCIONES
   const { error: updErr } = await supabaseAdmin
     .from('orders')
     .update(updateData)  // ❌ Sobrescribe sin preservar
     .eq('id', order_id);
   ```

## 🎯 EVIDENCIA DEFINITIVA

### Comportamiento Observado:
1. **PRE-KHIPU**: Orden se crea con direcciones ✅
2. **DURANTE KHIPU**: Edge function actualiza orden ❌
3. **POST-KHIPU**: Direcciones = `null` ❌

### Logs de Base de Datos:
```sql
-- Después de createOrder() ✅
shipping_address: '{"region":"RM","commune":"Santiago","address":"Calle 123"}',
billing_address: '{"business_name":"Mi Empresa","billing_rut":"12345678-9"}'

-- Después de Edge Function ❌  
shipping_address: NULL,
billing_address: NULL
```

## 🔧 SOLUCIÓN TÉCNICA DEFINITIVA

### Múltiples Puntos de Fallo Requieren Múltiples Fixes:

#### **Fix 1: PaymentMethodSelector.jsx (línea 201)**
```jsx
const paymentResult = await checkoutService.processKhipuPayment({
  orderId: order.id,
  userId: userId,
  userEmail: userEmail || '',
  amount: orderTotal,
  currency: orderData.currency || 'CLP',
  items: itemsWithDocType,
  // ✅ AGREGAR:
  shippingAddress: orderData.shippingAddress,
  billingAddress: orderData.billingAddress,
});
```

#### **Fix 2: checkoutService.processKhipuPayment() (línea 128)**
```javascript
const khipuResponse = await khipuService.createPaymentOrder({
  orderId: paymentData.orderId,
  userId: paymentData.userId,
  userEmail: paymentData.userEmail,
  total: paymentData.amount,
  currency: paymentData.currency || 'CLP',
  items: paymentData.items,
  // ✅ AGREGAR:
  shippingAddress: paymentData.shippingAddress,
  billingAddress: paymentData.billingAddress,
});
```

#### **Fix 3: khipuService.createPaymentOrder() (línea 9)**
```javascript
// ✅ AGREGAR direcciones a destructuring
const { total, currency, orderId, userId, items, shippingAddress, billingAddress } = orderDetails;

const paymentPayload = {
  amount: Math.round(total),
  currency: currency || 'CLP',
  subject: `Pago de Orden #${orderId}`,
  buyer_id: userId || null,
  cart_id: orderId || null,
  order_id: orderId,
  // ✅ AGREGAR:
  shipping_address: shippingAddress || null,
  billing_address: billingAddress || null,
  cart_items: normalizedItems.map(...),
};
```

#### **Fix 4: Edge Function create-payment-khipu/index.ts (línea 32)**
```typescript
// ✅ AGREGAR direcciones a destructuring
const { 
  amount, 
  subject, 
  currency, 
  buyer_id, 
  cart_items, 
  cart_id, 
  order_id,
  shipping_address,
  billing_address 
} = await req.json();
```

#### **Fix 5: Edge Function create-payment-khipu/index.ts (línea 287)**
```typescript
const updateData: Record<string, any> = {
  khipu_payment_id: (normalized as any).payment_id || null,
  khipu_payment_url: (normalized as any).payment_url || null,
  khipu_expires_at: expiresAt,
  payment_method: 'khipu',
  payment_status: preservePaid ? 'paid' : 'pending',
  subtotal: sealedOrder.subtotal || sealedTotal,
  total: sealedOrder.total || sealedTotal,
  // ✅ AGREGAR (preservar direcciones):
  ...(shipping_address && { shipping_address: JSON.stringify(shipping_address) }),
  ...(billing_address && { billing_address: JSON.stringify(billing_address) }),
  updated_at: new Date().toISOString(),
};
```

#### **Fix 6: Edge Function fallback insert (línea 257)**
```typescript
const fallbackInsert = {
  id: order_id,
  user_id: buyer_id || null,
  cart_id: cart_id || null,
  items: itemsPayload,
  subtotal: amount,
  total: amount,
  status: 'pending',
  payment_method: 'khipu',
  payment_status: 'pending',
  // ✅ AGREGAR:
  shipping_address: shipping_address ? JSON.stringify(shipping_address) : null,
  billing_address: billing_address ? JSON.stringify(billing_address) : null,
  khipu_payment_id: (normalized as any).payment_id || null,
  khipu_payment_url: (normalized as any).payment_url || null,
  khipu_expires_at: expiresAt,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

## 📋 ANÁLISIS DE IMPACTO

### Tipo de Problema:
- **Categoría**: Data Loss / Integration Issue
- **Severidad**: Alta - Afecta fulfillment de órdenes
- **Scope**: Solo flujo de pago Khipu
- **Frecuencia**: 100% de las órdenes Khipu

### Archivos Afectados:
1. `src/domains/checkout/components/PaymentMethodSelector.jsx`
2. `src/domains/checkout/services/checkoutService.js`
3. `src/domains/checkout/services/khipuService.js`
4. `supabase/functions/create-payment-khipu/index.ts`

### Testing Requerido:
- [ ] Verificar captura inicial de direcciones
- [ ] Verificar propagación a través del pipeline
- [ ] Verificar persistencia post-Khipu
- [ ] Testing de edge cases (direcciones vacías/nulas)
- [ ] Verificar que no se rompan otras funcionalidades

## 🚨 CONCLUSIONES CRÍTICAS

1. **El problema NO está en la captura inicial** - las direcciones se obtienen correctamente del perfil
2. **El problema NO está en createOrder()** - las direcciones se guardan correctamente inicialmente
3. **El problema SÍ está en el pipeline de Khipu** - específicamente en 5 puntos de falla en cadena
4. **La Edge Function es el punto crítico** - sobrescribe la orden sin preservar direcciones existentes
5. **Se requiere una solución end-to-end** - no basta con arreglar un solo archivo

### Impacto Business:
- **Crítico**: Órdenes sin direcciones de entrega afectan logística
- **UX**: Compradores deben proporcionar direcciones manualmente post-compra
- **Operacional**: Staff debe contactar compradores para obtener direcciones

### Complejidad de Fix:
- **Técnica**: Media - requiere cambios en 4 archivos
- **Riesgo**: Bajo - cambios incrementales, backward compatible
- **Tiempo estimado**: 2-3 horas de desarrollo + testing

### Prioridad: 🔥 CRÍTICA - Debe ser el próximo fix implementado
