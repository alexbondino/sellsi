import React, { useState } from 'react';
import { Box, Card, CardMedia, useTheme, useMediaQuery } from '@mui/material';
import { ZoomIn } from '@mui/icons-material';
import { getProductImageUrl } from '../../../../utils/getProductImageUrl';
import { useImagePreloader } from '../../../../hooks/useLazyImage';

const ProductImageGallery = ({
  images = [],
  selectedIndex = 0,
  onImageSelect,
  productName,
  isMobile = false, // Nuevo prop
  imagesRaw = [], // raw objects with image_order and image_url for debugging
}) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // Solo en md y superiores
  // Estados para el zoom con seguimiento del mouse
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  // Usar las imágenes reales del producto
  const galleryImages =
    images.length > 0
      ? images.map(getProductImageUrl)
      : ['/placeholder-product.jpg'];
  // Diagnostic removed: gallery images debug logs eliminated
  // Precargar las primeras 3 imágenes para mejor UX
  const { preloadedImages, isPreloading } = useImagePreloader(galleryImages);
  // Diagnostic removed: preloadedImages debug logs eliminated
  // Manejar el movimiento del mouse sobre la imagen
  const handleMouseMove = e => {
    if (!isDesktop) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });

    // Posición absoluta del cursor para el icono de lupa
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  // Manejar cuando el mouse entra en la imagen
  const handleMouseEnter = () => {
    if (isDesktop) {
      setIsHovering(true);
    }
  };

  // Manejar cuando el mouse sale de la imagen
  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
        maxWidth: '100%',
        px: { xs: 0, sm: 0, md: 4 }, // Sin padding horizontal en móvil
        pt: 0,
        pb: 2,
      }}
    >
      {/* Main Image */}
      <Card
        elevation={2}
        sx={{
          mb: 2,
          overflow: 'hidden',
          borderRadius: { xs: 0, sm: 3 }, // Sin border radius en móvil
          width: '100%', // Full width en todos los tamaños
          maxWidth: { xs: '100%', md: 500 }, // Sin límite en móvil, 500px en desktop
          display: 'flex',
          justifyContent: 'center',
          mx: 'auto',
          position: 'relative',
          cursor: isDesktop ? 'none' : 'default',
          transition: 'box-shadow 0.3s ease',
          ...(isHovering &&
            isDesktop && {
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
            }),
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardMedia
          component="img"
          image={galleryImages[selectedIndex]}
          alt={productName}
          sx={{
            width: '100%', // Responsive width
            height: { xs: 300, sm: 400, md: 500 }, // Altura responsive
            maxWidth: '100%', // Responsive max width
            objectFit: 'contain', // Mantener aspecto completo de la imagen
            display: 'block', // Evitar problemas de inline
            bgcolor: '#fff',
            // Remove mobile padding: let AppShell provide the gutter
            p: { xs: 0, md: 1.9 },
            transition: 'transform 0.3s ease, transform-origin 0.1s ease',
            transformOrigin:
              isHovering && isDesktop
                ? `${mousePosition.x}% ${mousePosition.y}%`
                : 'center center',
            transform: isHovering && isDesktop ? 'scale(1.8)' : 'scale(1)',
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
          width: '100%', // Full width
          maxWidth: { xs: '100%', md: 480 }, // Sin límite en móvil, 480px en desktop
          height: { xs: 80, md: 95 }, // Altura responsive
          alignItems: 'center',
          mx: 'auto',
          px: { xs: 2, md: 0 }, // Padding en móvil para evitar bordes
        }}
      >
        {galleryImages.map((image, index) => (
          <Card
            key={index}
            elevation={selectedIndex === index ? 3 : 1}
            sx={{
              width: { xs: 70, md: 80 }, // Más pequeñas en móvil
              height: { xs: 70, md: 80 },
              minWidth: { xs: 70, md: 80 },
              maxWidth: { xs: 70, md: 80 },
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
            <Box sx={{ position: 'relative' }}>
              {/* imagesRaw debug badge removed to avoid exposing filenames in UI */}
              <CardMedia
                component="img"
                image={image}
                alt={`${productName} ${index + 1}`}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  bgcolor: '#fff',
                  // Remove mobile padding to avoid doubling gutter
                  p: { xs: 0, md: 0.475 },
                }}
              />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ProductImageGallery;
