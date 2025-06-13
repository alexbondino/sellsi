import React, { useRef, useState } from 'react'
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
} from '@mui/material'
import {
  CloudUpload as CloudUploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material'

/**
 * ImageUploader - Componente para subir y gestionar imágenes de productos
 */
const ImageUploader = ({
  images = [],
  onImagesChange,
  maxImages = 5,
  error,
}) => {
  const theme = useTheme()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    processFiles(files)
    // Reset input para permitir seleccionar el mismo archivo
    event.target.value = ''
  }

  const processFiles = (files) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      return
    }

    if (images.length + imageFiles.length > maxImages) {
      alert(`Solo puedes subir máximo ${maxImages} imágenes`)
      return
    }

    // Convertir archivos a URLs de objeto para preview
    const newImages = imageFiles.map((file) => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }))

    onImagesChange([...images, ...newImages])
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragOver(false)

    const files = Array.from(event.dataTransfer.files)
    processFiles(files)
  }

  const removeImage = (imageId) => {
    const updatedImages = images.filter((img) => img.id !== imageId)
    // Limpiar URL del objeto para evitar memory leaks
    const imageToRemove = images.find((img) => img.id === imageId)
    if (imageToRemove && imageToRemove.url) {
      URL.revokeObjectURL(imageToRemove.url)
    }
    onImagesChange(updatedImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = images.length < maxImages

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
              Agregar imágenes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Arrastra y suelta imágenes aquí o haz clic para seleccionar
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Formatos soportados: JPG, PNG, GIF • Máximo {maxImages} imágenes
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {/* Preview de imágenes */}
      {images.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
            Imágenes seleccionadas ({images.length}/{maxImages})
          </Typography>

          <Grid container spacing={2}>
            {images.map((image, index) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={3}
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
                      alt={`Producto ${index + 1}`}
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
                  {index === 0 && (
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
                  </IconButton>
                  <CardActions sx={{ p: 1 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        width: '100%',
                      }}
                    >
                      {image.name}
                    </Typography>
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
          Agregar más imágenes
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
      {images.length === 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
          <Typography
            variant="body2"
            color="info.main"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ImageIcon fontSize="small" />
            La primera imagen será la imagen principal del producto
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ImageUploader
