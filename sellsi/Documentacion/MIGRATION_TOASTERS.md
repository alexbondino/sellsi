# 🎯 GUÍA DE MIGRACIÓN: Sistema Unificado de Toasters

## 📋 **Resumen**
Esta guía explica cómo migrar todos los toasters de la aplicación al nuevo sistema estandarizado ubicado en `/src/utils/toastHelpers.js`.

## 🔧 **Importaciones**

### ❌ **Antes (inconsistente):**
```javascript
import { toast } from 'react-hot-toast';

// Diferentes estilos por archivo
toast.success('Mensaje', { icon: '✅' });
toast.error('Error', { style: { background: '#333', color: '#fff' } });
toast('Info', { icon: '❤️', duration: 3000 });
```

### ✅ **Después (estandarizado):**
```javascript
import { 
  showSuccessToast,
  showErrorToast,
  showValidationError,
  showCartSuccess,
  showProductSuccess,
  // ... otros helpers según necesidad
} from '../utils/toastHelpers';

showSuccessToast('Mensaje');
showErrorToast('Error');
showCartSuccess('Producto agregado al carrito');
```

## 🔄 **Mapeo de Migraciones**

### **Toasts Genéricos**
```javascript
// ❌ Antes
toast.success('Mensaje')
toast.error('Error')
toast.loading('Cargando...')
toast('Info')

// ✅ Después
showSuccessToast('Mensaje')
showErrorToast('Error')
showSaveLoading('Cargando...')
showInfoToast('Info')
```

### **Toasts con Iconos Personalizados**
```javascript
// ❌ Antes
toast.success('Eliminado', { icon: '🗑️' })
toast.error('Error', { icon: '❌' })

// ✅ Después
showSuccessToast('Eliminado', { icon: '🗑️' })
showErrorToast('Error', { icon: '❌' })
```

### **Toasts Específicos de Dominio**
```javascript
// ❌ Antes
toast.success(`${item.name} agregado al carrito`, { icon: '🛒' })
toast.success(`${product.name} agregado a favoritos`, { icon: '❤️' })

// ✅ Después
showCartSuccess(`${item.name} agregado al carrito`)
showWishlistSuccess(`${product.name} agregado a favoritos`)
```

### **Toasts de Loading con Reemplazo**
```javascript
// ❌ Antes
toast.loading('Guardando...', { id: 'save' });
// ... lógica
toast.success('Guardado!', { id: 'save' });

// ✅ Después
showSaveLoading('Guardando...', 'save');
// ... lógica
replaceLoadingWithSuccess('save', 'Guardado!');
```

## 📁 **Archivos que Requieren Migración**

### **Prioridad Alta:**
1. `/src/domains/buyer/BuyerCart.jsx` - Múltiples estilos inconsistentes
2. `/src/shared/stores/cart/useWishlist.js` - Iconos personalizados
3. `/src/domains/supplier/pages/my-products/MyProducts.jsx` - Mensajes básicos
4. `/src/shared/stores/cart/cartStore.facade.js` - Iconos temáticos

### **Prioridad Media:**
5. `/src/domains/ProductPageView/components/PurchaseActions.jsx`
6. `/src/domains/checkout/pages/PaymentMethod.jsx`
7. `/src/shared/stores/cart/useShipping.js`

## 🎨 **Ejemplos de Migración Específicos**

### **BuyerCart.jsx - CustomToast Component**
```javascript
// ❌ Eliminar este componente
const CustomToast = ({ message, type, duration = 3000 }) => {
  // ... código personalizado
};

// ✅ Reemplazar con helpers
import { showCartSuccess, showCartError } from '../utils/toastHelpers';
```

### **useWishlist.js - Iconos Consistentes**
```javascript
// ❌ Antes
toast.success(`${product.name} agregado a favoritos`, { icon: '❤️' })
toast.info(`${product.name} ya está en favoritos`, { icon: '💔' })

// ✅ Después  
showWishlistSuccess(`${product.name} agregado a favoritos`)
showWishlistInfo(`${product.name} ya está en favoritos`)
```

### **cartStore.facade.js - Iconos Temáticos**
```javascript
// ❌ Antes
toast.success('Carrito limpiado', { icon: '🧹' })
toast.success(result.message, { icon: '🎟️' })
toast.success(result.message, { icon: '🚚' })

// ✅ Después
showCartSuccess('Carrito limpiado', '🧹')
showSuccessToast(result.message, { icon: '🎟️' })
showSuccessToast(result.message, { icon: '🚚' })
```

## ✅ **Checklist de Migración**

- [ ] **Importar helpers** en lugar de `toast` directo
- [ ] **Reemplazar calls** con funciones equivalentes
- [ ] **Eliminar estilos personalizados** inconsistentes
- [ ] **Usar helpers específicos** (cart, product, wishlist, etc.)
- [ ] **Testear visualmente** que los toasts se vean consistentes
- [ ] **Verificar posición** (esquina superior derecha)
- [ ] **Confirmar funcionalidad** del botón cerrar (X)

## 🎯 **Resultado Final**

✅ **Consistencia visual** en toda la aplicación
✅ **Posición unificada** (esquina superior derecha)  
✅ **Colores estandarizados** por tipo de mensaje
✅ **Botón cerrar funcional** en todos los toasts
✅ **Duración apropiada** según tipo de mensaje
✅ **Iconos coherentes** con la temática de cada dominio
✅ **Mantenimiento simplificado** con un solo punto de configuración

## 🚀 **Próximos Pasos**

1. **Migrar archivos de prioridad alta** primero
2. **Testear cada migración** individualmente  
3. **Documentar cambios** en PRs específicos
4. **Validar UX** con usuarios finales
5. **Eliminar código legacy** una vez confirmado el funcionamiento
