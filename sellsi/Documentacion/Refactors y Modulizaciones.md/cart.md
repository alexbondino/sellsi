# Plan de Refactor: Cart Store

## ⚠️ REGLAS CRÍTICAS

**NO DEBO AGREGAR NINGUNA FUNCIÓN NUEVA NI MEJORAR NADA SOLO ME TENGO QUE CENTRAR EN REFACTORIZAR LO QUE YA EXISTE**

**NO DEBO AGREGAR NINGUNA FUNCIÓN NUEVA NI MEJORAR NADA SOLO ME TENGO QUE CENTRAR EN REFACTORIZAR LO QUE YA EXISTE**

**NO DEBO AGREGAR NINGUNA FUNCIÓN NUEVA NI MEJORAR NADA SOLO ME TENGO QUE CENTRAR EN REFACTORIZAR LO QUE YA EXISTE**

## Análisis del archivo actual: cartStore.js

**Tamaño**: 998 líneas
**Ubicación**: `src/features/buyer/hooks/cartStore.js`
**Problema**: Store monolítico con múltiples responsabilidades

### Funciones existentes que DEBO mantener exactamente iguales:

1. **Estado principal**
   - items: []
   - isLoading
   - error
   - isBackendSynced
   - cartId
   - userId
   - lastModified

2. **Operaciones básicas**
   - addItem()
   - updateQuantity()
   - removeItem()
   - clearCart()
   - setItems()

3. **Cálculos**
   - getSubtotal()
   - getTotal()
   - getDiscount()
   - getShippingCost()
   - getItemCount()

4. **Backend sync**
   - initializeWithUser()
   - syncToBackend()
   - addItemWithBackend()
   - updateQuantityWithBackend()
   - removeItemWithBackend()
   - clearCartWithBackend()

5. **Persistencia**
   - saveToLocal()
   - loadFromLocal()
   - clearLocal()

6. **Delegación a módulos**
   - Usa: useCartHistory, useWishlist, useCoupons, useShipping

## Plan de Refactor

### Fase 1: Extraer Constantes
- Crear `cartStore.constants.js` con configuraciones
- Mover CART_CONFIG, VERSION, STORAGE_KEY

### Fase 2: Extraer Helpers  
- Crear `cartStore.helpers.js` con funciones puras
- Mover validateCartQuantity, prepareCartItem, cleanLocalCartItems

### Fase 3: Extraer Cálculos
- Crear `cartStore.calculations.js` con lógica de cálculos
- Mover getSubtotal, getTotal, getDiscount, etc.

### Fase 4: Extraer Operaciones Locales
- Crear `cartStore.local.js` con operaciones sin backend
- Mover addItem local, updateQuantity local, etc.

### Fase 5: Extraer Operaciones Backend
- Crear `cartStore.backend.js` con operaciones de sync
- Mover initializeWithUser, syncToBackend, etc.

### Fase 6: Crear Core Store
- Crear `cartStore.core.js` con estado y operaciones básicas
- Solo estado principal y setters simples

### Fase 7: Crear Facade
- Crear `cartStore.facade.js` que une todos los módulos
- Mantiene la misma API externa

## Resultado Final

```
hooks/
├── cartStore.js           # Punto de entrada (mantiene misma API)
├── cartStore.constants.js # Configuraciones
├── cartStore.helpers.js   # Funciones puras
├── cartStore.calculations.js # Lógica de cálculos
├── cartStore.local.js     # Operaciones locales
├── cartStore.backend.js   # Operaciones backend
├── cartStore.core.js      # Estado principal
└── cartStore.facade.js    # Compositor
```

**IMPORTANTE**: El archivo original `cartStore.js` se mantendrá como punto de entrada y exportará exactamente la misma API que antes.
