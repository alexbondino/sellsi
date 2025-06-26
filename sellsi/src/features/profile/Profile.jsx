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

const Profile = ({ userProfile, onUpdateProfile }) => {
  const { showBanner } = useBanner();
  
  const [formData, setFormData] = useState({
    // Información Empresa
    email: '',
    phone: '',
    rut: '',
    role: 'supplier', // 'supplier' o 'buyer'
    country: '', // NUEVO: Campo país
    
    // Información de Envío
    shippingRegion: '',
    shippingComuna: '',
    shippingAddress: '',
    shippingNumber: '',
    shippingDept: '',
    
    // Información de Transferencia
    accountHolder: '',
    accountType: 'corriente', // 'corriente' o 'vista'
    bank: '',
    accountNumber: '',
    transferRut: '',
    confirmationEmail: '',
    
    // Información de Facturación
    businessName: '',
    billingRut: '',
    businessLine: '',
    billingAddress: '',
    billingRegion: '',
    billingComuna: '',
  });

  const [initialData, setInitialData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingProfileImage, setPendingProfileImage] = useState(null);

  const [showSensitiveData, setShowSensitiveData] = useState({
    accountNumber: false,
    transferRut: false,
    billingRut: false,
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // Cleanup effect para limpiar URLs de blob cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (pendingProfileImage?.url) {
        URL.revokeObjectURL(pendingProfileImage.url);
      }
    };
  }, [pendingProfileImage]);

  // Cargar datos del usuario
  useEffect(() => {
    if (userProfile) {
      const userData = {
        // Mapeo de campos existentes en BD
        email: userProfile.email || '',
        phone: userProfile.phone_nbr || '', // Mapear phone_nbr → phone
        rut: userProfile.rut || '',
        role: userProfile.main_supplier ? 'supplier' : 'buyer', // Convertir boolean → string
        country: userProfile.country || '', // Campo existente en BD
        user_nm: userProfile.user_nm || '', // AGREGAR: Campo para edición de nombre
        
        shippingRegion: userProfile.shipping_region || '',
        shippingComuna: userProfile.shipping_comuna || '',
        shippingAddress: userProfile.shipping_address || '',
        shippingNumber: userProfile.shipping_number || '',
        shippingDept: userProfile.shipping_dept || '',
        
        accountHolder: userProfile.account_holder || '',
        accountType: userProfile.account_type || 'corriente',
        bank: userProfile.bank || '',
        accountNumber: userProfile.account_number || '',
        transferRut: userProfile.transfer_rut || '',
        confirmationEmail: userProfile.confirmation_email || '',
        
        businessName: userProfile.business_name || '',
        billingRut: userProfile.billing_rut || '',
        businessLine: userProfile.business_line || '',
        billingAddress: userProfile.billing_address || '',
        billingRegion: userProfile.billing_region || '',
        billingComuna: userProfile.billing_comuna || '',
      };
      
      setFormData(userData);
      setInitialData(userData);
    }
  }, [userProfile]);

  // Detectar cambios (incluyendo imagen pendiente)
  useEffect(() => {
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialData);
    const imageChanged = !!pendingProfileImage; // Hay imagen pendiente
    const changed = formChanged || imageChanged;
    
    setHasChanges(changed);
  }, [formData, initialData, pendingProfileImage]);

  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSwitchChange = (field) => (event, newValue) => {
    if (newValue !== null) {
      setFormData(prev => ({
        ...prev,
        [field]: newValue
      }));
    }
  };

  const handleRegionChange = (field, regionField, comunaField) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [regionField]: value,
      [comunaField]: '' // Reset comuna
    }));
  };

  const handleUpdate = async () => {
    if (!hasChanges) return;
    
    setLoading(true);
    try {
      // Preparar datos para actualizar
      let dataToUpdate = { ...formData };
      
      // Si hay imagen pendiente, incluirla en la actualización
      if (pendingProfileImage) {
        dataToUpdate.profileImage = pendingProfileImage;
      }
      
      await onUpdateProfile(dataToUpdate);
      setInitialData(formData);
      setHasChanges(false);
      
      // Limpiar imagen pendiente después de guardar exitosamente
      if (pendingProfileImage) {
        URL.revokeObjectURL(pendingProfileImage.url); // Limpiar memoria
        setPendingProfileImage(null);
      }
      
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

  const maskSensitiveData = (value, showLast = 4) => {
    if (!value) return '';
    const str = value.toString();
    if (str.length <= showLast) return str;
    return '*'.repeat(str.length - showLast) + str.slice(-showLast);
  };

  const toggleSensitiveData = (field) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getSensitiveFieldValue = (field, value) => {
    return showSensitiveData[field] ? value : maskSensitiveData(value);
  };

  const validateRut = (rut) => {
    if (!rut) return true;
    const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
    return rutPattern.test(rut);
  };

  const validateEmail = (email) => {
    if (!email) return true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const getFullName = () => {
    return userProfile?.user_nm || 'Usuario'; // Usar user_nm de la BD
  };

  // Función para obtener el nombre que se debe mostrar (incluyendo cambios pendientes)
  const getDisplayName = () => {
    return formData.user_nm || userProfile?.user_nm || 'Usuario';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Función para manejar el avatar con logo o iniciales
  const getAvatarProps = () => {
    const logoUrl = getDisplayImageUrl(); // Usar la función que incluye imagen preliminar
    
    if (logoUrl) {
      return {
        src: logoUrl,
        alt: `Logo de ${getDisplayName()}`,
        children: null // No mostrar iniciales si hay logo
      };
    }
    
    return {
      src: undefined,
      children: getInitials(), // Mostrar iniciales si no hay logo
      sx: { bgcolor: 'primary.main' }
    };
  };

  const shippingComunas = formData.shippingRegion ? getComunasByRegion(formData.shippingRegion) : [];

  const billingComunas = formData.billingRegion ? getComunasByRegion(formData.billingRegion) : [];

  const handleNameSave = () => {
    if (editedName.trim() && editedName !== getFullName()) {
      console.log('🔄 [NAME EDIT] Saving name change:', {
        oldName: getFullName(),
        newName: editedName,
        currentFormData: formData
      });
      
      // Actualizar el formData para detectar cambios
      const updatedFormData = { 
        ...formData, 
        user_nm: editedName // Mapear a user_nm para la BD
      };
      
      console.log('🔄 [NAME EDIT] Updated formData:', updatedFormData);
      setFormData(updatedFormData);
      
      // Solo actualizar el estado local, NO guardar en BD automáticamente
      // Los cambios se guardarán cuando el usuario presione "Actualizar"
    }
    setIsEditingName(false);
  };

  // Función para salir del modo edición sin guardar automáticamente
  const handleNameBlur = () => {
    // Solo actualizar el estado local si hay cambios
    if (editedName.trim() && editedName !== getFullName()) {
      const updatedFormData = { 
        ...formData, 
        user_nm: editedName
      };
      setFormData(updatedFormData);
      console.log('📝 [NAME EDIT] Updated local state (no auto-save):', editedName);
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    // Restaurar el nombre original
    setEditedName(getFullName());
    setIsEditingName(false);
    console.log('❌ [NAME EDIT] Cancelled, restored original name:', getFullName());
  };

  // Funciones para manejar la imagen de perfil
  const handleImageClick = () => {
    setIsImageModalOpen(true);
  };

  const handleImageModalClose = () => {
    setIsImageModalOpen(false);
  };

  const handleImageChange = (imageData) => {
    // Limpiar imagen pendiente anterior si existe
    if (pendingProfileImage?.url) {
      URL.revokeObjectURL(pendingProfileImage.url);
    }
    
    setPendingProfileImage(imageData);
  };

  // Función para cancelar cambios de imagen
  const handleCancelImageChanges = () => {
    if (pendingProfileImage?.url) {
      URL.revokeObjectURL(pendingProfileImage.url);
    }
    setPendingProfileImage(null);
  };

  // Función para obtener la URL de la imagen a mostrar (incluyendo imagen preliminar)
  const getDisplayImageUrl = () => {
    if (pendingProfileImage) {
      return pendingProfileImage.url; // Mostrar imagen preliminar
    }
    return userProfile?.logo_url; // Mostrar imagen actual de BD
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
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: '50%',
                bgcolor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 1,
                },
              }}
              onClick={handleImageClick}
            >
              <CameraAltIcon sx={{ color: 'white', fontSize: 32 }} />
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

      {/* Grid Layout 2x2 */}
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
                  onFocus={() => setShowSensitiveData(prev => ({ ...prev, accountNumber: true }))}
                  onBlur={() => setShowSensitiveData(prev => ({ ...prev, accountNumber: false }))}
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
                  onFocus={() => setShowSensitiveData(prev => ({ ...prev, transferRut: true }))}
                  onBlur={() => setShowSensitiveData(prev => ({ ...prev, transferRut: false }))}
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
                  onFocus={() => setShowSensitiveData(prev => ({ ...prev, billingRut: true }))}
                  onBlur={() => setShowSensitiveData(prev => ({ ...prev, billingRut: false }))}
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
                    disabled={!hasChanges || loading}
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
        userInitials={getInitials()}
      />
    </Box>
  );
};

export default Profile;
