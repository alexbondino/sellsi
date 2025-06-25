import React, { useRef, useState } from 'react';
/* Para subir imagenes */
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Grid,
  Card,
  CardMedia,
  CardActions,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';

/**
 * ImageUploader - Componente UI reutilizable para subir y gestionar imágenes
 *
 * @param {Array} images - Array de imágenes actuales
 * @param {Function} onImagesChange - Callback cuando cambien las imágenes
 * @param {number} maxImages - Número máximo de imágenes permitidas
 * @param {string} error - Mensaje de error a mostrar
 * @param {string} acceptedTypes - Tipos de archivo aceptados (default: "image/*")
 * @param {string} dropText - Texto personalizado para el área de drop
 * @param {string} buttonText - Texto personalizado para el botón
 * @param {boolean} showPrimaryBadge - Mostrar badge de "Principal" en primera imagen
 * @param {Function} onError - Callback para manejar errores
 */
const ImageUploader = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  error,
  acceptedTypes = 'image/*',
  dropText = 'Arrastra y suelta imágenes aquí o haz clic para seleccionar',
  buttonText = 'Agregar imágenes',
  showPrimaryBadge = true,
  onError,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  // Función para formatear tamaño de archivo
  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = event => {
    const files = Array.from(event.target.files);
    processFiles(files);
    // Reset input para permitir seleccionar el mismo archivo
    event.target.value = '';
  };
  const processFiles = files => {
    const maxFileSize = 2 * 1024 * 1024; // 2MB en bytes

    const imageFiles = files.filter(file => {
      if (acceptedTypes === 'image/*') {
        return file.type.startsWith('image/');
      }
      return acceptedTypes
        .split(',')
        .some(type => file.type.includes(type.trim()));
    });

    if (imageFiles.length === 0) {
      onError?.('No se seleccionaron archivos válidos');
      return;
    }

    // Validar límite de imágenes
    if (images.length + imageFiles.length > maxImages) {
      const errorMsg = `Solo puedes subir máximo ${maxImages} imágenes`;
      onError?.(errorMsg);
      return;
    }

    // Validar tamaño de archivos
    const oversizedFiles = imageFiles.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map(f => f.name).join(', ');
      onError?.(
        `Las siguientes imágenes exceden el límite de 2MB: ${fileNames}`
      );
      return;
    }

    // Convertir archivos a URLs de objeto para preview
    const newImages = imageFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleDragOver = event => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = event => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = event => {
    event.preventDefault();
    setDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
  };

  const removeImage = imageId => {
    const updatedImages = images.filter(img => img.id !== imageId);
    // Limpiar URL del objeto para evitar memory leaks
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove && imageToRemove.url) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    onImagesChange(updatedImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const canAddMore = images.length < maxImages;

  return (
    <Box>
      {/* Area de drop/upload */}
      {canAddMore && (
        <Paper
          elevation={0}
          sx={{
            border: `2px dashed ${
              dragOver ? theme.palette.primary.main : theme.palette.divider
            }`,
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            bgcolor: dragOver
              ? alpha(theme.palette.primary.main, 0.05)
              : 'grey.50',
            mb: 2,
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <AddIcon
              sx={{
                fontSize: 48,
                color: dragOver ? 'primary.main' : 'text.secondary',
              }}
            />
            <Typography variant="h6" color="text.secondary">
              {buttonText}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dropText}
            </Typography>{' '}
            <Typography variant="caption" color="text.secondary">
              Formatos soportados: {acceptedTypes} • Máximo {maxImages} archivos
              • 2MB por imagen
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Preview de imágenes */}
      {images.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Archivos seleccionados ({images.length}/{maxImages})
          </Typography>

          <Grid container spacing={2}>
            {' '}
            {images.map((image, index) => (
              <Grid
                size={{ xs: 6, sm: 4, md: 3 }}
                key={image.id}
                sx={{ maxWidth: 160, minWidth: 140 }}
              >
                <Card
                  elevation={2}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    minHeight: 140,
                    maxHeight: 140,
                    height: 140,
                    maxWidth: 160,
                    minWidth: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    '&:hover .delete-button': {
                      opacity: 1,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={image.url}
                      alt={`Archivo ${index + 1}`}
                      sx={{
                        objectFit: 'contain',
                        width: '100%',
                        height: '100%',
                        background: '#f5f5f5',
                        m: 0,
                        p: 0,
                        display: 'block',
                      }}
                    />
                  </Box>
                  {/* Badge de imagen principal */}
                  {showPrimaryBadge && index === 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        bgcolor: 'primary.main',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      Principal
                    </Box>
                  )}
                  {/* Botón de eliminar */}
                  <IconButton
                    className="delete-button"
                    onClick={() => removeImage(image.id)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(244, 67, 54, 0.8)',
                      },
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>{' '}
                  <CardActions
                    sx={{
                      p: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        fontSize: '0.7rem',
                      }}
                    >
                      {image.name}
                    </Typography>
                    {image.size && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          fontSize: '0.6rem',
                          color:
                            image.size > 2 * 1024 * 1024
                              ? 'error.main'
                              : 'text.secondary',
                        }}
                      >
                        {formatFileSize(image.size)}
                      </Typography>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Botón adicional para agregar más */}
      {canAddMore && images.length > 0 && (
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={openFileDialog}
          sx={{ textTransform: 'none' }}
        >
          Agregar más archivos
        </Button>
      )}

      {/* Error */}
      {error && (
        <Typography
          variant="caption"
          color="error"
          display="block"
          sx={{ mt: 1 }}
        >
          {error}
        </Typography>
      )}

      {/* Info adicional */}
      {images.length === 0 && showPrimaryBadge && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography
            variant="body2"
            color="info.main"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ImageIcon fontSize="small" />
            El primer archivo será el principal
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploader;
