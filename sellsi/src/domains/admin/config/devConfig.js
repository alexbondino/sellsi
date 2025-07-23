/**
 * 🚧 Configuración de Desarrollo para Admin Panel
 * 
 * Configuraciones específicas para el entorno de desarrollo
 * que permiten crear la primera cuenta admin sin restricciones.
 * 
 * ⚠️ IMPORTANTE: Cambiar a false en producción
 */

// 🔧 CONFIGURACIÓN DE DESARROLLO
export const DEV_CONFIG = {
  // Permitir crear admins sin estar logueado (solo para desarrollo)
  ALLOW_ADMIN_CREATION_WITHOUT_AUTH: true,
  
  // Mostrar información extra de debugging
  SHOW_DEBUG_INFO: true,
  
  // Usar datos mock si las tablas no existen
  USE_MOCK_DATA: true,
  
  // Saltar verificación de permisos
  SKIP_PERMISSION_CHECK: true,
  
  // Modo de desarrollo activo
  DEV_MODE: true
};

// 🔍 FUNCIONES DE DESARROLLO
export const isDevelopment = () => {
  return process.env.NODE_ENV === 'development' || DEV_CONFIG.DEV_MODE;
};

export const canCreateAdminInDev = () => {
  return isDevelopment() && DEV_CONFIG.ALLOW_ADMIN_CREATION_WITHOUT_AUTH;
};

export const shouldSkipPermissions = () => {
  return isDevelopment() && DEV_CONFIG.SKIP_PERMISSION_CHECK;
};

// 🚨 FUNCIONES DE PRODUCCIÓN
export const setProductionMode = () => {
  DEV_CONFIG.ALLOW_ADMIN_CREATION_WITHOUT_AUTH = false;
  DEV_CONFIG.SHOW_DEBUG_INFO = false;
  DEV_CONFIG.USE_MOCK_DATA = false;
  DEV_CONFIG.SKIP_PERMISSION_CHECK = false;
  DEV_CONFIG.DEV_MODE = false;
};

// 📋 VALIDACIÓN DE ENTORNO
export const validateEnvironment = () => {
  const warnings = [];
  
  if (process.env.NODE_ENV === 'production') {
    if (DEV_CONFIG.ALLOW_ADMIN_CREATION_WITHOUT_AUTH) {
      warnings.push('⚠️ PELIGRO: Creación de admins sin auth habilitada en producción');
    }
    if (DEV_CONFIG.SKIP_PERMISSION_CHECK) {
      warnings.push('⚠️ PELIGRO: Verificación de permisos deshabilitada en producción');
    }
    if (DEV_CONFIG.DEV_MODE) {
      warnings.push('⚠️ PELIGRO: Modo desarrollo activo en producción');
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
  DEV_MESSAGE: 'Modo desarrollo: Puedes crear la primera cuenta admin sin restricciones'
};
