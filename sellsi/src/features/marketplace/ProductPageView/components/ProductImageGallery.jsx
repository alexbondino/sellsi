import React from 'react'
import { Box, Card, CardMedia } from '@mui/material'
import { getProductImageUrl } from '../../../../utils/getProductImageUrl'
import LazyImage from './LazyImage'
import { useImagePreloader } from '../hooks/useLazyImage'

const ProductImageGallery = ({
  images = [],
  selectedIndex = 0,
  onImageSelect,
  productName,
}) => {
  // Usar las imágenes reales del producto
  const galleryImages =
    images.length > 0
      ? images.map(getProductImageUrl)
      : ['/placeholder-product.jpg']

  // Precargar las primeras 3 imágenes para mejor UX
  const { preloadedImages, isPreloading } = useImagePreloader(galleryImages)
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '100%',
        px: { xs: 2, sm: 3, md: 4 }, // Horizontal padding
        py: 2, // Vertical padding
      }}
    >
      {' '}
      {/* Main Image */}
      <Card
        elevation={2}
        sx={{
          mb: 2,
          overflow: 'hidden',
          borderRadius: 3,
          width: 'fit-content', // Ajustar al contenido
          maxWidth: 'none', // Sin límite máximo
          display: 'flex',
          justifyContent: 'center',
          mx: 'auto', // Margin auto horizontal para centrado adicional
        }}
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
          }}
        />
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
