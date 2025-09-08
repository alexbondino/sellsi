## Skeletons inteligentes para Marketplace

Este documento describe el sistema de skeletons aplicado a la grilla del Marketplace para reducir CLS y mejorar la fluidez percibida.

### Objetivos

- Minimizar la variación de layout (CLS) haciendo que los contenedores de las tarjetas mantengan tamaño idéntico al contenido real.
- Evitar flicker: no mostrar skeleton si la carga es muy rápida; en cambio, mantener el estado previo hasta superar un umbral.
- Mantener ritmo visual consistente con el grid y los breakpoints.

### Componentes clave

- ProductCardSkeleton: replica dimensiones y estructura de `ProductCard` en sus variantes `buyer`, `supplier` y `provider`.
- ProductCardSkeletonGrid: renderiza N skeletons respetando el `gridStyles` y `cardContainerStyles` reales del layout.
- useSmartSkeleton: hook que controla la aparición/desaparición con delay y duración mínima para suavizar transiciones.

Rutas:

- `src/shared/components/display/product-card/ProductCardSkeleton.jsx`
- `src/domains/ProductPageView/hooks/useSmartSkeleton.js`

### Integración en ProductsSection

En `ProductsSection.jsx`:

- Se importa `ProductCardSkeletonGrid` y `useSmartSkeleton`.
- Se reemplaza el spinner genérico de Loading por:
	- Si `useSmartSkeleton(loading)` retorna true, se muestra la grilla de skeletons con el mismo grid y cantidad aproximada de tarjetas por página.
	- Si no, se mantiene `LoadingOverlay` como fallback para cargas ultrarrápidas.

Fragmento clave:

- `showSkeletons = useSmartSkeleton(loading, { delay: 120, minDuration: 320 })`
- En `components.Loading` se renderiza `ProductCardSkeletonGrid` con `type` dinámico (`provider` o `buyer`).

### Decisiones de diseño para reducir CLS

- Alturas y anchos del card skeleton están calcados de `ProductCard.jsx` (por breakpoint) para evitar saltos.
- El contenedor de imagen usa altura fija equivalente a `ProductCardImage`/`ProviderContext`.
- El botón inferior (buyer/provider) reserva espacio absoluto en la misma posición que el botón real.
- El grid del skeleton utiliza exactamente `gridStyles` y `cardContainerStyles` del layout actual.

### UX y animación

- Se usa `animation="wave"` en los `Skeleton` de MUI para una retroalimentación suave.
- Aparición con delay y duración mínima evita parpadeo en cargas < 120ms y pantallas con cache cálido.

### Extensión futura

- Ajustar `count` en `ProductCardSkeletonGrid` para igualar exactamente los ítems visibles por breakpoint.
- Añadir skeletons para estados de interacción (menú acción en supplier, chips) si se requiere aún más fidelidad visual.

### Pruebas

- Verificar en XS/SM/MD/LG/XL que el alto/ancho de la tarjeta no cambie al reemplazar skeleton por contenido real.
- Revisar que `useSmartSkeleton` oculte skeletons si el tiempo de carga real < 120ms.

