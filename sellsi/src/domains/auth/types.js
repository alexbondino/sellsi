// 📁 domains/auth/types.js
// Tipos y interfaces del dominio de autenticación

/**
 * @typedef {Object} User
 * @property {string} id - ID único del usuario
 * @property {string} email - Email del usuario
 * @property {string} role - Rol del usuario (buyer, supplier, admin)
 * @property {Object} user_metadata - Metadata del usuario
 * @property {boolean} email_confirmed_at - Si el email está confirmado
 */

/**
 * @typedef {Object} AuthState
 * @property {User|null} user - Usuario actual
 * @property {boolean} loading - Estado de carga
 * @property {boolean} isAuthenticated - Si está autenticado
 * @property {boolean} needsOnboarding - Si necesita onboarding
 */

/**
 * @typedef {Object} LoginFormData
 * @property {string} email - Email del usuario
 * @property {string} password - Contraseña del usuario
 * @property {boolean} rememberMe - Recordar sesión
 */

/**
 * @typedef {Object} RegisterFormData
 * @property {string} correo - Email del usuario
 * @property {string} password - Contraseña del usuario
 * @property {string} confirmPassword - Confirmación de contraseña
 * @property {string} accountType - Tipo de cuenta (buyer, supplier)
 */

export const AUTH_TYPES = {
  // Placeholder para tipos TypeScript futuros
};
