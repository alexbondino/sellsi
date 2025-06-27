# Buyer Module (`src/features/buyer`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

El módulo **Buyer** es el núcleo de toda la experiencia de compra en la plataforma Sellsi. Su objetivo es centralizar y orquestar la lógica, componentes visuales y hooks necesarios para que un usuario pueda navegar, comprar, gestionar pedidos, revisar su historial, analizar su rendimiento y personalizar su experiencia de compra. Este módulo resuelve el problema de la dispersión de la lógica de usuario comprador, permitiendo un desarrollo más mantenible, escalable y reutilizable. Además, abstrae la complejidad de la gestión de carrito, wishlist, cupones, envíos y performance, facilitando la integración con servicios externos y la extensión futura.

## Listado de archivos principales

| Archivo                  | Tipo         | Descripción breve                                                      |
|------------------------- |-------------|-----------------------------------------------------------------------|
| BuyerCart.jsx            | Componente  | Carrito de compras avanzado, maneja productos, descuentos y envíos.   |
| BuyerOrders.jsx          | Componente  | Muestra el historial de pedidos del comprador.                        |
| BuyerPerformance.jsx     | Componente  | Estadísticas y métricas de compra del usuario.                        |
| BuyerProfile.jsx         | Componente  | Perfil del comprador, datos personales y de envío.                    |
| MarketplaceBuyer.jsx     | Componente  | Vista principal del marketplace para compradores.                     |
| index.js                 | Barrel      | Exporta todos los componentes y hooks del módulo.                     |
| hooks/cartStore.js       | Hook        | Store global del carrito, integra lógica de historial, wishlist, etc. |
| hooks/useWishlist.js     | Hook        | Maneja la lista de deseos del usuario.                                |
| hooks/useShipping.js     | Hook        | Opciones y lógica de envío.                                           |
| hooks/useCoupons.js      | Hook        | Gestión y validación de cupones de descuento.                         |
| hooks/useCartHistory.js  | Hook        | Historial de acciones y undo/redo del carrito.                        |
| hooks/useCartNotifications.js | Hook   | Notificaciones y alertas del carrito.                                 |
| cart/                   | Carpeta     | Componentes reutilizables del carrito (ver tabla abajo).              |

### Componentes de `cart/`

| Archivo                | Tipo        | Descripción breve                                 |
|------------------------|-------------|--------------------------------------------------|
| CartHeader.jsx         | Componente  | Encabezado del carrito, estadísticas y controles. |
| ShippingProgressBar.jsx| Componente  | Barra de progreso de envío.                       |
| CartItem.jsx           | Componente  | Item individual del carrito.                      |
| OrderSummary.jsx       | Componente  | Resumen y checkout del pedido.                    |
| DiscountSection.jsx    | Componente  | Aplicación de cupones de descuento.               |
| ShippingOptions.jsx    | Componente  | Selección de opciones de envío.                   |
| PriceBreakdown.jsx     | Componente  | Detalle de precios y descuentos.                  |
| SavingsCalculator.jsx  | Componente  | Calculadora de ahorros.                           |
| WishlistSection.jsx    | Componente  | Gestión de productos favoritos.                   |
| EmptyCartState.jsx     | Componente  | Estado visual cuando el carrito está vacío.       |

## Relaciones internas del módulo

- `BuyerCart.jsx` importa y utiliza componentes de `cart/` y hooks de `hooks/`.
- `cartStore.js` centraliza el estado y delega a hooks especializados (`useWishlist`, `useShipping`, `useCoupons`, `useCartHistory`).
- `MarketplaceBuyer.jsx` usa hooks y componentes de marketplace y secciones.
- `index.js` exporta todos los componentes y hooks para uso externo.
- Diagrama simplificado:

```
BuyerCart.jsx
├─ cart/CartHeader.jsx
├─ cart/CartItem.jsx
├─ cart/OrderSummary.jsx
├─ cart/ShippingProgressBar.jsx
├─ cart/WishlistSection.jsx
├─ hooks/cartStore.js
│   ├─ useWishlist.js
│   ├─ useShipping.js
│   ├─ useCoupons.js
│   └─ useCartHistory.js
```

## Props de los componentes principales

| Componente         | Prop              | Tipo         | Requerida | Descripción                                      |
|--------------------|-------------------|--------------|-----------|--------------------------------------------------|
| BuyerProfile       | onProfileUpdated  | function     | No        | Callback al actualizar el perfil.                 |
| OrderSummary       | subtotal          | number       | Sí        | Subtotal del carrito.                            |
|                    | discount          | number       | Sí        | Descuento aplicado.                              |
|                    | shippingCost      | number       | Sí        | Costo de envío.                                  |
|                    | total             | number       | Sí        | Total final.                                     |
|                    | onApplyCoupon     | function     | No        | Aplica cupón de descuento.                       |
| CartHeader         | cartStats         | object       | Sí        | Estadísticas del carrito.                        |
|                    | onUndo            | function     | No        | Deshacer última acción.                          |
|                    | onRedo            | function     | No        | Rehacer acción.                                  |
|                    | onClearCart       | function     | No        | Limpiar carrito.                                 |

## Hooks personalizados

### cartStore.js
Store global del carrito, maneja persistencia automática en localStorage, cálculos de totales, validaciones de stock, integración con notificaciones y delega funcionalidades a hooks especializados. Expone funciones como `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `applyCoupon`, `setShippingOption`, entre otras. Es el punto de entrada para cualquier lógica relacionada al carrito.

### useWishlist.js
Permite añadir, eliminar y mover productos en la lista de deseos. Expone funciones como `addToWishlist(product)`, `removeFromWishlist(productId)`. Maneja el estado de la wishlist y notifica al usuario sobre cambios.

### useShipping.js
Gestiona la selección y validación de opciones de envío. Expone funciones como `setShippingOption(optionId)`, `getShippingCost(subtotal)`. Permite calcular costos y validar opciones según el contexto del carrito.

### useCoupons.js
Permite aplicar y validar cupones de descuento. Expone funciones como `applyCoupon(code, subtotal)`, `removeCoupon(code)`. Valida compatibilidad, requisitos mínimos y gestiona el estado de cupones aplicados.

### useCartHistory.js
Maneja el historial de acciones del carrito, permitiendo funcionalidades de undo/redo. Expone funciones como `saveToHistory(currentState, actionType, actionData)`, `undo()`, `redo()`. Permite rastrear y revertir cambios en el carrito.

### useCartNotifications.js
Gestiona notificaciones y alertas relacionadas con el carrito, como advertencias de corrupción de datos, límites de cantidad, errores de carga, etc. Expone funciones como `notifyCartCleaned`, `notifyQuantityLimited`, `notifyCartError`, `resetNotifications`.

## Dependencias externas e internas

- **Externas**: React, Zustand, Material-UI, lodash.debounce, react-hot-toast, framer-motion, Supabase.
- **Internas**: Servicios de `src/services/`, utilidades de `src/utils/`, constantes de marketplace, componentes de UI y layout.
- **Contextos/Providers**: Puede usar contextos globales para autenticación y datos de usuario (ej: Supabase Auth).
- **Importaciones externas**: El módulo importa helpers y servicios de fuera de la carpeta actual, especialmente para lógica de negocio y utilidades.

## Consideraciones técnicas y advertencias

- El store del carrito persiste en localStorage y está preparado para sincronización futura con backend y multi-dispositivo.
- Algunos componentes usan datos mock, pendientes de integración real con Supabase.
- El módulo asume integración con Material-UI y hooks personalizados, por lo que cualquier cambio en estas dependencias puede requerir ajustes.
- La lógica de undo/redo y wishlist está desacoplada para facilitar la extensión y el testing.
- Es importante mantener la coherencia entre los hooks y el store central para evitar bugs difíciles de rastrear.
- Si se modifica la estructura de los productos o el flujo de checkout, revisar las validaciones y persistencia.

## Puntos de extensión o reutilización

- Los componentes de `cart/` y hooks pueden ser reutilizados en otros módulos de compra o adaptados para otros roles de usuario.
- El store y hooks están diseñados para ser extendidos fácilmente (ej: sincronización multi-dispositivo, integración con otros servicios, personalización de lógica de descuentos o envíos).
- El barrel `index.js` permite importar cualquier componente o hook del módulo de forma centralizada y limpia.

## Ejemplos de uso

### Importar y usar componentes principales

```jsx
import { BuyerCart, BuyerOrders, BuyerProfile } from 'src/features/buyer';

<BuyerCart />
<BuyerOrders />
<BuyerProfile onProfileUpdated={handleUpdate} />
```

### Usar el store global del carrito

```js
import useCartStore from 'src/features/buyer/hooks/cartStore';
const { addItem, removeItem, updateQuantity } = useCartStore();
```

### Usar hooks especializados

```js
import useWishlist from 'src/features/buyer/hooks/useWishlist';
const { addToWishlist, removeFromWishlist } = useWishlist();

import useShipping from 'src/features/buyer/hooks/useShipping';
const { setShippingOption, getShippingCost } = useShipping();
```

---

Este README resume la estructura, funcionamiento y consideraciones técnicas del módulo Buyer. Consulta los comentarios en el código y la documentación interna para detalles adicionales. Si tienes dudas, revisa los hooks y el store, ya que son el corazón de la lógica de negocio de este módulo.
