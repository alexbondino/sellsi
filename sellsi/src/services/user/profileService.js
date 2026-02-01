/**
 * Servicio para gestionar operaciones del perfil de usuario
 * Maneja la comunicación con las tablas: users, bank_info, shipping_info, billing_info
 */

import { supabase } from '../supabase';
import { BANKS } from '../../shared/constants/profile';
import { invalidateUserProfileCache } from './profileCache';

// ============================================================================
// PERF PROFILE CACHE (dedupe + TTL)
// ============================================================================
// Evita N llamadas simultáneas a getUserProfile (ownership, shippingRegion, shippingValidation etc.)
// y reduce 3 fetch shipping_info => 1 usando embedding.

const PROFILE_CACHE_TTL = 1_800_000; // 30 minutos (balance entre performance y freshness de datos)
const profileCache = new Map(); // userId -> { data, ts }
const inFlight = new Map(); // userId -> Promise

export { invalidateUserProfileCache } from './profileCache';

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
export const getUserProfile = async (userId, options = {}) => {
  const force = !!options.force;
  if (!userId) return { data: null, error: new Error('userId requerido') };

  // 1. Cache hit
  const cached = profileCache.get(userId);
  if (!force && cached && (Date.now() - cached.ts) < PROFILE_CACHE_TTL) {
    return { data: cached.data, error: null, cached: true };
  }

  // 2. In-flight dedupe
  if (!force && inFlight.has(userId)) {
    try {
      const data = await inFlight.get(userId);
      return { data, error: null, deduped: true };
    } catch (e) {
      return { data: null, error: e };
    }
  }

  // 3. Real fetch (embedding). Fallback a modo legacy si falla embedding.
  const fetchPromise = (async () => {
    try {
      // Embebido: una sola llamada
      const { data, error } = await supabase
        .from('users')
        .select('*, bank_info(*), shipping_info(*), billing_info(*), supplier(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Normalizar relaciones (pueden venir como array o null)
      const bankRel = Array.isArray(data.bank_info) ? data.bank_info[0] : data.bank_info;
      const shipRel = Array.isArray(data.shipping_info) ? data.shipping_info[0] : data.shipping_info;
      const billRel = Array.isArray(data.billing_info) ? data.billing_info[0] : data.billing_info;

      const supplierRel = Array.isArray(data.supplier) ? data.supplier[0] : data.supplier;
      const completeProfile = {
        ...data,
        // Flatten bancario
        account_holder: bankRel?.account_holder || '',
        bank: cleanBankValue(bankRel?.bank),
        account_number: bankRel?.account_number || '',
        transfer_rut: bankRel?.transfer_rut || '',
        confirmation_email: bankRel?.confirmation_email || '',
        account_type: bankRel?.account_type || 'corriente',
        // Flatten shipping
        shipping_region: shipRel?.shipping_region || '',
        shipping_commune: shipRel?.shipping_commune || '',
        shipping_address: shipRel?.shipping_address || '',
        shipping_number: shipRel?.shipping_number || '',
        shipping_dept: shipRel?.shipping_dept || '',
        // Flatten billing
        business_name: billRel?.business_name || '',
        billing_rut: billRel?.billing_rut || '',
        business_line: billRel?.business_line || '',
        billing_address: billRel?.billing_address || '',
        billing_region: billRel?.billing_region || '',
        billing_commune: billRel?.billing_commune || '',
        // Flatten supplier legal info (if exists)
        supplier_legal_name: supplierRel?.supplier_legal_name || data?.supplier_legal_name || '',
        supplier_legal_rut: supplierRel?.supplier_legal_rut || data?.supplier_legal_rut || '',
        supplier_legal_representative_name: supplierRel?.supplier_legal_representative_name || data?.supplier_legal_representative_name || '',
        supplier_legal_representative_rut: supplierRel?.supplier_legal_representative_rut || data?.supplier_legal_representative_rut || '',
        supplier_legal_address: supplierRel?.supplier_legal_address || data?.supplier_legal_address || '',
        supplier_legal_region: supplierRel?.supplier_legal_region || data?.supplier_legal_region || '',
        supplier_legal_commune: supplierRel?.supplier_legal_commune || data?.supplier_legal_commune || '',
        // Defaults (preservar campos de tabla users como minimum_purchase_amount, descripcion_proveedor)
        descripcion_proveedor: data?.descripcion_proveedor || '',
        document_types: data?.document_types || [],
        // minimum_purchase_amount: suppliers mínimo 1, buyers pueden 0
        minimum_purchase_amount: data?.minimum_purchase_amount ?? (data?.main_supplier ? 1 : 0),
      };

      profileCache.set(userId, { data: completeProfile, ts: Date.now() });
      return completeProfile;
    } catch (embedErr) {
      // Fallback legacy (4 consultas) solo si embedding falla por RLS o relación no declarada
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (userError) throw userError;

        const [bankRes, shipRes, billRes, supplierRes] = await Promise.allSettled([
          supabase.from('bank_info').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('shipping_info').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('billing_info').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('supplier').select('*').eq('user_id', userId).maybeSingle(),
        ]);
        const bankData = bankRes.status === 'fulfilled' && !bankRes.value.error ? bankRes.value.data : null;
        const shippingData = shipRes.status === 'fulfilled' && !shipRes.value.error ? shipRes.value.data : null;
        const billingData = billRes.status === 'fulfilled' && !billRes.value.error ? billRes.value.data : null;
        const supplierData = supplierRes.status === 'fulfilled' && !supplierRes.value.error ? supplierRes.value.data : null;
        const completeProfile = {
          ...userData,
          account_holder: bankData?.account_holder || '',
            bank: cleanBankValue(bankData?.bank),
            account_number: bankData?.account_number || '',
            transfer_rut: bankData?.transfer_rut || '',
            confirmation_email: bankData?.confirmation_email || '',
            account_type: bankData?.account_type || 'corriente',
            shipping_region: shippingData?.shipping_region || '',
            shipping_commune: shippingData?.shipping_commune || '',
            shipping_address: shippingData?.shipping_address || '',
            shipping_number: shippingData?.shipping_number || '',
            shipping_dept: shippingData?.shipping_dept || '',
            business_name: billingData?.business_name || '',
            billing_rut: billingData?.billing_rut || '',
            business_line: billingData?.business_line || '',
            billing_address: billingData?.billing_address || '',
            billing_region: billingData?.billing_region || '',
            billing_commune: billingData?.billing_commune || '',
            // Supplier legal fields
            supplier_legal_name: supplierData?.supplier_legal_name || userData?.supplier_legal_name || '',
            supplier_legal_rut: supplierData?.supplier_legal_rut || userData?.supplier_legal_rut || '',
            supplier_legal_representative_name: supplierData?.supplier_legal_representative_name || userData?.supplier_legal_representative_name || '',
            supplier_legal_representative_rut: supplierData?.supplier_legal_representative_rut || userData?.supplier_legal_representative_rut || '',
            supplier_legal_address: supplierData?.supplier_legal_address || userData?.supplier_legal_address || '',
            supplier_legal_region: supplierData?.supplier_legal_region || userData?.supplier_legal_region || '',
            supplier_legal_commune: supplierData?.supplier_legal_commune || userData?.supplier_legal_commune || '',
            descripcion_proveedor: userData?.descripcion_proveedor || '',
            document_types: userData?.document_types || [],
            // minimum_purchase_amount: suppliers mínimo 1, buyers pueden 0
            minimum_purchase_amount: userData?.minimum_purchase_amount ?? (userData?.main_supplier ? 1 : 0),
        };
        profileCache.set(userId, { data: completeProfile, ts: Date.now() });
        return completeProfile;
      } catch (legacyErr) {
        throw embedErr || legacyErr;
      }
    }
  })();

  inFlight.set(userId, fetchPromise);
  try {
    const data = await fetchPromise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  } finally {
    inFlight.delete(userId);
  }
};

/**
 * Wrapper conveniente que retorna directamente el objeto de perfil (sin envoltorio {data,error}).
 * Lanza excepción si hay error para simplificar uso en componentes.
 * Uso previsto: const profile = await getUserProfileData(userId)
 */
export const getUserProfileData = async (userId) => {
  const { data, error } = await getUserProfile(userId);
  if (error) throw error;
  return data || {};
};

/**
 * Actualiza el perfil completo del usuario en múltiples tablas
 * @param {string} userId - ID del usuario
 * @param {object} profileData - Datos del perfil a actualizar
 * @returns {object} - Resultado de la operación
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const partialErrors = {};
    // Server-side validation: Ensure required groups of fields are complete.
    // This mirrors the client-side rules implemented in the Profile component
    // - If shipping region is provided, require commune and address
    // - If business_name (billing) is provided, require full billing fields
    const validation = validateProfileUpdate(profileData);
    if (!validation.ok) {
      return { success: false, error: new Error('Validation failed'), validationErrors: validation.errors };
    }

    // 1. Actualizar tabla users (información básica)
    const userUpdateData = {
      // Aceptar tanto payload camelCase (legacy) como snake_case (nuevo mapeo)
      phone_nbr: profileData.phone_nbr !== undefined ? profileData.phone_nbr : profileData.phone,
      user_nm: profileData.user_nm || profileData.full_name,
      main_supplier: profileData.main_supplier !== undefined
        ? profileData.main_supplier
        : (profileData.role === 'supplier'),
      country: profileData.country,
      rut: profileData.rut,
      updatedt: new Date().toISOString(),
      descripcion_proveedor: profileData.descripcion_proveedor || profileData.descripcionProveedor || '',
      // Document types desde cualquiera de las dos claves
      document_types: profileData.document_types !== undefined
        ? profileData.document_types
        : (profileData.documentTypes || []),
      // Compra mínima: suppliers mínimo $1, buyers pueden $0
      minimum_purchase_amount: (() => {
        const isSupplier = profileData.main_supplier !== undefined 
          ? profileData.main_supplier 
          : (profileData.role === 'supplier');
        const rawValue = profileData.minimum_purchase_amount !== undefined
          ? profileData.minimum_purchase_amount
          : profileData.minimumPurchaseAmount;
        
        return isSupplier 
          ? (rawValue || 1)  // Suppliers: mínimo 1
          : (rawValue || 0); // Buyers: puede ser 0
      })(),
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
          partialErrors.bank = bankError?.message || String(bankError);
        } else {
          console.log('✅ Datos bancarios actualizados correctamente');
        }
      } catch (error) {
        console.error('❌ Excepción al actualizar datos bancarios:', error);
      }
    } else {
      console.log('ℹ️ No hay datos bancarios para actualizar');
    }

    // 3. Actualizar/Insertar Dirección de Despacho (con validación de existencia)
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
          partialErrors.shipping = shippingError?.message || String(shippingError);
        }
      } catch (error) {
              }
    }

    // 4. Actualizar/Insertar Facturación (con validación de existencia)
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
          partialErrors.billing = billingError?.message || String(billingError);
        }
      } catch (error) {
              }
    }

    // 5. Actualizar/Insertar Información Legal del Proveedor (tabla supplier)
    if (hasSupplierData(profileData)) {
      // Ensure the NOT NULL `name` column is provided when creating a supplier row.
      // Prefer an explicit `user_nm` from the payload, else fall back to the legal name.
      const supplierName = profileData.user_nm || profileData.userName || profileData.supplier_legal_name || 'Proveedor';

      const supplierData = {
        user_id: userId,
        name: supplierName,
        supplier_legal_name: profileData.supplier_legal_name,
        supplier_legal_rut: profileData.supplier_legal_rut,
        supplier_legal_representative_name: profileData.supplier_legal_representative_name,
        supplier_legal_representative_rut: profileData.supplier_legal_representative_rut,
        supplier_legal_address: profileData.supplier_legal_address,
        supplier_legal_region: profileData.supplier_legal_region,
        supplier_legal_commune: profileData.supplier_legal_commune,
      };

      try {
        const { error: supplierError } = await supabase
          .from('supplier')
          .upsert(supplierData, { onConflict: ['user_id'] });

        if (supplierError) {
          partialErrors.supplier = supplierError?.message || String(supplierError);
        } else {
          console.log('✅ Información legal del proveedor actualizada correctamente');
        }
      } catch (error) {
        console.error('❌ Excepción al actualizar información legal del proveedor:', error);
      }
    }

  // Invalidar cache tras actualización completa
  try { invalidateUserProfileCache(userId); } catch(e) {}
  return { success: true, error: null, partialErrors: Object.keys(partialErrors).length ? partialErrors : undefined };
  } catch (error) {
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
          } else {
      // Si no coincide, intentar actualizar de nuevo
      if (userData?.logo_url !== publicUrl) {
                const { error: retryError } = await supabase
          .from('users')
          .update({ logo_url: publicUrl })
          .eq('user_id', userId);
        
        if (retryError) {
                  }
      }
    }

  // Invalidate cache para que profile refresque logo_url
  invalidateUserProfileCache(userId);
  return { url: publicUrl, error: null };
  } catch (error) {
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
            return { success: false, error: removeError };
    }
    
    return { success: true, deletedCount: filesToRemove.length };
    
  } catch (error) {
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
    
        
    if (verifyData?.logo_url !== correctUrl) {
      const upsertResult = await forceUpsertImageUrl(userId, correctUrl);
            
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
      
          }
    
    // 7. Limpiar archivos duplicados
    const filesToDelete = validImages
      .filter(file => file.name !== selectedFile.name)
      .map(file => `${userId}/${file.name}`);
    
    if (filesToDelete.length > 0) {
            const { error: deleteError } = await supabase.storage
        .from('user-logos')
        .remove(filesToDelete);
      
      if (deleteError) {
      } else {
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

const hasSupplierData = (data) => {
  return data.supplier_legal_name || data.supplier_legal_rut || data.supplier_legal_representative_name ||
         data.supplier_legal_representative_rut || data.supplier_legal_address || data.supplier_legal_region || data.supplier_legal_commune;
};

/**
 * Validates a profile update payload for server-side parity with client rules.
 * Returns { ok: boolean, errors: { field: message } }
 */
export const validateProfileUpdate = (payload = {}) => {
  const errors = {};

  // Shipping: if region provided (either snake_case or camelCase), require commune and address
  const region = payload.shipping_region ?? payload.shippingRegion ?? payload.shipping_region;
  const commune = payload.shipping_commune ?? payload.shippingCommune;
  const address = payload.shipping_address ?? payload.shippingAddress;
  const shippingNumber = payload.shipping_number ?? payload.shippingNumber;
  const regionProvided = region !== undefined && region !== null && String(region).trim() !== '';
  if (regionProvided && (!commune || String(commune).trim() === '' || !address || String(address).trim() === '')) {
    errors.shipping = 'When shipping region is provided, shipping commune and address are required';
  }

  // Shipping number, if provided, must contain only digits
  if (shippingNumber !== undefined && shippingNumber !== null && String(shippingNumber).trim() !== '') {
    if (!/^\d+$/.test(String(shippingNumber).trim())) {
      errors.shippingNumber = 'Shipping number must contain only digits';
    }
  }

  // Billing: if business_name provided (either camelCase or snake_case), require full billing fields
  const businessName = payload.business_name ?? payload.businessName;
  const billingRut = payload.billing_rut ?? payload.billingRut;
  const businessLine = payload.business_line ?? payload.businessLine;
  const billingAddress = payload.billing_address ?? payload.billingAddress;
  const billingRegion = payload.billing_region ?? payload.billingRegion;
  const billingCommune = payload.billing_commune ?? payload.billingCommune;

  if (businessName && String(businessName).trim() !== '') {
    const anyMissing = [billingRut, businessLine, billingAddress, billingRegion, billingCommune]
      .some(v => v === undefined || v === null || String(v).trim() === '');
    if (anyMissing) {
      errors.billing = 'All billing fields are required when business name is present';
    }
  }

  // Account number must contain only digits if provided (supports snake_case and camelCase)
  const accountNumber = payload.account_number ?? payload.accountNumber;
  if (accountNumber !== undefined && accountNumber !== null && String(accountNumber).trim() !== '') {
    if (!/^\d+$/.test(String(accountNumber).trim())) {
      errors.accountNumber = 'Account number must contain only digits';
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
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
      
            const result = await forceFixImageUrl(user.id);
            
      if (result.success) {
                // Intentar recargar automáticamente el perfil
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
                // Intentar corrección manual directa
        const manualResult = await forceUpsertImageUrl(user.id, result.expected || 'URL_PLACEHOLDER');
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
      
            
      // Test 1: Update solo logo_url (sin updated_at que podría no existir)
            const testUrl = 'https://pvtmkfckdaeiqrfjskrq.supabase.co/storage/v1/object/public/user-logos/' + user.id + '/logo.png';
      const { data: test1Data, error: test1Error } = await supabase
        .from('users')
        .update({ logo_url: testUrl })
        .eq('user_id', user.id)
        .select();
      
            
      // Test 2: Update solo updatedt (campo que sí existe)
            const { data: test2Data, error: test2Error } = await supabase
        .from('users')
        .update({ updatedt: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();
      
            
      // Test 3: Verificar si el campo updatedt existe
            const { data: test3Data, error: test3Error } = await supabase
        .from('users')
        .update({ updatedt: new Date().toISOString() })
        .eq('user_id', user.id)
        .select();
      
            
      // Test 4: Verificar estructura de tabla
            const { data: test4Data, error: test4Error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
            
      // Test 5: Verificar RLS (Row Level Security)
            const { data: test5Data, error: test5Error } = await supabase
        .from('users')
        .select('user_id, logo_url')
        .limit(5);
      
                  
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
  
      }
