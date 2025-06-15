/**
 * ============================================================================
 * LAZY IMAGE - COMPONENTE DE IMAGEN CON LAZY LOADING AVANZADO
 * ============================================================================
 *
 * Componente profesional de imagen con lazy loading, placeholders,
 * progressive loading y optimización para marketplaces.
 */

import React from 'react'
import { Box, CardMedia, Skeleton, Fade } from '@mui/material'
import { useLazyImage } from '../hooks/useLazyImage'

const LazyImage = ({
  src,
  alt,
  width,
  height,
  borderRadius = 0,
  objectFit = 'contain',
  bgcolor = '#fafafa',
  padding = 0,
  placeholder,
  enableProgressiveLoading = true,
  ...props
}) => {
  const { imageSrc, isLoaded, isLoading, error, imgRef } = useLazyImage(src, {
    placeholder,
    enableProgressiveLoading,
  })

  return (
    <Box
      ref={imgRef}
      sx={{
        position: 'relative',
        width,
        height,
        borderRadius,
        overflow: 'hidden',
        bgcolor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Skeleton mientras carga */}
      {!isLoaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bgcolor: 'grey.100',
            animation: 'wave 1.6s ease-in-out 0.5s infinite',
          }}
        />
      )}

      {/* Imagen principal */}
      <Fade in={isLoaded} timeout={300}>
        <CardMedia
          component="img"
          image={imageSrc}
          alt={alt}
          sx={{
            width: '100%',
            height: '100%',
            objectFit,
            p: padding,
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            ...props.sx,
          }}
          {...props}
        />
      </Fade>

      {/* Indicador de loading */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Box>
      )}

      {/* Error state */}
      {error && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          Error al cargar imagen
        </Box>
      )}
    </Box>
  )
}

export default LazyImage
