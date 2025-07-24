import React from 'react';
import { Box, Typography } from '@mui/material';
import { ImageUploader } from '../../../../../shared/components/forms';
import { ImageUploadErrorBoundary } from '../../../components/ErrorBoundary';

/**
 * Componente para la gestión de imágenes del producto
 * Maneja la carga y validación de imágenes
 */
const ProductImages = ({
  formData,
  errors,
  localErrors,
  touched,
  triedSubmit,
  imageError,
  onImagesChange,
  onImageError,
}) => {
  const handleRetry = () => {
    // Reset image errors and clear any failed uploads
    onImageError(null);
    // Could trigger a re-upload process here
  };

  return (
    <ImageUploadErrorBoundary onRetry={handleRetry}>
    <Box
      className="full-width"
      sx={{
        p: 0,
        m: 0,
        boxShadow: 'none',
        bgcolor: 'transparent',
        overflow: 'visible',
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: 600, color: 'black', mb: 2 }}
      >
        Imágenes del Producto
      </Typography>
      <ImageUploader
        images={formData.imagenes}
        onImagesChange={onImagesChange}
        maxImages={5}
        onError={onImageError}
        error={
          (touched.imagenes || triedSubmit) &&
          (errors.imagenes || localErrors.imagenes || imageError)
        }
      />
    </Box>
    </ImageUploadErrorBoundary>
  );
};

export default ProductImages;
