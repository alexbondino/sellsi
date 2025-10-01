/**
 * Utilidades de validación para formularios
 * Extraído del módulo Profile para reutilización
 */

/**
 * Limpia el RUT: elimina puntos y lo deja en formato XXXXXXXX-X
 * @param {string} rut
 * @returns {string}
 */
export const cleanRut = (rut) => {
  if (!rut) return '';
  return rut.replace(/[.]/g, '').toUpperCase();
};

/**
 * Valida formato de RUT chileno (sin puntos, solo guion)
 * @param {string} rut - RUT en formato XXXXXXXX-X o XXXXXXXXX-X
 * @returns {boolean} - true si es válido o vacío, false si formato incorrecto
 */
export const validateRut = (rut) => {
  if (!rut) return true;
  // Acepta 7 a 9 dígitos antes del guion (personas y empresas)
  const rutPattern = /^\d{7,9}-[\dkK]$/;
  return rutPattern.test(cleanRut(rut));
};

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido o vacío, false si formato incorrecto
 */
export const validateEmail = (email) => {
  if (!email) return true;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

/**
 * Valida requisitos de contraseña
 * @param {string} password - Contraseña a validar
 * @returns {object} - Objeto con resultados de validación
 */
export const validatePassword = (password) => {
  const requirements = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
  };
  
  return {
    isValid: Object.values(requirements).every(req => req),
    requirements
  };
};

/**
 * Valida que dos contraseñas coincidan
 * @param {string} password - Contraseña original
 * @param {string} confirmPassword - Confirmación de contraseña
 * @returns {boolean} - true si coinciden
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  return password === confirmPassword;
};

/**
 * Formatea el RUT chileno con puntos y guion: 12.345.678-5 o 76.543.210-K
 * @param {string} rut
 * @returns {string}
 */
export const formatRut = (rut) => {
  if (!rut) return '';
  // Limpiar caracteres no válidos
  let clean = rut.replace(/[^\dkK]/gi, '').toUpperCase();
  // Separar cuerpo y dígito verificador
  let body = clean.slice(0, -1);
  let dv = clean.slice(-1);
  // Agregar puntos cada 3 dígitos desde la derecha
  let formatted = '';
  while (body.length > 3) {
    formatted = '.' + body.slice(-3) + formatted;
    body = body.slice(0, -3);
  }
  formatted = body + formatted + '-' + dv;
  return formatted;
};

/**
 * Mapa de prefijos telefónicos por país (ISO-2 → calling code)
 * Solo países usados por CountrySelector
 */
export const COUNTRY_CALLING_CODES = {
  CL: '56', AR: '54', PE: '51', CO: '57', MX: '52', ES: '34', US: '1',
  EC: '593', BO: '591', UY: '598', PY: '595', VE: '58', BR: '55',
  GT: '502', CR: '506', PA: '507'
};

/**
 * Normaliza un teléfono a formato E.164 usando el country code ISO-2
 * - Elimina todo lo no numérico
 * - Si comienza con el calling code, lo recorta a NSN
 * - Retorna "+<calling_code><nsn>"
 */
export const normalizePhone = (countryCode, phoneRaw) => {
  if (!phoneRaw) return '';
  const cc = COUNTRY_CALLING_CODES[countryCode] || '';
  let digits = String(phoneRaw).replace(/\D+/g, '');
  if (!cc) {
    // Sin prefijo conocido, limitar longitud E.164
    return `+${digits}`.slice(0, 16);
  }
  // Si el input ya incluye el calling code al inicio, recortar
  if (digits.startsWith(cc)) {
    digits = digits.slice(cc.length);
  }
  // Quitar prefijo de troncal '0' inicial común en la marcación nacional (AR, BR, PE, VE)
  if (['AR', 'BR', 'PE', 'VE', 'CL', 'CO', 'MX', 'EC', 'BO', 'UY', 'PY'].includes(countryCode)) {
    digits = digits.replace(/^0+/, '');
  }
  // Construir E.164
  return `+${cc}${digits}`;
};

/**
 * Valida un teléfono según país de forma robusta pero pragmática
 * - Chile (CL): exige NSN de 9 dígitos
 * - Otros: longitud total E.164 entre 6 y 15 dígitos totales
 */
export const validatePhone = (countryCode, phoneRaw) => {
  if (!phoneRaw) return { isValid: false, reason: 'Requerido' };
  const cc = COUNTRY_CALLING_CODES[countryCode] || '';
  const onlyDigits = String(phoneRaw).replace(/\D+/g, '');

  const stripCC = (digits) => digits.startsWith(cc) ? digits.slice(cc.length) : digits;
  const nsnRaw = stripCC(onlyDigits).replace(/^0+/, '');

  if (countryCode === 'CL') {
    // Chile: NSN de 9 dígitos
    let nsn = nsnRaw;
    if (nsn.length !== 9) {
      return { isValid: false, reason: 'Debe tener 9 dígitos' };
    }
    return { isValid: true };
  }

  if (countryCode === 'AR') {
    // Argentina: NSN 10 (fijo) u 11 (móvil con 9). Aceptamos 10 o 11.
    const len = nsnRaw.length;
    if (len === 10) return { isValid: true };
    if (len === 11) return { isValid: true };
    return { isValid: false, reason: 'Debe tener 10 u 11 dígitos' };
  }

  if (countryCode === 'PE') {
    // Perú: 8 (fijo) o 9 comenzando con 9 (móvil)
    const len = nsnRaw.length;
    if (len === 8) return { isValid: true };
    if (len === 9 && nsnRaw.startsWith('9')) return { isValid: true };
    return { isValid: false, reason: 'Debe tener 8 (fijo) o 9 iniciando con 9 (móvil)' };
  }

  if (countryCode === 'BR') {
    // Brasil: 10 (fijo) o 11 (móvil, 9 después del DDD)
    const len = nsnRaw.length;
    if (len === 10) return { isValid: true };
    if (len === 11) {
      // Heurística: móvil debe tener '9' en la tercera posición (después de DDD)
      if (nsnRaw[2] === '9') return { isValid: true };
      return { isValid: false, reason: 'Móvil debe ser 11 dígitos con 9 después del DDD' };
    }
    return { isValid: false, reason: 'Debe tener 10 (fijo) u 11 (móvil)' };
  }

  if (countryCode === 'VE') {
    // Venezuela: NSN 10 dígitos (fijo/móvil)
    if (nsnRaw.length === 10) return { isValid: true };
    return { isValid: false, reason: 'Debe tener 10 dígitos' };
  }

  // Genérico: E.164 entre 6 y 15 dígitos (sin contar '+')
  const e164 = normalizePhone(countryCode, onlyDigits).replace('+', '');
  if (e164.length < 6 || e164.length > 15) {
    return { isValid: false, reason: 'Longitud inválida' };
  }
  return { isValid: true };
};
