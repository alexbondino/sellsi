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
    if (profileData.logo_url !== undefined) {
      userUpdateData.logo_url = profileData.logo_url; // Puede ser null para borrar
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
    console.log('[uploadProfileImage] userId:', userId, 'imageFile:', imageFile);
    
    // 1. Eliminar TODAS las imágenes previas del usuario
    const deleteResult = await deleteAllUserImages(userId);
    if (!deleteResult.success) {
      console.warn('[uploadProfileImage] No se pudieron eliminar archivos previos:', deleteResult.error);
    } else {
      console.log('[uploadProfileImage] Se eliminaron', deleteResult.deletedCount, 'archivos previos');
    }

    // 2. Subir el nuevo archivo
    const fileExt = imageFile.name.split('.').pop();
    const filePath = `${userId}/logo.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('user-logos')
      .upload(filePath, imageFile, { upsert: true });

    console.log('[uploadProfileImage] upload result:', uploadError);

    if (uploadError) throw uploadError;

    // 3. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('user-logos')
      .getPublicUrl(filePath);
    console.log('[uploadProfileImage] public URL data:', urlData);

    const publicUrl = urlData.publicUrl;
    console.log('[uploadProfileImage] Intentando actualizar logo_url en users con:', publicUrl);

    // 4. Actualizar URL en la tabla users
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        logo_url: publicUrl,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select(); // Añadir select para ver qué se actualizó

    console.log('[uploadProfileImage] update users result:', updateError, 'userId:', userId, 'logo_url:', publicUrl);
    console.log('[uploadProfileImage] updateData:', updateData);
    console.log('[uploadProfileImage] Expected URL:', publicUrl);
    console.log('[uploadProfileImage] File extension from original file:', imageFile.name);

    if (updateError) throw updateError;

    // Leer de vuelta el usuario para confirmar
    const { data: userData, error: userReadError } = await supabase
      .from('users')
      .select('logo_url')
      .eq('user_id', userId)
      .single();
    if (userReadError) {
      console.error('[uploadProfileImage] Error leyendo usuario después de update:', userReadError);
    } else {
      console.log('[uploadProfileImage] logo_url en BD después de update:', userData?.logo_url);
      console.log('[uploadProfileImage] ¿La URL en BD coincide con la esperada?', userData?.logo_url === publicUrl);
      
      // Si no coincide, intentar actualizar de nuevo
      if (userData?.logo_url !== publicUrl) {
        console.warn('[uploadProfileImage] MISMATCH detectado. Intentando actualizar de nuevo...');
        const { error: retryError } = await supabase
          .from('users')
          .update({ logo_url: publicUrl })
          .eq('user_id', userId);
        
        if (retryError) {
          console.error('[uploadProfileImage] Error en retry update:', retryError);
        } else {
          console.log('[uploadProfileImage] Retry update exitoso');
        }
      }
    }

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('[uploadProfileImage] Error uploading profile image:', error);
    return { url: null, error };
  }
};

/**
 * Elimina todas las imágenes de perfil del usuario del bucket
 * @param {string} userId - ID del usuario
 * @returns {object} - Resultado de la operación
 */
export const deleteAllUserImages = async (userId) => {
  try {
    console.log('[deleteAllUserImages] Eliminando todas las imágenes para userId:', userId);
    
    // 1. Listar todos los archivos del usuario
    const { data: listData, error: listError } = await supabase.storage
      .from('user-logos')
      .list(userId + '/', { limit: 100 });
    
    if (listError) {
      console.warn('[deleteAllUserImages] Error listando archivos:', listError);
      return { success: false, error: listError };
    }
    
    if (!listData || listData.length === 0) {
      console.log('[deleteAllUserImages] No hay archivos para eliminar');
      return { success: true, deletedCount: 0 };
    }
    
    // 2. Eliminar todos los archivos encontrados
    const filesToRemove = listData.map(f => `${userId}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from('user-logos')
      .remove(filesToRemove);
    
    if (removeError) {
      console.error('[deleteAllUserImages] Error eliminando archivos:', removeError);
      return { success: false, error: removeError };
    }
    
    console.log('[deleteAllUserImages] Archivos eliminados exitosamente:', filesToRemove);
    return { success: true, deletedCount: filesToRemove.length };
    
  } catch (error) {
    console.error('[deleteAllUserImages] Error inesperado:', error);
    return { success: false, error };
  }
};
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

/**
 * Función para reparar URLs de imagen rotas y limpiar archivos duplicados
 * @param {string} userId - ID del usuario
 * @returns {object} - Resultado de la reparación
 */
export const repairUserImageUrl = async (userId) => {
  try {
    console.log('[repairUserImageUrl] Iniciando reparación para userId:', userId);
    
    // 1. Listar todos los archivos del usuario
    const { data: listData, error: listError } = await supabase.storage
      .from('user-logos')
      .list(userId + '/', { limit: 100 });
    
    if (listError) {
      console.error('[repairUserImageUrl] Error listando archivos:', listError);
      return { success: false, error: listError };
    }
    
    console.log('[repairUserImageUrl] Archivos encontrados:', listData);
    
    if (!listData || listData.length === 0) {
      // No hay archivos, actualizar BD para quitar URL
      await supabase
        .from('users')
        .update({ logo_url: null })
        .eq('user_id', userId);
      
      return { success: true, message: 'No hay archivos, BD actualizada a null' };
    }
    
    // 2. Filtrar archivos de imagen válidos (jpg, png, webp, gif, jpeg)
    const imageRegex = /^logo\.(jpg|jpeg|png|webp|gif)$/i;
    const validImages = listData.filter(file => imageRegex.test(file.name));
    if (!validImages || validImages.length === 0) {
      return { success: false, error: 'No se encontró archivo de imagen válido' };
    }
    // Elegir el más reciente por fecha si existe, si no por nombre (alfabético)
    let validFile = validImages[0];
    if (validImages.length > 1) {
      // Si hay fecha, usar la más reciente
      validFile = validImages.reduce((a, b) => {
        if (a.updated_at && b.updated_at) {
          return new Date(a.updated_at) > new Date(b.updated_at) ? a : b;
        }
        return a.name > b.name ? a : b;
      });
    }
    // 3. Construir URL correcta
    const correctPath = `${userId}/${validFile.name}`;
    const { data: urlData } = supabase.storage
      .from('user-logos')
      .getPublicUrl(correctPath);
    const correctUrl = urlData.publicUrl;
    console.log('[repairUserImageUrl] URL correcta:', correctUrl);
    
    // 4. Actualizar BD con URL correcta
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        logo_url: correctUrl,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('[repairUserImageUrl] Error actualizando BD:', updateError);
      return { success: false, error: updateError };
    }
    
    // 5. Eliminar archivos duplicados (mantener solo el que usamos)
    const filesToDelete = listData
      .filter(file => imageRegex.test(file.name) && file.name !== validFile.name)
      .map(file => `${userId}/${file.name}`);
    if (filesToDelete.length > 0) {
      console.log('[repairUserImageUrl] Eliminando archivos duplicados:', filesToDelete);
      const { error: deleteError } = await supabase.storage
        .from('user-logos')
        .remove(filesToDelete);
      if (deleteError) {
        console.warn('[repairUserImageUrl] Error eliminando duplicados:', deleteError);
      }
    }
    
    return { 
      success: true, 
      correctUrl, 
      deletedFiles: filesToDelete.length,
      message: 'URL reparada exitosamente'
    };
    
  } catch (error) {
    console.error('[repairUserImageUrl] Error inesperado:', error);
    return { success: false, error };
  }
};

/**
 * Función para forzar la corrección de URLs de imagen rotas
 * Actualiza directamente en la base de datos sin depender de otros procesos
 * @param {string} userId - ID del usuario
 * @returns {object} - Resultado de la corrección forzada
 */
export const forceFixImageUrl = async (userId) => {
  try {
    console.log('[forceFixImageUrl] 🚀 INICIANDO CORRECCIÓN FORZADA para userId:', userId);
    
    // 1. Listar todos los archivos del usuario
    const { data: listData, error: listError } = await supabase.storage
      .from('user-logos')
      .list(userId + '/', { limit: 100 });
    
    if (listError) {
      console.error('[forceFixImageUrl] ❌ Error listando archivos:', listError);
      return { success: false, error: listError };
    }
    
    console.log('[forceFixImageUrl] 📁 Archivos encontrados:', listData);
    
    if (!listData || listData.length === 0) {
      console.log('[forceFixImageUrl] 🗑️ No hay archivos, limpiando BD...');
      const { error: clearError } = await supabase
        .from('users')
        .update({ logo_url: null })
        .eq('user_id', userId);
      
      if (clearError) {
        console.error('[forceFixImageUrl] ❌ Error limpiando BD:', clearError);
        return { success: false, error: clearError };
      }
      
      return { success: true, message: 'No hay archivos, BD limpiada' };
    }
    
    // 2. Filtrar archivos de imagen válidos
    const imageRegex = /^logo\.(jpg|jpeg|png|webp|gif)$/i;
    const validImages = listData.filter(file => imageRegex.test(file.name));
    
    if (!validImages || validImages.length === 0) {
      console.log('[forceFixImageUrl] ❌ No se encontró archivo de imagen válido');
      return { success: false, error: 'No se encontró archivo de imagen válido' };
    }
    
    // 3. Elegir el archivo más reciente
    let selectedFile = validImages[0];
    if (validImages.length > 1) {
      selectedFile = validImages.reduce((a, b) => {
        if (a.updated_at && b.updated_at) {
          return new Date(a.updated_at) > new Date(b.updated_at) ? a : b;
        }
        return a.name > b.name ? a : b;
      });
    }
    
    console.log('[forceFixImageUrl] 🎯 Archivo seleccionado:', selectedFile);
    
    // 4. Construir URL correcta
    const correctPath = `${userId}/${selectedFile.name}`;
    const { data: urlData } = supabase.storage
      .from('user-logos')
      .getPublicUrl(correctPath);
    const correctUrl = urlData.publicUrl;
    
    console.log('[forceFixImageUrl] 🔗 URL correcta construida:', correctUrl);
    
    // 5. ACTUALIZACIÓN FORZADA con múltiples intentos
    let updateSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    // Primero verificar que el usuario existe
    console.log('[forceFixImageUrl] 🔍 Verificando que el usuario existe...');
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('user_id, logo_url')
      .eq('user_id', userId)
      .single();
    
    if (existingUserError) {
      console.error('[forceFixImageUrl] ❌ Usuario no encontrado:', existingUserError);
      return { success: false, error: 'Usuario no existe en la tabla users' };
    }
    
    console.log('[forceFixImageUrl] ✅ Usuario encontrado:', existingUser);
    console.log('[forceFixImageUrl] 📝 URL actual en BD:', existingUser.logo_url);
    
    while (!updateSuccess && attempts < maxAttempts) {
      attempts++;
      console.log(`[forceFixImageUrl] 🔄 Intento ${attempts}/${maxAttempts} de actualizar BD...`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
      .update({ 
        logo_url: correctUrl,
        updatedt: new Date().toISOString()
      })
        .eq('user_id', userId)
        .select();
      
      console.log(`[forceFixImageUrl] 📊 Update response - data:`, updateData, 'error:', updateError);
      
      if (updateError) {
        console.error(`[forceFixImageUrl] ❌ Error en intento ${attempts}:`, updateError);
        if (attempts === maxAttempts) {
          return { success: false, error: updateError };
        }
        // Esperar un poco antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log(`[forceFixImageUrl] ✅ Actualización exitosa en intento ${attempts}:`, updateData);
        if (updateData && updateData.length > 0) {
          updateSuccess = true;
        } else {
          console.warn(`[forceFixImageUrl] ⚠️ Update exitoso pero sin filas afectadas en intento ${attempts}`);
          if (attempts === maxAttempts) {
            console.error('[forceFixImageUrl] ❌ No se pudo actualizar después de todos los intentos');
            return { success: false, error: 'No se actualizó ninguna fila' };
          }
        }
      }
    }
    
    // 6. Verificar que la actualización se aplicó
    console.log('[forceFixImageUrl] 🔍 Verificando actualización...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('logo_url')
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      console.error('[forceFixImageUrl] ❌ Error verificando:', verifyError);
      return { success: false, error: verifyError };
    }
    
    console.log('[forceFixImageUrl] 🔍 URL en BD después de update:', verifyData?.logo_url);
    console.log('[forceFixImageUrl] 🔍 ¿Coincide con la esperada?', verifyData?.logo_url === correctUrl);
    
    if (verifyData?.logo_url !== correctUrl) {
      console.error('[forceFixImageUrl] ❌ MISMATCH PERSISTENTE - Intentando UPSERT como alternativa...');
      
      const upsertResult = await forceUpsertImageUrl(userId, correctUrl);
      console.log('[forceFixImageUrl] 📊 Resultado UPSERT:', upsertResult);
      
      if (!upsertResult.success) {
        return { 
          success: false, 
          error: 'UPDATE y UPSERT fallaron',
          updateError: 'La actualización no se aplicó correctamente',
          upsertError: upsertResult.error,
          expected: correctUrl,
          actual: verifyData?.logo_url
        };
      }
      
      // Verificar de nuevo después del UPSERT
      const { data: finalVerifyData, error: finalVerifyError } = await supabase
        .from('users')
        .select('logo_url')
        .eq('user_id', userId)
        .single();
      
      if (finalVerifyError || finalVerifyData?.logo_url !== correctUrl) {
        console.error('[forceFixImageUrl] ❌ UPSERT también falló');
        return { 
          success: false, 
          error: 'Ni UPDATE ni UPSERT funcionaron',
          expected: correctUrl,
          actual: finalVerifyData?.logo_url
        };
      }
      
      console.log('[forceFixImageUrl] ✅ UPSERT exitoso!');
    }
    
    // 7. Limpiar archivos duplicados
    const filesToDelete = validImages
      .filter(file => file.name !== selectedFile.name)
      .map(file => `${userId}/${file.name}`);
    
    if (filesToDelete.length > 0) {
      console.log('[forceFixImageUrl] 🗑️ Eliminando archivos duplicados:', filesToDelete);
      const { error: deleteError } = await supabase.storage
        .from('user-logos')
        .remove(filesToDelete);
      
      if (deleteError) {
        console.warn('[forceFixImageUrl] ⚠️ Error eliminando duplicados:', deleteError);
      } else {
        console.log('[forceFixImageUrl] ✅ Duplicados eliminados exitosamente');
      }
    }
    
    return {
      success: true,
      correctUrl,
      selectedFile: selectedFile.name,
      deletedFiles: filesToDelete.length,
      message: 'URL corregida exitosamente'
    };
    
  } catch (error) {
    console.error('[forceFixImageUrl] ❌ Error general:', error);
    return { success: false, error };
  }
};

/**
 * Función alternativa que usa UPSERT en lugar de UPDATE
 * @param {string} userId - ID del usuario
 * @param {string} correctUrl - URL correcta a insertar
 * @returns {object} - Resultado del upsert
 */
export const forceUpsertImageUrl = async (userId, correctUrl) => {
  try {
    console.log('[forceUpsertImageUrl] 🚀 Intentando UPSERT para:', userId, 'URL:', correctUrl);
    
    const { data, error } = await supabase
      .from('users')
      .upsert({ 
        user_id: userId,
        logo_url: correctUrl,
        updatedt: new Date().toISOString()
      }, { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })
      .select();
    
    console.log('[forceUpsertImageUrl] 📊 Upsert result - data:', data, 'error:', error);
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('[forceUpsertImageUrl] ❌ Error:', error);
    return { success: false, error };
  }
};

/**
 * Funciones auxiliares para validar si hay datos en cada sección
 */
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

// ============================================================================
// FUNCIONES DE UTILIDAD PARA DESARROLLO/DEBUG
// ============================================================================

/**
 * Función de utilidad para corregir manualmente URLs desde la consola
 * Úsala en la consola del navegador: window.fixMyImageUrl()
 */
if (typeof window !== 'undefined') {
  window.fixMyImageUrl = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        return;
      }
      
      console.log('🚀 Ejecutando corrección forzada de imagen para usuario:', user.id);
      const result = await forceFixImageUrl(user.id);
      console.log('✅ Resultado:', result);
      
      if (result.success) {
        console.log('🎉 ¡URL corregida! Recarga la página para ver los cambios.');
        // Intentar recargar automáticamente el perfil
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        console.log('🔧 Probando método alternativo directo...');
        // Intentar corrección manual directa
        const manualResult = await forceUpsertImageUrl(user.id, result.expected || 'URL_PLACEHOLDER');
        console.log('🔧 Resultado manual:', manualResult);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error ejecutando corrección:', error);
    }
  };
  
  // Función para inspeccionar el estado de la BD
  window.inspectUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        return;
      }
      
      console.log('🔍 Inspeccionando datos del usuario:', user.id);
      
      // 1. Verificar usuario en tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      console.log('👤 Datos del usuario en BD:', userData);
      if (userError) console.error('❌ Error obteniendo usuario:', userError);
      
      // 2. Verificar archivos en storage
      const { data: files, error: filesError } = await supabase.storage
        .from('user-logos')
        .list(user.id + '/', { limit: 100 });
      
      console.log('📁 Archivos en storage:', files);
      if (filesError) console.error('❌ Error obteniendo archivos:', filesError);
      
      return { userData, files };
    } catch (error) {
      console.error('❌ Error en inspección:', error);
    }
  };

  // Función para probar actualizaciones directas y diagnosticar problemas de BD
  window.testDirectUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('❌ No hay usuario autenticado');
        return;
      }
      
      console.log('🧪 Probando actualizaciones directas para usuario:', user.id);
      
      // Test 1: Update solo logo_url (sin updated_at que podría no existir)
      console.log('Test 1: Solo logo_url...');
      const testUrl = 'https://pvtmkfckdaeiqrfjskrq.supabase.co/storage/v1/object/public/user-logos/' + user.id + '/logo.png';
      const { data: test1Data, error: test1Error } = await supabase
        .from('users')
        .update({ logo_url: testUrl })
        .eq('user_id', user.id)
        .select();
      
      console.log('Test 1 - data:', test1Data, 'error:', test1Error);
      
      // Test 2: Update solo updatedt (campo que sí existe)
      console.log('Test 2: Solo updatedt...');
      const { data: test2Data, error: test2Error } = await supabase
        .from('users')
        .update({ updatedt: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();
      
      console.log('Test 2 - data:', test2Data, 'error:', test2Error);
      
      // Test 3: Verificar si el campo updatedt existe
      console.log('Test 3: Probando campo updatedt...');
      const { data: test3Data, error: test3Error } = await supabase
        .from('users')
        .update({ updatedt: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();
      
      console.log('Test 3 - data:', test3Data, 'error:', test3Error);
      
      // Test 4: Verificar estructura de tabla
      console.log('Test 4: Columnas disponibles...');
      const { data: test4Data, error: test4Error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      console.log('Test 4 - Columnas disponibles:', test4Data ? Object.keys(test4Data[0] || {}) : 'No data');
      
      // Test 5: Verificar RLS (Row Level Security)
      console.log('Test 5: Probando sin WHERE clause...');
      const { data: test5Data, error: test5Error } = await supabase
        .from('users')
        .select('user_id, logo_url')
        .limit(5);
      
      console.log('Test 5 - ¿Podemos leer otros usuarios?:', test5Data?.length || 0, 'usuarios visibles');
      if (test5Error) console.log('Test 5 - Error RLS:', test5Error);
      
      return { 
        test1: { data: test1Data, error: test1Error },
        test2: { data: test2Data, error: test2Error },
        test3: { data: test3Data, error: test3Error },
        test4: { data: test4Data, error: test4Error },
        test5: { data: test5Data, error: test5Error }
      };
    } catch (error) {
      console.error('❌ Error en test directo:', error);
    }
  };
  
  console.log('🛠️ Función de debug disponible: window.fixMyImageUrl()');
  console.log('🔍 Función de inspección disponible: window.inspectUserData()');
  console.log('🧪 Función de test de BD disponible: window.testDirectUpdate()');
}
