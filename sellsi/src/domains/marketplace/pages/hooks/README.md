# Módulo: hooks

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Centraliza la lógica de negocio del marketplace en hooks personalizados reutilizables, separando la lógica de estado de la presentación y optimizando performance mediante memoización.
- **Arquitectura de alto nivel:** Conjunto de custom hooks especializados que encapsulan lógica compleja de estado, efectos y cálculos, siguiendo principios de responsabilidad única y composición.
- **Función y casos de uso principales:** Gestionar estado de productos, filtros, ordenamiento, scroll behavior y datos de marketplace de forma reutilizable y optimizada.
- **Flujo de datos/información simplificado:**
  ```
  Components → Custom Hooks → React Hooks → External APIs/State
       ↓            ↓              ↓             ↓
  Re-render ← State change ← Effects ← Data updates
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| useMarketplaceState.js | Hook | Estado global de productos y filtros | Gestión centralizada de estado del marketplace |
| useProductSorting.js | Hook | Lógica de ordenamiento de productos | Algoritmos de sorting y memoización |
| useScrollBehavior.js | Hook | Comportamiento de scroll para UI | Control de visibilidad de elementos según scroll |
| useProducts.js | Hook | Fetch y cache de productos desde Supabase | Integración con backend y manejo de datos |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
useMarketplaceLogic (orchestrator)
├── useMarketplaceState.js (state)
│   └── useProducts.js (data)
├── useProductSorting.js (sorting)
└── useScrollBehavior.js (UI behavior)
```

**Patrones de comunicación:**
- **Composition pattern**: Hooks se componen para crear funcionalidad compleja
- **Data flow**: Estado fluye desde hooks de datos hacia hooks de lógica
- **Memoization**: Optimización de cálculos costosos
- **Effect coordination**: Coordinación de efectos entre hooks

## 4. Props de los componentes
Este módulo no contiene componentes, solo hooks.

## 5. Hooks personalizados
### `useMarketplaceState()`

**Propósito:** Hook principal que gestiona todo el estado del marketplace incluyendo productos, filtros, búsqueda y navegación.

**Estados y efectos principales:**
- Estado de productos y filtrado en tiempo real
- Gestión de categorías y secciones activas
- Control de filtros aplicados y búsqueda
- Loading y error states para UX

**API que expone:**
- `products`: Lista completa de productos
- `productosFiltrados`: Productos después de aplicar filtros
- `filtros`: Estado actual de filtros
- `setBusqueda()`: Actualizar término de búsqueda
- `updateFiltros()`: Modificar filtros activos
- `resetFiltros()`: Limpiar todos los filtros

**Ejemplo de uso básico:**
```jsx
const { 
  productosFiltrados, 
  setBusqueda, 
  updateFiltros,
  loading 
} = useMarketplaceState();
```

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| `@supabase/supabase-js` | >=2 | Fetch de datos de productos | Alto - Fuente de datos principal |
| `react` | >=17 | Hooks base y efectos | Crítico - Funcionalidad core |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Performance**: Filtrado sincrónico puede ser lento con muchos productos
- **Memory**: Algunos efectos pueden crear memory leaks si no se limpian
- **Complexity**: Coordinación entre hooks puede ser compleja de debuggear

### Deuda técnica relevante:
- **[ALTA]** Implementar debounce en filtros para mejor performance
- **[MEDIA]** Mejorar cleanup de efectos para prevenir memory leaks

## 8. Puntos de extensión
- **Hooks composables**: Fácil crear nuevos hooks combinando existentes
- **Custom logic**: Agregar nueva lógica sin afectar componentes
- **Performance optimization**: Memoización granular según necesidades

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { useMarketplaceState } from 'src/features/marketplace/hooks';

function CustomMarketplace() {
  const { productosFiltrados, loading, setBusqueda } = useMarketplaceState();
  
  if (loading) return <div>Cargando...</div>;
  
  return (
    <div>
      <input onChange={(e) => setBusqueda(e.target.value)} />
      {productosFiltrados.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

## 10. Rendimiento y optimización
- **Memoización estratégica**: useMemo y useCallback en cálculos costosos
- **Debouncing**: Optimización de filtros y búsqueda (pendiente)
- **Effect cleanup**: Prevención de memory leaks y listeners activos

## 11. Actualización
- **Última actualización:** 18/07/2025
| useProductFilters.js   | Hook    | Gestiona filtros de precio, stock y rating               | Lógica de filtrado y callbacks           |
| useMarketplaceState.js | Hook    | Estado global del marketplace, filtros y búsqueda        | Orquestación de estado y filtrado        |
| useScrollBehavior.js   | Hook    | Maneja visibilidad y sticky de la barra de búsqueda      | UX de scroll y topbar                    |
| useDebounce.js         | Utilidad| Función debounce para optimizar eventos                   | Optimización de llamadas y renders       |
| constants.js           | Constantes| Constantes y datos de configuración                     | Centralización de datos                  |

## 3. Relaciones internas del módulo
- `useMarketplaceState` orquesta el estado global y consume `useProducts`.
- `useProductSorting`, `useProductFilters` y `useProductPriceTiers` pueden ser usados en conjunto para componer la lógica de productos.
- `useScrollBehavior` y `useDebounce` optimizan la UX y el rendimiento.

```
useMarketplaceState
├── useProducts
├── useProductFilters
├── useProductSorting
├── useProductPriceTiers
├── useScrollBehavior
└── useDebounce
```

## 4. API y props principales de los hooks

### useProducts()
- **Estados:** products, loading, error
- **Funciones:** fetch automático, mapeo de datos

### useProductSorting(productos)
- **Estados:** ordenamiento, productosOrdenados
- **Funciones:** setOrdenamiento, getSortLabel

### useProductPriceTiers(productId)
- **Estados:** tiers, loading, error

### useProductFilters(filtros, updateFiltros)
- **Funciones:** handlePrecioChange, handleStockChange, handleRatingChange

### useMarketplaceState()
- **Estados:** products, filtros, búsqueda, sección activa, etc.
- **Funciones:** setFiltros, setBusqueda, setSeccionActiva, productosFiltrados

### useScrollBehavior()
- **Estados:** showSearchBar, isSearchBarSticky, showTopBarOnHover
- **Funciones:** handleScroll, handleMouseMove

### useDebounce(fn, delay)
- **Propósito:** Devuelve una función debounced para optimizar llamadas frecuentes

## 5. Hooks personalizados
Todos los archivos son hooks reutilizables, diseñados para ser usados en los componentes del marketplace o en otros módulos de UI compleja.

## 6. Dependencias principales
| Dependencia         | Versión | Propósito                  | Impacto                |
|---------------------|---------|----------------------------|------------------------|
| `react`             | >=17    | Hooks y estado             | Lógica y efectos       |
| `supabase-js`       | >=2     | Backend y autenticación    | Fetch de productos     |

## 7. Consideraciones técnicas
- Los hooks están desacoplados y pueden usarse en otros contextos.
- El hook de productos soporta mocks y backend real.
- El estado global y los filtros están optimizados con memoización.
- El debounce y scroll están optimizados para UX y rendimiento.

## 8. Puntos de extensión
- Los hooks pueden adaptarse para otros módulos de catálogo o búsqueda avanzada.
- El diseño permite agregar nuevos filtros, ordenamientos o lógica de precios fácilmente.

## 9. Ejemplos de uso

### Usar productos y ordenamiento
```js
import { useProducts, useProductSorting } from './hooks';
const { products } = useProducts();
const { productosOrdenados } = useProductSorting(products);
```

### Usar estado global del marketplace
```js
import { useMarketplaceState } from './hooks';
const { productosFiltrados, setBusqueda } = useMarketplaceState();
```

## 10. Rendimiento y optimización
- Memoización de filtros y ordenamientos.
- Debounce para búsquedas y eventos frecuentes.
- Fetch optimizado y desacoplado.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
