# Módulo: marketplace

> **Creado:** 03/07/2025  
> **Última actualización:** 03/07/2025

---

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Centraliza la experiencia de compra, exploración y visualización de productos en Sellsi, integrando búsqueda, filtros, navegación, ficha técnica y lógica de negocio para un marketplace robusto y escalable.
- **Arquitectura de alto nivel:** Composición de componentes funcionales React, hooks personalizados para lógica de estado, filtros y navegación, UI desacoplada con Material UI, integración con Supabase y separación de lógica de presentación y negocio.
- **Función y casos de uso principales:** Renderizar la página principal del marketplace, permitir búsqueda, filtrado, navegación por categorías, mostrar productos recomendados y visualizar la ficha técnica detallada de cada producto.
- **Flujo de datos/información simplificado:**
  - El estado global y los datos de productos llegan por hooks y props desde el contenedor principal.
  - Cada sección maneja su propio estado local y callbacks para máxima eficiencia.
  - La ficha técnica recibe el producto y callbacks desde el wrapper.

---

## 2. Listado de archivos principales
| Archivo                                 | Tipo         | Descripción breve                                                      | Responsabilidad principal                  |
|-----------------------------------------|-------------|-----------------------------------------------------------------------|--------------------------------------------|
| Marketplace.jsx                         | Componente  | Orquesta la vista principal del marketplace, maneja layout y secciones.| Renderizar y orquestar la UI principal     |
| useMarketplaceLogic.jsx                 | Hook        | Lógica centralizada de estado, filtros, orden y navegación.           | Manejar estado global y lógica de negocio  |
| sections/SearchSection.jsx              | Componente  | Barra de búsqueda y navegación de categorías.                         | UX de búsqueda y navegación                |
| sections/FilterSection.jsx              | Componente  | Panel de filtros avanzado, responsive y desacoplado.                  | Control y visualización de filtros         |
| sections/ProductsSection.jsx            | Componente  | Grid de productos, contador, estado vacío y lógica de agregar al carrito.| Renderizado y acciones sobre productos     |
| RecommendedProducts.jsx                 | Componente  | Muestra productos recomendados en base al contexto del usuario.        | Sugerir productos relevantes               |
| ProductPageView/ProductPageView.jsx     | Componente  | Ficha técnica completa del producto, con galería, specs y acciones.   | Renderizar ficha técnica y acciones        |
| ProductPageView/ProductPageWrapper.jsx  | Componente  | Wrapper para cargar datos y mostrar la ficha técnica.                 | Fetch de producto y control de navegación  |
| ProductPageView/components/ProductHeader.jsx | Componente | Encabezado de la ficha técnica, imágenes, precios y proveedor.        | Mostrar info principal del producto        |
| ProductPageView/components/TechnicalSpecifications.jsx | Componente | Especificaciones técnicas detalladas del producto.                    | Mostrar detalles técnicos                  |
| ProductPageView/components/PurchaseActions.jsx | Componente | Acciones de compra, selector de cantidad y agregar al carrito.        | Acciones rápidas de compra                 |
| ProductPageView/hooks/useProductPageData.js | Hook      | Maneja la carga de datos, loading y errores para la ficha técnica.    | Fetch y estados de producto                |
| ProductPageView/hooks/useProductPriceTiers.js | Hook    | Obtiene tramos de precios por cantidad para el producto.              | Lógica de precios escalonados              |
| ProductPageView/hooks/useLazyImage.js   | Hook        | Lazy loading avanzado de imágenes para la ficha técnica.              | Optimizar carga de imágenes                |
| utils/formatters.js                     | Helper      | Funciones utilitarias para formateo de datos y precios.               | Formateo y helpers de datos                |
| utils/performanceDebug.js               | Helper      | Herramientas para debug y performance del marketplace.                | Debug y optimización                       |
| index.js                               | Barrel      | Exporta los componentes y hooks principales del módulo.               | Punto de entrada del módulo                |

---

## 3. Relaciones internas del módulo
- `Marketplace.jsx` importa y orquesta las secciones principales: búsqueda, filtros y grid de productos.
- `useMarketplaceLogic.jsx` centraliza el estado, lógica de filtros, orden y navegación, y es consumido por las secciones.
- `sections/SearchSection.jsx`, `sections/FilterSection.jsx` y `sections/ProductsSection.jsx` son componentes desacoplados y reutilizables.
- `ProductPageView/ProductPageView.jsx` ("Ficha Técnica") es el componente más complejo: integra galería de imágenes, encabezado, especificaciones técnicas, condiciones de venta y acciones de compra.
- Los hooks de `ProductPageView/hooks/` gestionan la carga de datos, tramos de precios y lazy loading de imágenes.
- El barrel `index.js` exporta los componentes clave para uso externo.

Árbol de relaciones simplificado:
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

## 4. Props de los componentes principales
| Componente                | Prop                  | Tipo         | Requerida | Descripción                                      |
|---------------------------|-----------------------|--------------|-----------|--------------------------------------------------|
| Marketplace               | -                     | -            | -         | No recibe props, maneja todo internamente.        |
| useMarketplaceLogic       | options               | object       | No        | Configuración opcional para layout y lógica.      |
| SearchSection             | shouldShowSearchBar   | boolean      | No        | Controla visibilidad de la barra de búsqueda.     |
|                           | searchBarProps        | object       | No        | Props para el buscador.                          |
|                           | categoryNavigationProps| object      | No        | Props para navegación de categorías.              |
| FilterSection             | hayFiltrosActivos     | boolean      | No        | Indica si hay filtros activos.                   |
|                           | desktopFilterProps    | object       | No        | Props para el panel de filtros desktop.           |
| ProductsSection           | seccionActiva         | string       | No        | Sección activa actual.                           |
|                           | setSeccionActiva      | function     | No        | Cambia la sección activa.                        |
|                           | totalProductos        | number       | No        | Total de productos mostrados.                    |
|                           | productosOrdenados    | array        | No        | Lista de productos a mostrar.                    |
|                           | resetFiltros          | function     | No        | Resetea los filtros aplicados.                   |
| ProductPageView           | product               | object       | Sí        | Objeto con todos los datos del producto.         |
|                           | onClose               | function     | No        | Callback para cerrar la ficha técnica.           |
|                           | onAddToCart           | function     | No        | Callback para agregar al carrito.                |
|                           | isPageView            | boolean      | No        | Indica si es vista de página completa.           |
|                           | loading               | boolean      | No        | Estado de carga de la ficha técnica.             |
| ProductHeader             | product               | object       | Sí        | Datos principales del producto.                  |
|                           | selectedImageIndex    | number       | No        | Índice de imagen seleccionada.                   |
|                           | onImageSelect         | function     | No        | Callback para seleccionar imagen.                |
|                           | onAddToCart           | function     | No        | Callback para agregar al carrito.                |
|                           | isLoggedIn            | boolean      | No        | Estado de login del usuario.                     |
| TechnicalSpecifications   | product               | object       | Sí        | Objeto con especificaciones técnicas.            |
| PurchaseActions           | onAddToCart           | function     | Sí        | Callback para agregar al carrito.                |
|                           | stock                 | number       | Sí        | Stock disponible.                                |
|                           | product               | object       | Sí        | Producto actual.                                 |
|                           | tiers                 | array        | No        | Tramos de precios por cantidad.                  |
|                           | isLoggedIn            | boolean      | No        | Estado de login del usuario.                     |

**Notas importantes:**
- Los componentes hijos como SearchBar, CategoryNavigation, FilterPanel y ProductCard reciben sus propias props especializadas.

---

## 5. Hooks personalizados
### useMarketplaceLogic.jsx
Centraliza la lógica de estado, filtros, orden, navegación y configuración visual del marketplace. Expone funciones y estados para controlar la UI y la lógica de negocio desde el componente principal y las secciones.

### useProductPageData.js
Maneja la carga de datos, estados de loading, errores y mock data para la ficha técnica. Permite mostrar skeleton loaders y fallback en caso de error.

### useProductPriceTiers.js
Obtiene los tramos de precios por cantidad para el producto actual, ya sea desde Supabase o mocks. Expone `tiers`, `loading` y `error`.

### useLazyImage.js
Hook avanzado para lazy loading de imágenes, con soporte para placeholders, progressive loading y optimización para marketplaces.

---

## 6. Dependencias principales
| Dependencia           | Versión | Propósito                  | Impacto                |
|----------------------|---------|----------------------------|------------------------|
| `react`              | >=17    | Hooks y estado             | Lógica y efectos       |
| `@mui/material`      | >=5     | Componentes UI             | Visualización          |
| `@mui/icons-material`| >=5     | Iconos para UI             | Visualización          |
| `react-router-dom`   | >=6     | Routing y navegación       | Navegación             |
| `supabase-js`        | >=2     | Backend y autenticación    | Datos remotos          |
| `react-hot-toast`    | >=2     | Feedback visual            | UX y notificaciones    |

---

## 7. Consideraciones técnicas y advertencias
- La ficha técnica (`ProductPageView`) es el componente más complejo y crítico: integra galería, especificaciones, condiciones de venta, acciones de compra y lógica de precios escalonados.
- El módulo asume integración con Material-UI, React Router DOM y Supabase. Cambios en estas dependencias pueden requerir ajustes.
- Los hooks están optimizados para performance y desacoplados para facilitar testing y extensión.
- El manejo de loading y errores está pensado para UX profesional (skeleton loaders, mensajes claros).
- Si se modifica la estructura de productos, revisar los helpers y hooks de carga de datos.
- El módulo está preparado para soportar tanto datos reales como mocks, facilitando el desarrollo y pruebas.

---

## 8. Puntos de extensión o reutilización
- Los componentes de secciones (`SearchSection`, `FilterSection`, `ProductsSection`) y hooks pueden ser reutilizados en otros contextos de catálogo o dashboards.
- La ficha técnica (`ProductPageView`) puede extenderse para soportar más tipos de productos, variantes o integraciones (ej: reviews, preguntas, etc.).
- El barrel `index.js` permite importar cualquier componente o hook del módulo de forma centralizada.

---

## 9. Ejemplos de uso
### Importar y usar el marketplace principal
```jsx
import { Marketplace } from 'src/features/marketplace';

<Marketplace />
```

### Usar la ficha técnica (ProductPageView)
```jsx
import { ProductPageView } from 'src/features/marketplace/ProductPageView';

<ProductPageView product={producto} onAddToCart={handleAddToCart} />
```

### Usar hooks especializados
```js
import { useMarketplaceLogic } from 'src/features/marketplace';
const { filtros, setFiltros, productosOrdenados } = useMarketplaceLogic();

import { useProductPageData } from 'src/features/marketplace/ProductPageView/hooks/useProductPageData';
const { product, loading, error } = useProductPageData();
```

---

## 10. Rendimiento y optimización
- Memoización avanzada de componentes y hooks.
- Skeleton loaders para mejorar la percepción de velocidad.
- Lazy loading de imágenes y code splitting por rutas.
- Áreas de mejora: optimizar fetch de datos, manejo de errores y desacoplar lógica de filtros.

---

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
