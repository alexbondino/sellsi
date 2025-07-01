/**
 * Servicio para gestionar operaciones del perfil de usuario
 * Maneja la comunicación con las tablas: users, bank_info, shipping_info, billing_info
 */

import { supabase } from './supabase';

/**
 * Obtiene el perfil completo del usuario uniendo todas las tablas relacionadas
 * @param {string} userId - ID del usuario
 * @returns {object} - Perfil completo del usuario
 */
export const getUserProfile = async (userId) => {
  try {
    // Query principal para obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError) throw userError;

    // Obtener información bancaria con manejo de errores
    let bankData = null;
    try {
      const { data, error } = await supabase
        .from('bank_info')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Solo asignar datos si no hay error y hay datos válidos
      if (!error && data) {
        bankData = data;
      }
    } catch (bankError) {
      console.warn('⚠️ Error accessing bank_info (table may not exist or lack permissions):', bankError);
    }

    // Obtener información de envío con manejo de errores
    let shippingData = null;
    try {
      const { data, error } = await supabase
        .from('shipping_info')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        shippingData = data;
      }
    } catch (shippingError) {
      console.warn('⚠️ Error accessing shipping_info (table may not exist or lack permissions):', shippingError);
    }

    // Obtener información de facturación con manejo de errores
    let billingData = null;
    try {
      const { data, error } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        billingData = data;
      }
    } catch (billingError) {
      console.warn('⚠️ Error accessing billing_info (table may not exist or lack permissions):', billingError);
    }

    // Combinar todos los datos (las consultas adicionales pueden fallar si no existen registros)
    const completeProfile = {
      ...userData,
      // Información bancaria (opcional)
      account_holder: bankData?.account_holder || '',
      bank: bankData?.bank || '',
      account_number: bankData?.account_number || '',
      transfer_rut: bankData?.transfer_rut || '',
      confirmation_email: bankData?.confirmation_email || '',
      account_type: bankData?.account_type || 'corriente',
      
      // Información de envío (opcional)
      shipping_region: shippingData?.shipping_region || '',
      shipping_commune: shippingData?.shipping_commune || '',
      shipping_address: shippingData?.shipping_address || '',
      shipping_number: shippingData?.shipping_number || '',
      shipping_dept: shippingData?.shipping_dept || '',
      
      // Información de facturación (opcional)
      business_name: billingData?.business_name || '',
      billing_rut: billingData?.billing_rut || '',
      business_line: billingData?.business_line || '',
      billing_address: billingData?.billing_address || '',
      billing_region: billingData?.billing_region || '',
      billing_commune: billingData?.billing_commune || '',
    };

    return { data: completeProfile, error: null };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { data: null, error };
  }
};

/**
 * Actualiza el perfil completo del usuario en múltiples tablas
 * @param {string} userId - ID del usuario
 * @param {object} profileData - Datos del perfil a actualizar
 * @returns {object} - Resultado de la operación
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    // 1. Actualizar tabla users (información básica)
    const userUpdateData = {
      phone_nbr: profileData.phone,
      user_nm: profileData.user_nm || profileData.full_name,
      main_supplier: profileData.role === 'supplier',
      country: profileData.country,
      rut: profileData.rut,
      updatedt: new Date().toISOString(),
    };

    // Agregar logo_url solo si se proporciona
    if (profileData.logo_url) {
      userUpdateData.logo_url = profileData.logo_url;
    }

    const { error: userError } = await supabase
      .from('users')
      .update(userUpdateData)
      .eq('user_id', userId);

    if (userError) throw userError;

    // 2. Actualizar/Insertar información bancaria (con validación de existencia)
    if (hasbankingData(profileData)) {
      const bankData = {
        user_id: userId,
        account_holder: profileData.accountHolder,
        bank: profileData.bank,
        account_number: profileData.accountNumber,
        transfer_rut: profileData.transferRut,
        confirmation_email: profileData.confirmationEmail,
        account_type: profileData.accountType || 'corriente',
      };

      try {
        const { error: bankError } = await supabase
          .from('bank_info')
          .upsert(bankData, { onConflict: 'user_id' });

        if (bankError) {
          console.warn('⚠️ Could not update bank_info (table may not exist):', bankError);
        }
      } catch (error) {
        console.warn('⚠️ Bank info update failed - continuing without it:', error);
      }
    }

    // 3. Actualizar/Insertar información de envío (con validación de existencia)
    if (hasShippingData(profileData)) {
      const shippingData = {
        user_id: userId,
        shipping_region: profileData.shippingRegion,
        shipping_commune: profileData.shippingComuna,
        shipping_address: profileData.shippingAddress,
        shipping_number: profileData.shippingNumber,
        shipping_dept: profileData.shippingDept,
      };

      try {
        const { error: shippingError } = await supabase
          .from('shipping_info')
          .upsert(shippingData, { onConflict: 'user_id' });

        if (shippingError) {
          console.warn('⚠️ Could not update shipping_info (table may not exist):', shippingError);
        }
      } catch (error) {
        console.warn('⚠️ Shipping info update failed - continuing without it:', error);
      }
    }

    // 4. Actualizar/Insertar información de facturación (con validación de existencia)
    if (hasBillingData(profileData)) {
      const billingData = {
        user_id: userId,
        business_name: profileData.businessName,
        billing_rut: profileData.billingRut,
        business_line: profileData.businessLine,
        billing_address: profileData.billingAddress,
        billing_region: profileData.billingRegion,
        billing_commune: profileData.billingComuna,
      };

      try {
        const { error: billingError } = await supabase
          .from('billing_info')
          .upsert(billingData, { onConflict: 'user_id' });

        if (billingError) {
          console.warn('⚠️ Could not update billing_info (table may not exist):', billingError);
        }
      } catch (error) {
        console.warn('⚠️ Billing info update failed - continuing without it:', error);
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error };
  }
};

/**
 * Sube una imagen de perfil y actualiza la URL en la BD
 * @param {string} userId - ID del usuario
 * @param {File} imageFile - Archivo de imagen
 * @returns {object} - URL pública de la imagen o error
 */
export const uploadProfileImage = async (userId, imageFile) => {
  try {
    const fileExt = imageFile.name.split('.').pop();
    const timestamp = Date.now();
    const filePath = `${userId}/logo_${timestamp}.${fileExt}`;

    // Subir archivo
    const { error: uploadError } = await supabase.storage
      .from('user-logos')
      .upload(filePath, imageFile);

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('user-logos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Actualizar URL en la tabla users
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        logo_url: publicUrl,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return { url: null, error };
  }
};

/**
 * Función de diagnóstico para verificar acceso a las tablas
 * Útil para debuggear problemas de permisos o tablas faltantes
 * @param {string} userId - ID del usuario
 * @returns {object} - Estado de acceso a cada tabla
 */
export const diagnoseTables = async (userId) => {
  const diagnosis = {
    users: { accessible: false, error: null },
    bank_info: { accessible: false, error: null },
    shipping_info: { accessible: false, error: null },
    billing_info: { accessible: false, error: null }
  };

  // Test tabla users
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1);
    
    diagnosis.users.accessible = !error;
    diagnosis.users.error = error?.message || null;
  } catch (error) {
    diagnosis.users.error = error.message;
  }

  // Test tabla bank_info
  try {
    const { data, error } = await supabase
      .from('bank_info')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1);
    
    diagnosis.bank_info.accessible = !error;
    diagnosis.bank_info.error = error?.message || null;
  } catch (error) {
    diagnosis.bank_info.error = error.message;
  }

  // Test tabla shipping_info
  try {
    const { data, error } = await supabase
      .from('shipping_info')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1);
    
    diagnosis.shipping_info.accessible = !error;
    diagnosis.shipping_info.error = error?.message || null;
  } catch (error) {
    diagnosis.shipping_info.error = error.message;
  }

  // Test tabla billing_info
  try {
    const { data, error } = await supabase
      .from('billing_info')
      .select('user_id')
      .eq('user_id', userId)
      .limit(1);
    
    diagnosis.billing_info.accessible = !error;
    diagnosis.billing_info.error = error?.message || null;
  } catch (error) {
    diagnosis.billing_info.error = error.message;
  }

  console.log('🔍 Table Access Diagnosis:', diagnosis);
  return diagnosis;
};

// Funciones auxiliares para validar si hay datos en cada sección
const hasbankingData = (data) => {
  return data.accountHolder || data.bank || data.accountNumber || 
         data.transferRut || data.confirmationEmail;
};

const hasShippingData = (data) => {
  return data.shippingRegion || data.shippingComuna || data.shippingAddress || 
         data.shippingNumber || data.shippingDept;
};

const hasBillingData = (data) => {
  return data.businessName || data.billingRut || data.businessLine || 
         data.billingAddress || data.billingRegion || data.billingComuna;
};
