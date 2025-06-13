import React from 'react'
import { Box, Card, CardMedia } from '@mui/material'
import { getProductImageUrl } from '../../../../utils/getProductImageUrl'

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
      {/* Main Image */}
      <Card
        elevation={2}
        sx={{
          mb: 2,
          overflow: 'hidden',
          borderRadius: 3,
          width: '90%', // Reducir del 100% para crear espacio
          maxWidth: 450, // Reducir ligeramente el máximo
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
            width: '100%',
            height: { xs: 300, sm: 400, md: 500 },
            objectFit: 'contain',
            bgcolor: '#fafafa',
            p: 2,
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
          width: '90%', // Matching main image width
          maxWidth: 450, // Matching main image maxWidth
          alignItems: 'center',
          mx: 'auto', // Center the thumbnails container
        }}
      >
        {galleryImages.map((image, index) => (
          <Card
            key={index}
            elevation={selectedIndex === index ? 3 : 1}
            sx={{
              minWidth: 80,
              height: 80,
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
                p: 0.5,
              }}
            />
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default ProductImageGallery
