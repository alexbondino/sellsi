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
  Person as PersonIcon,
} from '@mui/icons-material';

import Tooltip from '@mui/material/Tooltip';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

/**
 * ProfileImageModal - Modal reutilizable para cambiar imagen de perfil
 * 
 * @param {boolean} open - Si el modal está abierto
 * @param {Function} onClose - Función para cerrar el modal
 * @param {Function} onImageChange - Función llamada cuando se selecciona una nueva imagen
 * @param {string} currentImageUrl - URL de la imagen actual del perfil
 * @param {string} userInitials - Iniciales del usuario para mostrar si no hay imagen
 * @param {Function} onSaveImage - Función para guardar automáticamente en Supabase (nueva)
 */
const ProfileImageModal = ({
  open,
  onClose,
  onImageChange,
  currentImageUrl,
  userInitials = 'U',
  onSaveImage, // Nueva prop para guardado automático
}) => {
  const theme = useTheme();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [localImageUrl, setLocalImageUrl] = useState(currentImageUrl);
  const [loading, setLoading] = useState(false); // Estado de carga para guardado automático

  // ✅ Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(open);

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

    // Limpiar imagen anterior si existe
    if (selectedImage?.url) {
      URL.revokeObjectURL(selectedImage.url);
    }

    setError('');
    let imageUrl;
    try {
      imageUrl = URL.createObjectURL(file);
    } catch (e) {
      // Graceful fallback if createObjectURL fails in certain environments (jsdom mocked or security)
      setError('No se pudo procesar la imagen');
      return;
    }

    // Crear un nuevo objeto cada vez para evitar referencias cruzadas
    const newImageData = {
      file: file, // Usar el archivo original directamente
      url: imageUrl,
      name: file.name,
      size: file.size,
      timestamp: Date.now(), // Agregar timestamp para unicidad
    };

    setSelectedImage(newImageData);
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
    }
    setSelectedImage(null);
    setError('');
  };

  // Determinar si hay un cambio pendiente para guardar
  const isDeletePending = !selectedImage && localImageUrl === undefined && currentImageUrl;
  const isSaveEnabled = !!selectedImage || isDeletePending;

  const handleSave = async () => {
    if (!onSaveImage) {
      // Comportamiento original si no hay función de guardado automático
      if (selectedImage) {
        const imageToSave = {
          file: selectedImage.file,
          url: selectedImage.url,
          name: selectedImage.name,
          size: selectedImage.size,
          timestamp: selectedImage.timestamp
        };
        onImageChange(imageToSave);
        setSelectedImage(null);
        setError('');
        onClose();
        return;
      }
      if (isDeletePending) {
        onImageChange(null);
        setError('');
        onClose();
        return;
      }
      onImageChange(null);
      onClose();
      return;
    }

    // Nuevo comportamiento: guardar automáticamente en Supabase
    setLoading(true);
    try {
      if (selectedImage) {
        await onSaveImage(selectedImage.file);
      } else if (isDeletePending) {
        await onSaveImage(null); // Eliminar imagen
      }
      
      setSelectedImage(null);
      setError('');
      onClose();
    } catch (error) {
      setError(error.message || 'Error al guardar la imagen');
    } finally {
      setLoading(false);
    }
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
    }
    setSelectedImage(null);
    setError('');
    onClose();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  React.useEffect(() => {
    setLocalImageUrl(currentImageUrl);
  }, [currentImageUrl]);

  // Limpiar estado cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      // Limpiar cualquier imagen seleccionada previa al abrir
      if (selectedImage?.url) {
        URL.revokeObjectURL(selectedImage.url);
      }
      setSelectedImage(null);
      setError('');
      setLocalImageUrl(currentImageUrl);
    }
  }, [open]);

  const previewImageUrl = selectedImage?.url || (localImageUrl ? localImageUrl : undefined);

  // Debug logs removed

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      disableScrollLock={true}
      sx={{ zIndex: 1500 }}
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

        {/* Preview de imagen actual + botón eliminar */}
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={previewImageUrl}
            sx={{
              width: 120,
              height: 120,
              fontSize: 40,
              color: 'white !important',
              bgcolor: previewImageUrl ? 'transparent' : 'primary.main',
              border: `3px solid ${theme.palette.primary.main}`,
              transition: 'none !important'
            }}
            // imgProps removed debug logs
          >
            {!previewImageUrl && (
              userInitials && userInitials !== 'U' ? 
                userInitials : 
                <PersonIcon sx={{ 
                  color: 'white !important', 
                  fontSize: 40, 
                  transition: 'none !important',
                  '&:hover': { color: 'white !important' },
                  '&:focus': { color: 'white !important' },
                  '&:active': { color: 'white !important' }
                }} />
            )}
          </Avatar>
          {/* Debug logs removed */}
          {currentImageUrl && !selectedImage && (
            <Tooltip title="Eliminar imagen actual">
              <IconButton
                aria-label="Eliminar imagen actual"
                data-testid="profile-image-delete-current"
                onClick={() => {
                  setSelectedImage(null);
                  setLocalImageUrl(undefined);
                }}
                size="large"
                sx={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  color: 'grey.600',
                  background: 'white',
                  boxShadow: 1,
                  '&:hover': {
                    color: 'grey.800',
                    background: 'rgba(158, 158, 158, 0.13)',
                  },
                }}
              >
                <DeleteIcon fontSize="medium" />
              </IconButton>
            </Tooltip>
          )}
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
            Máximo 300KB • JPG, PNG, WEBP
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
              <IconButton aria-label="Eliminar imagen seleccionada" data-testid="profile-image-remove-selected" size="small" onClick={handleRemoveImage} color="error">
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
          accept="image/png, image/jpeg, image/webp"
          aria-label="Selecciona imagen de perfil"
          data-testid="profile-image-input"
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
          disabled={!isSaveEnabled || loading}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileImageModal;
