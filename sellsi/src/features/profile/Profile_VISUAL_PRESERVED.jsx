import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Avatar,
  Paper,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ProfileSwitch from './ProfileSwitch';
import ChangePasswordModal from './ChangePasswordModal';
import ProfileImageModal from '../ui/ProfileImageModal';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { 
  regiones, 
  getComunasByRegion
} from '../../utils/chileData';
import { useBanner } from '../ui/banner/BannerContext';

// Hooks personalizados
import { useProfileForm } from './hooks/useProfileForm';
import { useProfileImage } from './hooks/useProfileImage';
import { useSensitiveFields } from './hooks/useSensitiveFields';

// Utilidades
import { validateRut, validateEmail } from '../../utils/validators';
import { getInitials } from '../../utils/profileHelpers';

const Profile = ({ userProfile, onUpdateProfile }) => {
  const { showBanner } = useBanner();
  
  // Usar los hooks modulares
  const { formData, hasChanges, updateField, resetForm, updateInitialData } = useProfileForm(userProfile);
  const { 
    pendingImage, 
    handleImageChange, 
    getDisplayImageUrl,
    clearPendingImage 
  } = useProfileImage(userProfile?.logo_url);
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

  // Handlers simplificados que usan los hooks
  const handleInputChange = (field) => (event) => {
    updateField(field, event.target.value);
  };

  const handleSwitchChange = (field) => (event, newValue) => {
    if (newValue !== null) {
      updateField(field, newValue);
    }
  };

  const handleRegionChange = (field, regionField, comunaField) => (event) => {
    const value = event.target.value;
    updateField(regionField, value);
    updateField(comunaField, ''); // Reset comuna
  };

  const handleUpdate = async () => {
    // Verificar si hay cambios en formulario O imagen pendiente
    const hasFormChanges = hasChanges;
    const hasImageChanges = !!pendingImage;
    const hasPendingChanges = hasFormChanges || hasImageChanges;
    
    if (!hasPendingChanges) return;
    
    setLoading(true);
    try {
      // Preparar datos para actualizar
      let dataToUpdate = { ...formData };
      
      // Si hay imagen pendiente, incluirla en la actualización
      if (pendingImage) {
        dataToUpdate.profileImage = pendingImage;
      }
      
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

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== getDisplayName()) {
      updateField('user_nm', editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setEditedName(getDisplayName());
    setIsEditingName(false);
  };

  const handleImageModalClose = () => {
    setIsImageModalOpen(false);
  };

  // Función para obtener el nombre que se debe mostrar (incluyendo cambios pendientes)
  const getDisplayName = () => {
    return formData.user_nm || userProfile?.user_nm || 'Usuario';
  };

  // Función para manejar el avatar con logo o iniciales
  const getAvatarProps = () => {
    const logoUrl = getDisplayImageUrl(); // Usar la función que incluye imagen preliminar
    
    if (logoUrl) {
      return {
        src: logoUrl,
        sx: { bgcolor: '#f5f5f5' }
      };
    } else {
      return {
        children: getInitials(getDisplayName()), // Mostrar iniciales si no hay logo
        sx: { bgcolor: 'primary.main', color: 'white' }
      };
    }
  };

  const handleImageClick = () => {
    setIsImageModalOpen(true);
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
              onBlur={handleNameSave}
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
                  setEditedName(getDisplayName());
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
          <Box sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
              Información Empresa
            </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Correo Electrónico"
                  value={formData.email}
                  InputProps={{ readOnly: true }}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120 }}>
                    Contraseña
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    Cambiar contraseña
                  </Button>
                </Box>
                
                <TextField
                  label="Teléfono"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="56963109665"
                />
                
                <TextField
                  label="RUT"
                  value={formData.rut}
                  onChange={handleInputChange('rut')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="77.122.155-5"
                  error={!validateRut(formData.rut)}
                  helperText={!validateRut(formData.rut) ? 'Formato de RUT inválido' : ''}
                />
                
                <TextField
                  label="País"
                  value={formData.country}
                  onChange={handleInputChange('country')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Chile"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120 }}>
                    Función
                  </Typography>
                  <ProfileSwitch
                    type="role"
                    value={formData.role}
                    onChange={handleSwitchChange('role')}
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, ml: 0.5 }}>
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Esta será tu función primaria. Cuando inicies sesión, verás el panel según tu función.
                  </Typography>
                </Box>
              </Box>
            </Box>

          {/* Primera fila - Segunda columna: Información de Transferencia */}
          <Box sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
              Información de Transferencia
            </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nombre Titular"
                  value={formData.accountHolder}
                  onChange={handleInputChange('accountHolder')}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" sx={{ minWidth: 120 }}>
                    Tipo de Cuenta
                  </Typography>
                  <ProfileSwitch
                    type="accountType"
                    value={formData.accountType}
                    onChange={handleSwitchChange('accountType')}
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
                
                <TextField
                  label="Banco"
                  value={formData.bank}
                  onChange={handleInputChange('bank')}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
                
                <TextField
                  label="N° de Cuenta"
                  value={getSensitiveFieldValue('accountNumber', formData.accountNumber)}
                  onChange={handleInputChange('accountNumber')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  onFocus={() => toggleSensitiveData('accountNumber')}
                  onBlur={() => toggleSensitiveData('accountNumber')}
                />
                
                <TextField
                  label="RUT"
                  value={getSensitiveFieldValue('transferRut', formData.transferRut)}
                  onChange={handleInputChange('transferRut')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!validateRut(formData.transferRut)}
                  helperText={!validateRut(formData.transferRut) ? 'Formato de RUT inválido' : ''}
                  onFocus={() => toggleSensitiveData('transferRut')}
                  onBlur={() => toggleSensitiveData('transferRut')}
                />
                
                <TextField
                  label="Correo Confirmación"
                  value={formData.confirmationEmail}
                  onChange={handleInputChange('confirmationEmail')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="email"
                  error={!validateEmail(formData.confirmationEmail)}
                  helperText={!validateEmail(formData.confirmationEmail) ? 'Formato de email inválido' : ''}
                />
              </Box>
            </Box>

          {/* Segunda fila - Primera columna: Información de Envío */}
          <Box sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
              Información de Envío
            </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Región</InputLabel>
                  <Select
                    value={formData.shippingRegion}
                    onChange={handleRegionChange('shipping', 'shippingRegion', 'shippingComuna')}
                    label="Región"
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {regiones.map(region => (
                      <MenuItem key={region.value} value={region.value}>
                        {region.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" disabled={!formData.shippingRegion}>
                  <InputLabel>Comuna</InputLabel>
                  <Select
                    value={formData.shippingComuna}
                    onChange={handleInputChange('shippingComuna')}
                    label="Comuna"
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {(formData.shippingRegion ? getComunasByRegion(formData.shippingRegion) : []).map(comuna => (
                      <MenuItem key={comuna.value} value={comuna.value}>
                        {comuna.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  label="Dirección de Envío"
                  value={formData.shippingAddress}
                  onChange={handleInputChange('shippingAddress')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Halimeda 433"
                />
                
                <TextField
                  label="Dirección Número"
                  value={formData.shippingNumber}
                  onChange={handleInputChange('shippingNumber')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  type="number"
                />
                
                <TextField
                  label="Dirección Depto."
                  value={formData.shippingDept}
                  onChange={handleInputChange('shippingDept')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Depto. 101"
                />
              </Box>
            </Box>

          {/* Segunda fila - Segunda columna: Información de Facturación */}
          <Box sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" sx={{ mb: 2, pb: 1, borderBottom: 2, borderColor: 'primary.main' }}>
              Información de Facturación
            </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Razón Social"
                  value={formData.businessName}
                  onChange={handleInputChange('businessName')}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
                
                <TextField
                  label="RUT"
                  value={getSensitiveFieldValue('billingRut', formData.billingRut)}
                  onChange={handleInputChange('billingRut')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  error={!validateRut(formData.billingRut)}
                  helperText={!validateRut(formData.billingRut) ? 'Formato de RUT inválido' : ''}
                  onFocus={() => toggleSensitiveData('billingRut')}
                  onBlur={() => toggleSensitiveData('billingRut')}
                />
                
                <TextField
                  label="Giro"
                  value={formData.businessLine}
                  onChange={handleInputChange('businessLine')}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
                
                <TextField
                  label="Dirección"
                  value={formData.billingAddress}
                  onChange={handleInputChange('billingAddress')}
                  fullWidth
                  variant="outlined"
                  size="small"
                />
                
                <FormControl fullWidth size="small">
                  <InputLabel>Región</InputLabel>
                  <Select
                    value={formData.billingRegion}
                    onChange={handleRegionChange('billing', 'billingRegion', 'billingComuna')}
                    label="Región"
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {regiones.map(region => (
                      <MenuItem key={region.value} value={region.value}>
                        {region.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" disabled={!formData.billingRegion}>
                  <InputLabel>Comuna</InputLabel>
                  <Select
                    value={formData.billingComuna}
                    onChange={handleInputChange('billingComuna')}
                    label="Comuna"
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {(formData.billingRegion ? getComunasByRegion(formData.billingRegion) : []).map(comuna => (
                      <MenuItem key={comuna.value} value={comuna.value}>
                        {comuna.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleUpdate}
                    disabled={!hasChanges && !pendingImage || loading}
                    sx={{ 
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    {loading ? 'Actualizando...' : 'Actualizar'}
                  </Button>
                </Box>
              </Box>
            </Box>
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
