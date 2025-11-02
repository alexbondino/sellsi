/**
 * 🚧 Configuración de Desarrollo para Admin Panel
 *
 * Configuraciones específicas para el entorno de desarrollo
 * que permiten crear la primera cuenta admin sin restricciones.
 *
 * ⚠️ IMPORTANTE: Estas configuraciones se toman de las variables de entorno
 * configuradas en Vercel según el entorno (staging/production)
 */

// 🔧 CONFIGURACIÓN BASADA EN VARIABLES DE ENTORNO
export const DEV_CONFIG = {
  // Permitir crear admins sin estar logueado (desde variable de entorno)
  ALLOW_ADMIN_CREATION_WITHOUT_AUTH:
    import.meta.env.VITE_ALLOW_ADMIN_CREATION_WITHOUT_AUTH === 'true',

  // Mostrar información extra de debugging (solo en desarrollo y staging)
  SHOW_DEBUG_INFO: import.meta.env.VITE_APP_ENV !== 'production',

  // Usar datos mock si las tablas no existen (solo desarrollo local)
  USE_MOCK_DATA: import.meta.env.DEV,

  // Saltar verificación de permisos (solo en desarrollo local)
  SKIP_PERMISSION_CHECK: import.meta.env.DEV,

  // Modo de desarrollo activo (desarrollo local o staging)
  DEV_MODE: import.meta.env.VITE_APP_ENV !== 'production',
};

// 🔍 FUNCIONES DE DESARROLLO
export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development';
};

export const isStaging = () => {
  return import.meta.env.VITE_APP_ENV === 'staging';
};

export const isProduction = () => {
  return import.meta.env.VITE_APP_ENV === 'production';
};

export const canCreateAdminInDev = () => {
  return DEV_CONFIG.ALLOW_ADMIN_CREATION_WITHOUT_AUTH;
};

export const shouldSkipPermissions = () => {
  return DEV_CONFIG.SKIP_PERMISSION_CHECK;
};

// � VALIDACIÓN DE ENTORNO
export const validateEnvironment = () => {
  const warnings = [];

  if (isProduction()) {
    if (DEV_CONFIG.ALLOW_ADMIN_CREATION_WITHOUT_AUTH) {
      warnings.push(
        '⚠️ PELIGRO: Creación de admins sin auth habilitada en producción'
      );
    }
    if (DEV_CONFIG.SKIP_PERMISSION_CHECK) {
      warnings.push(
        '⚠️ PELIGRO: Verificación de permisos deshabilitada en producción'
      );
    }
    if (DEV_CONFIG.SHOW_DEBUG_INFO) {
      warnings.push(
        '⚠️ PELIGRO: Información de debug habilitada en producción'
      );
    }
  }

  return warnings;
};

// 🎯 CONFIGURACIÓN PARA PRIMERA CUENTA ADMIN
export const FIRST_ADMIN_CONFIG = {
  // Credenciales por defecto para primera cuenta
  DEFAULT_USERNAME: 'admin',
  DEFAULT_PASSWORD: 'admin123',
  DEFAULT_EMAIL: 'admin@sellsi.com',
  DEFAULT_FULL_NAME: 'Administrador Principal',

  // Mensaje para desarrollo
  DEV_MESSAGE:
    'Modo desarrollo: Puedes crear la primera cuenta admin sin restricciones',
};
