# Módulo: ProductPageView

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Implementa la vista detallada completa de productos en Sellsi, proporcionando ficha técnica interactiva, galería de imágenes, especificaciones completas, condiciones de venta y acciones de compra con precios escalonados.
- **Arquitectura de alto nivel:** Arquitectura Container/Presentational con ProductPageWrapper (container) manejando datos y navegación, ProductPageView (presentational) orquestando UI, y componentes especializados para cada sección de la ficha técnica.
- **Función y casos de uso principales:** Mostrar información completa de productos, gestionar galería de imágenes con lazy loading, permitir acciones de compra contextuales, manejar navegación inteligente según origen de usuario.
- **Flujo de datos/información simplificado:**
  ```
  URL params → ProductPageWrapper → Supabase fetch → ProductPageView
       ↓              ↓                    ↓               ↓
  Navigation ← Callbacks ← User actions ← Specialized components
  ```

---

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| ProductPageView.jsx | Componente | Orquestador principal de la vista de producto | Coordinación de secciones y manejo de layout |
| ProductPageWrapper.jsx | Componente | Container para fetch de datos y navegación | Lógica de datos, routing y estados de carga |
| components/ProductHeader.jsx | Componente | Header con información principal del producto | Presentación de datos básicos y acciones primarias |
| components/ProductImageGallery.jsx | Componente | Galería interactiva con zoom y lazy loading | Visualización optimizada de imágenes |
| components/PurchaseActions.jsx | Componente | Acciones de compra con selector de cantidad | Interface de compra y gestión de carrito |
| components/TechnicalSpecifications.jsx | Componente | Especificaciones técnicas detalladas | Presentación de información técnica |
| components/ProductPageSkeletons.jsx | Componente | Skeleton loaders para estados de carga | UX durante fetch de datos |
| hooks/useProductPageData.js | Hook | Gestión de datos y estados de producto | Fetch, loading, error handling |
| hooks/useProductPriceTiers.js | Hook | Lógica de precios escalonados por cantidad | Cálculo de precios según volumen |
| hooks/useLazyImage.js | Hook | Optimización de carga de imágenes | Performance de galería de imágenes |

---

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
ProductPageWrapper (Container)
└── ProductPageView (Presentational)
    ├── ProductHeader
    │   ├── ProductImageGallery
    │   │   └── useLazyImage.js
    │   └── PurchaseActions
    │       └── useProductPriceTiers.js
    ├── TechnicalSpecifications
    ├── ProductPageSkeletons (fallback)
    └── useProductPageData.js (datos)
```

**Patrones de comunicación:**
- **Container/Presentational**: Wrapper maneja datos, View maneja presentación
- **Specialized components**: Cada componente tiene responsabilidad específica
- **Custom hooks**: Lógica compleja encapsulada en hooks reutilizables
## 4. Props de los componentes
### ProductPageView
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `product` | `object` | Sí | Datos completos del producto: `{id, nombre, precio, imagenes, descripcion, ...}` |
| `onClose` | `function` | No | Callback para navegación de retorno. Ej: `() => navigate(-1)` |
| `onAddToCart` | `function` | No | Callback para agregar al carrito. Ej: `(product) => addToCart(product)` |
| `isPageView` | `boolean` | No | Indica si es vista de página completa o modal |
| `loading` | `boolean` | No | Estado de carga para mostrar skeletons |
| `isLoggedIn` | `boolean` | No | Estado de autenticación para mostrar acciones |
| `fromMyProducts` | `boolean` | No | Contexto de origen para navegación inteligente |

### ProductPageWrapper  
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `isLoggedIn` | `boolean` | No | Estado de autenticación propagado a vista |

### ProductImageGallery
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `images` | `array` | Sí | Array de URLs de imágenes: `[{url, thumbnail_url}, ...]` |
| `selectedIndex` | `number` | No | Índice de imagen actualmente seleccionada |
| `onImageSelect` | `function` | No | Callback cuando se selecciona una imagen |

**Notas importantes:** Componentes están diseñados para máxima reutilización con props mínimas pero flexibles.

---

## 5. Hooks personalizados
### `useLazyImage(src, options)`

**Propósito:** Implementa lazy loading optimizado de imágenes con placeholders y progressive loading para mejorar performance de la galería.

**Estados y efectos principales:**
- Gestiona observación de intersección para determinar cuándo cargar imagen
- Maneja estados de carga, error y imagen cargada exitosamente
- Implementa pre-carga de thumbnails y imágenes completas

**API que expone:**
- `imageSrc`: URL de la imagen actualmente cargada
- `isLoaded`: Boolean indicando si la imagen se cargó completamente
- `isLoading`: Estado de carga en progreso
- `error`: Error de carga si ocurrió

**Ejemplo de uso básico:**
```jsx
const { imageSrc, isLoaded, isLoading } = useLazyImage(imageUrl, {
  threshold: 0.1,
  rootMargin: '50px'
});
```

### `useProductPageData()`

**Propósito:** Maneja fetch de datos del producto, estados de loading y error, con soporte para mocks durante desarrollo.

**Estados y efectos principales:**
- Fetch inicial de producto desde Supabase
- Estados de loading, error y datos cargados
- Fallback a datos mock en caso de error

**API que expone:**
- `product`: Datos del producto cargado
- `loading`: Estado de carga
- `error`: Error de fetch si ocurrió
- `refetch()`: Función para recargar datos

**Ejemplo de uso básico:**
```jsx
const { product, loading, error } = useProductPageData();
```

### `useProductPriceTiers(productId)`

**Propósito:** Obtiene y calcula tramos de precios escalonados por cantidad para el producto especificado.

**Estados y efectos principales:**
- Fetch de rangos de precios desde Supabase
- Cálculo de precios según cantidad
- Cache de resultados para optimización

**API que expone:**
- `tiers`: Array de tramos de precios
- `loading`: Estado de carga de tramos
- `calculatePrice(quantity)`: Función para calcular precio según cantidad

**Ejemplo de uso básico:**
```jsx
const { tiers, loading, calculatePrice } = useProductPriceTiers(productId);
```

---

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| `@mui/material` | >=5 | Sistema completo de componentes UI | Alto - Toda la interfaz visual |
| `@supabase/supabase-js` | >=2 | Cliente de base de datos | Alto - Fuente de datos principal |
| `react-router-dom` | >=6 | Navegación y parámetros URL | Alto - Routing crítico |
| `react-hot-toast` | >=2 | Sistema de notificaciones | Medio - Feedback de acciones |
| `zustand` | >=4 | Estado global del carrito | Medio - Funcionalidad de compra |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Dependencia de URL params**: Funcionalidad crítica depende de parámetros válidos
- **IntersectionObserver**: Lazy loading requiere soporte del navegador
- **Performance con muchas imágenes**: Galería puede ser pesada con productos con muchas fotos

### Deuda técnica relevante:
- **[ALTA]** Migrar de mocks a integración real con Supabase
- **[MEDIA]** Optimizar re-renders en componentes de galería
- **[MEDIA]** Implementar cache de productos visitados
- **[BAJA]** Mejorar accessibility en componentes interactivos

## 8. Puntos de extensión
- **Componentes modulares**: Fácil agregar nuevas secciones (reviews, Q&A, comparaciones)
- **Hooks reutilizables**: Lógica de lazy loading y fetch adaptable a otros contextos
- **Sistema de plugins**: ProductPageView puede extenderse con nuevos módulos
- **Responsive design**: Layout adaptable a diferentes dispositivos y contextos

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { ProductPageWrapper } from 'src/features/marketplace/ProductPageView';

function ProductRoute() {
  return <ProductPageWrapper isLoggedIn={user !== null} />;
}
```

### Ejemplo más completo:
```jsx
import { ProductPageView } from 'src/features/marketplace/ProductPageView';
import { useAuth } from 'src/context/AuthContext';
import { useCart } from 'src/hooks/useCart';

function CustomProductView({ product }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  
  return (
    <ProductPageView
      product={product}
      isLoggedIn={!!user}
      onAddToCart={(product) => {
        addToCart(product);
        analytics.track('Product Added to Cart', { productId: product.id });
      }}
      onClose={() => navigate(-1)}
      fromMyProducts={location.state?.from === 'myproducts'}
    />
  );
}
```

## 10. Rendimiento y optimización
- **React.lazy**: Carga diferida de componentes pesados (ProductImageGallery, PurchaseActions)
- **Suspense boundaries**: Manejo elegante de estados de carga
- **Memoización estratégica**: useCallback y useMemo en hooks críticos
- **Lazy loading de imágenes**: Optimización de carga de galería
- **Optimizaciones pendientes**: Virtualización de imágenes, prefetch de productos relacionados

## 11. Actualización
- **Última actualización:** 18/07/2025
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
