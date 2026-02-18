import React, { useState, useRef, useCallback } from 'react';
import { Box, Card, CardMedia, useTheme, useMediaQuery } from '@mui/material';
import { ZoomIn } from '@mui/icons-material';
import { getProductImageUrl } from '../../../../utils/getProductImageUrl';
import { useImagePreloader } from '../../../../hooks/useLazyImage';
import ImageZoomModal from './ImageZoomModal';

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

  // ─── Zoom sin estado React ─────────────────────────────────────────────────
  // Usamos refs para manipular el DOM directamente en mousemove, evitando
  // re-renders por cada pixel y eliminando el lag característico de setState.
  const imgRef = useRef(null);
  const cursorRef = useRef(null);
  const isHoveringRef = useRef(false);

  // Solo necesitamos estado para controlar el modal de mobile
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  // Usar las imágenes reales del producto
  const galleryImages =
    images.length > 0
      ? images.map(getProductImageUrl)
      : ['/placeholder-product.jpg'];

  // Precargar las primeras 3 imágenes para mejor UX
  useImagePreloader(galleryImages);

  // ─── Handlers de mouse sin setState ───────────────────────────────────────
  const handleMouseMove = useCallback(e => {
    if (!isDesktop || !isHoveringRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Manipulamos el DOM directamente: cero re-renders
    if (imgRef.current) {
      imgRef.current.style.transformOrigin = `${x}% ${y}%`;
    }

    // Mover el cursor personalizado (32px / 2 = 16 para centrar)
    if (cursorRef.current) {
      cursorRef.current.style.left = `${e.clientX - rect.left - 16}px`;
      cursorRef.current.style.top = `${e.clientY - rect.top - 16}px`;
    }
  }, [isDesktop]);

  const handleMouseEnter = useCallback(() => {
    if (!isDesktop) return;
    isHoveringRef.current = true;

    if (imgRef.current) {
      imgRef.current.style.transition = 'none';
      imgRef.current.style.transform = 'scale(2.2)';
      imgRef.current.style.willChange = 'transform'; // Activar GPU solo al necesitar
    }
    if (cursorRef.current) {
      cursorRef.current.style.display = 'flex';
    }
  }, [isDesktop]);

  const resetZoom = useCallback(() => {
    isHoveringRef.current = false;
    if (imgRef.current) {
      imgRef.current.style.transition = 'transform 0.2s ease';
      imgRef.current.style.transform = 'scale(1)';
      imgRef.current.style.transformOrigin = 'center center';
      imgRef.current.style.willChange = 'auto'; // Liberar GPU al terminar
    }
    if (cursorRef.current) {
      cursorRef.current.style.display = 'none';
    }
  }, []);

  const handleMouseLeave = resetZoom;

  // Resetear zoom si el usuario cambia de imagen mientras hace hover
  // (evita que scale(2.2) y transition:none queden pegados en el DOM)
  React.useEffect(() => {
    if (isHoveringRef.current) return; // Si sigue hovering, no tocar
    if (imgRef.current) {
      imgRef.current.style.transition = '';
      imgRef.current.style.transform = '';
      imgRef.current.style.transformOrigin = '';
      imgRef.current.style.willChange = '';
    }
  }, [selectedIndex]);

  // Manejar click en la imagen para abrir modal (mobile)
  const handleImageClick = useCallback(() => {
    if (!isDesktop) {
      setIsZoomModalOpen(true);
    }
  }, [isDesktop]);

  // Cerrar modal de zoom
  const handleCloseZoomModal = useCallback(() => {
    setIsZoomModalOpen(false);
  }, []);

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
          width: { xs: '100%', md: '72%' }, // ✅ Full width en mobile, 72% en desktop
          display: 'flex',
          justifyContent: 'center',
          mx: 'auto',
          position: 'relative',
          cursor: isDesktop ? 'none' : 'zoom-in',
          transition: 'box-shadow 0.3s ease',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleImageClick}
      >
        <CardMedia
          ref={imgRef}
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
            // Sin transición inicial: la añadimos/quitamos via ref en los handlers
            transformOrigin: 'center center',
            transform: 'scale(1)',
            position: 'relative',
            zIndex: 2,
            // willChange se gestiona via ref (activar al hover, liberar al salir)
            // No poner aquí: Emotion lo re-inyecta en reposo anulando el ref
          }}
        />
        {/* Icono de lupa que sigue al cursor — siempre en DOM, ocultado via ref */}
        {isDesktop && (
          <Box
            ref={cursorRef}
            sx={{
              position: 'absolute',
              display: 'none', // Ocultado por defecto, se muestra via ref en handleMouseEnter
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '50%',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 10,
              pointerEvents: 'none', // No interferir con los eventos del mouse
            }}
          >
            <ZoomIn
              sx={{
                fontSize: 18,
                color: 'primary.main',
              }}
            />
          </Box>
        )}
        {/* Indicador de zoom para mobile */}
        {!isDesktop && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 2,
              padding: '4px 8px',
              gap: 0.5,
              zIndex: 10,
            }}
          >
            <ZoomIn sx={{ fontSize: 16, color: 'white' }} />
            <Box
              component="span"
              sx={{
                fontSize: '0.7rem',
                color: 'white',
                fontWeight: 500,
              }}
            >
              Toca para ampliar
            </Box>
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
      {/* Modal de zoom para mobile */}
      <ImageZoomModal
        open={isZoomModalOpen}
        onClose={handleCloseZoomModal}
        images={galleryImages}
        initialIndex={selectedIndex}
        productName={productName}
      />
    </Box>
  );
};

export default ProductImageGallery;
