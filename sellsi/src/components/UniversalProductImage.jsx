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
  aspectRatio,
  objectFit = 'contain',
  borderRadius = 0,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const queryClient = useQueryClient();

  // Hooks para obtener thumbnails
  const { thumbnailUrl: responsiveThumbnail, isLoading: responsiveLoading } = useResponsiveThumbnail(product);
  const productId = product?.id || product?.productid || product?.product_id || product?.productId;
  const minithumb = useMinithumb(product);

  // Phase-aware query state
  // Si el producto ya trae thumbnail_url o thumbnails, asumimos fase final lista
  const [currentPhase, setCurrentPhase] = useState(
    (product?.thumbnail_url || product?.thumbnailUrl || product?.thumbnails) ? 'thumbnails_ready' : null
  )
  // Actualizar fase inicial cuando cambie el producto
  useEffect(() => {
    if (product && (product.thumbnail_url || product.thumbnailUrl || product.thumbnails)) {
      setCurrentPhase('thumbnails_ready')
    }
  }, [product?.id, product?.thumbnail_url, product?.thumbnailUrl, product?.thumbnails])
  const { ref: viewportRef, inView } = useInViewport({ once: true, rootMargin: '200px' })
  const phaseQuery = useThumbnailPhaseQuery(productId, currentPhase, { enabled: !FeatureFlags.ENABLE_VIEWPORT_THUMBS || inView })
  const phaseDataThumbUrl = phaseQuery.data?.thumbnail_url

  // Determinar la URL a usar basada en el tamaño solicitado
  const selectedThumbnail = React.useMemo(() => {
    if (!product) return '/placeholder-product.jpg';

    const finalUrl = (() => {
      switch (size) {
        case 'minithumb':
          // Para minithumb: minithumb específico → thumbnail responsivo → imagen original → placeholder
  const chosen = minithumb || phaseDataThumbUrl || responsiveThumbnail || product?.imagen || product?.image || '/placeholder-product.jpg';
    if (process.env.NODE_ENV === 'development') {
      console.debug('[THUMBS][UniversalProductImage] choose=minithumb', { productId, minithumb, phaseDataThumbUrl, responsiveThumbnail, original: product?.imagen, chosen });
    }
    return chosen;
        case 'mobile': {
          // Forzar siempre variante mobile independiente del viewport
          // 1) thumbnails.mobile directo
          let mobile = product?.thumbnails?.mobile;
          // 2) Si phaseDataThumbUrl apunta a desktop/tablet construir mobile
          const source = phaseDataThumbUrl || responsiveThumbnail || product?.thumbnail_url || product?.thumbnailUrl;
          if (!mobile && source && typeof source === 'string') {
            if (source.includes('_mobile_')) mobile = source; // Ya es mobile
            else if (source.includes('_desktop_320x260')) mobile = source.replace('_desktop_320x260.jpg', '_mobile_190x153.jpg');
            else if (source.includes('_tablet_300x230')) mobile = source.replace('_tablet_300x230.jpg', '_mobile_190x153.jpg');
          }
          // 3) Minithumb NUNCA sustituye a mobile aquí (diferente tamaño) -> ignorado
          const chosenM = mobile || product?.imagen || product?.image || '/placeholder-product.jpg';
          if (process.env.NODE_ENV === 'development') {
            console.debug('[THUMBS][UniversalProductImage] choose=mobile', { productId, mobile, source, phaseDataThumbUrl, responsiveThumbnail, original: product?.imagen, chosen: chosenM });
          }
          return chosenM;
        }
        case 'responsive':
        default:
          // Para responsive: thumbnail responsivo → imagen original → placeholder
          // responsiveThumbnail ya incluye el fallback a product.imagen internamente
  const chosenR = phaseDataThumbUrl || responsiveThumbnail || product?.imagen || product?.image || '/placeholder-product.jpg';
    if (process.env.NODE_ENV === 'development') {
      console.debug('[THUMBS][UniversalProductImage] choose=responsive', { productId, phaseDataThumbUrl, responsiveThumbnail, original: product?.imagen, chosen: chosenR });
    }
    return chosenR;
      }
    })();

    return finalUrl;
  }, [product, size, minithumb, responsiveThumbnail, phaseDataThumbUrl, retryCount]);

  // Manejar errores de carga de imagen
  const handleImageError = useCallback(() => {

    setImageError(true);

    // FUNCIONALIDAD PRINCIPAL: Invalidar cache cuando hay error 404
    if (productId) {
      const cacheKey = ['thumbnail', productId];

      // Invalidar cache de React Query para este producto
      queryClient.invalidateQueries({
        queryKey: cacheKey,
        exact: false
      });

      // También limpiar cache del navegador forzando reload
      if (selectedThumbnail && selectedThumbnail !== '/placeholder-product.jpg') {
        const img = new Image();
        img.src = selectedThumbnail + '?cache-bust=' + Date.now();
      }

      // Reintentar después de un delay (máximo 2 reintentos)
      if (retryCount < 2) {
        setTimeout(() => {
          
          setRetryCount(prev => prev + 1);
          setImageError(false);
        }, 1000);
      }
    }

    // Callback personalizado de error
    if (onError) {
      onError();
    }
  }, [product, onError, selectedThumbnail, queryClient, retryCount]);

  // Manejar carga exitosa de imagen
  const handleImageLoad = useCallback(() => {
    setImageError(false);
    setRetryCount(0); // Reset retry count cuando carga exitosamente
    if (onLoad) {
      onLoad();
    }
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
        setRetryCount(0)
        setTimeout(() => {
          setRetryCount(p => p + 1)
          setRetryCount(p => p - 1)
        }, 100)
      }, ThumbTimings.PHASE_EVENT_DEBOUNCE_MS)
    }
    window.addEventListener('productImagesReady', handleImagesReady)
    return () => window.removeEventListener('productImagesReady', handleImagesReady)
  }, [productId, queryClient])

  // Si hay error o no hay imagen válida, mostrar Avatar con icono CENTRADO
  if (imageError || !selectedThumbnail || selectedThumbnail === '/placeholder-product.jpg') {
    // Mostrar spinner durante los reintentos
    if (imageError && retryCount < 2) {
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
    // Mostrar icono de imagen rota solo si ya se acabaron los intentos
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
  if (lazy) {
    return (
      <LazyImage
        src={selectedThumbnail}
        alt={imageAlt}
        aspectRatio={aspectRatio}
        rootMargin="150px"
        objectFit={objectFit}
        sx={baseStyles}
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
  }

  // Imagen normal (no lazy)
  return (
    <Box
      component="img"
      src={selectedThumbnail}
      alt={imageAlt}
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
 */
export const ProductCardImage = ({ product, type = 'buyer', ...props }) => {
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
    <UniversalProductImage
      product={product}
      size="responsive"
      height={getCardHeight()}
      lazy={false} // Forzar carga inmediata en cards para descartar issues de IntersectionObserver
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
    lazy={false} // Evitar IntersectionObserver en el carrito para asegurar visibilidad inmediata
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
export const CheckoutSummaryImage = ({ product, ...props }) => (
  <UniversalProductImage
    product={product}
    // Prioriza minithumb de 40x40 si existe
    size="minithumb"
    width={40}
    height={40}
    lazy={false}
    sx={{
      borderRadius: '50%'
    }}
    {...props}
  />
);

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

export default UniversalProductImage;
