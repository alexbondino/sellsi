import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import Profile from '../profile/Profile';
import { supabase } from '../../services/supabase';

const SupplierProfile = ({ onProfileUpdated }) => {
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

      let logoPublicUrl = userProfile?.logo_url; // Mantener URL actual por defecto

      // MANEJAR SUBIDA DE IMAGEN DE PERFIL
      if (profileData.profileImage) {
        const fileExt = profileData.profileImage.name.split('.').pop();
        const timestamp = Date.now();
        const staticFilePath = `${user.id}/logo_${timestamp}.${fileExt}`; // Path único para evitar conflictos

        const { error: uploadError } = await supabase.storage
          .from('user-logos')
          .upload(staticFilePath, profileData.profileImage.file);

        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('user-logos')
          .getPublicUrl(staticFilePath);
        logoPublicUrl = urlData.publicUrl;
      }

      // Mapear campos de Frontend a BD según ProfileBack.md
      const updateData = {
        // SOLO campos existentes por ahora
        phone_nbr: profileData.phone, // phone → phone_nbr
        user_nm: profileData.user_nm || profileData.full_name, // Priorizar user_nm para edición de nombre
        main_supplier: profileData.role === 'supplier', // string → boolean
        country: profileData.country,
        logo_url: logoPublicUrl, // AGREGAR: Actualizar URL de la imagen
        
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

export default SupplierProfile;
