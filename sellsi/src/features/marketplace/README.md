# Marketplace Module (`src/features/marketplace`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

El módulo **Marketplace** es el corazón de la experiencia de compra y exploración de productos en Sellsi. Centraliza la lógica, componentes y hooks necesarios para mostrar, buscar, filtrar y navegar productos, así como para visualizar la ficha técnica detallada de cada producto ("ProductPageView" o Ficha Técnica). Este módulo resuelve la necesidad de un marketplace robusto, escalable y altamente interactivo, permitiendo a los usuarios comparar, analizar y comprar productos de manera eficiente y visualmente atractiva.

## Listado de archivos principales

| Archivo                                 | Tipo         | Descripción breve                                                      |
|-----------------------------------------|-------------|-----------------------------------------------------------------------|
| Marketplace.jsx                         | Componente  | Orquesta la vista principal del marketplace, maneja layout y secciones.|
| useMarketplaceLogic.jsx                 | Hook        | Lógica centralizada de estado, filtros, orden y navegación.           |
| sections/SearchSection.jsx              | Componente  | Barra de búsqueda y navegación de categorías.                         |
| sections/FilterSection.jsx              | Componente  | Panel de filtros avanzado, responsive y desacoplado.                  |
| sections/ProductsSection.jsx            | Componente  | Grid de productos, contador, estado vacío y lógica de agregar al carrito.|
| RecommendedProducts.jsx                 | Componente  | Muestra productos recomendados en base al contexto del usuario.        |
| ProductPageView/ProductPageView.jsx     | Componente  | Ficha técnica completa del producto, con galería, specs y acciones.   |
| ProductPageView/ProductPageWrapper.jsx  | Componente  | Wrapper para cargar datos y mostrar la ficha técnica.                 |
| ProductPageView/components/ProductHeader.jsx | Componente | Encabezado de la ficha técnica, imágenes, precios y proveedor.        |
| ProductPageView/components/TechnicalSpecifications.jsx | Componente | Especificaciones técnicas detalladas del producto.                    |
| ProductPageView/components/PurchaseActions.jsx | Componente | Acciones de compra, selector de cantidad y agregar al carrito.        |
| ProductPageView/hooks/useProductPageData.js | Hook      | Maneja la carga de datos, loading y errores para la ficha técnica.    |
| ProductPageView/hooks/useProductPriceTiers.js | Hook    | Obtiene tramos de precios por cantidad para el producto.              |
| ProductPageView/hooks/useLazyImage.js   | Hook        | Lazy loading avanzado de imágenes para la ficha técnica.              |
| utils/formatters.js                     | Helper      | Funciones utilitarias para formateo de datos y precios.               |
| utils/performanceDebug.js               | Helper      | Herramientas para debug y performance del marketplace.                |
| index.js                               | Barrel      | Exporta los componentes y hooks principales del módulo.               |

## Relaciones internas del módulo

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

## Props de los componentes principales

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

## Hooks personalizados

### useMarketplaceLogic.jsx
Centraliza la lógica de estado, filtros, orden, navegación y configuración visual del marketplace. Expone funciones y estados para controlar la UI y la lógica de negocio desde el componente principal y las secciones.

### useProductPageData.js
Maneja la carga de datos, estados de loading, errores y mock data para la ficha técnica. Permite mostrar skeleton loaders y fallback en caso de error.

### useProductPriceTiers.js
Obtiene los tramos de precios por cantidad para el producto actual, ya sea desde Supabase o mocks. Expone `tiers`, `loading` y `error`.

### useLazyImage.js
Hook avanzado para lazy loading de imágenes, con soporte para placeholders, progressive loading y optimización para marketplaces.

## Dependencias externas e internas

- **Externas**: React, Material-UI, React Router DOM, react-hot-toast, Supabase, íconos de Material-UI.
- **Internas**: Helpers de `utils/`, hooks y componentes de otros módulos (`layout`, `buyer`), servicios de Supabase.
- **Contextos/Providers**: Puede recibir contextos globales para sesión y usuario, pero no define contextos propios.
- **Importaciones externas**: Utiliza helpers, stores y componentes de fuera de la carpeta para integración total.

## Consideraciones técnicas y advertencias

- La ficha técnica (`ProductPageView`) es el componente más complejo y crítico: integra galería, especificaciones, condiciones de venta, acciones de compra y lógica de precios escalonados.
- El módulo asume integración con Material-UI, React Router DOM y Supabase. Cambios en estas dependencias pueden requerir ajustes.
- Los hooks están optimizados para performance y desacoplados para facilitar testing y extensión.
- El manejo de loading y errores está pensado para UX profesional (skeleton loaders, mensajes claros).
- Si se modifica la estructura de productos, revisar los helpers y hooks de carga de datos.
- El módulo está preparado para soportar tanto datos reales como mocks, facilitando el desarrollo y pruebas.

## Puntos de extensión o reutilización

- Los componentes de secciones (`SearchSection`, `FilterSection`, `ProductsSection`) y hooks pueden ser reutilizados en otros contextos de catálogo o dashboards.
- La ficha técnica (`ProductPageView`) puede extenderse para soportar más tipos de productos, variantes o integraciones (ej: reviews, preguntas, etc.).
- El barrel `index.js` permite importar cualquier componente o hook del módulo de forma centralizada.

## Ejemplos de uso

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

Este README documenta la estructura, relaciones y funcionamiento del módulo Marketplace. Consulta los comentarios en el código y la documentación interna para detalles adicionales. Si tienes dudas, revisa la ficha técnica (`ProductPageView`), ya que es el corazón de la experiencia de producto en Sellsi.
