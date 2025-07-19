# Módulo: FilterPanel

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Proporciona un sistema completo de filtrado avanzado para el marketplace, permitiendo búsquedas precisas mediante múltiples criterios (precio, stock, categorías, etc.).
- **Arquitectura de alto nivel:** Componente contenedor que orquesta subcomponentes especializados de filtrado con hooks dedicados para la lógica de negocio.
- **Función y casos de uso principales:** Filtrado por precio, stock, rating, categorías, negociabilidad y visualización de filtros activos con capacidad de eliminación individual.
- **Flujo de datos/información simplificado:**
  ```
  User Input → Filter Components → Filter State → Product List Update
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| FilterPanel.jsx | Componente | Panel principal que orquesta todos los filtros | Coordinación y estado de filtros |
| components/PriceFilter.jsx | Componente | Slider de rango de precios | Filtrado por precio |
| components/AppliedFiltersDisplay.jsx | Componente | Visualización de filtros activos como chips | UI de filtros aplicados |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
FilterPanel (container)
├── PriceFilter (specialized filter)
├── AppliedFiltersDisplay (filter visualization)
└── useProductFilters (business logic)
```

**Patrones de comunicación:**
- **Container/Presentational**: FilterPanel coordina, subcomponentes presentan
- **Controlled components**: Estado centralizado en el container
- **Custom hooks**: Lógica de filtros en useProductFilters

## 4. Props de los componentes
### FilterPanel
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| filtros | objeto | ✓ | Estado actual de filtros aplicados |
| categoriaSeleccionada | array | ✗ | Lista de categorías seleccionadas |
| busqueda | string | ✗ | Término de búsqueda actual |
| updateFiltros | función | ✓ | Callback para actualizar filtros |
| resetFiltros | función | ✓ | Callback para limpiar todos los filtros |
| totalProductos | número | ✗ | Contador de productos filtrados |
| filtrosAbiertos | boolean | ✗ | Estado de expansión del panel |
| filterPosition | string | ✗ | Posición del panel ('left', 'right') |
| isMobileOpen | boolean | ✗ | Estado móvil del panel |
| onMobileClose | función | ✗ | Handler para cerrar en móvil |

### AppliedFiltersDisplay
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| filtros | objeto | ✓ | Filtros aplicados para mostrar |
| onRemoveFilter | función | ✓ | Callback para eliminar filtro específico |
| styles | objeto | ✗ | Estilos personalizados del componente |

## 5. Hooks personalizados
### useProductFilters (importado)
- **Propósito:** Encapsula lógica de filtrado y manipulación de estado
- **Inputs:** Estado inicial de filtros
- **Outputs:** Filtros actuales, funciones de actualización y reset
- **Efectos secundarios:** Actualización de la lista de productos

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| @mui/material | ^5.0.0 | Componentes UI del panel | Alto - Core UI |
| @mui/icons-material | ^5.0.0 | Iconos para filtros | Medio - UX |
| react | ^18.0.0 | Hooks y estado | Alto - Funcionalidad |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Responsive design**: Comportamiento diferente en móvil vs desktop
- **Performance**: Filtros complejos pueden ser costosos con muchos productos
- **State sync**: Requiere sincronización con el estado global del marketplace

### Deuda técnica relevante:
- **[MEDIA]** Implementar virtualization para listas largas de filtros
- **[BAJA]** Mejorar accesibilidad con ARIA labels
- **[BAJA]** Agregar tests unitarios para componentes de filtros

## 8. Puntos de extensión
- **Nuevos filtros**: Fácil adición de nuevos tipos de filtro
- **Custom themes**: Soporte para temas personalizados via Material-UI
- **Filter persistence**: Posibilidad de guardar filtros en localStorage

## 9. Ejemplos de uso
### Implementación básica:
```jsx
import FilterPanel from 'src/features/marketplace/FilterPanel/FilterPanel';
import { useProductFilters } from 'src/features/marketplace/hooks';

function MarketplacePage() {
  const {
    filtros,
    updateFiltros,
    resetFiltros,
    filteredProducts
  } = useProductFilters();

  return (
    <div>
      <FilterPanel
        filtros={filtros}
        updateFiltros={updateFiltros}
        resetFiltros={resetFiltros}
        totalProductos={filteredProducts.length}
        filtrosAbiertos={true}
      />
      <ProductList products={filteredProducts} />
    </div>
  );
}
```

### Filtros personalizados:
```jsx
<FilterPanel
  filtros={customFilters}
  categoriaSeleccionada={['electronics', 'books']}
  busqueda="laptop"
  filterPosition="right"
  isMobileOpen={mobileDrawerOpen}
  onMobileClose={() => setMobileDrawerOpen(false)}
/>
```

## 10. Rendimiento y optimización
- **React.memo**: Componentes memoizados para evitar re-renders innecesarios
- **useMemo**: Cálculos de filtros memoizados
- **Debounced updates**: Filtros de texto con debounce para reducir llamadas
- **Lazy loading**: Carga condicional de filtros complejos

## 11. Actualización
- **Última actualización:** 18/07/2025
