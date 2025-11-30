/**
 * Utilidad para acceder a variables de entorno de manera compatible con Jest y Vite.
 * 
 * En Vite: usa import.meta.env
 * En Jest: usa process.env
 */

// Detectar si estamos en ambiente de test (Jest)
const isTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';

/**
 * Obtiene una variable de entorno.
 * Compatible con Vite (import.meta.env) y Jest (process.env)
 */
export function getEnv(key) {
  // En browser (Vite): usar import.meta.env
  // En Jest/Node: usar process.env
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  // Fallback para Jest o Node
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}

/**
 * Variables de entorno comunes pre-computadas
 */
export const ENV = {
  get VITE_USE_MOCKS() {
    return getEnv('VITE_USE_MOCKS') === 'true';
  },
  get VITE_SUPABASE_URL() {
    return getEnv('VITE_SUPABASE_URL');
  },
  get VITE_SUPABASE_ANON_KEY() {
    return getEnv('VITE_SUPABASE_ANON_KEY');
  },
  get VITE_PRICE_SUMMARY_TTL_MS() {
    return getEnv('VITE_PRICE_SUMMARY_TTL_MS');
  },
  get MODE() {
    return getEnv('MODE') || (isTest ? 'test' : 'development');
  },
  get DEV() {
    return getEnv('DEV') === 'true' || getEnv('MODE') === 'development';
  },
  get PROD() {
    return getEnv('PROD') === 'true' || getEnv('MODE') === 'production';
  },
  isTest,
};

export default ENV;
