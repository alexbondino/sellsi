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
import ChangePasswordModal from '../components/ChangePasswordModal';
import ProfileImageModal from '../../../shared/components/modals/ProfileImageModal';
import { useBanner } from '../../../shared/components/display/banners/BannerContext';

// Hooks personalizados
import { useProfileForm } from '../hooks/useProfileForm';
import { useProfileImage } from '../hooks/useProfileImage';
import { useSensitiveFields } from '../hooks/useSensitiveFields';
import { useOptimizedUserShippingRegion } from '../../../hooks/useOptimizedUserShippingRegion';
import { useRoleSync } from '../../../shared/hooks';

// Secciones modulares
import { CompanyInfoSection, TransferInfoSection, ShippingInfoSection, BillingInfoSection } from '../components/sections';

// Utilidades
import { getInitials } from '../../../utils/profileHelpers';
import { trackUserAction } from '../../../services/security';
import { getUserProfile } from '../../../services/user';

const Profile = ({ userProfile, onUpdateProfile }) => {
  const { showBanner } = useBanner();

  // Estado local para el perfil cargado
  const [loadedProfile, setLoadedProfile] = useState(null);

  // Cargar perfil completo desde Supabase al montar
  useEffect(() => {
    async function fetchProfile() {
      const userId = userProfile?.user_id;
      if (userId) {
        const profile = await getUserProfile(userId);
        setLoadedProfile(profile?.data || null);
      }
    }
    fetchProfile();
  }, [userProfile?.user_id]);

  // Usar los hooks modulares con el perfil cargado
  const { formData, hasChanges, updateField, resetForm, updateInitialData } = useProfileForm(loadedProfile);
  useEffect(() => {
    }, [formData.shippingRegion, formData.shippingComuna]);
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

  // Hook para invalidar caché de shipping
  const { invalidateUserCache } = useOptimizedUserShippingRegion();
  
  // ✅ NUEVO: Hook para sincronización automática de roles
  const { isInSync, debug } = useRoleSync();

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
  }, [userProfile?.logo_url, pendingImage]);

  // ✅ NUEVO: Debug effect para monitorear sincronización de roles (opcional, solo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !isInSync) {
      console.warn('🔄 Role sync issue detected:', debug);
    }
  }, [isInSync, debug]);

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

    if (!hasPendingChanges) {
      return;
    }

    setLoading(true);
    try {
      // Preparar datos para actualizar
      let dataToUpdate = { ...formData };

      // Si hay imagen pendiente, incluirla en la actualización
      if (pendingImage) {
        if (pendingImage.delete) {
          dataToUpdate.logo_url = null; // Eliminar imagen
          dataToUpdate.profileImage = null; // Asegurar que se pase null
        } else {
          dataToUpdate.profileImage = pendingImage;
        }
      }

      await onUpdateProfile(dataToUpdate);
      updateInitialData(); // Actualizar datos iniciales en lugar de resetear

      // ✅ INVALIDAR CACHÉ DE SHIPPING si cambió la región
      if (dataToUpdate.shipping_region || dataToUpdate.shippingRegion) {
        invalidateUserCache();
      }

      // Registrar IP del usuario al actualizar perfil (solo si tenemos perfil cargado)
      if (loadedProfile?.user_id) {
        try {
          await trackUserAction(loadedProfile.user_id, 'profile_updated');
        } catch (trackError) {
          // Error silencioso para no afectar la experiencia del usuario
          }
      }

      // Limpiar imagen pendiente después de guardar exitosamente
      clearPendingImage();

      // Mostrar banner de éxito
      showBanner({
        message: '✅ Perfil actualizado correctamente',
        severity: 'success',
        duration: 4000
      });

    } catch (error) {
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
    if (logoUrl) {
      return {
        src: logoUrl,
        sx: { bgcolor: 'transparent' }
      };
    } else {
      const initials = getInitials(getDisplayName());
      if (initials && initials.trim()) {
        return {
          children: initials, // Mostrar iniciales si no hay logo
          sx: { 
            bgcolor: 'primary.main', 
            color: 'white !important',
            '& .MuiAvatar-fallback': { color: 'white !important' }
          }
        };
      } else {
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
