# Marketplace Utils (`src/features/marketplace/marketplace`)

> **Fecha de creación de este README:** 03/07/2025

## 1. Resumen funcional del módulo

Esta carpeta contiene utilidades, helpers y constantes que encapsulan la lógica de filtrado, ordenamiento, generación de datos y manejo de URLs para productos en el marketplace de Sellsi. Permite separar la lógica de negocio y utilidades del código de hooks y componentes, facilitando la reutilización y el mantenimiento.

- **Problema que resuelve:** Centraliza funciones de filtrado, ordenamiento, generación de datos de muestra y helpers de URL, evitando duplicación y acoplamiento en los componentes y hooks del marketplace.
- **Arquitectura:** Módulos de funciones puras, helpers y constantes, cada uno enfocado en una parte de la lógica de negocio del marketplace.
- **Función principal:** Proveer utilidades reutilizables para manipulación de productos, generación de datos y configuración de filtros y ordenamientos.
- **Flujo de datos:**
  - Los helpers son consumidos por hooks y componentes para filtrar, ordenar, mapear y mostrar productos.

## 2. Listado de archivos
| Archivo                | Tipo      | Descripción breve                                 | Responsabilidad principal                |
|------------------------|-----------|--------------------------------------------------|------------------------------------------|
| salesDataGenerator.js  | Helper    | Genera datos de ventas y especificaciones técnicas| Mock y enriquecimiento de productos      |
| productUrl.js          | Helper    | Genera y parsea slugs y URLs de productos         | Navegación y SEO                        |
| productSorting.js      | Helper    | Funciones para ordenar productos                  | Lógica de ordenamiento                  |
| productFilters.js      | Helper    | Funciones para filtrar productos por criterios    | Lógica de filtrado                      |
| constants.js           | Constantes| Constantes de secciones, filtros y ordenamientos  | Configuración centralizada               |

## 3. Relaciones internas del módulo
- `productSorting.js` y `productFilters.js` consumen constantes de `constants.js`.
- `salesDataGenerator.js` y `productUrl.js` son helpers independientes.
- Todos los helpers pueden ser consumidos por hooks y componentes del marketplace.

```
productSorting.js
├── constants.js
productFilters.js
├── constants.js
salesDataGenerator.js
productUrl.js
```

## 4. API y props principales de los helpers

### salesDataGenerator.js
- **Funciones:**
  - generateSalesCharacteristics(product): Genera datos de ventas aleatorios.
  - generateTechnicalSpecifications(product): Genera especificaciones técnicas mock.

### productUrl.js
- **Funciones:**
  - createProductSlug(productName): Convierte nombre en slug URL.
  - generateProductSlug(product): Slug completo con ID.
  - generateProductUrl(product): URL completa para specs.

### productSorting.js
- **Funciones:**
  - sortProducts(productos, ordenamiento): Ordena productos según criterio.

### productFilters.js
- **Funciones:**
  - filterProductsBySection, filterProductsBySearch, filterProductsByCategory, filterProductsByPrice, filterProductsByStock, filterProductsByRating, filterProductsByNegotiable

### constants.js
- **Constantes:**
  - SECTIONS, SECTION_LABELS, SORT_OPTIONS, INITIAL_FILTERS, PRICE_RANGE, RATING_RANGE

## 5. Dependencias principales
| Dependencia         | Versión | Propósito                  | Impacto                |
|---------------------|---------|----------------------------|------------------------|
| `none`              | -       | Funciones puras            | Portabilidad           |

## 6. Consideraciones técnicas
- Helpers y constantes desacoplados, sin dependencias externas.
- Mock data y helpers pueden ser reemplazados por lógica real en producción.
- Mantener consistencia en el uso de constantes y helpers en todo el marketplace.

## 7. Puntos de extensión
- Los helpers pueden adaptarse para nuevos criterios de filtrado, ordenamiento o generación de datos.
- Fácil de extender con nuevas constantes o utilidades.

## 8. Ejemplos de uso

### Ordenar productos
```js
import { sortProducts } from './productSorting';
const productosOrdenados = sortProducts(productos, 'mayor-precio');
```

### Filtrar productos
```js
import { filterProductsBySection, filterProductsByPrice } from './productFilters';
const filtrados = filterProductsBySection(productos, 'ofertas');
```

### Generar slug de producto
```js
import { generateProductSlug } from './productUrl';
const slug = generateProductSlug(producto);
```

## 9. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
