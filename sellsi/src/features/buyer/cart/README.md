# Carrito de Compras - Módulo Buyer/Cart

## 1. Resumen funcional del módulo
Este módulo gestiona la experiencia completa del carrito de compras para el usuario comprador en Sellsi. Resuelve la visualización, edición y resumen de productos seleccionados, cálculo de precios, descuentos, opciones de envío, wishlist y estado del carrito. Utiliza arquitectura basada en componentes React, con patrones de composición, props y comunicación por callbacks. El flujo de datos se basa en props y estados locales, permitiendo una experiencia interactiva y modular.

**Casos de uso principales:**
- Visualizar productos en el carrito
- Editar cantidades y eliminar productos
- Aplicar descuentos y cupones
- Calcular y mostrar precios, ahorros y envío
- Gestionar wishlist y estado de carrito vacío
- Mostrar resumen y opciones de compra

**Flujo simplificado:**
CartHeader → CartItem(s) → PriceBreakdown/SavingsCalculator → ShippingOptions/ShippingProgressBar → WishlistSection/EmptyCartState → OrderSummary

## 2. Listado de archivos
| Archivo                | Tipo        | Descripción                                      | Responsabilidad principal                  |
|------------------------|------------|--------------------------------------------------|--------------------------------------------|
| CartHeader.jsx         | Componente | Encabezado del carrito, estadísticas y controles  | Mostrar stats, deshacer/rehacer, acciones  |
| CartItem.jsx           | Componente | Producto individual en el carrito                 | Editar cantidad, eliminar, favoritos       |
| DiscountSection.jsx    | Componente | Gestión de cupones y descuentos                   | Aplicar/quitar cupones (actualmente oculto)|
| EmptyCartState.jsx     | Componente | Estado visual cuando el carrito está vacío        | Mensaje y acceso a wishlist                |
| OrderSummary.jsx       | Componente | Resumen final de la orden                        | Mostrar breakdown, cupones, total, pagar   |
| PriceBreakdown.jsx     | Componente | Desglose de precios y descuentos                  | Mostrar subtotal, descuentos, envío, total |
| SavingsCalculator.jsx  | Componente | Resumen de ahorros obtenidos                     | Mostrar ahorro por descuentos              |
| ShippingOptions.jsx    | Componente | Opciones de envío y fechas                       | Selección y visualización de envío         |
| ShippingProgressBar.jsx| Componente | Barra de progreso hacia envío gratis              | Mostrar cuánto falta para envío gratis     |
| WishlistSection.jsx    | Componente | Gestión de productos favoritos/wishlist           | Mover a carrito, eliminar de wishlist      |
| index.js               | Exportador  | Exporta todos los componentes del módulo          | Reexportar componentes para uso externo    |

## 3. Relaciones internas del módulo
```
OrderSummary
├── PriceBreakdown
├── DiscountSection
├── ShippingOptions
├── SavingsCalculator
├── ShippingProgressBar
├── EmptyCartState
└── WishlistSection

CartHeader
├── CartItem (múltiples)
```
- Comunicación principal por props y callbacks
- Los componentes se renderizan unos a otros según el estado del carrito
- Uso de contexto mínimo, preferencia por composición

## 4. Props de los componentes principales
### CartHeader
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| cartStats    | Object   | Sí        | Estadísticas del carrito (items, valor, etc)|
| formatPrice  | Function | Sí        | Formatea precios para mostrar               |
| discount     | Number   | No        | Descuento total aplicado                    |
| onUndo       | Function | No        | Acción para deshacer última operación       |

### CartItem
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| product      | Object   | Sí        | Datos del producto                          |
| quantity     | Number   | Sí        | Cantidad seleccionada                       |
| onChangeQty  | Function | No        | Callback para cambiar cantidad              |
| onRemove     | Function | No        | Eliminar producto del carrito               |
| ...otros     | ...      | ...       | Props para favoritos, imagen, etc           |

### PriceBreakdown
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| subtotal     | Number   | Sí        | Subtotal de productos                       |
| discount     | Number   | No        | Descuento aplicado                          |
| shippingCost | Number   | Sí        | Costo de envío                              |
| total        | Number   | Sí        | Total final                                 |
| formatPrice  | Function | Sí        | Formatea precios                            |
| cartStats    | Object   | Sí        | Estadísticas del carrito                    |

### SavingsCalculator
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| subtotal     | Number   | Sí        | Subtotal antes de descuentos                |
| discount     | Number   | No        | Descuento aplicado                          |
| total        | Number   | Sí        | Total final                                 |
| formatPrice  | Function | Sí        | Formatea precios                            |

### ShippingOptions
| Prop             | Tipo     | Requerido | Descripción                                 |
|------------------|----------|-----------|---------------------------------------------|
| selectedShipping | String   | Sí        | Opción de envío seleccionada                |
| onShippingChange | Function | Sí        | Callback para cambiar opción de envío       |
| shippingOptions  | Array    | Sí        | Opciones disponibles de envío               |
| formatPrice      | Function | Sí        | Formatea precios                            |
| deliveryDate     | String   | No        | Fecha estimada de entrega                   |
| formatDate       | Function | No        | Formatea fecha de entrega                   |

### WishlistSection
| Prop              | Tipo     | Requerido | Descripción                                 |
|-------------------|----------|-----------|---------------------------------------------|
| showWishlist      | Boolean  | Sí        | Si mostrar la wishlist                      |
| wishlist          | Array    | Sí        | Productos en wishlist                       |
| formatPrice       | Function | Sí        | Formatea precios                            |
| moveToCart        | Function | No        | Mueve producto a carrito                    |
| removeFromWishlist| Function | No        | Elimina producto de wishlist                |

### EmptyCartState
| Prop           | Tipo     | Requerido | Descripción                                 |
|----------------|----------|-----------|---------------------------------------------|
| wishlist       | Array    | No        | Productos en wishlist                       |
| setShowWishlist| Function | No        | Muestra la wishlist                         |

---
## 5. Hooks personalizados
### `useShippingValidation(cartItems, isAdvancedMode)`

**Propósito:**
Valida la compatibilidad de despacho entre productos del carrito y la región del usuario, permitiendo lógica avanzada de validación y control de estados de envío.

**Estados y efectos principales:**
- `userRegion`: Región del usuario obtenida del perfil
- `shippingStates`: Estado de despacho por producto
- `isLoading`, `error`: Estados de carga y error
- `incompatibleProducts`: Productos no compatibles con la región
- Efectos para cargar perfil, revalidar productos y escuchar cambios de sesión

**API que expone:**
- `validateProductShipping(product, userRegion)`: Valida un producto específico
- `isCartCompatible`: Si el carrito es compatible con la región
- `isShippingInfoComplete()`: Verifica si el usuario completó su info de envío
- `revalidate()`: Revalida todos los productos
- `refreshUserProfile()`: Recarga el perfil del usuario
- `getUserRegionName(regionValue)`: Convierte valor de región a nombre legible
- `SHIPPING_STATES`: Estados posibles de despacho

**Ejemplo de uso básico:**
```jsx
import { useShippingValidation } from './hooks/useShippingValidation';
const {
  shippingStates,
  isCartCompatible,
  revalidate,
} = useShippingValidation(cartItems, true);
```

## 6. Dependencias principales
| Dependencia      | Versión   | Propósito                        | Impacto                |
|------------------|-----------|----------------------------------|------------------------|
| `react`          | ^18.x     | UI y estado                      | Base de componentes    |
| `@mui/material`  | ^5.x      | Componentes visuales             | UI moderna             |
| `framer-motion`  | ^7.x      | Animaciones                      | UX animado             |
| `react-router-dom`| ^6.x     | Navegación SPA                   | Routing                |
| `@mui/icons-material` | ^5.x | Iconos                           | UI visual              |
| `localStorage`   | nativo    | Persistencia de usuario          | Estado sesión          |
| Servicios internos| -         | API de usuario, utilidades       | Funcionalidad común    |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- La validación avanzada depende de la información de perfil del usuario
- Si el producto no tiene regiones de despacho, se muestra advertencia
- El hook de validación puede requerir actualización si cambia el modelo de datos

### Deuda técnica relevante:
- [ALTA] Unificación de formatos de regiones de despacho en productos
- [MEDIA] Mejorar manejo de errores y mensajes al usuario

## 8. Puntos de extensión
- Todos los componentes son reutilizables y exportados vía `index.js`
- El hook `useShippingValidation` puede extenderse para nuevas reglas de negocio
- Interfaces públicas: props de componentes y API del hook
- Para extender, crea nuevos componentes y agrégalos al exportador

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { CartHeader, CartItem, PriceBreakdown } from './cart';

function MiCarrito({ items, stats }) {
  return (
    <>
      <CartHeader cartStats={stats} />
      {items.map(item => (
        <CartItem key={item.id} product={item} />
      ))}
      <PriceBreakdown subtotal={10000} total={12000} />
    </>
  );
}
```

### Ejemplo avanzado con hook:
```jsx
import { OrderSummary, useShippingValidation } from './cart';

function Checkout({ cartItems }) {
  const {
    shippingStates,
    isCartCompatible,
    revalidate,
  } = useShippingValidation(cartItems, true);

  useEffect(() => {
    revalidate();
  }, [cartItems]);

  return (
    <OrderSummary
      cartStats={{ totalQuantity: cartItems.length }}
      shippingValidation={shippingStates}
      isAdvancedShippingMode={true}
    />
  );
}
```

## 10. Rendimiento y optimización
- Uso intensivo de `useMemo` y `useCallback` para evitar renders innecesarios
- Componentes desacoplados y memoizables
- Animaciones con `framer-motion` para UX fluida
- Carga de datos y validaciones asíncronas
- Áreas de mejora: code splitting, lazy loading de componentes secundarios

## 11. Actualización
- Última actualización: '2025-07-18'
