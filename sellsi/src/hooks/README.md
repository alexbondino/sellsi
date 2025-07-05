# Hooks

## 1. Resumen funcional del módulo
El módulo `hooks` centraliza hooks personalizados reutilizables para la plataforma Sellsi. Proporciona lógica compartida para optimizar la carga de imágenes, prefetch de datos y otras utilidades, promoviendo DRY y eficiencia en los componentes.

- **Problema que resuelve:** Evita duplicación de lógica y facilita la reutilización de patrones comunes en la UI.
- **Arquitectura:** Hooks independientes, cada uno con responsabilidad única y documentación interna.
- **Patrones:** Custom hooks, separación de lógica de UI, composición funcional.
- **Flujo de datos:** Props/argumentos → Estado/Efectos internos → Valores y funciones expuestas.

## 2. Listado de archivos
| Archivo           | Tipo   | Descripción                                 | Responsabilidad principal                |
|-------------------|--------|---------------------------------------------|------------------------------------------|
| useLazyImage.js   | Hook   | Carga diferida de imágenes (lazy loading)   | Optimizar performance y UX en imágenes   |
| usePrefetch.js    | Hook   | Prefetch de datos para navegación anticipada| Mejorar velocidad percibida y UX         |
| README.md         | Doc    | Documentación de los hooks                  | Explicar uso y API de cada hook          |

## 3. Relaciones internas del módulo
```
useLazyImage
usePrefetch
```
- Hooks independientes, pueden ser usados en cualquier componente.
- No dependen entre sí.

## 4. Props y API de los hooks
### useLazyImage
- `src` (string): URL de la imagen a cargar.
- `placeholder` (string, opcional): Imagen de placeholder.
- `rootMargin` (string, opcional): Margen para Intersection Observer.

**API expuesta:**
- `imageSrc`: URL de la imagen cargada (placeholder o real).
- `isLoaded`: Booleano, indica si la imagen real ya se cargó.
- `imgRef`: Ref para asociar al elemento `<img />`.

### usePrefetch
- `url` (string): URL o endpoint a prefetch.
- `options` (object, opcional): Opciones de fetch.

**API expuesta:**
- `prefetch`: Función para disparar el prefetch manualmente.
- `isPrefetched`: Booleano, indica si ya se realizó el prefetch.
- `data`: Datos obtenidos (si aplica).

## 5. Hooks personalizados
### `useLazyImage(src, placeholder, rootMargin)`
**Propósito:** Cargar imágenes solo cuando entran en viewport, mejorando performance y UX.

**Estados y efectos principales:**
- `imageSrc`, `isLoaded`, `imgRef`.
- Efecto: Intersection Observer para disparar carga.

**Ejemplo de uso básico:**
```jsx
const { imageSrc, isLoaded, imgRef } = useLazyImage(product.imgUrl, '/placeholder.png');

<img ref={imgRef} src={imageSrc} alt="Producto" />
```

### `usePrefetch(url, options)`
**Propósito:** Prefetch de datos para navegación anticipada o carga progresiva.

**Estados y efectos principales:**
- `isPrefetched`, `data`.
- Efecto: Fetch anticipado bajo demanda.

**Ejemplo de uso básico:**
```jsx
const { prefetch, isPrefetched, data } = usePrefetch('/api/productos');

<button onMouseEnter={prefetch}>Ver productos</button>
```

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y hooks              | Core                     |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- Los hooks asumen entorno React 18+.
- `useLazyImage` requiere soporte de Intersection Observer.
- Prefetch no implementa cache persistente por defecto.

### Deuda técnica relevante
- [MEDIA] Permitir configuración avanzada de observer y cache.
- [MEDIA] Mejorar cobertura de tests y ejemplos.

## 8. Puntos de extensión
- Agregar hooks para otras utilidades comunes (debounce, throttle, etc.).
- Integrar con sistemas de cache global o SWR.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import { useLazyImage, usePrefetch } from './hooks';

const { imageSrc, imgRef } = useLazyImage(url);
const { prefetch } = usePrefetch('/api/data');
```

## 10. Rendimiento y optimización
- Lazy loading y prefetch para mejorar performance y UX.
- Hooks optimizados para evitar renders innecesarios.
- Áreas de mejora: cache persistente y configuración avanzada.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
