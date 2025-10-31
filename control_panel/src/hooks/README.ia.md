# 🚀 README.ia.md - Módulo Hooks

## 1. 🎯 Resumen ejecutivo del módulo
- **Problema de negocio que resuelve:** Optimiza la performance y UX de la plataforma Sellsi mediante lazy loading inteligente, prefetching estratégico y gestión de seguridad, reduciendo tiempos de carga y mejorando la retención de usuarios
- **Responsabilidad principal:** Centralizar lógica reutilizable de optimización y proporcionar hooks especializados para casos de uso específicos de e-commerce
- **Posición en la arquitectura:** Capa de utilidades transversal - Proporciona hooks que pueden ser utilizados por cualquier módulo de la aplicación
- **Criticidad:** ALTA - Directamente impacta performance, UX y seguridad de toda la aplicación
- **Usuarios objetivo:** Desarrolladores frontend que necesitan optimizaciones de performance, componentes que manejan imágenes y navegación

## 2. 📊 Análisis de complejidad
- **Líneas de código:** ~575 LOC
- **Complejidad ciclomática:** MEDIA-ALTA - Lógica compleja de observers, cache, prefetch estratégico y manejo de estados múltiples
- **Acoplamiento:** BAJO-MEDIO - Dependencias mínimas con servicios específicos, mayoría son APIs nativas del browser
- **Cohesión:** ALTA - Todos los hooks están relacionados funcionalmente con optimización y performance
- **Deuda técnica estimada:** BAJA-MEDIA - Código bien estructurado pero necesita tests y configuración avanzada

## 3. 🗂️ Inventario completo de archivos
| Archivo | Tipo | LOC | Complejidad | Descripción funcional | Dependencias clave |
|---------|------|-----|-------------|----------------------|-------------------|
| useLazyImage.js | Hook | ~124 | MEDIA | Lazy loading avanzado con progressive loading | Intersection Observer, React hooks |
| usePrefetch.js | Hook | ~177 | ALTA | Prefetching inteligente basado en patrones de navegación | React Router, dynamic imports |
| useBanStatus.js | Hook | ~76 | MEDIA | Verificación de estado de ban con polling | banService, React hooks |
| useResponsiveThumbnail.js | Hook | ~278 | ALTA | Selección automática de thumbnails con cache global | Material-UI, Supabase, useMediaQuery |
| README.md | Documentación | ~100 | BAJA | Documentación de APIs y ejemplos | - |

## 4. 🏗️ Arquitectura y patrones
- **Patrones de diseño identificados:**
  - **Observer Pattern** (Intersection Observer para lazy loading)
  - **Strategy Pattern** (diferentes estrategias de prefetch por contexto)
  - **Cache Pattern** (cache global de thumbnails y prefetch)
  - **Factory Pattern** (generación dinámica de funciones de importación)
- **Estructura de carpetas:**
  ```
  hooks/
  ├── useLazyImage.js (Optimización de imágenes)
  ├── usePrefetch.js (Optimización de navegación)
  ├── useBanStatus.js (Seguridad y restricciones)
  └── useResponsiveThumbnail.js (Responsive image optimization)
  ```
- **Flujo de datos principal:**
  ```
  Hook Parameters → Internal State Management → Browser APIs → Optimized Output
  ├── State initialization
  ├── Effect registration
  ├── Cleanup management
  └── Return optimized values
  ```
- **Puntos de entrada:** Exports individuales de cada hook desde archivos específicos
- **Puntos de salida:** Objetos con estado optimizado, funciones de control y refs para integración

## 5. 🔗 Matriz de dependencias
#### Dependencias externas:
| Dependencia | Versión | Uso específico | Impacto en refactor | Alternativas |
|-------------|---------|----------------|-------------------|--------------|
| react | ^18.0.0 | Hooks base (useState, useEffect, useRef) | CRÍTICO - Core de toda la funcionalidad | No hay alternativas |
| react-router-dom | ^6.0.0 | useLocation para prefetch contextual | ALTO - usePrefetch depende | Reach Router (deprecated) |
| @mui/material | ^5.0.0 | useMediaQuery para breakpoints | MEDIO - Solo useResponsiveThumbnail | CSS media queries manuales |

#### Dependencias internas:
| Módulo interno | Tipo uso | Función específica | Acoplamiento |
|----------------|----------|-------------------|--------------|
| ../services/security | Importa | Verificación de estado de ban | MEDIO |
| ../services/supabase | Importa | Cliente de base de datos para thumbnails | MEDIO |
| ../features/[modules] | Dynamic import | Componentes lazy para prefetch | BAJO |

## 6. 🧩 API del módulo
#### Hooks exportados:
```jsx
// Ejemplo de uso completo del ecosistema de hooks
import { 
  useLazyImage,
  usePrefetch,
  useBanStatus,
  useResponsiveThumbnail,
  useImagePreloader,
  usePrefetchOnHover
} from 'src/hooks';

function OptimizedProductGallery({ products, userId }) {
  const { banStatus } = useBanStatus(userId);
  const { prefetchRoute } = usePrefetch();
  
  if (banStatus.isBanned) return <BanScreen />;
  
  return (
    <ProductGrid 
      products={products}
      onProductHover={(product) => prefetchRoute(`/product/${product.id}`)}
    />
  );
}
```

#### Props detalladas:
**useLazyImage(src, options)**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| src | string | ✅ | - | Valid URL | URL de la imagen a cargar | "https://example.com/image.jpg" |
| options.placeholder | string | ❌ | "/placeholder-product.jpg" | Valid URL | Imagen mostrada durante carga | "/loading.png" |
| options.threshold | number | ❌ | 0.1 | 0-1 | Porcentaje visible para trigger | 0.5 |
| options.rootMargin | string | ❌ | "50px" | CSS margin | Margen del observer | "100px 0px" |
| options.enableProgressiveLoading | boolean | ❌ | true | boolean | Activar carga progresiva | false |

**usePrefetch()**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| - | - | - | - | - | Hook sin parámetros | usePrefetch() |

**useBanStatus(userId, enabled)**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| userId | string\|null | ❌ | null | UUID format | ID del usuario a verificar | "uuid-123" |
| enabled | boolean | ❌ | true | boolean | Activar verificación automática | false |

**useResponsiveThumbnail(product)**
| Prop | Tipo | Requerido | Valor por defecto | Validación | Descripción | Ejemplo |
|------|------|-----------|------------------|------------|-------------|---------|
| product | object | ✅ | - | Product schema | Objeto con datos de imagen | {id, imagen, thumbnails} |

#### Hooks personalizados:
**useLazyImage(src, options)**
- **Propósito:** Lazy loading avanzado de imágenes con progressive loading y manejo de errores
- **Parámetros:** src (string), options (object con configuraciones)
- **Retorno:**
  ```jsx
  {
    imageSrc: string,      // URL actual (placeholder o imagen real)
    isLoaded: boolean,     // Si la imagen real ya se cargó
    isLoading: boolean,    // Si está en proceso de carga
    error: boolean,        // Si hubo error en la carga
    imgRef: RefObject      // Ref para el elemento img
  }
  ```
- **Estados internos:** Gestión de placeholder, carga, error y referencia DOM
- **Efectos:** Intersection Observer para detectar viewport, carga de imagen con fallbacks
- **Casos de uso:** Galerías de productos, imágenes hero, contenido multimedia
- **Limitaciones:** Requiere soporte de Intersection Observer (IE11+)

**usePrefetch()**
- **Propósito:** Sistema inteligente de prefetching basado en patrones de navegación
- **Parámetros:** Ninguno (configuración interna basada en rutas)
- **Retorno:**
  ```jsx
  {
    prefetchRoute: (routePath: string) => void,
    prefetchWithDelay: (routePath: string, delay?: number) => void,
    prefetchRelatedRoutes: () => void,
    cancelPrefetch: (routePath: string) => void
  }
  ```
- **Estados internos:** Set de rutas prefetcheadas, timers activos, mapas de rutas relacionadas
- **Efectos:** Dynamic imports automáticos, limpieza de timers, prefetch contextual
- **Casos de uso:** Hover sobre navegación, prefetch automático de rutas probables
- **Limitaciones:** Solo funciona con rutas predefinidas en ROUTE_COMPONENTS

## 7. 🔍 Análisis de estado
- **Estado global usado:**
  - Cache global de thumbnails (useResponsiveThumbnail)
  - Set global de rutas prefetcheadas (usePrefetch)
  - Material-UI Theme context para breakpoints
- **Estado local:**
  - Estados de carga de imágenes (isLoaded, isLoading, error)
  - Estado de ban del usuario (banStatus, isLoading, error)
  - Referencias DOM para observers (imgRef)
  - Timers y cleanup functions
- **Persistencia:**
  - Cache de thumbnails en memoria (no persistente)
  - Set de rutas prefetcheadas en sesión
- **Sincronización:**
  - Observer sync con DOM elements
  - Breakpoint sync con Material-UI theme
  - Route changes sync con React Router
- **Mutaciones:**
  - Cache updates en useResponsiveThumbnail
  - Prefetch state updates en usePrefetch
  - Image loading state transitions

## 8. 🎭 Lógica de negocio
- **Reglas de negocio implementadas:**
  - Lazy loading solo cuando imagen entra en viewport (optimización de ancho de banda)
  - Prefetch contextual basado en tipo de usuario (buyer vs supplier)
  - Verificación de ban antes de permitir acciones críticas
  - Selección automática de thumbnail según dispositivo (ahorro de datos móviles)
  - Progressive loading para imágenes de Supabase
- **Validaciones:**
  - URL válidas para imágenes y thumbnails
  - Estados de usuario válidos para verificación de ban
  - Formato correcto de productos para thumbnails responsivos
  - Rutas válidas para prefetching
- **Transformaciones de datos:**
  - URLs de placeholder a imagen real en lazy loading
  - Rutas de navegación a dynamic imports
  - Objetos de producto a URLs de thumbnail optimizadas
  - Estados de ban a booleanos de restricción
- **Casos especiales:**
  - Fallback a placeholder en caso de error de carga
  - Cleanup de observers en unmount de componentes
  - Cancelación de prefetch en navegación rápida
  - Cache invalidation en cambios de breakpoint
- **Integraciones:**
  - Intersection Observer API para viewport detection
  - React Router para navegación y prefetch
  - Supabase para gestión de imágenes
  - Material-UI para breakpoints responsivos

## 9. 🔄 Flujos de usuario
**Flujo principal de lazy loading:**
1. Componente monta con imagen → Mostrar placeholder → Observer registrado
2. Usuario hace scroll → Imagen entra en viewport → Trigger carga real
3. Imagen carga exitosamente → Transición smooth a imagen real → Observer limpiado
4. Si error → Mantener placeholder → Log error → Permitir retry

**Flujo de prefetch inteligente:**
1. Usuario entra a página → Analizar contexto actual → Identificar rutas probables
2. Después de 2s → Prefetch rutas relacionadas automáticamente
3. Usuario hace hover → Trigger prefetch con delay → Dynamic import en background
4. Usuario navega → Componente ya está cargado → Navegación instantánea

**Flujo de verificación de ban:**
1. Hook se monta → Verificar si está habilitado → Llamar banService
2. Resultado obtenido → Actualizar estado → Trigger re-render si necesario
3. Si usuario bannado → Mostrar restricciones → Bloquear acciones
4. Polling opcional → Re-verificar cada X tiempo → Actualizar estado dinámicamente

**Flujo de thumbnail responsivo:**
1. Hook recibe producto → Detectar breakpoint actual → Buscar en cache
2. Si no en cache → Generar URL apropiada → Guardar en cache global
3. Cambio de breakpoint → Re-evaluar thumbnail → Actualizar URL
4. Cleanup automático → Limpiar cache → Prevenir memory leaks

**Flujos alternativos:**
- **Error de red:** Retry automático con exponential backoff
- **Componente unmount:** Cleanup de observers, timers y efectos
- **Navegación rápida:** Cancelación de prefetch en progreso
- **Cache full:** Limpieza de entradas más antiguas

## 10. 🧪 Puntos de testing
- **Casos de prueba críticos:**
  - Lazy loading correcto con diferentes umbrales de viewport
  - Prefetch automático de rutas relacionadas según contexto
  - Verificación de ban con diferentes estados de usuario
  - Selección correcta de thumbnail según breakpoint
  - Cleanup adecuado de observers y timers en unmount
- **Mocks necesarios:**
  - Intersection Observer API para entornos de testing
  - Dynamic import resolution para prefetch testing
  - banService responses para diferentes estados
  - Material-UI useMediaQuery para breakpoint testing
  - Image loading events (onload, onerror)
- **Datos de prueba:**
  - URLs de imágenes válidas e inválidas
  - Objetos de producto con diferentes configuraciones de thumbnail
  - Estados de usuario (banned, active, suspended)
  - Rutas de navegación válidas e inválidas
- **Escenarios de error:**
  - Fallo de carga de imagen con retry
  - Error de red en verificación de ban
  - Browser sin soporte de Intersection Observer
  - Prefetch de ruta inexistente
- **Performance:**
  - Tiempo de lazy loading bajo diferentes condiciones de red
  - Memoria consumida por cache de thumbnails
  - Overhead de prefetch en navegación

## 11. 🚨 Puntos críticos para refactor
- **Código legacy:**
  - useResponsiveThumbnail tiene lógica compleja que podría separarse
  - Hardcoded route mappings en usePrefetch necesitan configuración externa
  - Cache global sin TTL puede crecer indefinidamente
- **Antipatrones:**
  - Direct DOM manipulation podría usar más React refs
  - Global cache sin cleanup automático
  - Mixed concerns en algunos hooks (UI + business logic)
- **Oportunidades de mejora:**
  - Implementar cache persistente con TTL configurable
  - Extraer configuraciones a archivos externos
  - Agregar métricas y analytics de performance
  - Implementar retry policies configurables
- **Riesgos:**
  - Cambios en APIs de browser pueden romper observers
  - Dependencias de routing pueden cambiar
  - Cache puede causar memory leaks en apps de larga duración
- **Orden de refactor:**
  1. Extraer configuraciones y constantes a archivos separados
  2. Implementar cache con TTL y cleanup automático
  3. Agregar tests unitarios completos
  4. Separar concerns en hooks complejos
  5. Implementar métricas de performance

## 12. 🔧 Consideraciones técnicas
#### Limitaciones actuales:
- **Performance:**
  - Cache global de thumbnails puede consumir memoria excesiva
  - Múltiples observers simultáneos en páginas con muchas imágenes
  - Prefetch agresivo puede impactar ancho de banda
- **Memoria:**
  - Cache sin límite de tamaño puede crecer indefinidamente
  - Referencias DOM no limpiadas en algunos edge cases
  - Timers activos pueden acumularse
- **Escalabilidad:**
  - Route mappings hardcoded limitan flexibilidad
  - Cache global no es thread-safe para futuras implementaciones
- **Compatibilidad:**
  - Intersection Observer requiere polyfill para IE11
  - Dynamic imports no soportados en versiones muy antiguas

#### Configuración requerida:
- **Variables de entorno:**
  - REACT_APP_PREFETCH_DELAY para configurar timing
  - REACT_APP_CACHE_SIZE para límites de cache
- **Inicialización:**
  - Polyfill de Intersection Observer para browsers antiguos
  - Material-UI ThemeProvider para breakpoints
- **Permisos:**
  - Acceso a APIs de imagen para carga
  - Acceso a servicios de autenticación para ban status

## 13. 🔒 Seguridad y compliance
- **Datos sensibles:**
  - URLs de imágenes pueden revelar estructura de almacenamiento
  - Estados de ban contienen información de seguridad
  - Cache puede contener datos de sesiones anteriores
- **Validaciones de seguridad:**
  - Sanitización de URLs de imágenes
  - Verificación de permisos antes de prefetch
  - Timeout en requests para evitar ataques de denegación
- **Permisos:**
  - Acceso a servicios de seguridad para verificación de ban
  - Permisos de lectura en sistema de archivos de imágenes
- **Auditoría:**
  - Log de acciones de prefetch para análisis de patrones
  - Tracking de errores de carga para debugging
  - Métricas de uso de cache para optimización

## 14. 📚 Referencias y documentación
- **Documentación técnica:**
  - [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
  - [React Hooks Documentation](https://reactjs.org/docs/hooks-intro.html)
  - [Dynamic Imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Dynamic_Imports)
- **Decisiones de arquitectura:**
  - Uso de Intersection Observer por performance superior a scroll listeners
  - Cache global vs local por eficiencia de memoria compartida
  - Prefetch basado en patrones vs machine learning por simplicidad
- **Recursos externos:**
  - [React Router v6 Lazy Loading](https://reactrouter.com/docs/en/v6/guides/lazy-loading)
  - [Material-UI useMediaQuery](https://mui.com/material-ui/react-use-media-query/)
  - [Web Performance Best Practices](https://web.dev/performance/)
- **Historial de cambios:**
  - v1.0: Hooks básicos de lazy loading y prefetch
  - v2.0: Agregado useResponsiveThumbnail con cache
  - v3.0: Sistema de ban status integrado
  - v4.0: Prefetch inteligente basado en contexto

## 15. 🎨 Ejemplos de uso avanzados
```jsx
// Ejemplo 1: E-commerce optimizado completo
import { 
  useLazyImage, 
  usePrefetch, 
  useBanStatus, 
  useResponsiveThumbnail 
} from 'src/hooks';

function OptimizedProductCatalog({ products, userId, userType }) {
  const { banStatus, isLoading: banLoading } = useBanStatus(userId);
  const { prefetchRoute, prefetchRelatedRoutes } = usePrefetch();

  useEffect(() => {
    // Prefetch contextual según tipo de usuario
    if (userType === 'buyer') {
      prefetchRoute('/buyer/cart');
      prefetchRoute('/buyer/orders');
    } else if (userType === 'supplier') {
      prefetchRoute('/supplier/myproducts');
    }
    
    // Prefetch rutas relacionadas después de 3s
    setTimeout(prefetchRelatedRoutes, 3000);
  }, [userType, prefetchRoute, prefetchRelatedRoutes]);

  if (banLoading) return <CatalogSkeleton />;
  if (banStatus.isBanned) return <AccessDenied reason={banStatus.reason} />;

  return (
    <ProductGrid>
      {products.map(product => (
        <OptimizedProductCard 
          key={product.id} 
          product={product}
          onHover={() => prefetchRoute(`/product/${product.id}`)}
        />
      ))}
    </ProductGrid>
  );
}

function OptimizedProductCard({ product, onHover }) {
  const thumbnailUrl = useResponsiveThumbnail(product);
  const { imageSrc, isLoaded, imgRef } = useLazyImage(thumbnailUrl, {
    placeholder: '/product-placeholder.webp',
    threshold: 0.25,
    rootMargin: '100px',
    enableProgressiveLoading: true
  });

  return (
    <Card onMouseEnter={onHover}>
      <CardMedia
        component="img"
        ref={imgRef}
        image={imageSrc}
        alt={product.name}
        sx={{
          opacity: isLoaded ? 1 : 0.8,
          transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          filter: isLoaded ? 'none' : 'blur(2px)'
        }}
      />
      <CardContent>
        <Typography variant="h6">{product.name}</Typography>
        <Typography variant="h5" color="primary">
          {product.price}
        </Typography>
      </CardContent>
    </Card>
  );
}

// Ejemplo 2: Gallery avanzada con preloading
function AdvancedImageGallery({ images, currentIndex }) {
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  
  // Preload imágenes adyacentes
  useEffect(() => {
    const preloadAdjacent = async () => {
      const toPreload = [
        images[currentIndex - 1],
        images[currentIndex + 1],
        images[currentIndex + 2]
      ].filter(Boolean);

      for (const img of toPreload) {
        if (!preloadedImages.has(img.id)) {
          const imageElement = new Image();
          imageElement.src = img.url;
          imageElement.onload = () => {
            setPreloadedImages(prev => new Set([...prev, img.id]));
          };
        }
      }
    };

    preloadAdjacent();
  }, [currentIndex, images, preloadedImages]);

  return (
    <ImageViewer>
      {images.map((image, index) => (
        <GalleryImage 
          key={image.id}
          image={image}
          isActive={index === currentIndex}
          isPreloaded={preloadedImages.has(image.id)}
        />
      ))}
    </ImageViewer>
  );
}

// Ejemplo 3: Hook personalizado combinando múltiples optimizaciones
function useOptimizedProduct(productId, userId) {
  const [product, setProduct] = useState(null);
  const { banStatus } = useBanStatus(userId);
  const { prefetchRoute } = usePrefetch();
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (banStatus.isBanned) return;
      
      try {
        const productData = await fetch(`/api/products/${productId}`);
        setProduct(await productData.json());
        
        // Prefetch productos relacionados
        prefetchRoute(`/api/products/${productId}/related`);
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [productId, banStatus.isBanned, prefetchRoute]);

  const thumbnailUrl = useResponsiveThumbnail(product);
  const imageProps = useLazyImage(thumbnailUrl, {
    placeholder: '/product-skeleton.svg',
    enableProgressiveLoading: true
  });

  return {
    product,
    imageProps,
    isAccessible: !banStatus.isBanned,
    banReason: banStatus.reason
  };
}

// Ejemplo 4: Performance monitoring
function usePerformanceMonitoring() {
  const { prefetchRoute } = usePrefetch();
  const performanceRef = useRef({
    prefetchTimes: new Map(),
    imageLoadTimes: new Map(),
    cacheHits: 0,
    cacheMisses: 0
  });

  const monitoredPrefetch = useCallback((route) => {
    const startTime = performance.now();
    
    prefetchRoute(route).then(() => {
      const endTime = performance.now();
      performanceRef.current.prefetchTimes.set(route, endTime - startTime);
    });
  }, [prefetchRoute]);

  const getPerformanceMetrics = useCallback(() => {
    return {
      averagePrefetchTime: Array.from(performanceRef.current.prefetchTimes.values())
        .reduce((a, b) => a + b, 0) / performanceRef.current.prefetchTimes.size,
      cacheHitRate: performanceRef.current.cacheHits / 
        (performanceRef.current.cacheHits + performanceRef.current.cacheMisses),
      totalPrefetches: performanceRef.current.prefetchTimes.size
    };
  }, []);

  return { monitoredPrefetch, getPerformanceMetrics };
}
```

## 16. 🔄 Guía de migración
- **Desde versión anterior:**
  - Actualizar imports de hooks renombrados
  - Migrar configuraciones hardcoded a archivos de configuración
  - Reemplazar cache global con implementación con TTL
- **Breaking changes:**
  - usePrefetch ya no acepta parámetros, usa contexto automático
  - useResponsiveThumbnail requiere objeto product completo
  - Cache API cambió para incluir invalidation automática
- **Checklist de migración:**
  1. ✅ Actualizar imports de todos los hooks
  2. ✅ Migrar configuraciones a archivos externos
  3. ✅ Implementar nuevos polyfills si es necesario
  4. ✅ Actualizar tests para nuevas APIs
  5. ✅ Verificar performance en producción
- **Rollback:**
  - Mantener versión anterior como fallback
  - Feature flags para activación gradual
  - Monitoring específico para detectar regresiones

## 17. 📋 Metadatos del documento
- **Creado:** 18/07/2025
- **Última actualización:** 18/07/2025
- **Versión del código:** staging branch
- **Autor:** Generado automáticamente por Pipeline ReadmeV4
- **Próxima revisión:** 18/08/2025
