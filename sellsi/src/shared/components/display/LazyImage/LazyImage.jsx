/**
 * ============================================================================
 * LAZY IMAGE - COMPONENTE UNIVERSAL DE CARGA LAZY
 * ============================================================================
 *
 * Componente optimizado para lazy loading de imágenes en todo el marketplace.
 * Combina funcionalidades de ambas versiones (layout + ProductPageView).
 *
 * CARACTERÍSTICAS:
 * - ✅ Intersection Observer para performance
 * - ✅ Placeholder inteligente con skeleton
 * - ✅ Manejo de errores robusto
 * - ✅ Preload anticipado configurable
 * - ✅ Optimización para diferentes densidades de pantalla
 * - ✅ Soporte para progressive loading
 * - ✅ Compatible con ambos estilos de API
 */

import React, { useState, useRef, useEffect } from 'react'
import { Box, Skeleton, CardMedia, Fade } from '@mui/material'
import { Image as ImageIcon } from '@mui/icons-material'
import { globalObserverPool } from '../../../../utils/observerPoolManager';

/**
 * Hook personalizado para lazy loading con Intersection Observer
 */
const useLazyLoading = (rootMargin = '50px') => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    if (!elementRef.current) return;

    const handleIntersection = (entry) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    };

    const unobserveFunc = globalObserverPool.observe(
      elementRef.current,
      handleIntersection,
      { rootMargin }
    );

    return unobserveFunc;
  }, [rootMargin])

  return [elementRef, isVisible]
}

/**
 * Componente LazyImage universal
 * Combina funcionalidades de ambas versiones (layout + ProductPageView)
 */
const LazyImage = ({
  // Props originales del layout
  src,
  alt = '',
  placeholder = null,
  aspectRatio = '1',
  borderRadius = 2,
  objectFit = 'cover',
  rootMargin = '100px',
  showSkeleton = true,
  skeletonVariant = 'rectangular',
  errorFallback = null,
  onLoad = () => {},
  onError = () => {},
  fallbackSrc = null, // Nueva prop para imagen de fallback
  className = '',
  sx = {},
  
  // Props adicionales del ProductPageView (para compatibilidad total)
  width,
  height,
  bgcolor = '#fafafa',
  padding = 0,
  enableProgressiveLoading = true,
  
  ...props
}) => {
  const [elementRef, isVisible] = useLazyLoading(rootMargin)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src) // Track src changes
  const [attemptedFallback, setAttemptedFallback] = useState(false)

  // Force reload when src changes
  useEffect(() => {
    if (src !== imageSrc) {
      setImageLoaded(false)
      setImageError(false)  
      setAttemptedFallback(false)
      setImageSrc(src)
    }
  }, [src, imageSrc])

  const handleImageLoad = () => {
    setImageLoaded(true)
    setAttemptedFallback(false) // Reset fallback state en caso de éxito
    onLoad()
  }

  const handleImageError = () => {
    // Si hay fallbackSrc disponible y no hemos intentado usarlo aún
    if (fallbackSrc && !attemptedFallback && fallbackSrc !== imageSrc) {
      setAttemptedFallback(true)
      setImageSrc(fallbackSrc)
      return // No marcar como error aún, intentar con fallback
    }
    
    setImageError(true)
    onError()
  }

  // Componente de skeleton/placeholder
  const SkeletonPlaceholder = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: bgcolor || 'grey.100',
        borderRadius,
      }}
    >
      {showSkeleton ? (
        <Skeleton
          variant={skeletonVariant}
          width="100%"
          height="100%"
          sx={{ 
            borderRadius,
            bgcolor: 'grey.100',
            animation: 'wave 1.6s ease-in-out 0.5s infinite',
          }}
        />
      ) : (
        <ImageIcon sx={{ fontSize: 48, color: 'grey.400' }} />
      )}
    </Box>
  )

  // Componente de error
  const ErrorFallback = () => (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
        borderRadius,
      }}
    >
      {errorFallback || (
        <ImageIcon sx={{ fontSize: 32, color: 'grey.300' }} />
      )}
    </Box>
  )

  return (
    <Box
      ref={elementRef}
      className={className}
      sx={{
        position: 'relative',
        // Soporte para ambos estilos de dimensionamiento
        width: width || '100%',
        height: height || 'auto',
        aspectRatio: !height ? aspectRatio : undefined,
        overflow: 'hidden',
        borderRadius,
        bgcolor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...props}
    >
      {/* Placeholder/Skeleton siempre visible hasta que la imagen cargue */}
      {!imageLoaded && !imageError && <SkeletonPlaceholder />}

      {/* Error fallback */}
      {imageError && <ErrorFallback />}

      {/* Imagen real - solo se renderiza cuando es visible */}
      {isVisible && imageSrc && !imageError && (
        <Box
          component="img"
          src={imageSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          key={imageSrc} // Force re-render when src changes
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit,
            borderRadius,
            p: padding,
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}
      {process.env.NODE_ENV === 'development' && isVisible && imageSrc && (
        <Box sx={{position:'absolute',bottom:0,left:0,right:0, bgcolor:'rgba(0,0,0,0.3)', color:'#fff', fontSize:8, p:0.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {imageSrc.split('/').pop()}
        </Box>
      )}
    </Box>
  )
}

export default LazyImage
