# FilterPanel Module (`src/features/marketplace/FilterPanel`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

Este módulo implementa el panel de filtros avanzado para el marketplace de Sellsi. Permite a los usuarios aplicar, visualizar y limpiar filtros de productos de forma intuitiva y responsiva, mejorando la experiencia de búsqueda y navegación.

- **Problema que resuelve:** Facilita la selección y visualización de filtros activos, permitiendo búsquedas precisas y personalizadas en el catálogo de productos.
- **Arquitectura:** Componentes desacoplados, hooks personalizados para lógica de filtros, estilos modulares y subcomponentes reutilizables.
- **Función principal:** Proveer UI y lógica para aplicar, mostrar y limpiar filtros de productos.
- **Flujo de datos:**
  - El usuario ajusta filtros (precio, stock, negociable, etc.)
  - El panel actualiza el estado de filtros y muestra los activos como chips.
  - Los cambios se propagan al estado global del marketplace.

## 2. Listado de archivos
| Archivo                  | Tipo        | Descripción breve                                 | Responsabilidad principal                |
|--------------------------|-------------|--------------------------------------------------|------------------------------------------|
| FilterPanel.jsx          | Componente  | Panel principal de filtros, orquesta subcomponentes| UI y lógica de filtros                   |
| components/PriceFilter.jsx| Componente | Slider y campos de precio                         | Selección de rango de precios            |
| components/AppliedFiltersDisplay.jsx| Componente | Chips visuales de filtros activos                | Visualización y remoción de filtros      |
| ...otros                 | ...         | ...                                              | ...                                      |

## 3. Relaciones internas del módulo
- `FilterPanel.jsx` orquesta la UI y lógica, importando subcomponentes.
- `PriceFilter.jsx` y `AppliedFiltersDisplay.jsx` son hijos directos de `FilterPanel`.
- Usa hooks de `../hooks/useProductFilters` para lógica de filtros.

```
FilterPanel
├── PriceFilter
├── AppliedFiltersDisplay
└── (usa hooks/useProductFilters)
```

## 4. Props de los componentes
### FilterPanel
| Prop              | Tipo           | Requerido | Descripción                                 |
|-------------------|----------------|-----------|---------------------------------------------|
| filtros           | objeto         | Sí        | Estado actual de los filtros                |
| categoriaSeleccionada | array      | No        | Categorías seleccionadas                    |
| busqueda          | string         | No        | Texto de búsqueda                           |
| updateFiltros     | función        | Sí        | Callback para actualizar filtros            |
| resetFiltros      | función        | Sí        | Callback para limpiar todos los filtros      |
| totalProductos    | número         | No        | Total de productos filtrados                |
| filtrosAbiertos   | boolean        | No        | Si el panel está abierto                    |
| filterPosition    | string         | No        | Posición del panel ('left', 'right')        |
| isMobileOpen      | boolean        | No        | Si el panel está abierto en móvil           |
| onMobileClose     | función        | No        | Handler para cerrar en móvil                |

### AppliedFiltersDisplay
| Prop              | Tipo           | Requerido | Descripción                                 |
|-------------------|----------------|-----------|---------------------------------------------|
| filtros           | objeto         | Sí        | Estado actual de los filtros                |
| categoriaSeleccionada | array      | No        | Categorías seleccionadas                    |
| busqueda          | string         | No        | Texto de búsqueda                           |
| onRemoveFilter    | función        | Sí        | Callback para remover un filtro             |
| styles            | objeto         | No        | Estilos personalizados                      |

## 5. Hooks personalizados
- Usa `useProductFilters` de `../hooks` para lógica de filtros y callbacks.

## 6. Dependencias principales
| Dependencia         | Versión | Propósito                  | Impacto                |
|---------------------|---------|----------------------------|------------------------|
| `react`             | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`     | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5    | Iconos para UI             | Visualización          |

## 7. Consideraciones técnicas
- Arquitectura desacoplada: lógica en hooks, UI en componentes puros.
- El panel es responsivo y optimizado para desktop y móvil.
- Los filtros activos se muestran como chips y pueden limpiarse individualmente.

## 8. Puntos de extensión
- Se pueden agregar nuevos filtros o criterios fácilmente.
- Los subcomponentes pueden reutilizarse en otros flujos de filtrado.

## 9. Ejemplos de uso

### Usar el panel de filtros
```jsx
import FilterPanel from './FilterPanel/FilterPanel';
<FilterPanel filtros={filtros} updateFiltros={setFiltros} resetFiltros={resetFiltros} />
```

## 10. Rendimiento y optimización
- Memoización de componentes y handlers.
- Renderizado condicional para mejorar performance.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
