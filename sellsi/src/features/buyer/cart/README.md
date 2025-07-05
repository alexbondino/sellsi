# Cart Submódulo (`src/features/buyer/cart`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

El submódulo **cart** centraliza todos los componentes visuales y lógicos relacionados con el carrito de compras del usuario comprador. Permite visualizar, modificar y gestionar productos, aplicar descuentos, calcular envíos, mostrar estados vacíos y gestionar favoritos, todo con una experiencia visual moderna y optimizada.

- **Problema que resuelve:** Facilita la gestión avanzada del carrito, integración de wishlist, descuentos y opciones de envío, desacoplando la lógica y UI del resto del módulo buyer.
- **Función principal:** Proveer componentes reutilizables y especializados para cada aspecto del carrito, permitiendo una experiencia de compra fluida y personalizable.

## 2. Listado de archivos
| Archivo                | Tipo        | Descripción breve                                 |
|------------------------|-------------|--------------------------------------------------|
| CartHeader.jsx         | Componente  | Encabezado del carrito, estadísticas y controles. |
| CartItem.jsx           | Componente  | Item individual del carrito.                      |
| OrderSummary.jsx       | Componente  | Resumen y checkout del pedido.                    |
| ShippingProgressBar.jsx| Componente  | Barra de progreso de envío.                       |
| WishlistSection.jsx    | Componente  | Gestión de productos favoritos.                   |
| EmptyCartState.jsx     | Componente  | Estado visual cuando el carrito está vacío.       |
| ...otros               | ...         | ...ver estructura de la carpeta                   |

## 3. Relaciones internas del módulo
- `CartHeader` recibe estadísticas y handlers del carrito principal.
- `CartItem` es renderizado por el carrito y recibe props de producto y handlers.
- `OrderSummary` consume datos agregados y callbacks para aplicar cupones y finalizar compra.
- `ShippingProgressBar` se muestra según subtotal y opciones de envío.
- `WishlistSection` y `EmptyCartState` se integran para UX avanzada.

```
CartHeader
├── CartItem (por cada producto)
├── OrderSummary
├── ShippingProgressBar
├── WishlistSection
└── EmptyCartState
```

## 4. Props de los componentes
### CartHeader
| Prop           | Tipo      | Requerido | Descripción                                 |
|----------------|-----------|-----------|---------------------------------------------|
| cartStats      | objeto    | Sí        | Estadísticas del carrito                    |
| formatPrice    | función   | Sí        | Formateo de precios                         |
| discount       | número    | No        | Descuento aplicado                          |
| onUndo         | función   | No        | Deshacer última acción                      |
| onRedo         | función   | No        | Rehacer acción                              |
| onClearCart    | función   | No        | Limpiar carrito                             |
| ...otros       | ...       | ...       | ...ver código para props avanzadas          |

### CartItem
| Prop           | Tipo      | Requerido | Descripción                                 |
|----------------|-----------|-----------|---------------------------------------------|
| product        | objeto    | Sí        | Datos del producto                          |
| onQuantityChange| función  | Sí        | Cambia la cantidad                          |
| onRemove       | función   | Sí        | Elimina el producto                         |
| ...otros       | ...       | ...       | ...ver código para props avanzadas          |

### OrderSummary
| Prop           | Tipo      | Requerido | Descripción                                 |
|----------------|-----------|-----------|---------------------------------------------|
| subtotal       | número    | Sí        | Subtotal del carrito                        |
| discount       | número    | Sí        | Descuento aplicado                          |
| shippingCost   | número    | Sí        | Costo de envío                              |
| total          | número    | Sí        | Total final                                 |
| onApplyCoupon  | función   | No        | Aplica cupón de descuento                   |
| ...otros       | ...       | ...       | ...ver código para props avanzadas          |

### ShippingProgressBar
| Prop           | Tipo      | Requerido | Descripción                                 |
|----------------|-----------|-----------|---------------------------------------------|
| subtotal       | número    | Sí        | Subtotal actual                             |
| formatPrice    | función   | Sí        | Formateo de precios                         |

### WishlistSection
| Prop           | Tipo      | Requerido | Descripción                                 |
|----------------|-----------|-----------|---------------------------------------------|
| showWishlist   | boolean   | Sí        | Si mostrar la wishlist                      |
| wishlist       | array     | Sí        | Productos favoritos                         |
| moveToCart     | función   | Sí        | Mover a carrito                             |
| removeFromWishlist| función| Sí        | Eliminar de favoritos                       |

### EmptyCartState
| Prop           | Tipo      | Requerido | Descripción                                 |
|----------------|-----------|-----------|---------------------------------------------|
| wishlist       | array     | Sí        | Productos favoritos                         |
| setShowWishlist| función   | Sí        | Mostrar wishlist                            |

## 5. Hooks personalizados
Este submódulo no define hooks propios, pero consume hooks globales del módulo buyer (ej: `useCartStore`).

## 6. Dependencias externas e internas
- **Externas:**
  - `@mui/material`, `@mui/icons-material`, `framer-motion`: UI y animaciones.
- **Internas:**
  - `../../layout`, `../../marketplace/*`, hooks y helpers del módulo buyer.

## 7. Consideraciones técnicas y advertencias
- Los componentes están optimizados para renderizado eficiente y UX moderna.
- Props avanzadas permiten integración con lógica de historial, descuentos y selección múltiple.
- Algunos componentes asumen integración con hooks y stores globales.

## 8. Puntos de extensión o reutilización
- Todos los componentes pueden ser reutilizados en otros flujos de compra.
- El diseño de props permite fácil extensión para nuevas funcionalidades.

## 9. Ejemplos de uso

### Usar el encabezado del carrito
```jsx
import CartHeader from './cart/CartHeader';

<CartHeader cartStats={cartStats} formatPrice={formatPrice} onUndo={onUndo} />
```

### Usar un item del carrito
```jsx
import CartItem from './cart/CartItem';

<CartItem product={producto} onQuantityChange={fn} onRemove={fn} />
```

## 10. Rendimiento y optimización
- Componentes desacoplados y memoizados.
- Uso de animaciones y lazy loading donde aplica.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
