# 🛒 Solución de Problemas del Carrito

## Problema Detectado

Se ha detectado un problema donde cantidades muy grandes (como `2505744634`) causan errores en la base de datos. Esto puede ocurrir por:

- Datos corruptos en el navegador
- Errores de entrada de usuario
- Problemas de sincronización

## ✅ Soluciones Implementadas

### 1. Validación Automática
- Todas las cantidades se validan automáticamente
- Límite máximo: 15,000 unidades por producto
- Límite mínimo: 1 unidad (o mínimo de compra del producto)

### 2. Limpieza Automática
- El carrito se limpia automáticamente al detectar datos corruptos
- Los productos con cantidades inválidas se corrigen o remueven
- Se muestran notificaciones al usuario cuando ocurre

### 3. Herramientas de Emergencia
En casos extremos, puedes usar las herramientas de emergencia:

#### Abrir la Consola del Navegador
1. Presiona `F12` (o `Ctrl+Shift+I` en Windows/Linux, `Cmd+Option+I` en Mac)
2. Ve a la pestaña **Console**

#### Comandos Disponibles

```javascript
// Ver el estado actual del carrito
window.sellsiEmergencyTools.validateCurrentCart()

// Intentar reparar cantidades corruptas
window.sellsiEmergencyTools.fixCorruptedQuantities()

// LIMPIEZA COMPLETA (elimina todo el carrito)
window.sellsiEmergencyTools.clearAllCartData()

// Ver ayuda
window.sellsiEmergencyTools.help()
```

## 🚨 Para Casos de Emergencia

### Si el carrito sigue sin funcionar:

1. **Opción 1: Reparación Automática**
   ```javascript
   window.sellsiEmergencyTools.fixCorruptedQuantities()
   ```

2. **Opción 2: Limpieza Completa**
   ```javascript
   window.sellsiEmergencyTools.clearAllCartData()
   ```
   ⚠️ **Esto eliminará todos los productos del carrito**

3. **Opción 3: Manual**
   - Ve a la configuración del navegador
   - Busca "Almacenamiento" o "Storage"
   - Elimina los datos del sitio web
   - Recarga la página

## 📞 Soporte

Si el problema persiste después de intentar estas soluciones:

1. Toma una captura de pantalla del error en la consola
2. Anota los pasos que causaron el problema
3. Contacta al equipo de soporte técnico

## 🔧 Para Desarrolladores

### Archivos Modificados
- `src/services/cartService.js` - Validaciones de backend
- `src/features/buyer/hooks/cartStore.js` - Validaciones de frontend
- `src/utils/quantityValidation.js` - Utilidades de validación
- `src/utils/cartEmergencyTools.js` - Herramientas de emergencia

### Límites Implementados
- Cantidad mínima: 1
- Cantidad máxima: 15,000
- Validación en múltiples capas
- Limpieza automática de datos corruptos

### Logs de Depuración
Los logs aparecen con prefijos:
- `[CartService]` - Operaciones de backend
- `[cartStore]` - Operaciones de frontend
- `[quantityValidation]` - Validaciones de cantidad
