/**
 * Utilidades auxiliares para el módulo Profile
 * Funciones de formateo y manipulación de datos
 */

/**
 * Enmascara datos sensibles mostrando solo los últimos N caracteres
 * @param {string|number} value - Valor a enmascarar
 * @param {number} showLast - Cantidad de caracteres a mostrar al final
 * @returns {string} - Valor enmascarado
 */
export const maskSensitiveData = (value, showLast = 4) => {
  if (!value) return '';
  const str = value.toString();
  if (str.length <= showLast) return str;
  return '*'.repeat(str.length - showLast) + str.slice(-showLast);
};

/**
 * Obtiene iniciales de un nombre para mostrar en avatar
 * @param {string} name - Nombre completo
 * @returns {string} - Iniciales en mayúsculas (máx 2 caracteres)
 */
export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

/**
 * Mapea datos del perfil de usuario (BD) a formato de formulario
 * @param {object} userProfile - Datos del usuario desde la BD
 * @returns {object} - Datos formateados para el formulario
 */
export const mapUserProfileToFormData = (userProfile) => {
  const mapped = {
    // Información Empresa
    email: userProfile.email || '',
    phone: userProfile.phone_nbr || '', // Mapear phone_nbr → phone
    rut: userProfile.rut || '',
    role: userProfile.main_supplier ? 'supplier' : 'buyer', // Convertir boolean → string
    user_nm: userProfile.user_nm || '',
    descripcionProveedor: userProfile.descripcion_proveedor || '', // <--- MAPEO CORRECTO

    // Información de Envío
    shippingRegion: userProfile.shipping_region || '',
    shippingComuna: userProfile.shipping_commune || '',
    shippingAddress: userProfile.shipping_address || '',
    shippingNumber: userProfile.shipping_number || '',
    shippingDept: userProfile.shipping_dept || '',
    shippingRegions: userProfile.shippingRegions || [], // <--- FIX: asegura que siempre esté definido

    // Información de Transferencia
    accountHolder: userProfile.account_holder || '',
    accountType: userProfile.account_type || 'corriente',
    bank: userProfile.bank || '',
    accountNumber: userProfile.account_number || '',
    transferRut: userProfile.transfer_rut || '',
    confirmationEmail: userProfile.confirmation_email || '',

    // Información de Facturación
    businessName: userProfile.business_name || '',
    billingRut: userProfile.billing_rut || '',
    businessLine: userProfile.business_line || '',
    billingAddress: userProfile.billing_address || '',
    billingRegion: userProfile.billing_region || '',
    billingComuna: userProfile.billing_comuna || userProfile.billing_commune || '',
  };
  console.log('[mapUserProfileToFormData] shipping_commune:', userProfile.shipping_commune, '→ shippingComuna:', mapped.shippingComuna);
  return mapped;
};

/**
 * Mapea datos del formulario a formato de BD para actualización
 * @param {object} formData - Datos del formulario
 * @param {object} userProfile - Datos actuales del usuario (para preservar campos no editables)
 * @returns {object} - Datos formateados para la BD
 */
export const mapFormDataToUserProfile = (formData, userProfile) => {
  return {
    // Información básica
    email: formData.email,
    phone_nbr: formData.phone, // Mapear phone → phone_nbr
    rut: formData.rut,
    main_supplier: formData.role === 'supplier', // Convertir string → boolean
    user_nm: formData.user_nm || userProfile?.user_nm, // Preservar nombre de usuario
    descripcion_proveedor: formData.descripcionProveedor || '', // <--- MAPEO CORRECTO
    
    // Información de Envío
    shipping_region: formData.shippingRegion,
    shipping_comuna: formData.shippingComuna,
    shipping_address: formData.shippingAddress,
    shipping_number: formData.shippingNumber,
    shipping_dept: formData.shippingDept,
    
    // Información de Transferencia
    account_holder: formData.accountHolder,
    account_type: formData.accountType,
    bank: formData.bank,
    account_number: formData.accountNumber,
    transfer_rut: formData.transferRut,
    confirmation_email: formData.confirmationEmail,
    
    // Información de Facturación
    business_name: formData.businessName,
    billing_rut: formData.billingRut,
    business_line: formData.businessLine,
    billing_address: formData.billingAddress,
    billing_region: formData.billingRegion,
    billing_comuna: formData.billingComuna,
  };
};
