/**
 * ============================================================================
 * LAZY IMAGE - COMPONENTE UNIVERSAL DE CARGA LAZY
 * ============================================================================
 *
 * Componente optimizado para lazy loading de imágenes en todo el marketplace.
 * Basado en el componente exitoso de ProductPageView pero más generalizado.
 *
 * CARACTERÍSTICAS:
 * - ✅ Intersection Observer para performance
 * - ✅ Placeholder inteligente con skeleton
 * - ✅ Manejo de errores robusto
 * - ✅ Preload anticipado configurable
 * - ✅ Optimización para diferentes densidades de pantalla
 */

import React, { useState, useRef, useEffect } from 'react'
import { Box, Skeleton, Paper } from '@mui/material'
import { Image as ImageIcon } from '@mui/icons-material'

/**
 * Hook personalizado para lazy loading con Intersection Observer
 */
const useLazyLoading = (rootMargin = '50px') => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )

    const currentElement = elementRef.current
    if (currentElement) {
      observer.observe(currentElement)
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement)
      }
    }
  }, [rootMargin])

  return [elementRef, isVisible]
}

/**
 * Componente LazyImage universal
 */
const LazyImage = ({
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
  className = '',
  sx = {},
  ...props
}) => {
  const [elementRef, isVisible] = useLazyLoading(rootMargin)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
    onLoad()
  }

  const handleImageError = () => {
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
        bgcolor: 'grey.100',
        borderRadius,
      }}
    >
      {showSkeleton ? (
        <Skeleton
          variant={skeletonVariant}
          width="100%"
          height="100%"
          sx={{ borderRadius }}
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
        width: '100%',
        aspectRatio,
        overflow: 'hidden',
        borderRadius,
        ...sx,
      }}
      {...props}
    >
      {/* Placeholder/Skeleton siempre visible hasta que la imagen cargue */}
      {!imageLoaded && !imageError && <SkeletonPlaceholder />}

      {/* Error fallback */}
      {imageError && <ErrorFallback />}

      {/* Imagen real - solo se renderiza cuando es visible */}
      {isVisible && src && !imageError && (
        <Box
          component="img"
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit,
            borderRadius,
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out',
          }}
        />
      )}
    </Box>
  )
}

export default LazyImage
