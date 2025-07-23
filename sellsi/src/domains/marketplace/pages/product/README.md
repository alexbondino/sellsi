# Módulo: product

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Proporciona componentes especializados para visualización y manipulación de información de productos individuales en el marketplace, incluyendo precios, stock, acciones y datos básicos.
- **Arquitectura de alto nivel:** Conjunto de componentes atómicos y modulares que siguen principios de responsabilidad única, cada uno enfocado en un aspecto específico de la presentación de productos.
- **Función y casos de uso principales:** Renderizar información de productos en tarjetas, listas y vistas detalladas, con componentes reutilizables para precios, stock, acciones y metadatos.
- **Flujo de datos/información simplificado:**
  ```
  Producto (props) → Componentes especializados → UI renderizada
        ↓                    ↓                        ↓
  Callbacks ← Acciones usuario ← Eventos de interacción
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| ProductInfo.jsx | Componente | Información básica del producto (nombre, proveedor, categoría) | Presentación de metadatos principales |
| PriceDisplay.jsx | Componente | Visualización de precios con descuentos y ahorros | Lógica de presentación de precios |
| StockIndicator.jsx | Componente | Indicador visual de disponibilidad de stock | Estado y cantidad de inventario |
| ActionButtons.jsx | Componente | Conjunto de acciones rápidas (carrito, wishlist, compartir) | Interacciones principales del usuario |
| index.js | Barrel | Exportación centralizada de componentes | Punto de entrada unificado |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
ProductCard/ProductView (Parent)
├── ProductInfo.jsx (metadatos)
├── PriceDisplay.jsx (precios)
├── StockIndicator.jsx (disponibilidad)
└── ActionButtons.jsx (acciones)
```

**Patrones de comunicación:**
- **Atomic design**: Componentes pequeños y reutilizables
- **Props interface**: Datos fluyen via props desde containers
- **Callback pattern**: Acciones se propagan via callbacks
- **Composition pattern**: Componentes se componen en vistas más complejas
├── ProductInfo
├── PriceDisplay
├── StockIndicator
## 4. Props de los componentes
### ProductInfo
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `product` | `object` | Sí | Datos del producto: `{nombre, proveedor, categoria, rating, ...}` |
| `compact` | `boolean` | No | Versión compacta del componente |

### PriceDisplay  
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `price` | `number` | Sí | Precio actual del producto |
| `originalPrice` | `number` | No | Precio original para mostrar descuento |
| `currency` | `string` | No | Código de moneda (default: 'CLP') |
| `size` | `string` | No | Tamaño de display: 'small', 'medium', 'large' |

### StockIndicator
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `stock` | `number` | Sí | Cantidad en inventario |
| `showQuantity` | `boolean` | No | Si mostrar cantidad exacta o solo estado |
| `threshold` | `number` | No | Umbral para stock bajo (default: 10) |
| Prop            | Tipo     | Requerido | Descripción                                 |
|-----------------|----------|-----------|---------------------------------------------|
| stock           | number   | Sí        | Stock actual                                |
| maxStock        | number   | Sí        | Stock máximo                                |
| showProgressBar | boolean  | No        | Mostrar barra de progreso                   |
| showLabel       | boolean  | No        | Mostrar etiqueta de texto                   |

### ActionButtons
### ActionButtons
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `onAddToCart` | `function` | No | Callback para agregar al carrito |
| `onWishlist` | `function` | No | Callback para agregar/quitar de wishlist |
| `onShare` | `function` | No | Callback para compartir producto |
| `isInWishlist` | `boolean` | No | Estado actual de wishlist |
| `disabled` | `boolean` | No | Deshabilitar todas las acciones |

**Notas importantes:** Todos los componentes son puramente presentacionales sin estado interno.

## 5. Hooks personalizados
Este módulo no define hooks personalizados, utiliza hooks estándar de React.

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| `@mui/material` | >=5 | Componentes UI y theming | Alto - Interfaz visual completa |
| `@mui/icons-material` | >=5 | Iconografía consistente | Medio - Elementos visuales |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Componentes puros**: Sin estado interno, dependientes de props
- **No validación**: Props sin validación de tipos (considerar TypeScript)
- **Coupling con Material-UI**: Fuertemente acoplado al design system

### Deuda técnica relevante:
- **[BAJA]** Migrar QuantitySelector obsoleto
- **[BAJA]** Agregar prop-types para validación
- **[BAJA]** Mejorar accessibility en botones de acción

## 8. Puntos de extensión
- **Atomic design**: Componentes reutilizables en cualquier contexto
- **Composition friendly**: Fácil composición en layouts complejos
- **Props extensibles**: Permite customización sin breaking changes
- **Barrel exports**: Importación granular según necesidades

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { ProductInfo, PriceDisplay, StockIndicator } from 'src/features/marketplace/product';

function ProductCard({ product }) {
  return (
    <div>
      <ProductInfo product={product} />
      <PriceDisplay 
        price={product.precio} 
        originalPrice={product.precioOriginal} 
      />
      <StockIndicator stock={product.stock} />
    </div>
  );
}
```

### Ejemplo más completo:
```jsx
import { ProductInfo, PriceDisplay, ActionButtons } from 'src/features/marketplace/product';
import { useCart, useWishlist } from 'src/hooks';

function InteractiveProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  
  return (
    <Card>
      <ProductInfo product={product} compact />
      <PriceDisplay 
        price={product.precio}
        originalPrice={product.precioOriginal}
        size="large"
      />
      <ActionButtons
        onAddToCart={() => addToCart(product)}
        onWishlist={() => toggle(product.id)}
        isInWishlist={isInWishlist(product.id)}
        onShare={() => navigator.share({ url: product.url })}
      />
    </Card>
  );
}
```

## 10. Rendimiento y optimización
- **React.memo**: Componentes automáticamente memoizados
- **Props mínimas**: Interfaz simple reduce re-renders
- **No side effects**: Componentes predictibles y eficientes
- **Optimizaciones pendientes**: Bundle splitting por uso, lazy loading de iconos

## 11. Actualización
- **Última actualización:** 18/07/2025
