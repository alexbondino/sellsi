# Custom Hooks (`src/hooks`)

> **Fecha de creación de este README:** 26/06/2025

## Resumen funcional del módulo

La carpeta **hooks** centraliza hooks personalizados reutilizables en Sellsi, orientados a optimizar la experiencia de usuario, el rendimiento y la gestión avanzada de recursos. Incluye hooks para lazy loading de imágenes y prefetching inteligente de rutas. Estos hooks resuelven necesidades de carga progresiva, anticipación de navegación y optimización de renders en aplicaciones React complejas.

## Listado de archivos principales

| Archivo         | Tipo    | Descripción breve                                                |
|-----------------|---------|-----------------------------------------------------------------|
| useLazyImage.js | Hook    | Lazy loading avanzado y preloading de imágenes con placeholders. |
| usePrefetch.js  | Hook    | Prefetching inteligente de rutas y componentes React.            |

## Relaciones internas del módulo

- Los hooks son independientes y pueden usarse en cualquier componente o feature.
- `useLazyImage` y `useImagePreloader` pueden combinarse para optimizar la carga de imágenes críticas y progresivas.
- `usePrefetch` y `usePrefetchOnHover` pueden integrarse en botones, links o menús para anticipar la navegación y mejorar la UX.

Árbol de relaciones simplificado:

```
useLazyImage.js
├─ useLazyImage
└─ useImagePreloader
usePrefetch.js
├─ usePrefetch
└─ usePrefetchOnHover
```

## Props y API de los hooks principales

### useLazyImage
- **Parámetros:**
  - `src` (string): URL de la imagen a cargar.
  - `options` (object):
    - `placeholder` (string): Imagen placeholder.
    - `threshold` (number): Umbral de visibilidad para IntersectionObserver.
    - `rootMargin` (string): Margen para el observer.
    - `enableProgressiveLoading` (bool): Carga progresiva (default: true).
- **Retorna:** `{ imageSrc, isLoaded, isLoading, error, imgRef }`

### useImagePreloader
- **Parámetros:**
  - `images` (array): URLs de imágenes a precargar.
- **Retorna:** `{ preloadedImages, isPreloading }`

### usePrefetch
- **Retorna:** `{ prefetchRoute, prefetchWithDelay, cancelPrefetch, prefetchedRoutes }`

### usePrefetchOnHover
- **Parámetros:**
  - `routePath` (string): Ruta a prefetch.
- **Retorna:** `{ onMouseEnter, onMouseLeave }`

## Dependencias externas e internas

- **Externas:** React, react-router-dom (para usePrefetch).
- **Internas:** Independientes, pueden usarse en cualquier feature o componente.

## Consideraciones técnicas y advertencias

- `useLazyImage` utiliza IntersectionObserver, asegúrate de que el navegador lo soporte.
- `usePrefetch` está optimizado para rutas y componentes lazy definidos en el mapeo interno.

## Puntos de extensión o reutilización

- Los hooks pueden ser extendidos para nuevos patrones de carga, animaciones o estrategias de prefetch.
- Pueden integrarse en features, componentes UI o flujos de onboarding para mejorar la UX y el rendimiento.

## Ejemplos de uso

### Lazy loading de imagen con placeholder

```jsx
import { useLazyImage } from 'src/hooks/useLazyImage';

const { imageSrc, isLoaded, imgRef } = useLazyImage(product.imageUrl);

<img ref={imgRef} src={imageSrc} alt="Producto" />
```

### Prefetch de ruta en hover

```jsx
import { usePrefetchOnHover } from 'src/hooks/usePrefetch';

const { onMouseEnter, onMouseLeave } = usePrefetchOnHover('/marketplace');

<button onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
  Ir al Marketplace
</button>
```

---

Este README documenta la estructura, relaciones y funcionamiento de los hooks personalizados de Sellsi. Consulta los comentarios en el código para detalles adicionales y patrones avanzados de uso.
