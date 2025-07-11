import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import Profile from '../profile/Profile';
import { supabase } from '../../services/supabase';
import { getUserProfile, updateUserProfile, uploadProfileImage, deleteAllUserImages, repairUserImageUrl, forceFixImageUrl } from '../../services/profileService';

const BuyerProfile = ({ onProfileUpdated }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Usar el nuevo servicio para obtener el perfil completo
      const { data, error } = await getUserProfile(user.id);
      
      if (error) {
        throw error;
      }

      // Mapear campos de BD a Frontend según ProfileBack.md
      setUserProfile({
        ...data,
        email: user.email, // Email del auth
        // Mapeo directo de campos existentes
        phone: data.phone_nbr, // phone_nbr → phone
        full_name: data.user_nm, // user_nm → full_name  
        user_nm: data.user_nm, // AGREGAR: También pasar user_nm directamente
        role: data.main_supplier ? 'supplier' : 'buyer', // boolean → string
        country: data.country, // Campo ya existe
        // Campos que vienen de las tablas relacionadas
        rut: data.rut,
        shipping_region: data.shipping_region,
        shipping_comuna: data.shipping_comuna,
        shipping_address: data.shipping_address,
        shipping_number: data.shipping_number,
        shipping_dept: data.shipping_dept,
        account_holder: data.account_holder,
        account_type: data.account_type,
        bank: data.bank,
        account_number: data.account_number,
        transfer_rut: data.transfer_rut,
        confirmation_email: data.confirmation_email,
        business_name: data.business_name,
        billing_rut: data.billing_rut,
        business_line: data.business_line,
        billing_address: data.billing_address,
        billing_region: data.billing_region,
        billing_comuna: data.billing_comuna,
        logo_url: data.logo_url, // Para el avatar
      });

      // REPARAR URL DE IMAGEN SI ES NECESARIO
      if (data.logo_url) {
        console.log('[BuyerProfile] Verificando URL de imagen:', data.logo_url);
        // Test si la URL funciona
        fetch(data.logo_url)
          .then(response => {
            if (!response.ok) {
              console.log('[BuyerProfile] URL rota, iniciando reparación FORZADA...');
              return forceFixImageUrl(user.id);
            }
            return { success: true, message: 'URL funciona correctamente' };
          })
          .then(repairResult => {
            console.log('[BuyerProfile] Resultado de reparación FORZADA:', repairResult);
            if (repairResult.success && repairResult.correctUrl) {
              // Recargar perfil con URL corregida
              fetchUserProfile();
            }
          })
          .catch(error => {
            console.log('[BuyerProfile] Error verificando URL, iniciando reparación...', error);
            repairUserImageUrl(user.id).then(repairResult => {
              console.log('[BuyerProfile] Resultado de reparación:', repairResult);
              if (repairResult.success && repairResult.correctUrl) {
                fetchUserProfile();
              }
            });
          });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      let logoPublicUrl = userProfile?.logo_url; // Mantener URL actual por defecto

      // MANEJAR ELIMINACIÓN DE IMAGEN DE PERFIL
      if (profileData.profileImage === null || (profileData.profileImage && profileData.profileImage.delete)) {
        // Eliminar todas las imágenes del usuario
        const deleteResult = await deleteAllUserImages(user.id);
        if (!deleteResult.success) {
          console.warn('No se pudieron eliminar las imágenes previas:', deleteResult.error);
        }
        logoPublicUrl = null;
        profileData.logo_url = null;
      }
      // MANEJAR SUBIDA DE NUEVA IMAGEN DE PERFIL
      else if (profileData.profileImage && profileData.profileImage.file) {
        const { url, error } = await uploadProfileImage(user.id, profileData.profileImage.file);
        
        if (error) {
          throw new Error(`Error al subir la imagen: ${error.message}`);
        }
        
        logoPublicUrl = url;
        // Agregar la nueva URL al profileData para la actualización
        profileData.logo_url = logoPublicUrl;
      }

      // Usar el nuevo servicio para actualizar el perfil
      const { success, error } = await updateUserProfile(user.id, profileData);
      
      if (!success) {
        throw error;
      }

      // Actualizar el estado local
      await fetchUserProfile();
      
      // Refrescar el perfil del usuario en App.jsx para actualizar TopBar
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <Profile 
      userProfile={userProfile}
      onUpdateProfile={handleUpdateProfile} 
    />
  );
};

export default BuyerProfile;
