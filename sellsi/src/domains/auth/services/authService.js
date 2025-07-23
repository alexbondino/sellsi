// 📁 domains/auth/services/authService.js
// Servicio central de autenticación
import { supabase } from '../../../services/supabase';
import { AUTH_ERRORS } from '../constants';

class AuthService {
  /**
   * Iniciar sesión con email y contraseña
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user, error}>}
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      });

      if (error) {
        return { user: null, error: this.mapAuthError(error) };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { type: AUTH_ERRORS.NETWORK_ERROR, message: error.message }
      };
    }
  }

  /**
   * Registrar nuevo usuario
   * @param {string} email 
   * @param {string} password 
   * @param {Object} metadata 
   * @returns {Promise<{user, error}>}
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        return { user: null, error: this.mapAuthError(error) };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { type: AUTH_ERRORS.NETWORK_ERROR, message: error.message }
      };
    }
  }

  /**
   * Cerrar sesión
   * @returns {Promise<{error}>}
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error: { type: AUTH_ERRORS.NETWORK_ERROR, message: error.message } };
    }
  }

  /**
   * Obtener usuario actual
   * @returns {Promise<{user, error}>}
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      return { 
        user: null, 
        error: { type: AUTH_ERRORS.NETWORK_ERROR, message: error.message }
      };
    }
  }

  /**
   * Resetear contraseña
   * @param {string} email 
   * @returns {Promise<{error}>}
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      );
      return { error };
    } catch (error) {
      return { error: { type: AUTH_ERRORS.NETWORK_ERROR, message: error.message } };
    }
  }

  /**
   * Mapear errores de Supabase a errores internos
   * @param {Object} error 
   * @returns {Object}
   */
  mapAuthError(error) {
    const errorMap = {
      'invalid_credentials': AUTH_ERRORS.INVALID_CREDENTIALS,
      'user_not_found': AUTH_ERRORS.USER_NOT_FOUND,
      'email_already_exists': AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
      'weak_password': AUTH_ERRORS.WEAK_PASSWORD
    };

    return {
      type: errorMap[error.message] || AUTH_ERRORS.NETWORK_ERROR,
      message: error.message,
      originalError: error
    };
  }
}

export default new AuthService();
