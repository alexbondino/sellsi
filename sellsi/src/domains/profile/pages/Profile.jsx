import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom'; // Para manejar parámetros de URL
import {
  Box,
  Typography,
  TextField,
  Avatar,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
} from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';
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
import { useAuth } from '../../../infrastructure/providers';

// Secciones modulares
import TransferInfoSection from '../components/sections/TransferInfoSection';
import ShippingInfoSection from '../components/sections/ShippingInfoSection';
import BillingInfoSection from '../components/sections/BillingInfoSection';
import CompanyInfoSection from '../components/sections/CompanyInfoSection';
// Documento Tributario eliminado

// Utilidades
import { getInitials, mapFormDataToUserProfile, mapUserProfileToFormData } from '../../../utils/profileHelpers';
import { trackUserAction } from '../../../services/security';
import { getUserProfile, updateUserProfile, uploadProfileImage, deleteAllUserImages } from '../../../services/user';
import { supabase } from '../../../services/supabase';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';
import { invalidateTransferInfoCache } from '../../../shared/hooks/profile/useTransferInfoValidation'; // Para invalidar cache bancario
import { invalidateBillingInfoCache } from '../../../shared/hooks/profile/useBillingInfoValidation'; // Invalidar cache facturación

/**
 * 🎭 Profile - Orquestador Universal de Perfiles
 * 
 * Componente orquestador que maneja la carga de datos y delega
 * la renderización a componentes modulares especializados.
 * 
 * Responsabilidades:
 * - Carga y mapeo de datos del usuario
 * - Orquestación de componentes modulares  
 * - Gestión de estado global del perfil
 * - Coordinación de actualizaciones
 * 
 * NO es monolítico: delega UI a secciones especializadas
 */
const Profile = ({ userProfile: initialUserProfile, onUpdateProfile: externalUpdateHandler }) => {
  const { showBanner } = useBanner();
  const location = useLocation(); // Para obtener parámetros de URL
  const { refreshUserProfile } = useAuth(); // Para actualizar avatar en TopBar sin F5

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Estado local para el perfil cargado y completo
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const [loadedProfile, setLoadedProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ NUEVO: Estado para highlight de campos bancarios
  const [shouldHighlightTransferFields, setShouldHighlightTransferFields] = useState(false);
  // ✅ NUEVO: Estado para highlight de campos de despacho
  const [shouldHighlightShippingFields, setShouldHighlightShippingFields] = useState(false);
  // ✅ NUEVO: Estado para highlight de campos de facturación
  const [shouldHighlightBillingFields, setShouldHighlightBillingFields] = useState(false);

  // ✅ NUEVO: Verificar parámetros de URL al montar y cuando cambie la location
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const section = urlParams.get('section');
    const highlight = urlParams.get('highlight');
    
    if (section === 'transfer' && highlight === 'true') {
      setShouldHighlightTransferFields(true);
      console.log('🎯 Resaltando campos de información bancaria por redirección');
      // Scroll automático a la sección de transferencia
      setTimeout(() => {
        const transferSection = document.getElementById('transfer-info-section');
        if (transferSection) {
          transferSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      // Remover el highlight después de 10 segundos para mejor UX
      const timer = setTimeout(() => {
        setShouldHighlightTransferFields(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
    if (section === 'shipping' && highlight === 'true') {
      setShouldHighlightShippingFields(true);
      console.log('🎯 Resaltando campos de dirección de despacho por redirección');
      // Scroll automático a la sección de shipping
      setTimeout(() => {
        const shippingSection = document.getElementById('shipping-info-section');
        if (shippingSection) {
          shippingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      const timer = setTimeout(() => { setShouldHighlightShippingFields(false); }, 10000);
      return () => clearTimeout(timer);
    }
    if (section === 'billing' && highlight === 'true') {
      setShouldHighlightBillingFields(true);
      console.log('🎯 Resaltando campos de facturación por redirección');
      // Scroll to billing section
      setTimeout(() => {
        const billingSection = document.getElementById('billing-info-section');
        if (billingSection) {
          billingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
      const timer = setTimeout(() => { setShouldHighlightBillingFields(false); }, 10000);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  // Cargar perfil completo desde Supabase al montar (lógica antes en BuyerProfile/SupplierProfile)
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Usar el servicio para obtener el perfil completo
      const { data, error } = await getUserProfile(user.id);
      
      console.log('📞 [PROFILE DEBUG] Datos crudos de getUserProfile:', {
        phone_nbr: data?.phone_nbr,
        country: data?.country,
        email: data?.email,
        user_nm: data?.user_nm
      });
      
      if (error) {
        throw error;
      }

      // ✅ Usar mapUserProfileToFormData para mapeo consistente (incluye derivación de NSN)
      const mappedProfile = {
        ...data,
        user_id: user.id,
        email: user.email,
        logo_url: data.logo_url,
        ...mapUserProfileToFormData(data), // Delegar mapeo a la función especializada
      };
      
      console.log('📞 [PROFILE DEBUG] Perfil mapeado:', {
        phone: mappedProfile.phone,
        phone_nbr_original: data.phone_nbr,
        country: mappedProfile.country,
        email: mappedProfile.email
      });

      setUserProfile(mappedProfile);
      setLoadedProfile(mappedProfile);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      showBanner({
        message: '❌ Error al cargar el perfil',
        severity: 'error',
        duration: 6000
      });
    }
  };

  // Handler de actualización (lógica antes duplicada en ambos profiles)
  const handleUpdateProfile = async (profileData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Actualizar usando el servicio
      await updateUserProfile(user.id, profileData);
      
  // ✅ INVALIDAR CACHE DE INFORMACIÓN BANCARIA si se actualizaron campos relacionados
      // NOTA: Los campos que llegan aquí están en formato BD (snake_case)
      const transferFields = ['account_holder', 'bank', 'account_number', 'transfer_rut', 'confirmation_email'];
      const hasTransferFieldUpdate = transferFields.some(field => profileData.hasOwnProperty(field));
      
      // ✅ TAMBIÉN verificar campos de formulario (camelCase) en caso de que vengan así
      const transferFieldsForm = ['accountHolder', 'accountNumber', 'transferRut', 'confirmationEmail'];
      const hasTransferFieldFormUpdate = transferFieldsForm.some(field => profileData.hasOwnProperty(field));
      
      if (hasTransferFieldUpdate || hasTransferFieldFormUpdate) {
        console.log('🏦 Invalidando cache de información bancaria por actualización de perfil');
        invalidateTransferInfoCache();
      }

      // ✅ INVALIDAR CACHE DE FACTURACIÓN si se actualizaron campos billing
      const billingFields = ['business_name','billing_rut','business_line','billing_address','billing_region','billing_commune'];
      const hasBillingUpdate = billingFields.some(field => profileData.hasOwnProperty(field));
      if (hasBillingUpdate) {
        console.log('🧾 Invalidando cache de facturación por actualización de perfil');
        invalidateBillingInfoCache();
      }
      
      // ✅ INVALIDAR CACHE DE PRODUCTOS si se actualizó compra mínima o descripción de proveedor
      const supplierFields = ['minimum_purchase_amount', 'descripcion_proveedor', 'minimumPurchaseAmount', 'descripcionProveedor'];
      const hasSupplierUpdate = supplierFields.some(field => profileData.hasOwnProperty(field));
      if (hasSupplierUpdate) {
        console.log('🛒 Invalidando cache de productos del marketplace por cambio en datos de proveedor');
        try { window.invalidateProductsCache?.(); } catch(e) {}
      }
      
      // Recargar perfil después de actualizar
      await fetchUserProfile();
      
      // Notificar al componente padre si existe
      if (externalUpdateHandler) {
        await externalUpdateHandler(profileData);
      }
    } catch (error) {
      throw error;
    }
  };

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

  // Estado local solo para UI (sin duplicar loading)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
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

  // Mostrar errores de shipping cuando el usuario intenta actualizar sin completar campos obligatorios
  const [showShippingErrors, setShowShippingErrors] = useState(false);
  // Mostrar errores de billing (nueva lógica condicionada por businessName)
  const [showBillingErrors, setShowBillingErrors] = useState(false);

  // Wrapper para updateField que limpia errores al editar campos de envío
  const handleFieldChange = (field, value) => {
    updateField(field, value);
    if (field.startsWith('shipping')) {
      setShowShippingErrors(false);
    }
    if (field.startsWith('billing') || field === 'businessName' || field === 'businessLine') {
      setShowBillingErrors(false);
    }
  };

  const inFlightUpdateRef = useRef(false);

  const handleUpdate = async () => {
    // Prevent duplicate rapid submissions
    if (inFlightUpdateRef.current) return;
    inFlightUpdateRef.current = true;
    // Verificar si hay cambios en formulario (excluyendo imagen y nombre que se guardan automáticamente)
    const hasFormChanges = hasChanges;

    if (!hasFormChanges) {
      showBanner({ message: 'No hay cambios para actualizar', severity: 'info', duration: 3000 });
      return;
    }

    setLoading(true);
    try {
      // ✅ MAPEAR CORRECTAMENTE: FormData → BD format
      console.log('📋 FormData antes del mapeo (COMPLETO):', JSON.stringify(formData, null, 2));
      let dataToUpdate = mapFormDataToUserProfile(formData, loadedProfile);
      console.log('🔄 Datos después del mapeo (COMPLETO):', JSON.stringify(dataToUpdate, null, 2));
      
      // Eliminar campos que se manejan automáticamente
      delete dataToUpdate.profileImage;
      delete dataToUpdate.user_nm;
      delete dataToUpdate.logo_url;

      console.log('📤 Datos finales a enviar (COMPLETO):', JSON.stringify(dataToUpdate, null, 2));
      // Strict validation: check both the raw formData and the already-mapped dataToUpdate.
      // This prevents cases where mapping or missing properties would allow an update to proceed
      // even though the user has partially filled required fields.
      const regionValue = formData?.shippingRegion;
      const communeValue = formData?.shippingCommune;
      const addressValue = formData?.shippingAddress;
      const regionSelected = regionValue !== undefined && regionValue !== null && String(regionValue).trim() !== '';

      // Also inspect mapped data (snake_case) because mapFormDataToUserProfile may materialize changes there
      const finalRegion = dataToUpdate.shipping_region ?? dataToUpdate.shippingRegion ?? regionValue;
      const finalCommune = dataToUpdate.shipping_commune ?? dataToUpdate.shippingCommune ?? communeValue;
      const finalAddress = dataToUpdate.shipping_address ?? dataToUpdate.shippingAddress ?? addressValue;

      const communeFilled = finalCommune !== undefined && finalCommune !== null && String(finalCommune).trim() !== '';
      const addressFilled = finalAddress !== undefined && finalAddress !== null && String(finalAddress).trim() !== '';

      if ((regionSelected || finalRegion) && (!communeFilled || !addressFilled)) {
        // Mostrar errores inline en los campos y evitar enviar la petición
        setShowShippingErrors(true);
        showBanner({ message: 'Por favor completa Comuna y Dirección de Envío para actualizar el perfil.', severity: 'error', duration: 6000 });
        setLoading(false);
        return;
      }

      // Billing: if business name exists in either form or mapped data, require full billing fields
      const businessNameFilled = (formData?.businessName && formData.businessName.trim() !== '') || (dataToUpdate.business_name && String(dataToUpdate.business_name).trim() !== '');
      if (businessNameFilled) {
        const billingRut = dataToUpdate.billing_rut ?? formData?.billingRut;
        const businessLine = dataToUpdate.business_line ?? formData?.businessLine;
        const billingAddress = dataToUpdate.billing_address ?? formData?.billingAddress;
        const billingRegion = dataToUpdate.billing_region ?? formData?.billingRegion;
        const billingCommune = dataToUpdate.billing_commune ?? formData?.billingCommune;
        const anyMissing = [billingRut, businessLine, billingAddress, billingRegion, billingCommune].some(v => !v || String(v).trim() === '');
        if (anyMissing) {
          setShowBillingErrors(true);
          showBanner({ message: 'Completa todos los campos de Facturación para actualizar (RUT, Giro, Dirección, Región, Comuna).', severity: 'error', duration: 6000 });
          setLoading(false);
          return;
        }
      }
  await handleUpdateProfile(dataToUpdate);
      updateInitialData(); // Actualizar datos iniciales en lugar de resetear

      // ✅ INVALIDAR / PRIMAR CACHÉ DE SHIPPING si cambió la región o campos de despacho
      const shippingFields = ['shipping_region', 'shipping_commune', 'shipping_address', 'shipping_number'];
      const hasShippingUpdate = shippingFields.some(field => dataToUpdate.hasOwnProperty(field));
      const newRegion = dataToUpdate.shipping_region || dataToUpdate.shippingRegion;
      
      if (newRegion || hasShippingUpdate) {
        invalidateUserCache();
        if (newRegion) {
          try { window.primeUserShippingRegionCache?.(newRegion); } catch(e) {}
        }
        // ✅ FIX: Invalidar cache de validación de shipping para que AddToCart lo reconozca
        try { window.invalidateShippingInfoCache?.(); } catch(e) {}
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
      inFlightUpdateRef.current = false;
    }
  };

  // Calcular si hay cambios pendientes (solo formulario, excluyendo imagen y nombre que se guardan automáticamente)
  const hasPendingChanges = hasChanges;

  // Funciones de nombre - RESTAURANDO LÓGICA ORIGINAL COMPLETA
  const getFullName = () => {
    return userProfile?.user_nm || 'Usuario'; // Usar user_nm de la BD
  };

  // Función para obtener el nombre que se debe mostrar (incluyendo cambios pendientes)
  const getDisplayName = () => {
    return formData.user_nm || userProfile?.user_nm || 'Usuario';
  };

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== getFullName()) {
      try {
        setLoading(true);
        // Guardar automáticamente en Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await updateUserProfile(user.id, { user_nm: editedName.trim() });
          // Actualizar estado local
          updateField('user_nm', editedName.trim());
          updateInitialData();
        }
      } catch (error) {
  showBanner({ message: 'Error al actualizar el nombre', severity: 'error' });
      } finally {
        setLoading(false);
      }
    }
    setIsEditingName(false);
  };

  // Función para salir del modo edición y guardar automáticamente
  const handleNameBlur = async () => {
    if (editedName.trim() && editedName !== getFullName()) {
      try {
        // Guardar automáticamente en Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await updateUserProfile(user.id, { user_nm: editedName.trim() });
          // Actualizar estado local
          updateField('user_nm', editedName.trim());
          updateInitialData();
        }
      } catch (error) {
  showBanner({ message: 'Error al actualizar el nombre', severity: 'error' });
      }
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

  // Función para guardar imagen automáticamente en Supabase
  const handleSaveImageAutomatic = async (imageFile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      let logoPublicUrl = null;

      if (imageFile === null) {
        // Eliminar imagen
        const deleteResult = await deleteAllUserImages(user.id);
        if (!deleteResult.success) {
          console.warn('No se pudieron eliminar las imágenes previas:', deleteResult.error);
        }
      } else {
        // Subir nueva imagen
        const { url, error } = await uploadProfileImage(user.id, imageFile);
        if (error) {
          throw new Error(`Error al subir la imagen: ${error.message}`);
        }
        logoPublicUrl = url;
      }

      // Actualizar estado local - recargar perfil desde la BD
      const updatedProfile = await getUserProfile(user.id);
      if (updatedProfile?.data) {
        // ✅ IMPORTANTE: Actualizar AMBOS estados para que el avatar se actualice sin F5
        // - loadedProfile: para el formulario de datos
        // - userProfile: para useProfileImage hook que controla el avatar
        const mappedProfile = {
          ...updatedProfile.data,
          user_id: user.id,
          logo_url: updatedProfile.data.logo_url,
          ...mapUserProfileToFormData(updatedProfile.data),
        };
        setLoadedProfile(updatedProfile.data);
        setUserProfile(mappedProfile);
      }
      
      // ✅ IMPORTANTE: Actualizar el contexto global para que TopBar/Avatar se actualicen sin F5
      await refreshUserProfile();
      
      showBanner({ message: 'Imagen actualizada correctamente', severity: 'success' });
    } catch (error) {
      throw new Error(error.message || 'Error al guardar la imagen');
    }
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

  // Función para guardar imagen automáticamente en Supabase
  const handleSaveImageToSupabase = async (imageFile) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      if (imageFile === null) {
        // Eliminar imagen
        await deleteAllUserImages(user.id);
        await updateUserProfile(user.id, { logo_url: null });
        clearPendingImage();
        updateInitialData();
  showBanner({ message: 'Imagen eliminada correctamente', severity: 'success' });
      } else {
        // Subir nueva imagen
        const { url, error } = await uploadProfileImage(user.id, imageFile);
        if (error) {
          throw new Error(error.message);
        }
        
        await updateUserProfile(user.id, { logo_url: url });
        clearPendingImage();
        updateInitialData();
  showBanner({ message: 'Imagen actualizada correctamente', severity: 'success' });
      }
      
      // Refrescar el perfil
      if (onUpdateProfile) {
        await onUpdateProfile({});
      }
    } catch (error) {
      throw new Error(error.message || 'Error al guardar la imagen');
    }
  };

  // Handlers para campos sensibles
  const handleSensitiveFocus = (field) => {
    toggleSensitiveData(field);
  };

  const handleSensitiveBlur = (field) => {
    toggleSensitiveData(field);
  };

  return (
    <>
      {/* Loading state mientras se carga el perfil */}
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            Cargando perfil...
          </Typography>
        </Box>
      ) : (
        <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', pt: { xs: 2, md: 4 }, px: { xs: 0, md: 3 }, pb: SPACING_BOTTOM_MAIN, ml: { xs: 0, md: 10, lg: 14, xl: 24 } }}>
          <Box sx={{ p: { xs: 0, md: 3 }, maxWidth: 1200, mx: 'auto', width: '100%', boxSizing: 'border-box' }}>
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

      {/* Grid Layout 2x2 - PRESERVANDO ESTRUCTURA VISUAL ORIGINAL CON NUEVAS FUNCIONALIDADES */}
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
          {/* Primera fila - Primera columna: Información General */}
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
            shouldHighlight={shouldHighlightTransferFields}
            id="transfer-info-section"
          />

          {/* Segunda fila - Primera columna: Dirección de Despacho */}
          <ShippingInfoSection 
            formData={formData}
            onFieldChange={handleFieldChange}
            onRegionChange={(type, regionField, comunaField, value) => { handleRegionChange(type, regionField, comunaField, value); }}
            showErrors={showShippingErrors}
            shouldHighlight={shouldHighlightShippingFields}
          />

          {/* Segunda fila - Segunda columna: Facturación (independiente) */}
          <BillingInfoSection
            id="billing-info-section"
            formData={formData}
            onFieldChange={updateField}
            onRegionChange={handleRegionChange}
            hasChanges={hasPendingChanges}
            loading={loading}
            onUpdate={handleUpdate}
            getSensitiveFieldValue={getSensitiveFieldValue}
            onFocusSensitive={handleSensitiveFocus}
            onBlurSensitive={handleSensitiveBlur}
            showBilling={true}
            showUpdateButton={false}
            showErrors={showBillingErrors}
            shouldHighlight={shouldHighlightBillingFields}
          />
        </Box>
        {/* Botón Actualizar al fondo del Paper */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2, pt: 0 }}>
          <Button 
            variant="contained"
            onClick={handleUpdate}
            disabled={loading}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
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
        onSaveImage={handleSaveImageAutomatic}
        currentImageUrl={userProfile?.logo_url}
        userInitials={getInitials(getDisplayName())}
      />
        </Box>
          </Box>
      )}
    </>
  );
};

export default Profile;
