# Buyer Hooks (`src/features/buyer/hooks`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

Esta carpeta contiene todos los hooks personalizados que gestionan la lógica avanzada del carrito de compras, wishlist, historial, cupones, notificaciones y opciones de envío para el usuario comprador. Permiten desacoplar la lógica de negocio de los componentes visuales, facilitando la mantenibilidad, extensión y testeo del módulo buyer.

- **Problema que resuelve:** Centraliza y desacopla la lógica de estado y operaciones complejas del flujo de compra, permitiendo componentes más simples y reutilizables.
- **Función principal:** Proveer hooks independientes y especializados para cada aspecto del flujo de compra y carrito.

## 2. Listado de archivos
| Archivo                | Tipo    | Descripción breve                                         |
|------------------------|---------|----------------------------------------------------------|
| cartStore.js           | Hook    | Store global del carrito, integra lógica de historial, wishlist, cupones y envíos. |
| useWishlist.js         | Hook    | Maneja la lista de deseos del usuario.                    |
| useShipping.js         | Hook    | Opciones y lógica de envío.                               |
| useCoupons.js          | Hook    | Gestión y validación de cupones de descuento.             |
| useCartHistory.js      | Hook    | Historial de acciones y undo/redo del carrito.            |
| useCartNotifications.js| Hook    | Notificaciones y alertas del carrito.                     |

## 3. Relaciones internas del módulo
- `cartStore.js` centraliza el estado y delega a hooks especializados (`useWishlist`, `useShipping`, `useCoupons`, `useCartHistory`).
- Los hooks pueden ser usados de forma independiente o combinados en el store global.

```
cartStore.js
├─ useWishlist.js
├─ useShipping.js
├─ useCoupons.js
└─ useCartHistory.js
```

## 4. API y props principales de los hooks

### cartStore.js
- **Estados:** items, total, subtotal, descuentos, historial, wishlist, shipping, etc.
- **Funciones:** addItem, removeItem, updateQuantity, clearCart, applyCoupon, setShippingOption, undo, redo, etc.

### useWishlist.js
- **Estados:** wishlist (array de productos)
- **Funciones:** addToWishlist(product), removeFromWishlist(productId), moveToCart(productId)

### useShipping.js
- **Estados:** selectedShipping
- **Funciones:** setShippingOption(optionId), getShippingCost(subtotal)

### useCoupons.js
- **Estados:** appliedCoupons, couponInput
- **Funciones:** applyCoupon(code, subtotal), removeCoupon(code), isCouponCompatible(coupon)

### useCartHistory.js
- **Estados:** history, historyIndex
- **Funciones:** saveToHistory(currentState, actionType, actionData), undo(), redo()

### useCartNotifications.js
- **Funciones:** notifyCartCleaned(summary), notifyQuantityLimited(productName, oldQuantity, newQuantity), notifyCartError(error), resetNotifications()

## 5. Hooks personalizados
Todos los archivos de la carpeta son hooks personalizados, diseñados para ser usados en componentes del módulo buyer o en otros módulos de compra.

## 6. Dependencias externas e internas
- **Externas:**
  - `zustand`, `react-hot-toast`, `lodash.debounce`.
- **Internas:**
  - Utilidades de `../../utils/`, servicios de `../../services/`, constantes de marketplace.

## 7. Consideraciones técnicas y advertencias
- El store del carrito persiste en localStorage y está preparado para sincronización futura con backend.
- Los hooks están desacoplados para facilitar extensión y testing.
- Cambios en la estructura de productos o lógica de negocio pueden requerir ajustes en varios hooks.

## 8. Puntos de extensión o reutilización
- Los hooks pueden ser reutilizados en otros módulos de compra o adaptados para otros roles de usuario.
- El diseño modular permite agregar nuevas funcionalidades (ej: sincronización multi-dispositivo) sin romper la API existente.

## 9. Ejemplos de uso

### Usar el store global del carrito
```js
import useCartStore from './hooks/cartStore';
const { addItem, removeItem, updateQuantity } = useCartStore();
```

### Usar hooks especializados
```js
import useWishlist from './hooks/useWishlist';
const { addToWishlist, removeFromWishlist } = useWishlist();

import useShipping from './hooks/useShipping';
const { setShippingOption, getShippingCost } = useShipping();
```

## 10. Rendimiento y optimización
- Persistencia automática y debounced en localStorage.
- Hooks desacoplados y memoizados para evitar renders innecesarios.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
