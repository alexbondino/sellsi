/**
 * COMPONENTE UNIVERSAL DE IMAGEN DE PRODUCTO
 * 
 * Componente que maneja todas las necesidades de imágenes de productos:
 * - Thumbnails responsivos verificados
 * - Detección automática de errores 404
 * - Fallbacks inteligentes
 * - Cache invalidation automático
 * - Compatible con todos los tamaños y contextos
 */

import React, { useState, useCallback, useEffect } from 'react';
import { FeatureFlags, ThumbTimings } from '../shared/flags/featureFlags';
import { Avatar, Box, Skeleton, CircularProgress } from '@mui/material';
import { BrokenImage as BrokenImageIcon } from '@mui/icons-material';
import { LazyImage } from '../shared/components/display/LazyImage';
import { useResponsiveThumbnail, useMinithumb } from '../hooks/useResponsiveThumbnail';
import { useThumbnailPhaseQuery, invalidateTransientThumbnailKeys } from '../hooks/thumbnails/useThumbnailPhaseQuery.js'
import { useInViewport } from '../hooks/useInViewport.js'
import { useQueryClient } from '@tanstack/react-query';
import { getProductImageUrl } from '../utils/getProductImageUrl';

const UniversalProductImage = ({
  product,
  size = 'responsive', // 'minithumb', 'mobile', 'tablet', 'desktop', 'responsive'
  width,
  height,
  sx = {},
  alt,
  fallbackIcon = BrokenImageIcon,
  onError,
  onLoad,
  lazy = true,
  // priority = eager (useful for cart / product card)
  priority = false,
  // ✅ NUEVO: imagePriority separada para controlar solo fetchpriority
  imagePriority = false,
  // rootMargin forwarded to LazyImage
  rootMargin = '150px',
  // safety timeout (ms) to fall back to eager if observer never fires
  observerTimeoutMs = 500,
  aspectRatio,
  objectFit = 'contain',
  borderRadius = 0,
  // Static fallback image URL (e.g. Sellsi logo) to try when all image attempts fail
  staticFallback,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);
  const [forceUseFallback, setForceUseFallback] = useState(false); // Nuevo estado para forzar uso de fallback
  const [overrideSrc, setOverrideSrc] = useState(null); // when set, force this src (used for staticFallback)
  const retryCountRef = React.useRef(0);
  const queryClient = useQueryClient();
  const [forceEager, setForceEager] = useState(false);

  // Hooks para obtener thumbnails
  const { thumbnailUrl: responsiveThumbnail, isLoading: responsiveLoading } = useResponsiveThumbnail(product);
  const productId = product?.id || product?.productid || product?.product_id || product?.productId;
  const minithumb = useMinithumb(product);

  // Debug log removed to avoid noisy console output in dev.

  // Phase-aware query state
  // Si el producto ya trae thumbnail_url o thumbnails, asumimos fase final lista
  const [currentPhase, setCurrentPhase] = useState(
    (product?.thumbnail_url || product?.thumbnailUrl || product?.thumbnails) ? 'thumbnails_ready' : null
  )
  
  const { ref: viewportRef, inView } = useInViewport({ once: true, rootMargin: '200px' })
  const phaseQuery = useThumbnailPhaseQuery(productId, currentPhase, { enabled: !FeatureFlags.ENABLE_VIEWPORT_THUMBS || inView })
  const phaseDataThumbUrl = phaseQuery.data?.thumbnail_url

  // ÚNICO PUNTO DE RESET: Solo cuando cambia realmente el producto
  useEffect(() => {
    setImageError(false);
    setAttemptedFallback(false);
    setForceUseFallback(false);
    setOverrideSrc(null);
    retryCountRef.current = 0;

    if (product && (product.thumbnail_url || product.thumbnailUrl || product.thumbnails)) {
      setCurrentPhase('thumbnails_ready')
    } else {
      setCurrentPhase(null)
    }
  }, [product?.id || product?.productid]);

  // ✅ SAFETY: if lazy loading is enabled but the observer never triggers, fall back to eager after a short timeout
  // ✅ MEJORADO: Timeout más corto y forzar eager si priority=false para evitar imágenes que no cargan
  useEffect(() => {
    if (!lazy || priority) return undefined; // no timeout when not lazy or when priority forces eager
    if (inView) {
      // observer already fired, no need for timeout
      setForceEager(false);
      return undefined;
    }
    let t = null;
    // ✅ TIMEOUT MÁS CORTO para imágenes con baja prioridad para evitar que no carguen nunca
    const timeoutMs = priority ? observerTimeoutMs : 200; // Timeout más agresivo para low priority
    t = setTimeout(() => {
      setForceEager(true);
      // eslint-disable-next-line no-console
    // observer timeout - falling back to eager for reliability
    }, timeoutMs);
    return () => {
      if (t) clearTimeout(t);
    };
  }, [lazy, priority, inView, observerTimeoutMs, productId]);  // Determinar la URL a usar basada en el tamaño solicitado
  const selectedThumbnail = React.useMemo(() => {
    // If an override src was set (e.g. staticFallback after an error), use it immediately
    if (overrideSrc) return overrideSrc;
    if (!product) return '/placeholder-product.jpg';

    // Si necesitamos forzar el uso del fallback, usar la imagen principal directamente
    if (forceUseFallback || attemptedFallback) {
      const fallbackImage = product?.imagen || product?.image;
      if (fallbackImage && fallbackImage !== '/placeholder-product.jpg') {
        // Debug log para entender qué está pasando
  // development-only logging removed
        
        // Si fallbackImage ya es una URL completa, usarla directamente
        if (typeof fallbackImage === 'string' && /^https?:\/\//.test(fallbackImage)) {
          return fallbackImage;
        }
        
        // Si es un path relativo, construir la URL correctamente
        if (typeof fallbackImage === 'string') {
          // Usar la misma lógica que ProductImageGallery
          const constructedUrl = getProductImageUrl(fallbackImage, product, false);
          // development-only logging removed
          return constructedUrl;
        }
        
        return fallbackImage;
      }
      // Si no hay imagen principal válida, usar placeholder
      return '/placeholder-product.jpg';
    }

    // Usar los hooks que ya manejan fallbacks internamente (solo si no estamos forzando fallback)
    switch (size) {
      case 'minithumb':
        // useMinithumb ya incluye fallback a imagen principal
        return minithumb || '/placeholder-product.jpg';
      case 'mobile': {
        // Intentar thumbnail mobile específico, luego fallback a imagen principal
        let mobile = product?.thumbnails?.mobile;
        const source = phaseDataThumbUrl || responsiveThumbnail || product?.thumbnail_url || product?.thumbnailUrl;
        if (!mobile && source && typeof source === 'string') {
          if (source.includes('_mobile_')) mobile = source;
          else if (source.includes('_desktop_320x260')) mobile = source.replace('_desktop_320x260.jpg', '_mobile_190x153.jpg');
          else if (source.includes('_tablet_300x230')) mobile = source.replace('_tablet_300x230.jpg', '_mobile_190x153.jpg');
        }
        // Si no hay mobile thumbnail, usar imagen principal
        return mobile || product?.imagen || product?.image || '/placeholder-product.jpg';
      }
      case 'responsive':
      default:
        // useResponsiveThumbnail ya incluye fallback a imagen principal
        return responsiveThumbnail || '/placeholder-product.jpg';
    }
  }, [product, size, minithumb, responsiveThumbnail, phaseDataThumbUrl, forceUseFallback, attemptedFallback]);

  // Manejar errores de carga de imagen
  const handleImageError = useCallback(() => {
  // development-only logging removed

    // Si no hemos intentado fallback aún y hay imagen principal disponible
    if (!attemptedFallback && !forceUseFallback) {
      const fallbackImage = product?.imagen || product?.image;
      if (fallbackImage && fallbackImage !== '/placeholder-product.jpg' && fallbackImage !== selectedThumbnail) {
        // Usar setTimeout para asegurar que el estado se actualiza en el próximo ciclo
        // Esto evita conflictos con el useMemo que podría ejecutarse con valores previos
        setTimeout(() => {
          setForceUseFallback(true);
          setAttemptedFallback(true);
        }, 0);

        return; // No marcar como error, intentar con fallback
      }
    }

    setImageError(true);

    // If a static fallback is provided (e.g. Sellsi logo), try it once before showing broken icon
    if (staticFallback && !overrideSrc) {
      // avoid infinite loops: if staticFallback equals selectedThumbnail, skip
      if (staticFallback !== selectedThumbnail) {
        setOverrideSrc(staticFallback);
        return; // try loading the static fallback first
      }
    }

    // FUNCIONALIDAD PRINCIPAL: Invalidar cache cuando hay error 404
    if (productId) {
      const cacheKey = ['thumbnail', productId];

      // Invalidar cache de React Query para este producto
      queryClient.invalidateQueries({
        queryKey: cacheKey,
        exact: false
      });

      // Solo reintentar si aún no hemos intentado fallback y tenemos menos de 2 reintentos
      if (!attemptedFallback && retryCountRef.current < 1) {
        setTimeout(() => {
          retryCountRef.current = retryCountRef.current + 1;
          setImageError(false);
        }, 1000);
      }
    }

    // Callback personalizado de error
    if (onError) {
      onError();
    }
  }, [product, onError, selectedThumbnail, queryClient, attemptedFallback, forceUseFallback, productId]);

  // Manejar carga exitosa de imagen
  const handleImageLoad = useCallback(() => {
    setImageError(false);
    // NO RESETEAR attemptedFallback y forceUseFallback aquí - solo cuando cambie el producto
    retryCountRef.current = 0; // Reset retry count cuando carga exitosamente
    if (onLoad) onLoad();
  }, [onLoad]);

  // Nombre alternativo para la imagen
  const imageAlt = alt || `${product?.nombre || product?.name || 'Producto'}`;

  // Estilos base del componente
  const baseStyles = {
    width: width || '100%',
    height: height || 'auto',
    borderRadius,
    ...sx
  };

  // Listener para imágenes procesadas en background (reubicado arriba para no quedar tras returns)
  useEffect(() => {
    const timers = {}
    const handleImagesReady = (event) => {
      const { productId: readyProductId, phase } = event.detail || {};
      if (!readyProductId || readyProductId !== productId) return;
      if (FeatureFlags.ENABLE_PHASED_THUMB_EVENTS) {
        if (!['thumbnails_ready', 'thumbnails_skipped_webp'].includes(phase)) return
      }
      setCurrentPhase(phase)
      if (timers[readyProductId]) clearTimeout(timers[readyProductId])
      timers[readyProductId] = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['thumbnail', productId], exact: false })
        invalidateTransientThumbnailKeys(productId)
        setImageError(false)
        // NO RESETEAR attemptedFallback y forceUseFallback automáticamente
        // Solo si realmente hay nuevas imágenes válidas
        const hasNewValidImages = phaseQuery.data?.thumbnail_url && 
          phaseQuery.data.thumbnail_url !== selectedThumbnail;
        
        if (hasNewValidImages) {
          setAttemptedFallback(false);
          setForceUseFallback(false);
        }
        
        // reset without causing re-render
        retryCountRef.current = 0;
        setTimeout(() => {
          // touch ref to preserve previous behavior without state updates
          retryCountRef.current = retryCountRef.current + 1;
          retryCountRef.current = retryCountRef.current - 1;
        }, 100)
      }, ThumbTimings.PHASE_EVENT_DEBOUNCE_MS)
    }
    window.addEventListener('productImagesReady', handleImagesReady)
    return () => window.removeEventListener('productImagesReady', handleImagesReady)
  }, [productId, queryClient])

  // Solo mostrar ícono roto si:
  // 1. Hay error de imagen Y
  // 2. Ya intentamos fallback a imagen principal Y  
  // 3. Realmente no hay imagen válida que mostrar
  const shouldShowBrokenIcon = imageError && attemptedFallback && (
    !selectedThumbnail || 
    selectedThumbnail === '/placeholder-product.jpg'
  );

  // Debug logging en desarrollo
  // development-only debug logs removed
  
  // Mostrar spinner durante reintentos (incluyendo intento de fallback)
  if (imageError && !attemptedFallback && retryCountRef.current < 1) {
    let avatarSize = 64;
    if (typeof baseStyles.width === 'number') avatarSize = baseStyles.width;
    else if (typeof baseStyles.height === 'number') avatarSize = baseStyles.height;
    else if (typeof width === 'number') avatarSize = width;
    else if (typeof height === 'number') avatarSize = height;
    return (
      <Avatar
        sx={{
          ...baseStyles,
          bgcolor: 'grey.100',
          color: 'grey.400',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        }}
        {...props}
      >
        <CircularProgress color="primary" size={avatarSize * 0.7} thickness={4} />
      </Avatar>
    );
  }

  // Mostrar icono de imagen rota solo cuando realmente no hay alternativas
  if (shouldShowBrokenIcon) {
    const FallbackIcon = fallbackIcon;
    return (
      <Avatar
        sx={{
          ...baseStyles,
          bgcolor: 'grey.100',
          color: 'grey.400',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem'
        }}
        {...props}
      >
        <FallbackIcon sx={{ fontSize: 'inherit' }} />
      </Avatar>
    );
  }

  // Renderizar imagen lazy o normal según configuración
  // ✅ MEJORADO: Ser más conservador con lazy loading para evitar imágenes que no cargan
  // Decide if we should render lazy or eager: priority overrides lazy; forceEager flips back to eager
  const shouldLazy = lazy && !priority && !forceEager;
  
  // ✅ Determinar fetchpriority basado en imagePriority (separado de eager/lazy)
  const fetchPriority = imagePriority ? 'high' : 'auto';
  
  if (shouldLazy) {
    return (
      <LazyImage
        src={selectedThumbnail}
        alt={imageAlt}
        aspectRatio={aspectRatio}
        rootMargin={rootMargin}
        objectFit={objectFit}
        sx={baseStyles}
        ref={viewportRef}
        fetchPriority={fetchPriority} // ✅ Añadir fetchpriority a LazyImage
        onError={() => {
          handleImageError();
        }}
        onLoad={() => {
          handleImageLoad();
        }}
        {...props}
      />
    );
  }

  // Imagen normal (no lazy)
  return (
    <Box
      component="img"
      src={selectedThumbnail}
      alt={imageAlt}
      fetchPriority={fetchPriority} // ✅ Añadir fetchpriority a imagen normal
      sx={{
        ...baseStyles,
        objectFit,
        display: 'block'
      }}
      ref={viewportRef}
      onError={() => {
        
        handleImageError();
      }}
      onLoad={() => {
        
        handleImageLoad();
      }}
      {...props}
    />
  );

  // (Eliminado código inalcanzable y return redundante)
};

// Componentes especializados para casos de uso específicos

/**
 * Componente específico para minithumb (40x40) - Para usar en listas, carrito, etc.
 */
export const MinithumbImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="minithumb"
    width={40}
    height={40}
    {...props}
  />
);

/**
 * Componente para ProductCard - Usa thumbnail responsivo
 * @param {Object} product - Datos del producto
 * @param {string} type - Tipo de card ('buyer', 'provider', 'supplier')
 * @param {boolean} priority - Si la imagen debe tener alta prioridad (fetchpriority="high")
 * @param {Object} props - Props adicionales para UniversalProductImage
 */
export const ProductCardImage = ({ product, type = 'buyer', priority = false, ...props }) => {
  // Diferentes alturas según el tipo de card
  const getCardHeight = () => {
    switch (type) {
      case 'supplier':
        return { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 };
      case 'buyer':
      case 'provider':
      default:
        return { xs: 142, sm: 154, md: 187.5, lg: 243.75, xl: 260 };
    }
  };

  return (
    <Box sx={{ width: '100%', height: getCardHeight(), minHeight: getCardHeight(), boxSizing: 'border-box' }}>
      <UniversalProductImage
        product={product}
        size="responsive"
        // Fill the outer responsive container
        height="100%"
        priority={true} // ✅ CONSERVADOR: Mantener eager loading para evitar problemas
        imagePriority={priority} // ✅ NUEVO: Prop separada solo para fetchpriority
        sx={{
          maxWidth: '100%',
          bgcolor: '#fff',
          p: type === 'supplier' ? 
            { xs: 0.5, sm: 0.8, md: 1, lg: 0 } : 
            { xs: 1, sm: 1.2, md: 1.5, lg: 0},
          display: 'block',
          mx: 'auto',
          mt: 0.5,
          // debug temporal: borde ligero para ver el contenedor
          border: process.env.NODE_ENV === 'development' ? '1px dashed rgba(0,0,0,0.1)' : undefined,
        }}
        {...props}
      />
    </Box>
  );
};

/**
 * Componente para CartItem - Usa thumbnails responsivos con fallback a avatar
 * NUNCA usa minithumb - sigue jerarquía: thumbnails > imágenes normales > avatar
 */
export const CartItemImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="mobile" // Forzar siempre thumbnail mobile para consistencia visual en el carrito
    priority={true} // Forzar eager por prioridad
    aspectRatio="1"
    objectFit="cover"
    sx={{
      borderRadius: 1,
      bgcolor: '#fafafa',
      border: process.env.NODE_ENV === 'development' ? '1px solid #e0e0e0' : undefined
    }}
    {...props}
  />
);

/**
 * Componente para CheckoutSummary - Usa thumbnails responsivos con fallback a avatar
 * NUNCA usa minithumb - sigue jerarquía: thumbnails > imágenes normales > avatar
 */
// Sx base estable para evitar recreación y permitir memo suave
const checkoutSummaryBaseSx = { borderRadius: '50%' };

export const CheckoutSummaryImage = React.memo(({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="minithumb"
    width={40}
    height={40}
    priority={true}
    sx={checkoutSummaryBaseSx}
    {...props}
  />
));

/**
 * Componente para tablas administrativas
 */
export const AdminTableImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    size="minithumb"
    width={40}
    height={40}
    sx={{
      borderRadius: 1
    }}
    {...props}
  />
);

// Memoizar export por seguridad adicional: evitar re-renders si las props no cambian
export default React.memo(UniversalProductImage);
