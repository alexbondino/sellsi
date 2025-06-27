import React, { useState } from 'react'
import { Box, Card, CardMedia, useTheme, useMediaQuery } from '@mui/material'
import { ZoomIn } from '@mui/icons-material'
import { getProductImageUrl } from '../../../../utils/getProductImageUrl'
import { useImagePreloader } from '../hooks/useLazyImage'

const ProductImageGallery = ({
  images = [],
  selectedIndex = 0,
  onImageSelect,
  productName,
}) => {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')) // Solo en md y superiores
    // Estados para el zoom con seguimiento del mouse
  const [isHovering, setIsHovering] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 })
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })

  // Usar las imágenes reales del producto
  const galleryImages =
    images.length > 0
      ? images.map(getProductImageUrl)
      : ['/placeholder-product.jpg']
  // Precargar las primeras 3 imágenes para mejor UX
  const { preloadedImages, isPreloading } = useImagePreloader(galleryImages)
  // Manejar el movimiento del mouse sobre la imagen
  const handleMouseMove = (e) => {
    if (!isDesktop) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setMousePosition({ x, y })
    
    // Posición absoluta del cursor para el icono de lupa
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  // Manejar cuando el mouse entra en la imagen
  const handleMouseEnter = () => {
    if (isDesktop) {
      setIsHovering(true)
    }
  }

  // Manejar cuando el mouse sale de la imagen
  const handleMouseLeave = () => {
    setIsHovering(false)
  }
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start', // Cambiar de center a flex-start
        width: '100%',
        maxWidth: '100%',
        px: { xs: 2, sm: 3, md: 4 }, // Horizontal padding
        pt: 0, // Sin padding top
        pb: 2, // Solo padding bottom
      }}
    >
      {' '}      {/* Main Image */}      <Card
        elevation={2}
        sx={{
          mb: 2, // Volver a margin bottom 2
          overflow: 'hidden',
          borderRadius: 3,
          width: 'fit-content', // Ajustar al contenido
          maxWidth: 'none', // Sin límite máximo
          display: 'flex',
          justifyContent: 'center',
          mx: 'auto', // Margin auto horizontal para centrado adicional
          position: 'relative', // Para el efecto zoom
          cursor: isDesktop ? 'none' : 'default', // Sin cursor para efecto más limpio
          transition: 'box-shadow 0.3s ease',
          ...(isHovering && isDesktop && {
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          })
        }}        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardMedia
          component="img"
          image={galleryImages[selectedIndex]}
          alt={productName}
          sx={{
            width: 500, // Ancho fijo de 500px
            height: 500, // Alto fijo de 500px
            maxWidth: 500, // Evitar que se agrande
            maxHeight: 500, // Evitar que se agrande
            objectFit: 'contain',
            bgcolor: '#fafafa',
            p: 1.9, // Reducido de 2 a 1.9
            transition: 'transform 0.3s ease, transform-origin 0.1s ease', // Transición suave
            transformOrigin: isHovering && isDesktop 
              ? `${mousePosition.x}% ${mousePosition.y}%` 
              : 'center center', // Zoom sigue al mouse
            transform: isHovering && isDesktop 
              ? 'scale(1.8)' // Zoom más pronunciado
              : 'scale(1)', // Sin zoom
            position: 'relative',
            zIndex: 2,
          }}
        />
          {/* Icono de lupa que sigue al cursor */}
        {isHovering && isDesktop && (
          <Box
            sx={{
              position: 'absolute',
              left: cursorPosition.x - 12, // Centrar el icono (24px / 2)
              top: cursorPosition.y - 12, // Centrar el icono (24px / 2)
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.45)', // 50% transparencia (0.9 * 0.5)
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Sombra más sutil
              zIndex: 10,
              pointerEvents: 'none', // No interferir con los eventos del mouse
              transition: 'opacity 0.2s ease',
              opacity: 0.5, // 50% de transparencia general
            }}
          >
            <ZoomIn 
              sx={{ 
                fontSize: 16, 
                color: 'primary.main',
              }} 
            />
          </Box>
        )}
      </Card>{' '}
      {/* Thumbnail Images */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          justifyContent: 'center',
          width: 480, // Ancho fijo de 480px
          height: 95, // Altura fija de 95px
          maxWidth: 480, // Máximo 480px
          alignItems: 'center',
          mx: 'auto', // Center the thumbnails container
        }}
      >
        {galleryImages.map((image, index) => (
          <Card
            key={index}
            elevation={selectedIndex === index ? 3 : 1}
            sx={{
              width: 80, // Aumentado de 73px a 80px
              height: 80, // Aumentado de 73px a 80px
              minWidth: 80, // Evitar que se encoja
              maxWidth: 80, // Evitar que se agrande
              cursor: 'pointer',
              border: selectedIndex === index ? '2px solid' : '1px solid',
              borderColor:
                selectedIndex === index ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                elevation: 3,
              },
            }}
            onClick={() => onImageSelect && onImageSelect(index)}
          >
            <CardMedia
              component="img"
              image={image}
              alt={`${productName} ${index + 1}`}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                bgcolor: '#fafafa',
                p: 0.475, // Reducido de 0.5 a 0.475 (5% menos)
              }}
            />
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default ProductImageGallery
