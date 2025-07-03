# Módulo: sections

> **Creado:** 03/07/2025  
> **Última actualización:** 03/07/2025

---

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Este módulo agrupa las secciones principales de la vista de marketplace: búsqueda, filtros y listado de productos, desacoplando la lógica de UI y mejorando la experiencia de usuario.
- **Arquitectura de alto nivel:** Componentes funcionales React, memoización avanzada, separación de responsabilidades, uso de Material UI y props especializadas para cada sección.
- **Función y casos de uso principales:** Renderizar la barra de búsqueda y navegación de categorías, mostrar y controlar filtros (desktop/móvil), y desplegar el grid de productos con feedback visual y acciones rápidas.
- **Flujo de datos/información simplificado:**
  - El estado global y los datos de productos llegan por props desde el contenedor principal.
  - Cada sección maneja su propio estado local y callbacks para máxima eficiencia.

---

## 2. Listado de archivos
| Archivo            | Tipo        | Descripción                                         | Responsabilidad principal                  |
|--------------------|-------------|-----------------------------------------------------|--------------------------------------------|
| SearchSection.jsx  | Componente  | Barra de búsqueda fija y navegación de categorías    | UX de búsqueda y navegación                |
| FilterSection.jsx  | Componente  | Panel de filtros desktop/móvil y FAB de filtros      | Control y visualización de filtros         |
| ProductsSection.jsx| Componente  | Grid de productos, título, contador y estado vacío   | Renderizado y acciones sobre productos     |

---

## 3. Relaciones internas del módulo
- **Diagrama de dependencias:**
```
MarketplacePage
├── SearchSection (usa SearchBar, CategoryNavigation)
├── FilterSection (usa FilterPanel)
└── ProductsSection (usa ProductCard, LoadingOverlay)
```
- **Patrones de comunicación:** props y callbacks, sin contexto global.
- **Relaciones clave:** Cada sección es independiente y desacoplada, pero suelen usarse juntas en la vista principal del marketplace.

---

## 4. Props de los componentes
### SearchSection
| Prop                  | Tipo     | Requerido | Descripción                                 |
|-----------------------|----------|-----------|---------------------------------------------|
| shouldShowSearchBar   | boolean  | Sí        | Controla la visibilidad de la barra         |
| searchBarProps        | object   | Sí        | Props para el componente SearchBar          |
| categoryNavigationProps| object  | Sí        | Props para CategoryNavigation               |
| hasSideBar            | boolean  | No        | Si hay SideBar, ajusta el layout            |

### FilterSection
| Prop               | Tipo     | Requerido | Descripción                                 |
|--------------------|----------|-----------|---------------------------------------------|
| hayFiltrosActivos  | boolean  | Sí        | Indica si hay filtros activos               |
| desktopFilterProps | object   | Sí        | Props para el panel de filtros desktop      |
| filterPosition     | string   | No        | Posición del panel de filtros               |

### ProductsSection
| Prop               | Tipo     | Requerido | Descripción                                 |
|--------------------|----------|-----------|---------------------------------------------|
| seccionActiva      | string   | Sí        | Sección activa del marketplace              |
| setSeccionActiva   | func     | Sí        | Cambia la sección activa                    |
| totalProductos     | number   | Sí        | Total de productos mostrados                |
| productosOrdenados | array    | Sí        | Lista de productos ordenados                |
| resetFiltros       | func     | Sí        | Callback para limpiar filtros               |
| hasSideBar         | boolean  | No        | Si hay SideBar, ajusta el layout            |
| titleMarginLeft    | object   | No        | Margen izquierdo del título                 |
| loading            | boolean  | No        | Estado de carga                             |
| error              | any      | No        | Estado de error                             |

**Notas importantes:**
- Los componentes hijos como SearchBar, CategoryNavigation, FilterPanel y ProductCard reciben sus propias props especializadas.

---

## 5. Hooks personalizados
Este módulo no define hooks personalizados propios, pero utiliza hooks de React y hooks globales del proyecto (por ejemplo, para el carrito).

---

## 6. Dependencias principales
| Dependencia           | Versión | Propósito                  | Impacto                |
|----------------------|---------|----------------------------|------------------------|
| `react`              | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`      | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5     | Iconos para UI             | Visualización          |
| `react-hot-toast`    | >=2     | Feedback visual            | UX y notificaciones    |

---

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- El FAB de filtros es siempre visible en móvil para mejor UX.
- El grid de productos y la barra de búsqueda son completamente desacoplados.
- El layout depende de props como `hasSideBar` para máxima flexibilidad.

### Deuda técnica relevante:
- [MEDIA] Mejorar la comparación profunda de props en memoización personalizada.
- [MEDIA] Unificar lógica de filtros entre desktop y móvil.

---

## 8. Puntos de extensión
- Se pueden agregar nuevas secciones (por ejemplo, banners, recomendaciones).
- Los componentes pueden extenderse con más props o integración con otros servicios.

---

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { SearchSection, FilterSection, ProductsSection } from './sections';

function MarketplacePage(props) {
  return (
    <>
      <SearchSection {...props.searchSectionProps} />
      <FilterSection {...props.filterSectionProps} />
      <ProductsSection {...props.productsSectionProps} />
    </>
  );
}
```

---

## 10. Rendimiento y optimización
- Memoización avanzada de componentes y estilos.
- Renderizado eficiente y desacoplado.
- Áreas de mejora: optimizar comparación de props y unificar lógica de filtros.

---

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
