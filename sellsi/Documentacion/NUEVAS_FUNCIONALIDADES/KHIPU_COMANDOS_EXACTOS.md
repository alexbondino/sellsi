# 🚀 COMANDOS EXACTOS PARA ACTIVAR KHIPU

## ⚡ EJECUCIÓN RÁPIDA (Copiar y Pegar)

### PASO 1: Crear archivo de variables de entorno
```powershell
# Ejecutar en la raíz del proyecto sellsi/
New-Item -Path ".env.local" -ItemType File -Force
```

Luego editar `.env.local` y agregar:
```bash
VITE_APP_URL=http://localhost:5173
VITE_KHIPU_RECEIVER_ID=tu_receiver_id_aqui
VITE_KHIPU_SECRET=tu_secret_aqui
```

### PASO 2: Verificar que Supabase CLI está instalado
```powershell
supabase --version
```

Si no está instalado:
```powershell
# Instalar Supabase CLI
npm install -g supabase
```

### PASO 3: Login en Supabase
```powershell
supabase login
```

### PASO 4: Enlazar proyecto (si no está enlazado)
```powershell
# Ejecutar en la raíz del proyecto
supabase link --project-ref tu-project-ref
```

### PASO 5: Desplegar funciones Edge
```powershell
# Cambiar al directorio del proyecto
cd c:\Users\klaus\OneDrive\Documentos\sellsi\sellsi

# Desplegar todas las funciones de Khipu
supabase functions deploy create-khipu-payment
supabase functions deploy verify-khipu-payment  
supabase functions deploy process-khipu-webhook
```

### PASO 6: Verificar despliegue
```powershell
supabase functions list
```

### PASO 7: Probar en desarrollo
```powershell
npm run dev
```

---

## 🔑 OBTENER CREDENCIALES DE KHIPU

### 1. Crear cuenta Khipu
1. Ir a https://khipu.com
2. Crear cuenta de cobro
3. Completar verificación de comercio
4. Seleccionar plan de cobro

### 2. Obtener API Keys  
1. Ingresar al panel de Khipu
2. Ir a "Opciones de la cuenta"
3. Buscar sección "Para integrar Khipu a tu sitio Web"
4. Copiar:
   - **Receiver ID** → Usar en `VITE_KHIPU_RECEIVER_ID`
   - **Secret Key** → Usar en `VITE_KHIPU_SECRET`

---

## 🧪 TESTING DESPUÉS DE CONFIGURACIÓN

### Test 1: Verificar variables de entorno
```javascript
// Abrir DevTools en browser y ejecutar:
console.log(import.meta.env.VITE_KHIPU_RECEIVER_ID)
console.log(import.meta.env.VITE_KHIPU_SECRET)
// Deben mostrar tus credenciales (no undefined)
```

### Test 2: Verificar funciones Edge
1. Ir a https://app.supabase.com
2. Seleccionar proyecto
3. Edge Functions
4. Verificar que aparecen:
   - create-khipu-payment
   - verify-khipu-payment
   - process-khipu-webhook

### Test 3: Probar flujo completo
1. `npm run dev`
2. Ir a checkout
3. Seleccionar Khipu
4. Verificar redirección a Khipu (simulador en desarrollo)

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "Command 'supabase' not found"
```powershell
npm install -g supabase
```

### Error: "Not linked to any remote project"
```powershell
supabase link --project-ref tu-project-ref
```

### Error: "Quota exceeded"
1. Ir a https://app.supabase.com
2. Tu proyecto → Settings → Billing
3. Upgrade plan o esperar reset mensual

### Error: "Credenciales no configuradas"
1. Verificar que `.env.local` existe
2. Verificar que las variables tienen valores reales (no "tu_receiver_id_aqui")
3. Reiniciar servidor de desarrollo

### Error: "Function deployment failed"
```powershell
# Verificar login
supabase auth
# Re-enlazar proyecto  
supabase link --project-ref tu-project-ref
# Intentar deploy nuevamente
```

---

## 📊 VERIFICACIÓN FINAL

### Checklist antes de marcar como completo:
- [ ] `.env.local` creado con credenciales reales
- [ ] Funciones Edge desplegadas en Supabase
- [ ] `npm run dev` ejecutándose sin errores
- [ ] Checkout redirect a Khipu funciona
- [ ] Páginas success/cancel accesibles

### URLs a verificar después del deploy:
- ✅ `http://localhost:5173/checkout/payment` - Selección Khipu
- ✅ `http://localhost:5173/checkout/success` - Página éxito
- ✅ `http://localhost:5173/checkout/cancel` - Página cancelación

---

## 💡 CONFIGURACIÓN PRODUCCIÓN (POSTERIOR)

Cuando estés listo para producción:

### 1. Actualizar variables de entorno
```bash
VITE_APP_URL=https://tu-dominio-real.com
# Usar credenciales de producción de Khipu
```

### 2. Configurar URLs en panel Khipu
- **URL de notificación**: `https://tu-dominio.com/api/webhooks/khipu-confirmation`
- **URL de retorno**: `https://tu-dominio.com/checkout/success`  
- **URL de cancelación**: `https://tu-dominio.com/checkout/cancel`

### 3. Deploy a producción
```powershell
npm run build
# Deploy según tu plataforma (Vercel, Netlify, etc.)
```

---

## 🎉 ¡LISTO!

Una vez ejecutados estos comandos, Khipu estará 100% funcional en Sellsi.

Los usuarios podrán:
1. Seleccionar Khipu como método de pago
2. Ser redirigidos a la pasarela de Khipu
3. Completar el pago con transferencia bancaria
4. Regresar automáticamente a Sellsi
5. Ver confirmación de pago exitoso
