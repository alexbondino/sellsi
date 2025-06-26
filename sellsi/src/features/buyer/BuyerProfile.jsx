import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import Profile from '../profile/Profile';
import { supabase } from '../../services/supabase';

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

      const { data, error } = await supabase
        .from('users') // Cambiar de 'profiles' a 'users'
        .select('*')
        .eq('user_id', user.id) // Cambiar de 'id' a 'user_id'
        .single();

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
        // Campos que vienen después de la migración
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

      // Mapear campos de Frontend a BD según ProfileBack.md
      const updateData = {
        // SOLO campos existentes por ahora
        phone_nbr: profileData.phone, // phone → phone_nbr
        user_nm: profileData.user_nm || profileData.full_name, // Priorizar user_nm para edición de nombre
        main_supplier: profileData.role === 'supplier', // string → boolean
        country: profileData.country,
        
        // TEMPORAL: Comentar campos que requieren migración hasta que se ejecute
        // rut: profileData.rut,
        // shipping_region: profileData.shippingRegion,
        // shipping_comuna: profileData.shippingComuna,
        // shipping_address: profileData.shippingAddress,
        // shipping_number: profileData.shippingNumber,
        // shipping_dept: profileData.shippingDept,
        // account_holder: profileData.accountHolder,
        // account_type: profileData.accountType,
        // bank: profileData.bank,
        // account_number: profileData.accountNumber,
        // transfer_rut: profileData.transferRut,
        // confirmation_email: profileData.confirmationEmail,
        // business_name: profileData.businessName,
        // billing_rut: profileData.billingRut,
        // business_line: profileData.businessLine,
        // billing_address: profileData.billingAddress,
        // billing_region: profileData.billingRegion,
        // billing_comuna: profileData.billingComuna,
        
        updatedt: new Date().toISOString(), // Usar updatedt en lugar de updated_at
      };

      // 📸 Manejar subida de imagen de perfil si se proporciona
      if (profileData.profileImage && profileData.profileImage.file) {
        console.log('📸 [BUYER PROFILE] Uploading profile image...');
        
        try {
          // Crear nombre único para el archivo
          const fileExt = profileData.profileImage.file.name.split('.').pop();
          const fileName = `${user.id}/logo.${fileExt}`;
          
          // Subir imagen a Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('user-logos')
            .upload(fileName, profileData.profileImage.file, {
              upsert: true,
              contentType: profileData.profileImage.file.type,
            });

          if (uploadError) {
            console.error('❌ [BUYER PROFILE] Error uploading image:', uploadError);
            throw uploadError;
          }

          // Obtener URL pública de la imagen
          const { data: { publicUrl } } = supabase.storage
            .from('user-logos')
            .getPublicUrl(fileName);

          updateData.logo_url = publicUrl;
          console.log('✅ [BUYER PROFILE] Image uploaded successfully:', publicUrl);
          
        } catch (imageError) {
          console.error('❌ [BUYER PROFILE] Error processing profile image:', imageError);
          // No hacer throw aquí - continuar con la actualización sin imagen
        }
      }

      console.log('🔄 Updating profile data:', updateData); // Debug log

      const { error } = await supabase
        .from('users') // Cambiar de 'profiles' a 'users'
        .update(updateData)
        .eq('user_id', user.id); // Cambiar de 'id' a 'user_id'

      if (error) {
        throw error;
      }

      // Actualizar el estado local
      await fetchUserProfile();
      
      // Refrescar el perfil del usuario en App.jsx para actualizar TopBar
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
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
