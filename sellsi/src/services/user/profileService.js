/**
 * Servicio para gestionar operaciones del perfil de usuario
 * Maneja la comunicación con las tablas: users, bank_info, shipping_info, billing_info
 */

import { supabase } from '../supabase';
import { BANKS } from '../../shared/constants/profile';

/**
 * Limpia y valida el valor del banco
 * @param {string} bankValue - Valor del banco a validar
 * @returns {string} - Valor del banco válido o cadena vacía
 */
const cleanBankValue = (bankValue) => {
  if (!bankValue || typeof bankValue !== 'string') {
    return '';
  }
  
  // Si el banco está en la lista de bancos válidos, devolverlo
  if (BANKS.includes(bankValue)) {
    return bankValue;
  }
  
  // Si no está en la lista, devolver cadena vacía
  console.warn(`Banco inválido encontrado: "${bankValue}". Limpiando valor.`);
  return '';
};

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
      .maybeSingle();

    if (userError) throw userError;

    // Obtener información bancaria con manejo de errores
    let bankData = null;
    try {
      const { data, error } = await supabase
        .from('bank_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      // Solo asignar datos si no hay error y hay datos válidos
      if (!error && data) {
        bankData = data;
      }
    } catch (bankError) {
      // ...removed log...
    }

    // Obtener información de envío con manejo de errores
    let shippingData = null;
    try {
      const { data, error } = await supabase
        .from('shipping_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        shippingData = data;
      }
    } catch (shippingError) {
      // ...removed log...
    }

    // Obtener información de facturación con manejo de errores
    let billingData = null;
    try {
      const { data, error } = await supabase
        .from('billing_info')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        billingData = data;
      }
    } catch (billingError) {
      // ...removed log...
    }

    // Combinar todos los datos (las consultas adicionales pueden fallar si no existen registros)
    const completeProfile = {
      ...userData,
      // Información bancaria (opcional)
      account_holder: bankData?.account_holder || '',
      bank: cleanBankValue(bankData?.bank), // ✅ LIMPIAR: Validar banco
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

      // Descripción de proveedor
      descripcion_proveedor: userData?.descripcion_proveedor || '',
      
      // ✅ AGREGAR: Tipos de documento tributario
      document_types: userData?.document_types || [],
    };

    return { data: completeProfile, error: null };
  } catch (error) {
    // ...removed log...
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
      descripcion_proveedor: profileData.descripcionProveedor || profileData.descripcion_proveedor || '',
      // ✅ CORREGIR: Mapear tanto documentTypes (frontend) como document_types (BD)
      document_types: profileData.documentTypes || profileData.document_types || [],
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
        account_holder: profileData.account_holder,
        bank: profileData.bank,
        account_number: profileData.account_number,
        transfer_rut: profileData.transfer_rut,
        confirmation_email: profileData.confirmation_email,
        account_type: profileData.account_type || 'corriente',
      };

      try {

        const { error: bankError } = await supabase
          .from('bank_info')
          .upsert(bankData, { onConflict: ['user_id'] });

        if (bankError) {
          console.error('❌ Error al actualizar datos bancarios:', bankError);
        } else {
          console.log('✅ Datos bancarios actualizados correctamente');
        }
      } catch (error) {
        console.error('❌ Excepción al actualizar datos bancarios:', error);
      }
    } else {
      console.log('ℹ️ No hay datos bancarios para actualizar');
    }

    // 3. Actualizar/Insertar información de envío (con validación de existencia)
    if (hasShippingData(profileData)) {
      const shippingData = {
        user_id: userId,
        shipping_region: profileData.shipping_region,
        shipping_commune: profileData.shipping_commune,
        shipping_address: profileData.shipping_address,
        shipping_number: profileData.shipping_number,
        shipping_dept: profileData.shipping_dept,
      };

      try {

        const { error: shippingError } = await supabase
          .from('shipping_info')
          .upsert(shippingData, { onConflict: ['user_id'] });

        if (shippingError) {
          // ...removed log...
        }
      } catch (error) {
        // ...removed log...
      }
    }

    // 4. Actualizar/Insertar información de facturación (con validación de existencia)
    if (hasBillingData(profileData)) {
      const billingData = {
        user_id: userId,
        business_name: profileData.business_name,
        billing_rut: profileData.billing_rut,
        business_line: profileData.business_line,
        billing_address: profileData.billing_address,
        billing_region: profileData.billing_region,
        billing_commune: profileData.billing_commune,
      };

      try {

        const { error: billingError } = await supabase
          .from('billing_info')
          .upsert(billingData, { onConflict: ['user_id'] });

        if (billingError) {
          // ...removed log...
        }
      } catch (error) {
        // ...removed log...
      }
    }

    return { success: true, error: null };
  } catch (error) {
    // ...removed log...
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
    // 1. Eliminar TODAS las imágenes previas del usuario
    const deleteResult = await deleteAllUserImages(userId);
    if (!deleteResult.success) {
      // ...removed log...
    }

    // 2. Subir el nuevo archivo con timestamp para evitar cache
    const fileExt = imageFile.name.split('.').pop();
    const timestamp = Date.now();
    const filePath = `${userId}/logo_${timestamp}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('user-logos')
      .upload(filePath, imageFile, { upsert: true });

    if (uploadError) throw uploadError;

    // 3. Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('user-logos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // 4. Actualizar URL en la tabla users
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ 
        logo_url: publicUrl,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select(); // Añadir select para ver qué se actualizó

    if (updateError) throw updateError;

    // Leer de vuelta el usuario para confirmar
    const { data: userData, error: userReadError } = await supabase
      .from('users')
      .select('logo_url')
      .eq('user_id', userId)
      .single();
    if (userReadError) {
      // ...removed log...
    } else {
      // Si no coincide, intentar actualizar de nuevo
      if (userData?.logo_url !== publicUrl) {
        // ...removed log...
        const { error: retryError } = await supabase
          .from('users')
          .update({ logo_url: publicUrl })
          .eq('user_id', userId);
        
        if (retryError) {
          // ...removed log...
        }
      }
    }

    return { url: publicUrl, error: null };
  } catch (error) {
    // ...removed log...
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
    // 1. Listar todos los archivos del usuario
    const { data: listData, error: listError } = await supabase.storage
      .from('user-logos')
      .list(userId + '/', { limit: 100 });
    
    if (listError) {
      // ...removed log...
      return { success: false, error: listError };
    }
    
    if (!listData || listData.length === 0) {
      return { success: true, deletedCount: 0 };
    }
    
    // 2. Eliminar todos los archivos encontrados
    const filesToRemove = listData.map(f => `${userId}/${f.name}`);
    const { error: removeError } = await supabase.storage
      .from('user-logos')
      .remove(filesToRemove);
    
    if (removeError) {
      // ...removed log...
      return { success: false, error: removeError };
    }
    
    return { success: true, deletedCount: filesToRemove.length };
    
  } catch (error) {
    // ...removed log...
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

  return diagnosis;
};

/**
 * Función para reparar URLs de imagen rotas y limpiar archivos duplicados
 * @param {string} userId - ID del usuario
 * @returns {object} - Resultado de la reparación
 */
export const repairUserImageUrl = async (userId) => {
  try {
    
    // 1. Listar todos los archivos del usuario
    const { data: listData, error: listError } = await supabase.storage
      .from('user-logos')
      .list(userId + '/', { limit: 100 });
    
    if (listError) {
      // ...removed log...
      return { success: false, error: listError };
    }

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
    
    // 4. Actualizar BD con URL correcta
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        logo_url: correctUrl,
        updatedt: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      // ...removed log...
      return { success: false, error: updateError };
    }
    
    // 5. Eliminar archivos duplicados (mantener solo el que usamos)
    const filesToDelete = listData
      .filter(file => imageRegex.test(file.name) && file.name !== validFile.name)
      .map(file => `${userId}/${file.name}`);
    if (filesToDelete.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('user-logos')
        .remove(filesToDelete);
      if (deleteError) {
      }
    }
    
    return { 
      success: true, 
      correctUrl, 
      deletedFiles: filesToDelete.length,
      message: 'URL reparada exitosamente'
    };
    
  } catch (error) {
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
    
    // 1. Listar todos los archivos del usuario
    const { data: listData, error: listError } = await supabase.storage
      .from('user-logos')
      .list(userId + '/', { limit: 100 });
    
    if (listError) {
      return { success: false, error: listError };
    }

    if (!listData || listData.length === 0) {
      const { error: clearError } = await supabase
        .from('users')
        .update({ logo_url: null })
        .eq('user_id', userId);
      
      if (clearError) {
        return { success: false, error: clearError };
      }
      
      return { success: true, message: 'No hay archivos, BD limpiada' };
    }
    
    // 2. Filtrar archivos de imagen válidos
    const imageRegex = /^logo\.(jpg|jpeg|png|webp|gif)$/i;
    const validImages = listData.filter(file => imageRegex.test(file.name));
    
    if (!validImages || validImages.length === 0) {
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

    // 4. Construir URL correcta
    const correctPath = `${userId}/${selectedFile.name}`;
    const { data: urlData } = supabase.storage
      .from('user-logos')
      .getPublicUrl(correctPath);
    const correctUrl = urlData.publicUrl;

    // 5. ACTUALIZACIÓN FORZADA con múltiples intentos
    let updateSuccess = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    // Primero verificar que el usuario existe
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('user_id, logo_url')
      .eq('user_id', userId)
      .single();
    
    if (existingUserError) {
      return { success: false, error: 'Usuario no existe en la tabla users' };
    }

    while (!updateSuccess && attempts < maxAttempts) {
      attempts++;
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
      .update({ 
        logo_url: correctUrl,
        updatedt: new Date().toISOString()
      })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        if (attempts === maxAttempts) {
          return { success: false, error: updateError };
        }
        // Esperar un poco antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        if (updateData && updateData.length > 0) {
          updateSuccess = true;
        } else {
          if (attempts === maxAttempts) {
            return { success: false, error: 'No se actualizó ninguna fila' };
          }
        }
      }
    }
    
    // 6. Verificar que la actualización se aplicó
    const { data: verifyData, error: verifyError } = await supabase
      .from('users')
      .select('logo_url')
      .eq('user_id', userId)
      .single();
    
    if (verifyError) {
      return { success: false, error: verifyError };
    }
    
    // ...removed log...
    
    if (verifyData?.logo_url !== correctUrl) {
      const upsertResult = await forceUpsertImageUrl(userId, correctUrl);
      // ...removed log...
      
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
        return { 
          success: false, 
          error: 'Ni UPDATE ni UPSERT funcionaron',
          expected: correctUrl,
          actual: finalVerifyData?.logo_url
        };
      }
      
      // ...removed log...
    }
    
    // 7. Limpiar archivos duplicados
    const filesToDelete = validImages
      .filter(file => file.name !== selectedFile.name)
      .map(file => `${userId}/${file.name}`);
    
    if (filesToDelete.length > 0) {
      // ...removed log...
      const { error: deleteError } = await supabase.storage
        .from('user-logos')
        .remove(filesToDelete);
      
      if (deleteError) {
      } else {
        // ...removed log...
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
    // ...removed log...
    
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
    
    // ...removed log...
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Funciones auxiliares para validar si hay datos en cada sección
 */
const hasbankingData = (data) => {
  return data.account_holder || data.bank || data.account_number || 
         data.transfer_rut || data.confirmation_email;
};

const hasShippingData = (data) => {
  return data.shipping_region || data.shipping_commune || data.shipping_address || 
         data.shipping_number || data.shipping_dept;
};

const hasBillingData = (data) => {
  return data.business_name || data.billing_rut || data.business_line || 
         data.billing_address || data.billing_region || data.billing_commune;
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
        return;
      }
      
      // ...removed log...
      const result = await forceFixImageUrl(user.id);
      // ...removed log...
      
      if (result.success) {
        // ...removed log...
        // Intentar recargar automáticamente el perfil
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // ...removed log...
        // Intentar corrección manual directa
        const manualResult = await forceUpsertImageUrl(user.id, result.expected || 'URL_PLACEHOLDER');
        // ...removed log...
      }
      
      return result;
    } catch (error) {
    }
  };
  
  // Función para inspeccionar el estado de la BD
  window.inspectUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      
      // ...removed log...
      
      // 1. Verificar usuario en tabla users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (userError) {
        return { userData: null, files: [] };
      }

      // 2. Verificar archivos en storage
      const { data: files, error: filesError } = await supabase.storage
        .from('user-logos')
        .list(user.id + '/', { limit: 100 });
      
      if (filesError) {
        return { userData, files: [] };
      }
      
      return { userData, files };
    } catch (error) {
    }
  };

  // Función para probar actualizaciones directas y diagnosticar problemas de BD
  window.testDirectUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      
      // ...removed log...
      
      // Test 1: Update solo logo_url (sin updated_at que podría no existir)
      // ...removed log...
      const testUrl = 'https://pvtmkfckdaeiqrfjskrq.supabase.co/storage/v1/object/public/user-logos/' + user.id + '/logo.png';
      const { data: test1Data, error: test1Error } = await supabase
        .from('users')
        .update({ logo_url: testUrl })
        .eq('user_id', user.id)
        .select();
      
      // ...removed log...
      
      // Test 2: Update solo updatedt (campo que sí existe)
      // ...removed log...
      const { data: test2Data, error: test2Error } = await supabase
        .from('users')
        .update({ updatedt: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();
      
      // ...removed log...
      
      // Test 3: Verificar si el campo updatedt existe
      // ...removed log...
      const { data: test3Data, error: test3Error } = await supabase
        .from('users')
        .update({ updatedt: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();
      
      // ...removed log...
      
      // Test 4: Verificar estructura de tabla
      // ...removed log...
      const { data: test4Data, error: test4Error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      // ...removed log...
      
      // Test 5: Verificar RLS (Row Level Security)
      // ...removed log...
      const { data: test5Data, error: test5Error } = await supabase
        .from('users')
        .select('user_id, logo_url')
        .limit(5);
      
      // ...removed log...
      // ...removed log...
      
      return { 
        test1: { data: test1Data, error: test1Error },
        test2: { data: test2Data, error: test2Error },
        test3: { data: test3Data, error: test3Error },
        test4: { data: test4Data, error: test4Error },
        test5: { data: test5Data, error: test5Error }
      };
    } catch (error) {
    }
  };
  
  // ...removed log...
  // ...removed log...
  // ...removed log...
}
