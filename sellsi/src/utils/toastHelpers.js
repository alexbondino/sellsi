/**
 * ============================================================================
 * TOAST HELPERS - SISTEMA UNIFICADO DE NOTIFICACIONES
 * ============================================================================
 * 
 * Centraliza y estandariza todos los toasters de la aplicación.
 * Garantiza consistencia visual y funcional en toda la app.
 */

import { toast } from 'react-hot-toast';

/**
 * 🎨 CONFIGURACIÓN VISUAL ESTANDARIZADA
 * Estilos base que se aplicarán a todos los toasters
 */
const BASE_TOAST_CONFIG = {
  duration: 4000,
  style: {
    background: '#fff',
    color: '#333',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '15px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid #e0e0e0',
    maxWidth: '400px',
    wordBreak: 'break-word'
  }
};

const TOAST_VARIANTS = {
  success: {
    style: {
      ...BASE_TOAST_CONFIG.style,
      background: '#e8f5e8',
      color: '#193501ff',
      border: '1px solid #4caf50'
    },
    iconTheme: {
      primary: '#4caf50',
      secondary: '#fff'
    }
  },
  error: {
    style: {
      ...BASE_TOAST_CONFIG.style,
      background: '#ffeaea',
      color: '#c62828',
      border: '1px solid #f44336'
    },
    iconTheme: {
      primary: '#f44336',
      secondary: '#fff'
    }
  },
  loading: {
    style: {
      ...BASE_TOAST_CONFIG.style,
      background: '#e3f2fd',
      color: '#1976d2',
      border: '1px solid #2196f3'
    },
    iconTheme: {
      primary: '#2196f3',
      secondary: '#fff'
    }
  },
  info: {
    style: {
      ...BASE_TOAST_CONFIG.style,
      background: '#e1f5fe',
      color: '#0277bd',
      border: '1px solid #03a9f4'
    },
    iconTheme: {
      primary: '#03a9f4',
      secondary: '#fff'
    }
  },
  warning: {
    style: {
      ...BASE_TOAST_CONFIG.style,
      background: '#fff8e1',
      color: '#f57c00',
      border: '1px solid #ff9800'
    },
    iconTheme: {
      primary: '#ff9800',
      secondary: '#fff'
    }
  }
};

/**
 * 🚀 FUNCIONES HELPER ESTANDARIZADAS
 */

/**
 * Toast de éxito con configuración unificada
 */
export const showSuccessToast = (message, options = {}) => {
  return toast.success(message, {
    ...TOAST_VARIANTS.success,
    duration: options.duration || BASE_TOAST_CONFIG.duration,
    id: options.id,
    icon: options.icon
  });
};

/**
 * Toast de error con configuración unificada
 */
export const showErrorToast = (message, options = {}) => {
  return toast.error(message, {
    ...TOAST_VARIANTS.error,
    duration: options.duration || 5000, // Más tiempo para leer errores
    id: options.id,
    icon: options.icon
  });
};

/**
 * Toast de loading con configuración unificada
 */
export const showLoadingToast = (message, options = {}) => {
  return toast.loading(message, {
    ...TOAST_VARIANTS.loading,
    id: options.id
  });
};

/**
 * Toast de información con configuración unificada
 */
export const showInfoToast = (message, options = {}) => {
  return toast(message, {
    ...TOAST_VARIANTS.info,
    duration: options.duration || BASE_TOAST_CONFIG.duration,
    id: options.id,
    icon: options.icon || 'ℹ️'
  });
};

/**
 * Toast de advertencia con configuración unificada
 */
export const showWarningToast = (message, options = {}) => {
  return toast(message, {
    ...TOAST_VARIANTS.warning,
    duration: options.duration || BASE_TOAST_CONFIG.duration,
    id: options.id,
    icon: options.icon || '⚠️'
  });
};

/**
 * 🎯 TOASTERS ESPECÍFICOS PARA LA APP
 * Mensajes comunes con configuración predefinida
 */

// Carrito
export const showCartSuccess = (message, icon = '🛒') => 
  showSuccessToast(message, { icon });

export const showCartError = (message) => 
  showErrorToast(message, { icon: '🛒' });

// Productos
export const showProductSuccess = (message, icon = '📦') => 
  showSuccessToast(message, { icon });

export const showProductError = (message) => 
  showErrorToast(message, { icon: '📦' });

// Validación
export const showValidationError = (message, options = {}) => 
  showErrorToast(message, { 
    id: 'validation-error',
    duration: 5000,
    ...options 
  });

// Guardado
export const showSaveSuccess = (message, icon = '✅') => 
  showSuccessToast(message, { icon });

export const showSaveError = (message, icon = '❌') => 
  showErrorToast(message, { icon });

// Loading states
export const showSaveLoading = (message, id = 'save-loading') => 
  showLoadingToast(message, { id });

/**
 * 🔄 UTILIDADES DE CONTROL
 */

/**
 * Cerrar toast específico
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Cerrar todos los toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Toast de éxito que reemplaza un loading
 */
export const replaceLoadingWithSuccess = (loadingId, message, icon = '✅') => {
  toast.success(message, {
    ...TOAST_VARIANTS.success,
    id: loadingId,
    icon
  });
};

/**
 * Toast de error que reemplaza un loading
 */
export const replaceLoadingWithError = (loadingId, message, icon = '❌') => {
  toast.error(message, {
    ...TOAST_VARIANTS.error,
    id: loadingId,
    icon,
    duration: 5000
  });
};
