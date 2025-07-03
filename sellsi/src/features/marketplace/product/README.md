# Módulo: product

> **Creado:** 03/07/2025  
> **Última actualización:** 03/07/2025

---

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Centraliza la visualización y manipulación de productos en el marketplace de Sellsi, permitiendo mostrar información clave y ejecutar acciones rápidas sobre productos.
- **Arquitectura de alto nivel:** Componentes funcionales React, UI con Material UI, comunicación por props y callbacks, lógica desacoplada.
- **Función y casos de uso principales:** Mostrar información relevante de productos, permitir agregar al carrito, wishlist, compartir, comparar, etc. Usado en páginas de detalle, listados y tarjetas de producto.
- **Flujo de datos/información simplificado:** Los datos de producto llegan por props desde el contenedor/página. Los callbacks de acción se propagan hacia arriba para manejar lógica global (carrito, wishlist, etc.).

---

## 2. Listado de archivos
| Archivo              | Tipo        | Descripción                                      | Responsabilidad principal                  |
|----------------------|-------------|--------------------------------------------------|--------------------------------------------|
| ProductInfo.jsx      | Componente  | Muestra nombre, proveedor, categoría, rating, etc.| Visualización de info básica del producto   |
| PriceDisplay.jsx     | Componente  | Muestra precio, descuentos y ahorro               | Visualización de precios y descuentos      |
| StockIndicator.jsx   | Componente  | Indica estado y cantidad de stock                 | Visualización de disponibilidad de stock   |
| ActionButtons.jsx    | Componente  | Botones de acción: carrito, wishlist, compartir   | Acciones rápidas sobre el producto        |
| index.js             | Barrel      | Exporta todos los componentes del módulo          | Punto de entrada del módulo               |

---

## 3. Relaciones internas del módulo
- **Diagrama de dependencias:**
```
VistaProducto
├── ProductInfo
├── PriceDisplay
├── StockIndicator
├── ActionButtons
```
- **Patrones de comunicación:** props y callbacks, sin contexto global.
- **Relaciones clave:** Los componentes suelen usarse juntos en vistas de producto.

---

## 4. Props de los componentes
### ProductInfo
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| name         | string   | Sí        | Nombre del producto                         |
| supplier     | string   | Sí        | Proveedor                                   |
| category     | string   | Sí        | Categoría                                   |
| rating       | number   | No        | Rating (0-5)                                |
| reviews      | number   | No        | Número de reseñas                           |
| description  | string   | No        | Descripción del producto                    |
| compact      | boolean  | No        | Versión compacta                            |

### PriceDisplay
| Prop          | Tipo      | Requerido | Descripción                                 |
|---------------|-----------|-----------|---------------------------------------------|
| price         | number    | Sí        | Precio actual                               |
| originalPrice | number    | No        | Precio original (para mostrar descuento)    |
| discount      | number    | No        | Porcentaje de descuento                     |
| formatPrice   | function  | No        | Función para formatear el precio            |
| size          | string    | No        | Tamaño ('small', 'medium', 'large')         |
| showDiscount  | boolean   | No        | Mostrar información de descuento            |

### StockIndicator
| Prop            | Tipo     | Requerido | Descripción                                 |
|-----------------|----------|-----------|---------------------------------------------|
| stock           | number   | Sí        | Stock actual                                |
| maxStock        | number   | Sí        | Stock máximo                                |
| showProgressBar | boolean  | No        | Mostrar barra de progreso                   |
| showLabel       | boolean  | No        | Mostrar etiqueta de texto                   |

### ActionButtons
| Prop            | Tipo      | Requerido | Descripción                                 |
|-----------------|-----------|-----------|---------------------------------------------|
| onAddToCart     | function  | Sí        | Callback para agregar al carrito            |
| onToggleWishlist| function  | Sí        | Callback para wishlist                      |
| onShare         | function  | No        | Callback para compartir                     |
| onCompare       | function  | No        | Callback para comparar                      |
| isInWishlist    | boolean   | No        | Si está en wishlist                         |
| isInCart        | boolean   | No        | Si está en carrito                          |
| disabled        | boolean   | No        | Deshabilitar botones                        |
| layout          | string    | No        | Layout visual ('horizontal', 'vertical', etc)|
| variant         | string    | No        | Variante de botón ('contained', 'outlined') |

**Notas importantes:**
- No se exporta `QuantitySelector.jsx` porque está obsoleto y debe migrarse a `/src/components/shared/QuantitySelector.jsx`.

---

## 5. Hooks personalizados
Este módulo no define hooks personalizados propios.

---

## 6. Dependencias principales
| Dependencia           | Versión | Propósito                  | Impacto                |
|----------------------|---------|----------------------------|------------------------|
| `react`              | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`      | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5     | Iconos para UI             | Visualización          |

---

## 7. Consideraciones técnicas
- Arquitectura desacoplada: lógica en props, UI en componentes puros.
- No hay hooks personalizados ni contexto global.
- `QuantitySelector.jsx` está deprecado y debe migrarse.

---

## 8. Puntos de extensión
- Los componentes pueden reutilizarse en otros módulos del marketplace.
- Se pueden extender los componentes agregando props adicionales o integrando nuevos servicios.

---

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { ProductInfo, PriceDisplay, StockIndicator, ActionButtons } from './product';

function EjemploProducto({ producto }) {
  return (
    <div>
      <ProductInfo name={producto.nombre} supplier={producto.proveedor} category={producto.categoria} />
      <PriceDisplay price={producto.precio} originalPrice={producto.precioOriginal} />
      <StockIndicator stock={producto.stock} maxStock={producto.stockMaximo} />
      <ActionButtons onAddToCart={() => {}} onToggleWishlist={() => {}} />
    </div>
  );
}
```

---

## 10. Rendimiento y optimización
- Componentes funcionales y memoización por React.
- Renderizado eficiente por separación de responsabilidades.
- Áreas de mejora: migrar completamente `QuantitySelector` y revisar posibles optimizaciones en renderizados masivos.

---

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
