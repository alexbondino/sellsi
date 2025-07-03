# Marketplace Hooks (`src/features/marketplace/hooks`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

Esta carpeta contiene hooks personalizados que encapsulan la lógica avanzada del marketplace de Sellsi. Permiten gestionar productos, filtros, ordenamiento, tramos de precios, estado global, comportamiento de scroll y utilidades de debounce, desacoplando la lógica de negocio de los componentes visuales.

- **Problema que resuelve:** Centraliza y desacopla la lógica de estado, filtrado, ordenamiento y UX del marketplace, permitiendo componentes más simples y reutilizables.
- **Arquitectura:** Hooks independientes y especializados, cada uno enfocado en una parte del flujo de marketplace.
- **Función principal:** Proveer lógica reutilizable para productos, filtros, ordenamiento, precios escalonados y comportamiento de UI.
- **Flujo de datos:**
  - Los hooks exponen estado y funciones para ser consumidos por los componentes del marketplace.

## 2. Listado de archivos
| Archivo                | Tipo    | Descripción breve                                         | Responsabilidad principal                |
|------------------------|---------|----------------------------------------------------------|------------------------------------------|
| useProducts.js         | Hook    | Obtiene productos del backend o mocks                    | Estado y fetch de productos              |
| useProductSorting.js   | Hook    | Ordena productos según criterios seleccionados            | Lógica de ordenamiento y opciones        |
| useProductPriceTiers.js| Hook    | Obtiene tramos de precios por cantidad                   | Lógica de precios escalonados            |
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
