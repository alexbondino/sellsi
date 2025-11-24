/**
 * ImageZoomModal - Modal fullscreen con pinch-to-zoom para mobile
 *
 * Características:
 * - Fullscreen en mobile
 * - Pinch-to-zoom con dos dedos
 * - Double-tap para zoom
 * - Swipe para cambiar imágenes
 * - Botón de cerrar
 */
import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  IconButton,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RestartAlt,
} from '@mui/icons-material';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';

/**
 * Controles de zoom
 */
const ZoomControls = ({ onClose }) => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 3,
        padding: 1,
        zIndex: 10,
      }}
    >
      <IconButton
        onClick={() => zoomOut()}
        sx={{ color: 'white' }}
        size="small"
      >
        <ZoomOut />
      </IconButton>
      <IconButton
        onClick={() => resetTransform()}
        sx={{ color: 'white' }}
        size="small"
      >
        <RestartAlt />
      </IconButton>
      <IconButton
        onClick={() => zoomIn()}
        sx={{ color: 'white' }}
        size="small"
      >
        <ZoomIn />
      </IconButton>
    </Box>
  );
};

const ImageZoomModal = ({
  open,
  onClose,
  images = [],
  initialIndex = 0,
  productName = '',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Navegación entre imágenes
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'ArrowLeft') {
        handlePrevious();
      } else if (event.key === 'ArrowRight') {
        handleNext();
      } else if (event.key === 'Escape') {
        onClose();
      }
    },
    [handlePrevious, handleNext, onClose]
  );

  // Reset index cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={isMobile}
      maxWidth="lg"
      fullWidth
      onKeyDown={handleKeyDown}
      PaperProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          backgroundImage: 'none',
          ...(isMobile && {
            margin: 0,
            maxHeight: '100%',
            maxWidth: '100%',
          }),
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: isMobile ? '100vh' : '80vh',
          overflow: 'hidden',
          touchAction: 'none', // Importante para pinch-to-zoom
        }}
      >
        {/* Botón cerrar */}
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>

        {/* Contador de imágenes */}
        {images.length > 1 && (
          <Typography
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: '0.875rem',
              zIndex: 10,
            }}
          >
            {currentIndex + 1} / {images.length}
          </Typography>
        )}

        {/* Botón anterior */}
        {images.length > 1 && (
          <IconButton
            onClick={handlePrevious}
            sx={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <ChevronLeft sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        {/* Botón siguiente */}
        {images.length > 1 && (
          <IconButton
            onClick={handleNext}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <ChevronRight sx={{ fontSize: 32 }} />
          </IconButton>
        )}

        {/* Imagen con zoom */}
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          centerOnInit
          doubleClick={{
            mode: 'toggle',
            step: 2,
          }}
          panning={{
            velocityDisabled: true,
          }}
          wheel={{
            step: 0.1,
          }}
          pinch={{
            step: 5,
          }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  component="img"
                  src={currentImage}
                  alt={`${productName} - Imagen ${currentIndex + 1}`}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                  }}
                  draggable={false}
                />
              </TransformComponent>

              {/* Controles de zoom */}
              <ZoomControls onClose={onClose} />
            </>
          )}
        </TransformWrapper>

        {/* Instrucciones para mobile */}
        {isMobile && (
          <Typography
            sx={{
              position: 'absolute',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.75rem',
              textAlign: 'center',
              zIndex: 10,
            }}
          >
            Pellizca para zoom • Doble tap para ampliar
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageZoomModal;
