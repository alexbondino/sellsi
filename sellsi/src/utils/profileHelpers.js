/**
 * Utilidades auxiliares para el módulo Profile
 * Funciones de formateo y manipulación de datos
 */
import { normalizePhone, COUNTRY_CALLING_CODES } from './validators';

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
  // Derivar NSN (número nacional sin prefijo) desde E.164 almacenado
  const deriveNSN = (country, storedPhone) => {
    if (!storedPhone) return '';
    const cc = COUNTRY_CALLING_CODES[country] || '';
    let digits = String(storedPhone).replace(/\D+/g, '');
    if (cc && digits.startsWith(cc)) {
      digits = digits.slice(cc.length);
    }
    // No reinsertar ceros de troncal; UI siempre muestra dígitos tal cual
    return digits;
  };

  const uiCountry = userProfile.country || '';
  const uiPhone = deriveNSN(uiCountry, userProfile.phone_nbr);
  const mapped = {
    // Información General
    email: userProfile.email || '',
    phone: uiPhone, // Mostrar solo NSN en UI (sin +código)
    rut: userProfile.rut || '',
  country: uiCountry,
    role: userProfile.main_supplier ? 'supplier' : 'buyer', // Convertir boolean → string
    user_nm: userProfile.user_nm || '',
    descripcionProveedor: userProfile.descripcion_proveedor || '', // <--- MAPEO CORRECTO
    minimumPurchaseAmount: userProfile.minimum_purchase_amount || 0,

    // Información de Despacho
    shippingRegion: userProfile.shipping_region || '',
    shippingCommune: userProfile.shipping_commune || '', // 🔧 CORREGIDO: commune (no comuna)
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

    // Documento Tributario
    documentTypes: userProfile.document_types || [],

    // Facturación
    businessName: userProfile.business_name || '',
    billingRut: userProfile.billing_rut || '',
    businessLine: userProfile.business_line || '',
    billingAddress: userProfile.billing_address || '',
    billingRegion: userProfile.billing_region || '',
    billingCommune: userProfile.billing_commune || '', // 🔧 CORREGIDO: commune (no comuna)
  };

  return mapped;
};

/**
 * Mapea datos del formulario a formato de BD para actualización
 * @param {object} formData - Datos del formulario
 * @param {object} userProfile - Datos actuales del usuario (para preservar campos no editables)
 * @returns {object} - Datos formateados para la BD
 */
export const mapFormDataToUserProfile = (formData, userProfile) => {
  // Normalizar teléfono a E.164 si es posible
  let normalizedPhone = formData.phone;
  if (formData.country && formData.phone) {
    try {
      normalizedPhone = normalizePhone(formData.country, formData.phone);
    } catch {
      // si falla por alguna razón, usar el valor crudo
      normalizedPhone = formData.phone;
    }
  }
  const result = {
    // Información básica
    email: formData.email,
  phone_nbr: normalizedPhone, // Guardar teléfono normalizado → phone_nbr
    rut: formData.rut,
  country: formData.country,
    main_supplier: formData.role === 'supplier', // Convertir string → boolean
    user_nm: formData.user_nm || userProfile?.user_nm, // Preservar nombre de usuario
    descripcion_proveedor: formData.descripcionProveedor || '', // <--- MAPEO CORRECTO
    minimum_purchase_amount: formData.minimumPurchaseAmount || 0,
    
    // Información de Despacho
    shipping_region: formData.shippingRegion,
    shipping_commune: formData.shippingCommune, // 🔧 CORREGIDO: shipping_commune (no shipping_comuna)
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
    
    // Documento Tributario
    document_types: formData.documentTypes || [],
    
    // Facturación
    business_name: formData.businessName,
    billing_rut: formData.billingRut,
    business_line: formData.businessLine,
    billing_address: formData.billingAddress,
    billing_region: formData.billingRegion,
    billing_commune: formData.billingCommune, // 🔧 CORREGIDO: billing_commune (no billing_comuna)
  };

  return result;
};
