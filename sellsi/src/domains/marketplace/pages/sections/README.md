# Módulo: sections

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Modulariza las secciones principales del marketplace en componentes especializados y reutilizables: búsqueda/navegación, filtros avanzados y grid de productos, permitiendo desarrollo independiente y optimización granular.
- **Arquitectura de alto nivel:** Arquitectura de componentes modulares con patrón de composición, cada sección encapsula su lógica de presentación mientras recibe datos via props, con memoización para optimizar performance.
- **Función y casos de uso principales:** Proporcionar interfaces especializadas para búsqueda de productos, aplicación de filtros avanzados, y visualización de productos en grid responsive con acciones de compra.
- **Flujo de datos/información simplificado:**
  ```
  useMarketplaceLogic → Props especializadas → Secciones independientes
           ↓                    ↓                      ↓
  Estado central ← Callbacks ← Eventos de usuario ← Interacciones UI
  ```

---

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| SearchSection.jsx | Componente | Sección de búsqueda y navegación por categorías | Interfaz de búsqueda unificada y navegación contextual |
| FilterSection.jsx | Componente | Panel de filtros responsive con modal móvil | Gestión visual de filtros avanzados en múltiples dispositivos |
| ProductsSection.jsx | Componente | Grid de productos con estados y contador | Visualización principal de productos con acciones de compra |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
Marketplace.jsx (Orquestador)
├── SearchSection.jsx (Búsqueda)
│   ├── SearchBar (componente)
│   └── CategoryNavigation (componente)
├── FilterSection.jsx (Filtros)
│   ├── FilterPanel (desktop)
│   └── FilterModal (móvil)
└── ProductsSection.jsx (Productos)
    ├── ProductCard (individual)
    ├── EmptyState (sin resultados)
    └── LoadingOverlay (carga)
```

**Patrones de comunicación:**
- **Props especializadas**: Cada sección recibe props pre-configuradas y memoizadas
- **Callback lifting**: Eventos de usuario se propagan via callbacks al estado central
- **Composición modular**: Secciones son independientes pero coordinadas
- **Responsive patterns**: Diferentes behaviors según breakpoints

---

## 4. Props de los componentes
### SearchSection
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `shouldShowSearchBar` | `boolean` | Sí | Controla visibilidad de barra de búsqueda según scroll |
| `searchBarProps` | `object` | Sí | Props configuradas para SearchBar: `{busqueda, setBusqueda, ordenamiento, ...}` |
| `categoryNavigationProps` | `object` | Sí | Props para CategoryNavigation: `{seccionActiva, onCategoriaToggle, ...}` |
| `hasSideBar` | `boolean` | No | Ajusta layout si existe sidebar lateral |

### FilterSection
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `hayFiltrosActivos` | `boolean` | Sí | Indica si hay filtros aplicados para mostrar badge |
| `desktopFilterProps` | `object` | Sí | Props para panel desktop: `{filtros, updateFiltros, resetFiltros, ...}` |
| `isMobileOpen` | `boolean` | No | Estado de modal móvil de filtros |
| `onMobileClose` | `function` | No | Callback para cerrar modal móvil |

### ProductsSection
| Prop | Tipo | Requerido | Descripción |
|------|------|----------|-------------|
| `seccionActiva` | `string` | Sí | Sección actual: 'todos', 'nuevos', 'ofertas', 'topVentas' |
| `setSeccionActiva` | `function` | Sí | Callback para cambiar sección activa |
| `totalProductos` | `number` | Sí | Contador de productos mostrados |
| `productosOrdenados` | `array` | Sí | Lista de productos filtrados y ordenados |
| `resetFiltros` | `function` | Sí | Callback para limpiar todos los filtros |
| `loading` | `boolean` | No | Estado de carga para mostrar skeleton |
| `error` | `any` | No | Estado de error para mostrar mensaje |

**Notas importantes:** Todas las props están pre-configuradas y memoizadas desde useMarketplaceLogic para optimizar performance.

---

## 5. Hooks personalizados
Este módulo no define hooks personalizados propios, sino que consume hooks del marketplace principal y utiliza hooks estándar de React para estado local.

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| `@mui/material` | >=5 | Sistema de componentes UI y layout | Alto - Interfaz visual completa |
| `@mui/icons-material` | >=5 | Iconografía consistente | Medio - Elementos visuales |
| `react-hot-toast` | >=2 | Notificaciones de acciones | Medio - Feedback de usuario |
| `../SearchBar` | Interno | Componente de búsqueda | Alto - Funcionalidad crítica |
| `../FilterPanel` | Interno | Panel de filtros | Alto - Core del sistema de filtros |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Dependencia de props**: Funcionalidad completamente dependiente de props externas
- **Responsive complexity**: Manejo complejo de diferentes layouts para móvil/desktop
- **Performance sensitivity**: Re-renders frecuentes por cambios en listas de productos

### Deuda técnica relevante:
- **[MEDIA]** Optimizar memoización de ProductCard individual
- **[BAJA]** Unificar lógica de responsive breakpoints
- **[BAJA]** Mejorar accessibility en componentes de filtro

## 8. Puntos de extensión
- **Secciones modulares**: Fácil agregar nuevas secciones (banners, promociones)
- **Componentes pluggables**: SearchBar y FilterPanel son intercambiables
- **Layout flexible**: Configuración responsive adaptable a diferentes contextos
- **Estado extensible**: Props pattern permite agregar nuevas funcionalidades

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { SearchSection, FilterSection, ProductsSection } from 'src/features/marketplace/sections';

function CustomMarketplace({ searchProps, filterProps, productsProps }) {
  return (
    <div>
      <SearchSection {...searchProps} />
      <FilterSection {...filterProps} />
      <ProductsSection {...productsProps} />
    </div>
  );
}
```

### Ejemplo más completo:
```jsx
import { useMarketplaceLogic } from 'src/features/marketplace';
import { SearchSection, FilterSection, ProductsSection } from 'src/features/marketplace/sections';

function MarketplaceWithLogic() {
  const { 
    searchSectionProps, 
    filterSectionProps, 
    productsSectionProps 
  } = useMarketplaceLogic({
    hasSideBar: false
  });
  
  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      <SearchSection {...searchSectionProps} />
      <FilterSection {...filterSectionProps} />
      <ProductsSection {...productsSectionProps} />
    </Box>
  );
}
```

## 10. Rendimiento y optimización
- **Memoización granular**: Cada sección está memoizada independientemente
- **Props estables**: useMarketplaceLogic proporciona props memoizadas para evitar re-renders
- **Lazy rendering**: ProductCard se renderiza solo cuando es visible
- **Optimizaciones pendientes**: Virtualización para listas largas, debounce en búsqueda

## 11. Actualización
- **Última actualización:** 18/07/2025
