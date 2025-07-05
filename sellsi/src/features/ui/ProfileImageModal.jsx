import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  Typography,
  Avatar,
  Paper,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

/**
 * ProfileImageModal - Modal reutilizable para cambiar imagen de perfil
 * 
 * @param {boolean} open - Si el modal está abierto
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Function} onImageChange - Función llamada cuando se selecciona una nueva imagen
 * @param {string} currentImageUrl - URL de la imagen actual del perfil
 * @param {string} userInitials - Iniciales del usuario para mostrar si no hay imagen
 */
const ProfileImageModal = ({
  open,
  onClose,
  onImageChange,
  currentImageUrl,
  userInitials = 'U',
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const maxFileSize = 300 * 1024; // 300KB en bytes

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona solo archivos de imagen');
      return false;
    }

    // Validar tamaño (máximo 300KB)
    if (file.size > maxFileSize) {
      setError(`La imagen debe ser menor a 300KB. Tamaño actual: ${formatFileSize(file.size)}`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (files) => {
    const file = files[0];
    if (!file || !validateFile(file)) return;

    setError('');
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage({
      file,
      url: imageUrl,
      name: file.name,
      size: file.size,
    });
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
    // Reset input para permitir seleccionar el mismo archivo
    event.target.value = '';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleRemoveImage = () => {
    if (selectedImage?.url) {
      URL.revokeObjectURL(selectedImage.url);
      // ...log eliminado...
    }
    setSelectedImage(null);
    setError('');
  };

  const handleSave = () => {
    if (!selectedImage) {
      setError('Por favor, selecciona una imagen');
      return;
    }

    // Pasar la imagen al componente padre SIN revocar la URL
    onImageChange(selectedImage);
    
    // Limpiar solo el estado local del modal (SIN revocar URL)
    setSelectedImage(null);
    setError('');
    onClose();
  };

  const handleClose = () => {
    // NO revocar automáticamente - el componente padre se encarga
    setSelectedImage(null);
    setError('');
    onClose();
  };

  const handleCancel = () => {
    // Solo revocar la URL cuando se cancela explícitamente
    if (selectedImage?.url) {
      URL.revokeObjectURL(selectedImage.url);
      // ...log eliminado...
    }
    setSelectedImage(null);
    setError('');
    onClose();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Determinar qué imagen mostrar en el preview
  const previewImageUrl = selectedImage?.url || currentImageUrl;

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      disableScrollLock={true}
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        overflow: 'visible'
      }}>
        Cambiar imagen de perfil
        <IconButton onClick={handleCancel} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, overflow: 'visible' }}>
        {/* Preview de imagen actual */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Avatar
            src={previewImageUrl}
            sx={{
              width: 120,
              height: 120,
              fontSize: 40,
              bgcolor: 'primary.main',
              border: `3px solid ${theme.palette.primary.main}`,
            }}
          >
            {!previewImageUrl && userInitials}
          </Avatar>
        </Box>

        {/* Área de upload */}
        <Paper
          elevation={0}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          sx={{
            border: `2px dashed ${dragOver ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            bgcolor: dragOver ? alpha(theme.palette.primary.main, 0.05) : 'background.default',
            '&:hover': {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 48,
              color: dragOver ? 'primary.main' : 'text.secondary',
              mb: 2,
            }}
          />
          <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
            Selecciona una nueva imagen
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Arrastra y suelta una imagen aquí o haz clic para seleccionar
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Máximo 300KB • JPG, PNG, GIF
          </Typography>
        </Paper>

        {/* Información de imagen seleccionada */}
        {selectedImage && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {selectedImage.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatFileSize(selectedImage.size)}
                </Typography>
              </Box>
              <IconButton size="small" onClick={handleRemoveImage} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Mensaje de error */}
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>
            {error}
          </Typography>
        )}

        {/* Input oculto para selección de archivos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleCancel} color="inherit">
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!selectedImage}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileImageModal;
