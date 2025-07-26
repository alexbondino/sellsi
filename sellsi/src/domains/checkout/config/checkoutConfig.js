// ============================================================================
// CHECKOUT CONFIGURATION
// ============================================================================

// Configuración general del checkout
export const CHECKOUT_CONFIG = {
  // Configuración de UI
  ui: {
    showProgressStepper: true,
    showSecurityBadge: true,
    showPaymentMethodIcons: true,
    showProcessingAnimation: true,
    enableAnimations: true,
    compactMode: false
  },

  // Configuración de validación
  validation: {
    validateOnSelect: true,
    validateOnSubmit: true,
    showValidationErrors: true,
    minAmount: 1000,
    maxAmount: 10000000
  },

  // Configuración de UX
  ux: {
    autoAdvanceSteps: false,
    confirmBeforeBack: false,
    showSuccessAnimation: true,
    redirectAfterSuccess: true,
    redirectDelay: 3000
  },

  // Configuración de persistencia
  persistence: {
    saveToLocalStorage: true,
    savePaymentMethod: true,
    saveOrderData: true,
    clearOnSuccess: true,
    clearOnError: false
  },

  // Configuración de notificaciones
  notifications: {
    showToasts: true,
    toastDuration: 4000,
    showProcessingToast: true,
    showErrorToast: true,
    showSuccessToast: true
  },

  // Configuración de debug
  debug: {
    enableLogging: process.env.NODE_ENV === 'development',
    logStateChanges: true,
    logValidationErrors: true,
    logPaymentProcessing: true
  }
}

// Configuración específica por método de pago
export const PAYMENT_METHOD_CONFIG = {
  khipu: {
    displayName: 'Khipu',
    processingTime: 'Inmediato',
    supportedCurrencies: ['CLP'],
    showFees: true,
    showLimits: true,
    showProcessingTime: true,
    icon: {
      width: 48,
      height: 48,
      alt: 'Khipu - Transferencia bancaria'
    }
  },

  // Configuración futura para otros métodos
  webpay: {
    displayName: 'Webpay Plus',
    processingTime: '1-3 minutos',
    supportedCurrencies: ['CLP'],
    showFees: true,
    showLimits: true,
    showProcessingTime: true,
    icon: {
      width: 48,
      height: 48,
      alt: 'Webpay Plus - Tarjetas'
    }
  },

  mercadopago: {
    displayName: 'Mercado Pago',
    processingTime: 'Inmediato',
    supportedCurrencies: ['CLP'],
    showFees: true,
    showLimits: true,
    showProcessingTime: true,
    icon: {
      width: 48,
      height: 48,
      alt: 'Mercado Pago'
    }
  }
}

// Configuración de timeout y reintentos
export const CHECKOUT_TIMEOUTS = {
  paymentProcessing: 30000, // 30 segundos
  validationTimeout: 5000,  // 5 segundos
  redirectTimeout: 3000,    // 3 segundos
  
  // Configuración de reintentos
  retries: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2
  }
}

// Configuración de URLs
export const CHECKOUT_URLS = {
  // URLs de redirección
  success: '/buyer/orders',
  error: '/buyer/cart',
  cancel: '/buyer/cart',
  
  // URLs de API (a configurar según ambiente)
  api: {
    createOrder: '/api/orders',
    processPayment: '/api/payments',
    verifyPayment: '/api/payments/verify',
    khipu: '/api/payments/khipu'
  }
}

// Configuración de análiticas
export const CHECKOUT_ANALYTICS = {
  // Eventos a trackear
  events: {
    checkoutStarted: 'checkout_started',
    paymentMethodSelected: 'payment_method_selected',
    paymentProcessed: 'payment_processed',
    checkoutCompleted: 'checkout_completed',
    checkoutError: 'checkout_error',
    checkoutCancelled: 'checkout_cancelled'
  },

  // Propiedades adicionales
  properties: {
    includeOrderValue: true,
    includePaymentMethod: true,
    includeProcessingTime: true,
    includeErrorDetails: true
  }
}

// Función para obtener configuración del ambiente
export const getCheckoutConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  
  return {
    ...CHECKOUT_CONFIG,
    
    // Configuración específica por ambiente
    ...(env === 'production' ? {
      debug: {
        enableLogging: false,
        logStateChanges: false,
        logValidationErrors: false,
        logPaymentProcessing: false
      }
    } : {}),
    
    // URLs específicas por ambiente
    urls: {
      ...CHECKOUT_URLS,
      ...(env === 'production' ? {
        api: {
          createOrder: 'https://api.sellsi.com/orders',
          processPayment: 'https://api.sellsi.com/payments',
          verifyPayment: 'https://api.sellsi.com/payments/verify',
          khipu: 'https://api.sellsi.com/payments/khipu'
        }
      } : {})
    }
  }
}
