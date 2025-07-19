# Módulo: hooks

## 1. Resumen funcional del módulo
- **Problema que resuelve:** Centraliza lógica reutilizable y optimizaciones de performance para componentes de React, evitando duplicación de código y promoviendo consistencia en patrones comunes de la aplicación Sellsi.
- **Arquitectura de alto nivel:** Colección de custom hooks independientes, cada uno implementando el patrón de separación de lógica de UI y siguiendo principios de composición funcional.
- **Función y casos de uso principales:** Optimización de imágenes (lazy loading, thumbnails responsivos), gestión de seguridad (ban status), y mejora de UX (prefetch de datos).
- **Flujo de datos/información simplificado:**
  ```
  Argumentos/Props → Estado Interno → Efectos/APIs → Valores y Funciones Expuestas
  ```

## 2. Listado de archivos
| Archivo | Tipo | Descripción | Responsabilidad |
|---------|------|------------|----------------|
| useLazyImage.js | Hook | Carga diferida de imágenes con Intersection Observer | Optimizar performance de imágenes en viewport |
| usePrefetch.js | Hook | Prefetch de datos para navegación anticipada | Mejorar velocidad percibida y UX de navegación |
| useBanStatus.js | Hook | Verificación de estado de ban de usuarios | Gestión de seguridad y restricciones de acceso |
| useResponsiveThumbnail.js | Hook | Selección automática de thumbnails responsivos | Optimizar carga de imágenes según dispositivo |
| README.md | Documentación | Guía de uso y API de hooks | Documentar funcionalidad y ejemplos |

## 3. Relaciones internas del módulo
**Diagrama de dependencias:**
```
Hooks Independientes
├── useLazyImage (Intersection Observer API)
├── usePrefetch (Fetch API)
├── useBanStatus (banService)
└── useResponsiveThumbnail (Material-UI breakpoints, Supabase)
```

**Patrones de comunicación:**
- **Hooks independientes**: No hay dependencias entre hooks, cada uno maneja su dominio específico
- **APIs externas**: Integración con servicios (Supabase, banService) a través de abstracción
- **Estado encapsulado**: Cada hook maneja su propio estado interno y efectos
- **Composición**: Hooks diseñados para ser combinados en componentes según necesidades

## 4. Props de los componentes
### useLazyImage
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| src | string | ✓ | URL de la imagen a cargar de forma diferida |
| placeholder | string | ✗ | URL de imagen placeholder durante la carga |
| rootMargin | string | ✗ | Margen del Intersection Observer (ej: "10px") |

### usePrefetch
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| url | string | ✓ | URL o endpoint a prefetch |
| options | object | ✗ | Opciones de configuración para fetch |

### useBanStatus
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| userId | string | ✗ | ID del usuario a verificar (null para usuario actual) |
| enabled | boolean | ✗ | Si debe verificar automáticamente el ban (default: true) |

### useResponsiveThumbnail
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|------------|
| product | object | ✓ | Objeto producto con información de imágenes y thumbnails |

**Notas importantes:** Los hooks son funciones, no componentes. Se llaman dentro de componentes funcionales de React siguiendo las reglas de hooks.

## 5. Hooks personalizados
### `useLazyImage(src, placeholder, rootMargin)`

**Propósito:** Implementa lazy loading de imágenes para mejorar performance inicial y UX, cargando imágenes solo cuando entran en el viewport.

**Estados y efectos principales:**
- `imageSrc`: URL actual mostrada (placeholder o imagen real)
- `isLoaded`: Booleano indicando si la imagen real ya se cargó
- `imgRef`: Ref para asociar al elemento img
- Efecto: Intersection Observer para detectar entrada en viewport

**API que expone:**
- `imageSrc`: URL de la imagen a mostrar
- `isLoaded`: Estado de carga de la imagen
- `imgRef`: Ref para el elemento de imagen

**Ejemplo de uso básico:**
```jsx
const { imageSrc, isLoaded, imgRef } = useLazyImage(
  product.imageUrl, 
  '/placeholder.png',
  '50px'
);
```

### `usePrefetch(url, options)`

**Propósito:** Prefetch de datos para navegación anticipada, mejorando la velocidad percibida de la aplicación.

**Estados y efectos principales:**
- `isPrefetched`: Indica si ya se realizó el prefetch
- `data`: Datos obtenidos del prefetch
- `isLoading`: Estado de carga del prefetch
- Efecto: Fetch bajo demanda con manejo de errores

**API que expone:**
- `prefetch()`: Función para disparar el prefetch manualmente
- `isPrefetched`: Estado de prefetch completado
- `data`: Datos prefetcheados

**Ejemplo de uso básico:**
```jsx
const { prefetch, isPrefetched, data } = usePrefetch('/api/productos');
// Trigger en hover: onMouseEnter={prefetch}
```

### `useBanStatus(userId, enabled)`

**Propósito:** Verificar y gestionar el estado de ban de usuarios para aplicar restricciones de seguridad en tiempo real.

**Estados y efectos principales:**
- `banStatus`: Objeto con estado completo de ban (isBanned, banType, reason, bannedAt)
- `isLoading`: Estado de carga de verificación
- `error`: Errores en la verificación
- Efecto: Verificación automática al montar y cuando cambia userId

**API que expone:**
- `banStatus`: Estado completo de ban del usuario
- `isLoading`: Indicador de carga
- `error`: Estado de error
- `checkBanStatus()`: Función para verificar manualmente
- `reloadBanStatus()`: Función para recargar estado

**Ejemplo de uso básico:**
```jsx
const { banStatus, isLoading, reloadBanStatus } = useBanStatus(user.id);
if (banStatus.isBanned) return <BanScreen reason={banStatus.reason} />;
```

### `useResponsiveThumbnail(product)`

**Propósito:** Seleccionar automáticamente el thumbnail apropiado según el breakpoint actual para optimizar carga y UX responsiva.

**Estados y efectos principales:**
- Breakpoint detection con Material-UI useMediaQuery
- Cache global de thumbnails para evitar consultas repetidas
- Fallback inteligente a imágenes disponibles
- Efecto: Actualización automática al cambiar breakpoint

**API que expone:**
- `thumbnailUrl`: URL del thumbnail apropiado para el dispositivo actual

**Ejemplo de uso básico:**
```jsx
const thumbnailUrl = useResponsiveThumbnail(product);
return <img src={thumbnailUrl} alt={product.name} />;
```

## 6. Dependencias principales
| Dependencia | Versión | Propósito | Impacto |
|-------------|---------|-----------|---------|
| react | ^18.0.0 | Hooks base y funcionalidad core | Alto - Base fundamental |
| @mui/material | ^5.0.0 | useMediaQuery para breakpoints responsivos | Medio - Solo useResponsiveThumbnail |
| ../services/security | - | Servicio de verificación de bans | Medio - Solo useBanStatus |
| ../services/supabase | - | Cliente de base de datos | Medio - Solo useResponsiveThumbnail |

## 7. Consideraciones técnicas
### Limitaciones y advertencias:
- **Browser compatibility**: useLazyImage requiere soporte de Intersection Observer API
- **Performance**: useResponsiveThumbnail mantiene cache global que puede crecer en memoria
- **Dependencias**: Algunos hooks están acoplados a servicios específicos (banService, Supabase)
- **Error handling**: usePrefetch no implementa retry automático en fallos de red

### Deuda técnica relevante:
- **[MEDIA]** Implementar cache persistente y configuración de TTL en usePrefetch
- **[MEDIA]** Agregar tests unitarios para todos los hooks
- **[BAJA]** Permitir configuración avanzada de Intersection Observer
- **[BAJA]** Implementar cleanup automático de cache en useResponsiveThumbnail

## 8. Puntos de extensión
- **Nuevos hooks de utilidad**: Framework preparado para agregar debounce, throttle, localStorage
- **Cache personalizable**: Extensión del sistema de cache para otros hooks
- **Configuración global**: Posibilidad de configurar defaults globales para todos los hooks
- **Interceptores**: Sistema de middleware para hooks que interactúan con APIs
- **TypeScript**: Migración gradual a TypeScript con tipos explícitos

## 9. Ejemplos de uso
### Ejemplo básico:
```jsx
import { useLazyImage, usePrefetch } from 'src/hooks';

function ProductCard({ product }) {
  const { imageSrc, imgRef } = useLazyImage(
    product.imageUrl, 
    '/placeholder.png'
  );
  const { prefetch } = usePrefetch(`/api/products/${product.id}`);

  return (
    <div onMouseEnter={prefetch}>
      <img ref={imgRef} src={imageSrc} alt={product.name} />
      <h3>{product.name}</h3>
    </div>
  );
}
```

### Ejemplo más completo:
```jsx
import { 
  useLazyImage, 
  usePrefetch, 
  useBanStatus, 
  useResponsiveThumbnail 
} from 'src/hooks';

function AdvancedProductGallery({ products, userId }) {
  const { banStatus, isLoading: banLoading } = useBanStatus(userId);
  const { prefetch: prefetchProducts } = usePrefetch('/api/products/trending');

  useEffect(() => {
    // Prefetch productos trending al cargar
    const timer = setTimeout(prefetchProducts, 2000);
    return () => clearTimeout(timer);
  }, [prefetchProducts]);

  if (banLoading) return <Skeleton />;
  if (banStatus.isBanned) return <BanNotice reason={banStatus.reason} />;

  return (
    <Grid container spacing={2}>
      {products.map(product => (
        <ProductItem key={product.id} product={product} />
      ))}
    </Grid>
  );
}

function ProductItem({ product }) {
  const thumbnailUrl = useResponsiveThumbnail(product);
  const { imageSrc, isLoaded, imgRef } = useLazyImage(
    thumbnailUrl,
    '/product-placeholder.jpg',
    '20px'
  );

  return (
    <Card>
      <CardMedia
        component="img"
        ref={imgRef}
        image={imageSrc}
        alt={product.name}
        sx={{
          opacity: isLoaded ? 1 : 0.7,
          transition: 'opacity 0.3s ease'
        }}
      />
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="body2">{product.price}</Typography>
      </CardContent>
    </Card>
  );
}
```

## 10. Rendimiento y optimización
- **Lazy loading**: useLazyImage mejora tiempo de carga inicial reduciendo requests de imágenes
- **Prefetch inteligente**: usePrefetch mejora velocidad percibida en navegación
- **Cache global**: useResponsiveThumbnail evita consultas repetidas con cache en memoria
- **Breakpoint optimization**: Selección automática de tamaño de imagen según dispositivo
- **Memory management**: Cleanup automático de observers y listeners en unmount
- **Debounced effects**: Optimización interna para evitar llamadas excesivas a APIs

**Áreas de mejora identificadas:**
- Implementar cache persistente con TTL configurable
- Agregar métricas de performance y monitoring
- Optimizar re-renders con useMemo/useCallback donde sea necesario

## 11. Actualización
- **Última actualización:** 18/07/2025
