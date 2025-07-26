# Módulo: marketplace

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Centraliza la experiencia completa de marketplace B2B para Sellsi, permitiendo a compradores descubrir productos y a proveedores gestionar su catálogo. Integra búsqueda avanzada, filtros dinámicos, navegación por categorías, fichas técnicas detalladas y lógica de negocio para un marketplace escalable.
- **Arquitectura de alto nivel:** Arquitectura basada en composición de componentes funcionales React con patrón Container/Presentational, hooks personalizados para separación de lógica de negocio, estado centralizado, UI responsive con Material-UI, integración robusta con Supabase y optimizaciones de performance.
- **Función y casos de uso principales:** Renderizar marketplace principal con productos filtrados, gestionar navegación entre vistas (lista/ficha técnica), manejar acciones de compra, proporcionar experiencia diferenciada para compradores vs proveedores, y optimizar UX con lazy loading y memoización.
- **Flujo de datos/información simplificado:**
  ```
  Supabase → useProducts → useMarketplaceState → useMarketplaceLogic → Secciones UI
       ↓                                    ↓
  ProductData → ProductPageWrapper → ProductPageView → Componentes especializados
       ↓                                    ↓
  User Actions → Callbacks → Estado global → Re-render optimizado
  ```

---

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| Marketplace.jsx | Componente | Orquestador principal del marketplace con layout responsive | Coordinación de secciones principales y manejo de estado de UI |
| useMarketplaceLogic.jsx | Hook | Hook centralizado que consolida lógica de filtros, ordenamiento y navegación | Abstracción de lógica de negocio y optimización de props |
| ProviderCatalog.jsx | Componente | Vista especializada para catálogo de proveedor | Renderizado de productos del proveedor con navegación específica |
| RecommendedProducts.jsx | Componente | Sistema de recomendación de productos contextual | Sugerencias inteligentes basadas en perfil de usuario |
| index.js | Barrel | Punto de entrada unificado del módulo | Exportación centralizada de componentes y hooks públicos |

---

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
Marketplace.jsx (Orquestador principal)
├── useMarketplaceLogic.jsx (Estado centralizado)
│   ├── hooks/useMarketplaceState.js
│   ├── hooks/useProductSorting.js
│   └── hooks/useScrollBehavior.js
├── sections/ (Secciones modulares)
│   ├── SearchSection.jsx
│   ├── FilterSection.jsx
│   └── ProductsSection.jsx
├── ProductPageView/ (Vista detallada)
│   ├── ProductPageWrapper.jsx (Container)
│   ├── ProductPageView.jsx (Presentational)
│   ├── components/ (Especializados)
│   └── hooks/ (Lógica específica)
└── RecommendedProducts.jsx (Independiente)
```

**Patrones de comunicación:**
- **Props drilling optimizado**: useMarketplaceLogic centraliza y memoiza props para secciones
- **Custom hooks**: Separación clara entre lógica de negocio y presentación
- **Event callbacks**: Comunicación ascendente via callbacks memoizados
- **Context implícito**: Router location state para navegación entre vistas
```
Marketplace.jsx
├─ useMarketplaceLogic.jsx
├─ sections/
│   ├─ SearchSection.jsx
│   ├─ FilterSection.jsx
│   └─ ProductsSection.jsx
├─ RecommendedProducts.jsx
├─ ProductPageView/
│   ├─ ProductPageWrapper.jsx
│   ├─ ProductPageView.jsx
│   └─ components/
│       ├─ ProductHeader.jsx
│       ├─ TechnicalSpecifications.jsx
│       ├─ PurchaseActions.jsx
│       └─ ...
│   └─ hooks/
│       ├─ useProductPageData.js
│       ├─ useProductPriceTiers.js
│       └─ useLazyImage.js
├─ utils/
│   ├─ formatters.js
│   └─ performanceDebug.js
└─ index.js
```

---

## 4. Props de los componentes
### Marketplace
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| Sin props | - | - | Componente auto-contenido que maneja todo su estado internamente |

### ProductPageView
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `product` | `object` | Sí | Datos completos del producto con estructura: `{id, nombre, precio, stock, categoria, descripcion, imagenes, ...}` |
| `onClose` | `function` | No | Callback para cerrar la vista. Ej: `() => navigate(-1)` |
| `onAddToCart` | `function` | No | Callback para agregar al carrito. Ej: `(product) => addToCart(product)` |
| `isLoggedIn` | `boolean` | No | Estado de autenticación del usuario |
| `fromMyProducts` | `boolean` | No | Indica si viene desde vista de proveedor |
| `isSupplier` | `boolean` | No | Determina si el usuario es proveedor |

### ProviderCatalog
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `providerId` | `string` | Sí | ID del proveedor para filtrar productos |
| `onProductSelect` | `function` | No | Callback cuando se selecciona un producto |

## 5. Hooks personalizados
### `useMarketplaceLogic(options)`

**Propósito:** Hook centralizado que consolida toda la lógica de estado, filtros, ordenamiento y navegación del marketplace.

**Estados y efectos principales:**
- Gestiona estado de productos filtrados, búsqueda, categorías y ordenamiento
- Memoiza props complejas para optimizar re-renders de secciones
- Maneja comportamiento responsive y configuración de layout

**API que expone:**
- `searchSectionProps`: Props pre-configuradas para la sección de búsqueda
- `filterSectionProps`: Props para manejo de filtros (desktop y móvil)
- `productsSectionProps`: Props para grid de productos y acciones

**Ejemplo de uso básico:**
```jsx
const { searchSectionProps, filterSectionProps, productsSectionProps } = useMarketplaceLogic({
  hasSideBar: false,
  searchBarMarginLeft: { xs: 0, md: 2 }
});
```

### `useMarketplaceState()`

**Propósito:** Hook de estado global que maneja productos, filtros y navegación.

**Estados y efectos principales:**
- Estado de productos y filtrado en tiempo real
- Gestión de categorías seleccionadas y búsqueda
- Loading y error states para UX

**API que expone:**
- `productos`: Lista completa de productos
- `productosFiltrados`: Productos después de aplicar filtros
- `filtros`: Estado actual de filtros aplicados
- `setBusqueda()`: Actualizar término de búsqueda
- `updateFiltros()`: Modificar filtros activos

**Ejemplo de uso básico:**
```jsx
const { productosFiltrados, setBusqueda, updateFiltros } = useMarketplaceState();
```

---

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| `@mui/material` | >=5 | Sistema de componentes UI y theming | Alto - Toda la interfaz depende de Material-UI |
| `react-router-dom` | >=6 | Navegación entre vistas y manejo de parámetros | Alto - Routing crítico para marketplace |
| `@supabase/supabase-js` | >=2 | Cliente de base de datos y autenticación | Alto - Backend integration para productos |
| `react-hot-toast` | >=2 | Sistema de notificaciones | Medio - UX feedback y confirmaciones |
| `zustand` | >=4 | Estado global del carrito | Medio - Gestión de carrito de compras |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Performance**: Filtrado sincrónico puede ser lento con >1000 productos
- **Memory leaks**: Algunos componentes no se desmontan correctamente
- **Escalabilidad**: No implementa paginación, carga todos los productos
- **Browser support**: Requiere navegadores con soporte ES2020+

### Deuda técnica relevante:
- **[ALTA]** Migrar a TypeScript para mejor type safety
- **[ALTA]** Implementar Error Boundaries para manejo robusto de errores
- **[MEDIA]** Optimizar bundle splitting para carga inicial más rápida
## 8. Puntos de extensión
- **Componentes modulares**: Secciones (Search, Filter, Products) son reutilizables en otros contextos de catálogo
- **Hooks personalizados**: useMarketplaceLogic y useMarketplaceState pueden adaptarse para dashboards
- **Sistema de plugins**: ProductPageView puede extenderse con nuevos componentes (reviews, Q&A, comparaciones)
- **API pública**: Barrel exports en index.js facilitan importación selectiva de funcionalidades

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { Marketplace } from 'src/features/marketplace';

function MarketplacePage() {
  return <Marketplace />;
}
```

### Ejemplo más completo:
```jsx
import { ProductPageView, useMarketplaceLogic } from 'src/features/marketplace';
import { useAuth } from 'src/context/AuthContext';

function CustomMarketplace() {
  const { user } = useAuth();
  const { productsSectionProps } = useMarketplaceLogic({ 
    hasSideBar: true 
  });
  
  return (
    <div>
      <ProductsSection {...productsSectionProps} />
      {selectedProduct && (
        <ProductPageView
          product={selectedProduct}
          isLoggedIn={!!user}
          onAddToCart={(product) => {
            console.log('Added to cart:', product);
          }}
        />
      )}
    </div>
  );
}
## 10. Rendimiento y optimización
- **Memoización estratégica**: useCallback y useMemo para props complejas y cálculos costosos
- **Lazy loading**: React.lazy para componentes pesados (ProductImageGallery, PurchaseActions)
- **Code splitting**: Suspense boundaries para carga diferida de rutas
- **Skeleton loaders**: Mejora percepción de velocidad durante cargas
- **Optimizaciones identificadas**: Implementar virtualización para listas largas, cache con React Query

## 11. Actualización
- **Última actualización:** 18/07/2025
