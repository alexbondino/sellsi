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
