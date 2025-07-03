# Módulo: ProductPageView

> **Creado:** 03/07/2025  
> **Última actualización:** 03/07/2025

---

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Implementa la ficha técnica y vista detallada de un producto, integrando galería, especificaciones, condiciones de venta, acciones de compra y lógica de precios escalonados.
- **Arquitectura de alto nivel:** Composición de componentes funcionales React, hooks personalizados para lógica de datos, UI desacoplada con Material UI, integración con Supabase y separación de lógica de presentación y negocio.
- **Función y casos de uso principales:** Renderizar la página de producto, mostrar galería de imágenes, características, condiciones de venta, permitir agregar al carrito y mostrar skeleton loaders durante la carga.
- **Flujo de datos/información simplificado:**
  - El wrapper obtiene el producto desde la URL y Supabase.
  - Los datos se pasan por props a los componentes de la vista.
  - Los hooks gestionan la carga, lazy loading de imágenes y tramos de precios.

---

## 2. Listado de archivos
| Archivo                        | Tipo        | Descripción                                         | Responsabilidad principal                  |
|-------------------------------|-------------|-----------------------------------------------------|--------------------------------------------|
| ProductPageView.jsx            | Componente  | Vista principal de detalle de producto              | Orquestar la UI y lógica de la página      |
| ProductPageWrapper.jsx         | Componente  | Wrapper para obtención de datos y navegación        | Fetch de producto y control de navegación  |
| components/ProductHeader.jsx   | Componente  | Encabezado con info principal y acciones            | Mostrar nombre, proveedor, precio, stock   |
| components/ProductImageGallery.jsx | Componente | Galería de imágenes del producto                   | Visualización y zoom de imágenes           |
| components/ProductPageSkeletons.jsx | Componente | Skeleton loaders para UX de carga                  | Feedback visual durante carga              |
| components/PurchaseActions.jsx | Componente  | Acciones de compra y selector de cantidad           | Agregar al carrito, controlar cantidad     |
| components/SaleConditions.jsx  | Componente  | Condiciones de venta (boleta, compra mínima, etc.)  | Mostrar condiciones comerciales            |
| components/SalesCharacteristics.jsx | Componente | Características históricas de ventas               | Mostrar datos históricos                   |
| components/TechnicalSpecifications.jsx | Componente | Especificaciones técnicas del producto             | Mostrar detalles técnicos                  |
| hooks/useLazyImage.js          | Hook        | Lazy loading avanzado de imágenes                   | Optimizar carga de imágenes                |
| hooks/useProductPageData.js    | Hook        | Manejo de datos y skeleton loaders                  | Fetch y estados de producto                |
| hooks/useProductPriceTiers.js  | Hook        | Obtener tramos de precios por cantidad              | Lógica de precios escalonados              |

---

## 3. Relaciones internas del módulo
- **Diagrama de dependencias:**
```
ProductPageWrapper
└── ProductPageView
    ├── ProductHeader
    │   ├── ProductImageGallery (usa useLazyImage)
    │   ├── PurchaseActions
    │   └── PriceDisplay, StockIndicator
    ├── SaleConditions
    ├── SalesCharacteristics
    ├── TechnicalSpecifications
    └── ProductPageSkeletons
```
- **Patrones de comunicación:** props, callbacks y hooks personalizados. No usa contexto global.
- **Relaciones clave:** ProductPageView orquesta la UI y delega a subcomponentes especializados.

---

## 4. Props de los componentes
### ProductPageView
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| product      | object   | Sí        | Objeto de producto a mostrar                |
| onClose      | func     | No        | Callback para cerrar la vista               |
| onAddToCart  | func     | No        | Callback para agregar al carrito            |
| isPageView   | boolean  | No        | Si es vista de página completa              |
| loading      | boolean  | No        | Estado de carga                             |
| isLoggedIn   | boolean  | No        | Usuario autenticado                        |
| onGoHome     | func     | No        | Callback para ir a Home                     |
| onGoToMarketplace | func | No        | Callback para ir al marketplace             |
| fromMyProducts | boolean| No        | Si viene de la vista de mis productos       |

### ProductPageWrapper
| Prop         | Tipo     | Requerido | Descripción                                 |
|--------------|----------|-----------|---------------------------------------------|
| isLoggedIn   | boolean  | No        | Indica si el usuario está autenticado       |

### ProductHeader
| Prop             | Tipo     | Requerido | Descripción                                 |
|------------------|----------|-----------|---------------------------------------------|
| product          | object   | Sí        | Producto a mostrar                          |
| selectedImageIndex| number  | No        | Índice de imagen seleccionada               |
| onImageSelect    | func     | No        | Callback para seleccionar imagen            |
| onAddToCart      | func     | No        | Callback para agregar al carrito            |
| isLoggedIn       | boolean  | No        | Usuario autenticado                        |
| fromMyProducts   | boolean  | No        | Si viene de la vista de mis productos       |

**Notas importantes:**
- Los demás componentes reciben props especializadas según su función (ver código fuente para detalles).

---

## 5. Hooks personalizados
### `useLazyImage(src, options)`
- **Propósito:** Lazy loading avanzado de imágenes con placeholders y progressive loading.
- **Estados y efectos principales:** Maneja estados de carga, error y pre-carga de imágenes.
- **API:**
  - `imageSrc`: URL de la imagen cargada
  - `isLoaded`, `isLoading`, `error`
- **Ejemplo de uso:**
```js
const { imageSrc, isLoaded } = useLazyImage(url, { placeholder: '/placeholder.jpg' })
```

### `useProductPageData()`
- **Propósito:** Manejar la carga de datos del producto y estados de loading/error.
- **Estados:** product, loading, error
- **Ejemplo de uso:**
```js
const { product, loading, error } = useProductPageData()
```

### `useProductPriceTiers(productId)`
- **Propósito:** Obtener tramos de precios escalonados desde Supabase o mocks.
- **Estados:** tiers, loading, error
- **Ejemplo de uso:**
```js
const { tiers, loading } = useProductPriceTiers(productId)
```

---

## 6. Dependencias principales
| Dependencia           | Versión | Propósito                  | Impacto                |
|----------------------|---------|----------------------------|------------------------|
| `react`              | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`      | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5     | Iconos para UI             | Visualización          |
| `supabase-js`        | >=2     | Backend y autenticación    | Datos remotos          |
| `react-router-dom`   | >=6     | Routing y navegación       | Navegación             |
| `react-hot-toast`    | >=2     | Feedback visual            | UX y notificaciones    |

---

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- El fetch de producto depende de la URL y puede fallar si el ID es inválido.
- El lazy loading de imágenes requiere soporte de IntersectionObserver.
- Los skeleton loaders simulan carga, pero deben integrarse con la API real.

### Deuda técnica relevante:
- [MEDIA] Refactorizar mocks y lógica de tramos de precios para producción.
- [MEDIA] Mejorar manejo de errores y feedback en la UI.

---

## 8. Puntos de extensión
- Los componentes pueden extenderse para mostrar más información o integrar nuevos servicios.
- Los hooks pueden adaptarse para otras vistas de detalle.
- Se pueden agregar más skeleton loaders o animaciones de carga.

---

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import ProductPageWrapper from './ProductPageView/ProductPageWrapper';

function App() {
  return <ProductPageWrapper isLoggedIn={true} />;
}
```

### Ejemplo más completo:
```jsx
import ProductPageView from './ProductPageView/ProductPageView';
import { useProductPageData } from './ProductPageView/hooks/useProductPageData';

function DetalleProducto() {
  const { product, loading, error } = useProductPageData();
  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  return <ProductPageView product={product} />;
}
```

---

## 10. Rendimiento y optimización
- Memoización de componentes y hooks.
- Skeleton loaders para mejorar la percepción de velocidad.
- Lazy loading de imágenes y code splitting por rutas.
- Áreas de mejora: optimizar fetch de datos y manejo de errores.

---

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
