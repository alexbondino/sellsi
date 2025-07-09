import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PersonIcon from '@mui/icons-material/Person';
import ChangePasswordModal from './ChangePasswordModal';
import ProfileImageModal from '../ui/ProfileImageModal';
import { useBanner } from '../ui/banner/BannerContext';

// Hooks personalizados
import { useProfileForm } from './hooks/useProfileForm';
import { useProfileImage } from './hooks/useProfileImage';
import { useSensitiveFields } from './hooks/useSensitiveFields';

// Secciones modulares
import CompanyInfoSection from './sections/CompanyInfoSection';
import TransferInfoSection from './sections/TransferInfoSection';
import ShippingInfoSection from './sections/ShippingInfoSection';
import BillingInfoSection from './sections/BillingInfoSection';

// Utilidades
import { getInitials } from '../../utils/profileHelpers';

const Profile = ({ userProfile, onUpdateProfile }) => {
  const { showBanner } = useBanner();
  
  // Usar los hooks modulares
  const { formData, hasChanges, updateField, resetForm, updateInitialData } = useProfileForm(userProfile);
  const { 
    pendingImage, 
    handleImageChange: _handleImageChange, 
    getDisplayImageUrl,
    clearPendingImage 
  } = useProfileImage(userProfile?.logo_url);

  // Wrapper to log when image change is triggered from modal
  const handleImageChange = (imageData) => {
    _handleImageChange(imageData);
  } 
  const { 
    showSensitiveData, 
    toggleSensitiveData, 
    getSensitiveFieldValue 
  } = useSensitiveFields();

  // Estado local solo para UI
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Cleanup effect para limpiar URLs de blob cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (pendingImage?.url) {
        URL.revokeObjectURL(pendingImage.url);
      }
    };
  }, [pendingImage]);

  // Debug effect para monitorear cambios
  useEffect(() => {
    // Debug: Monitorear cambios de imagen y logo_url
    // console.log('[Profile] userProfile.logo_url changed:', userProfile?.logo_url);
    // console.log('[Profile] pendingImage changed:', pendingImage);
    // console.log('[Profile] getDisplayImageUrl():', getDisplayImageUrl());
  }, [userProfile?.logo_url, pendingImage]);

  // Handlers simplificados que usan los hooks
  const handleSwitchChange = (field) => (event, newValue) => {
    if (newValue !== null) {
      updateField(field, newValue);
    }
  };

  const handleRegionChange = (type, regionField, comunaField, value) => {
    updateField(regionField, value);
    updateField(comunaField, ''); // Reset comuna
  };

  const handleUpdate = async () => {
    // Verificar si hay cambios en formulario O imagen pendiente
    const hasFormChanges = hasChanges;
    const hasImageChanges = !!pendingImage;
    const hasPendingChanges = hasFormChanges || hasImageChanges;

    // console.log('[Profile] handleUpdate - hasFormChanges:', hasFormChanges);
    // console.log('[Profile] handleUpdate - hasImageChanges:', hasImageChanges);
    // console.log('[Profile] handleUpdate - formData:', formData);

    if (!hasPendingChanges) {
      // console.log('[Profile] handleUpdate - No hay cambios pendientes, no se actualiza.');
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para actualizar
      let dataToUpdate = { ...formData };

      // Si hay imagen pendiente, incluirla en la actualización
      if (pendingImage) {
        if (pendingImage.delete) {
          // console.log('[Profile] handleUpdate - Eliminando imagen de perfil (logo_url=null)');
          dataToUpdate.logo_url = null; // Eliminar imagen
          dataToUpdate.profileImage = null; // Asegurar que se pase null
        } else {
          // console.log('[Profile] handleUpdate - Subiendo nueva imagen de perfil');
          dataToUpdate.profileImage = pendingImage;
        }
      }

      // console.log('[Profile] handleUpdate - Llamando a onUpdateProfile con:', dataToUpdate);
      await onUpdateProfile(dataToUpdate);
      updateInitialData(); // Actualizar datos iniciales en lugar de resetear

      // Limpiar imagen pendiente después de guardar exitosamente
      clearPendingImage();

      // Mostrar banner de éxito
      showBanner({
        message: '✅ Perfil actualizado correctamente',
        severity: 'success',
        duration: 4000
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Mostrar banner de error
      showBanner({
        message: '❌ Error al actualizar el perfil. Por favor, inténtalo nuevamente.',
        severity: 'error',
        duration: 6000
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Calcular si hay cambios pendientes (formulario + imagen)
  const hasPendingChanges = hasChanges || !!pendingImage;

  // Funciones de nombre - RESTAURANDO LÓGICA ORIGINAL COMPLETA
  const getFullName = () => {
    return userProfile?.user_nm || 'Usuario'; // Usar user_nm de la BD
  };

  // Función para obtener el nombre que se debe mostrar (incluyendo cambios pendientes)
  const getDisplayName = () => {
    return formData.user_nm || userProfile?.user_nm || 'Usuario';
  };

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== getFullName()) {
      // Actualizar el formData para detectar cambios
      updateField('user_nm', editedName.trim());
      
      // Solo actualizar el estado local, NO guardar en BD automáticamente
      // Los cambios se guardarán cuando el usuario presione "Actualizar"
    }
    setIsEditingName(false);
  };

  // Función para salir del modo edición sin guardar automáticamente
  const handleNameBlur = () => {
    // Solo actualizar el estado local si hay cambios
    if (editedName.trim() && editedName !== getFullName()) {
      updateField('user_nm', editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    // Restaurar el nombre original
    setEditedName(getFullName());
    setIsEditingName(false);
  };

  const handleImageModalClose = () => {
    setIsImageModalOpen(false);
  };

  // Función para manejar el avatar con logo o iniciales
  const getAvatarProps = () => {
    const logoUrl = getDisplayImageUrl(); // Usar la función que incluye imagen preliminar
    // console.log('[Profile] getAvatarProps - logoUrl:', logoUrl);
    // console.log('[Profile] getAvatarProps - getDisplayName():', getDisplayName());
    if (logoUrl) {
      // console.log('[Profile] getAvatarProps - Using image URL');
      return {
        src: logoUrl,
        sx: { bgcolor: 'transparent' }
      };
    } else {
      const initials = getInitials(getDisplayName());
      // console.log('[Profile] getAvatarProps - initials:', initials);
      if (initials && initials.trim()) {
        // console.log('[Profile] getAvatarProps - Using initials');
        return {
          children: initials, // Mostrar iniciales si no hay logo
          sx: { 
            bgcolor: 'primary.main', 
            color: 'white !important',
            '& .MuiAvatar-fallback': { color: 'white !important' }
          }
        };
      } else {
        // console.log('[Profile] getAvatarProps - Using PersonIcon');
        return {
          children: <PersonIcon sx={{ 
            color: 'white !important', 
            transition: 'none !important',
            '&:hover': { color: 'white !important' },
            '&:focus': { color: 'white !important' },
            '&:active': { color: 'white !important' }
          }} />, // Mostrar icono de persona con color blanco
          sx: { 
            bgcolor: 'primary.main !important', 
            color: 'white !important', 
            transition: 'none !important' 
          }
        };
      }
    }
  };

  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  // Handlers para campos sensibles
  const handleSensitiveFocus = (field) => {
    toggleSensitiveData(field);
  };

  const handleSensitiveBlur = (field) => {
    toggleSensitiveData(field);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        {/* Avatar con hover clickeable */}
        <Tooltip title="Cambiar imagen de perfil" placement="top">
          <Box sx={{ position: 'relative', mr: 2 }}>
            <Avatar 
              {...getAvatarProps()}
              onClick={handleImageClick}
              sx={{ 
                width: 96, 
                height: 96, 
                fontSize: 29, 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                },
                ...getAvatarProps().sx 
              }}
            />
            
            {/* Icono de cámara en hover */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'primary.main',
                borderRadius: '50%',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 2,
                opacity: 0.9,
                transition: 'opacity 0.3s ease',
                '&:hover': { opacity: 1 }
              }}
            >
              <CameraAltIcon sx={{ fontSize: 16, color: 'white' }} />
            </Box>
          </Box>
        </Tooltip>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isEditingName ? (
            <TextField
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              size="small"
              variant="standard"
              sx={{ fontSize: 32, fontWeight: 500, minWidth: 180 }}
              onBlur={handleNameBlur}
              onKeyDown={e => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') handleNameCancel();
              }}
              autoFocus
              inputProps={{ style: { fontSize: 32, fontWeight: 500, padding: 0 } }}
            />
          ) : (
            <Typography variant="h4" sx={{ color: 'text.primary' }}>
              {getDisplayName()}
              <IconButton
                size="small"
                sx={{ ml: 1 }}
                title="Editar nombre de usuario"
                onClick={() => {
                  setEditedName(getFullName()); // Usar getFullName en lugar de getDisplayName
                  setIsEditingName(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Typography>
          )}
        </Box>
      </Box>

      {/* Grid Layout 2x2 - PRESERVANDO ESTRUCTURA VISUAL ORIGINAL */}
      <Paper sx={{ p: 0, bgcolor: '#fff', boxShadow: 2, borderRadius: 3, mb: 4 }}>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, auto)',
          gap: 3,
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr',
            gridTemplateRows: 'repeat(4, auto)',
          }
        }}>
          {/* Primera fila - Primera columna: Información Empresa */}
          <CompanyInfoSection 
            formData={formData}
            onFieldChange={updateField}
            onPasswordModalOpen={() => setIsPasswordModalOpen(true)}
          />

          {/* Primera fila - Segunda columna: Información de Transferencia */}
          <TransferInfoSection 
            formData={formData}
            onFieldChange={updateField}
            showSensitiveData={showSensitiveData}
            toggleSensitiveData={toggleSensitiveData}
            getSensitiveFieldValue={getSensitiveFieldValue}
          />

          {/* Segunda fila - Primera columna: Información de Envío */}
          <ShippingInfoSection 
            formData={formData}
            onFieldChange={updateField}
            onRegionChange={handleRegionChange}
          />

          {/* Segunda fila - Segunda columna: Información de Facturación */}
          <BillingInfoSection 
            formData={formData}
            onFieldChange={updateField}
            onRegionChange={handleRegionChange}
            hasChanges={hasPendingChanges}
            loading={loading}
            onUpdate={handleUpdate}
            getSensitiveFieldValue={getSensitiveFieldValue}
            onFocusSensitive={handleSensitiveFocus}
            onBlurSensitive={handleSensitiveBlur}
          />
        </Box>
        {/* Descripción proveedor solo si el rol es supplier */}
        {formData.role === 'supplier' && (
          <Box sx={{ mt: 3, px: 3 }}>
            <TextField
              label="Descripción breve del proveedor"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={formData.descripcionProveedor || ''}
              onChange={e => {
                const value = e.target.value;
                if (value.length <= 200) {
                  updateField('descripcionProveedor', value);
                }
              }}
              placeholder="Una descripción resumida del tipo de productos que comercializas..."
              helperText={`Una descripción resumida del tipo de productos que comercializas. Esta información ayudará a los compradores a identificar rápidamente tu oferta. (${(formData.descripcionProveedor || '').length}/200)`}
              sx={{ '.MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
        )}
      </Paper>

      {/* Modal de Cambio de Contraseña */}
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        showBanner={showBanner}
        onPasswordChanged={() => {
          setIsPasswordModalOpen(false);
          // Mostrar banner de éxito
          showBanner({
            message: '✅ Contraseña actualizada correctamente',
            severity: 'success',
            duration: 4000
          });
        }}
      />

      {/* Modal de Cambio de Imagen de Perfil */}
      <ProfileImageModal
        open={isImageModalOpen}
        onClose={handleImageModalClose}
        onImageChange={handleImageChange}
        currentImageUrl={userProfile?.logo_url}
        userInitials={getInitials(getDisplayName())}
      />
    </Box>
  );
};

export default Profile;

