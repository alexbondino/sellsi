# 🔗 INTEGRACIÓN REAL CON KHIPU - GUÍA DE IMPLEMENTACIÓN

> **Estado actual:** Simulación preparada  
> **Estado futuro:** Integración real con API de Khipu

## 🎯 **CAMBIOS NECESARIOS PARA KHIPU REAL**

### **1. Obtener credenciales de Khipu**
```javascript
// En .env
VITE_KHIPU_RECEIVER_ID=tu_receiver_id
VITE_KHIPU_SECRET=tu_secret_key
VITE_KHIPU_API_URL=https://khipu.com/api/2.0
```

### **2. Actualizar checkoutService.js**
```javascript
// REEMPLAZAR la función simulada:
export const processKhipuPayment = async (paymentData) => {
  // En lugar de simulación, hacer llamada real a Khipu
  const response = await fetch(`${VITE_KHIPU_API_URL}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${VITE_KHIPU_SECRET}`
    },
    body: new URLSearchParams({
      'receiver_id': VITE_KHIPU_RECEIVER_ID,
      'subject': `Compra en Sellsi - ${paymentData.reference}`,
      'amount': paymentData.amount,
      'currency': paymentData.currency,
      'return_url': `${window.location.origin}/buyer/checkout/success`,
      'cancel_url': `${window.location.origin}/buyer/checkout/cancel`,
      'notify_url': `${YOUR_BACKEND_URL}/webhooks/khipu`,
      'transaction_id': paymentData.reference
    })
  })

  const result = await response.json()
  
  return {
    success: true,
    paymentUrl: result.payment_url, // URL para redirigir al usuario
    paymentId: result.payment_id
  }
}
```

### **3. Actualizar PaymentMethodSelector.jsx**
```javascript
// REEMPLAZAR la simulación en handleContinue:
const handleContinue = async () => {
  try {
    // ... validaciones ...

    // Llamada real a Khipu
    const paymentResult = await checkoutService.processKhipuPayment({
      amount: orderData.total,
      currency: orderData.currency,
      reference: checkoutService.generatePaymentReference()
    })

    if (paymentResult.success) {
      // Marcar como procesando
      startPaymentProcessing()
      
      // Redirigir a Khipu
      window.location.href = paymentResult.paymentUrl
    }
  } catch (error) {
    failPayment(error.message)
  }
}
```

### **4. Crear páginas de callback**
```jsx
// src/features/checkout/KhipuSuccess.jsx
const KhipuSuccess = () => {
  useEffect(() => {
    // Verificar el pago con Khipu
    // Marcar como completado
    completePayment(transactionData)
  }, [])
  
  return <div>Verificando pago...</div>
}

// src/features/checkout/KhipuCancel.jsx  
const KhipuCancel = () => {
  useEffect(() => {
    failPayment('Pago cancelado por el usuario')
  }, [])
  
  return <div>Pago cancelado</div>
}
```

### **5. Configurar rutas**
```jsx
// En App.jsx, agregar:
<Route path="/buyer/checkout/success" element={<KhipuSuccess />} />
<Route path="/buyer/checkout/cancel" element={<KhipuCancel />} />
```

### **6. Implementar webhook en backend**
```javascript
// En tu backend (Node.js/Express ejemplo)
app.post('/webhooks/khipu', (req, res) => {
  const { payment_id, transaction_id } = req.body
  
  // Verificar pago con Khipu
  // Actualizar estado en base de datos
  // Notificar al frontend via WebSocket/polling
  
  res.status(200).json({ success: true })
})
```

---

## 🔄 **FLUJO COMPLETO CON KHIPU REAL**

### **Frontend (Cliente):**
1. Usuario selecciona Khipu → ✅ Paso completado
2. Confirma pago → Llamada a API
3. Recibe URL de Khipu → Redirección
4. Completa pago en Khipu
5. Khipu redirige a `/buyer/checkout/success`
6. Frontend verifica y marca como completado

### **Backend/Webhook:**
1. Khipu envía notificación a webhook
2. Backend verifica el pago
3. Actualiza estado en base de datos
4. Notifica al frontend (WebSocket/polling)

---

## 🧪 **TESTING CON KHIPU SANDBOX**

### **1. Configurar sandbox:**
```javascript
// Para testing
VITE_KHIPU_API_URL=https://khipu.com/api/2.0  // Sandbox URL
VITE_KHIPU_RECEIVER_ID=sandbox_receiver_id
```

### **2. Montos de prueba:**
- Usar montos específicos que Khipu sandbox reconoce
- Documentar casos de éxito/fallo para testing

---

## 📋 **CHECKLIST DE IMPLEMENTACIÓN**

### **Preparación:**
- [ ] Obtener credenciales de Khipu (sandbox y producción)
- [ ] Configurar variables de entorno
- [ ] Implementar webhook en backend

### **Frontend:**
- [ ] Actualizar `checkoutService.js` con API real
- [ ] Modificar `handleContinue` en PaymentMethodSelector
- [ ] Crear páginas de callback (success/cancel)
- [ ] Agregar rutas de callback
- [ ] Testing con sandbox

### **Backend:**
- [ ] Implementar endpoint webhook
- [ ] Validación de notificaciones de Khipu
- [ ] Actualización de estados en BD
- [ ] Notificación a frontend

### **Testing:**
- [ ] Flujo completo en sandbox
- [ ] Casos de éxito y fallo
- [ ] Verificación de webhooks
- [ ] Testing de timeout/errores

---

## 🚨 **CONSIDERACIONES IMPORTANTES**

### **Seguridad:**
- ✅ Validar todas las notificaciones del webhook
- ✅ Verificar firmas/tokens de Khipu
- ✅ No confiar solo en callbacks del frontend

### **UX:**
- ✅ Manejar casos de timeout/error
- ✅ Mostrar estado de "procesando" claro
- ✅ Opciones de reintentar en caso de fallo

### **Rendimiento:**
- ✅ Implementar polling inteligente para verificar estado
- ✅ Cache de estados para evitar llamadas repetitivas
- ✅ Timeout apropiados para evitar esperas infinitas

---

**El sistema actual está 100% preparado para la integración real.** 
Solo requiere reemplazar la simulación con las llamadas reales a la API de Khipu.
