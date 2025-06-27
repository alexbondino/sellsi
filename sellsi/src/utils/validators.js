/**
 * Utilidades de validación para formularios
 * Extraído del módulo Profile para reutilización
 */

/**
 * Valida formato de RUT chileno
 * @param {string} rut - RUT en formato XX.XXX.XXX-X
 * @returns {boolean} - true si es válido o vacío, false si formato incorrecto
 */
export const validateRut = (rut) => {
  if (!rut) return true;
  const rutPattern = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
  return rutPattern.test(rut);
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
