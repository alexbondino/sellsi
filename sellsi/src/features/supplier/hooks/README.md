# Supplier Hooks

## 1. Resumen funcional del módulo
El módulo `supplier/hooks` provee hooks personalizados para la gestión avanzada de productos en el dashboard de proveedores de Sellsi. Incluye lógica de lazy loading, paginación, infinite scroll y animaciones escalonadas para una experiencia de usuario fluida y profesional.

- **Problema que resuelve:** Permite cargar y animar grandes volúmenes de productos de forma eficiente y progresiva.
- **Arquitectura:** Hooks reutilizables, separación de lógica de UI, uso de refs y callbacks para optimización.
- **Patrones:** Custom hooks, memoización, Intersection Observer, animaciones controladas por estado.
- **Flujo de datos:** Productos base → Estado local → Renderizado progresivo → Animaciones.

## 2. Listado de archivos
| Archivo                | Tipo      | Descripción                                 | Responsabilidad principal                |
|------------------------|-----------|---------------------------------------------|------------------------------------------|
| useLazyProducts.js     | Hook      | Lazy loading, paginación e infinite scroll  | Controlar carga y visualización de productos |
| ...otros hooks         | Hook      | Funcionalidades adicionales para proveedores| Extensión de lógica de dashboard         |

## 3. Relaciones internas del módulo
```
useLazyProducts
├── useProductAnimations (interno)
└── (componentes de productos)
```
- Comunicación por retorno de API de hooks.
- Integración con componentes de lista y grid de productos.

## 4. Props de los hooks
### useLazyProducts
No recibe props externas, pero sí argumentos:
- `products` (array): Lista base de productos.
- `pageSize` (number, opcional): Tamaño de página para paginación (default: 12).

**API expuesta:**
- `displayedProducts`: Productos actualmente visibles.
- `isLoadingMore`: Estado de carga adicional.
- `hasMore`: Si hay más productos para cargar.
- `loadingTriggerRef`: Ref para el trigger de Intersection Observer.
- `totalCount`: Total de productos base.
- `displayedCount`: Cantidad de productos mostrados.
- `loadMore()`: Cargar más productos manualmente.
- `scrollToTop()`: Scroll suave al inicio.
- `progress`: Porcentaje de productos cargados.

### useProductAnimations
- `productCount` (number): Cantidad de productos a animar.

**API expuesta:**
- `triggerAnimation(startIndex)`: Inicia animación escalonada.
- `shouldAnimate(index)`: Indica si un producto debe animarse.
- `isAnimating`: Estado de animación global.
- `animatedItems`: Cantidad de items animados.

## 5. Hooks personalizados
### `useLazyProducts(products, pageSize)`
**Propósito:** Gestionar lazy loading, paginación e infinite scroll de productos.

**Estados y efectos principales:**
- `displayedProducts`, `currentPage`, `isLoadingMore`, `hasMore`.
- Efectos: Observador de scroll, reset en cambio de productos.

**Ejemplo de uso básico:**
```jsx
const {
  displayedProducts,
  isLoadingMore,
  hasMore,
  loadingTriggerRef,
  loadMore,
  scrollToTop,
  progress
} = useLazyProducts(productList);
```

### `useProductAnimations(productCount)`
**Propósito:** Gestionar animaciones escalonadas de productos al cargar.

**Ejemplo de uso básico:**
```jsx
const { triggerAnimation, shouldAnimate, isAnimating } = useProductAnimations(displayedProducts.length);
```

## 6. Dependencias principales
| Dependencia         | Versión   | Propósito                        | Impacto                  |
|---------------------|-----------|----------------------------------|--------------------------|
| react               | ^18.x     | Renderizado y estado             | Core                     |

## 7. Consideraciones técnicas
### Limitaciones y advertencias
- El hook asume que la lista de productos es estática durante la sesión.
- El Intersection Observer requiere soporte de navegador moderno.
- Las animaciones pueden no ser fluidas en dispositivos muy lentos.

### Deuda técnica relevante
- [MEDIA] Permitir actualización dinámica de la lista de productos.
- [MEDIA] Exponer callbacks para eventos de scroll y animación.

## 8. Puntos de extensión
- Integrar con fetch remoto para carga incremental real.
- Permitir configuración avanzada de animaciones y paginación.

## 9. Ejemplos de uso
### Ejemplo básico
```jsx
import { useLazyProducts, useProductAnimations } from './useLazyProducts';

function ProductList({ products }) {
  const {
    displayedProducts,
    isLoadingMore,
    hasMore,
    loadingTriggerRef,
    loadMore,
    scrollToTop,
    progress
  } = useLazyProducts(products);

  const { triggerAnimation, shouldAnimate, isAnimating } = useProductAnimations(displayedProducts.length);

  // ...renderizado de productos y trigger de animaciones
}
```

## 10. Rendimiento y optimización
- Memoización de callbacks y estados.
- Uso de Intersection Observer para eficiencia en scroll.
- Áreas de mejora: soporte para fetch incremental y animaciones CSS nativas.

## 11. Actualización
- Creado: `03/07/2025`
- Última actualización: `03/07/2025`
