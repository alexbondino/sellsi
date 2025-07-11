// ============================================================================
// CHECKOUT TESTING UTILITIES
// ============================================================================

import { PAYMENT_METHODS } from '../constants/paymentMethods'
import { CHECKOUT_STEPS } from '../constants/checkoutSteps'

// Mock data para testing
export const mockOrderData = {
  items: [
    {
      id: 1,
      name: 'Producto de prueba 1',
      price: 25000,
      quantity: 2,
      image: '/placeholder-product.jpg'
    },
    {
      id: 2,
      name: 'Producto de prueba 2',
      price: 15000,
      quantity: 1,
      image: '/placeholder-product.jpg'
    }
  ],
  subtotal: 65000,
  tax: 12350, // 19% IVA
  shipping: 5000,
  total: 82350,
  currency: 'CLP'
}

export const mockPaymentResponse = {
  success: true,
  transactionId: 'TEST_TXN_123456',
  paymentReference: 'TEST_REF_ABC123',
  status: 'completed',
  amount: 82350,
  currency: 'CLP',
  paymentMethod: 'khipu',
  processedAt: new Date().toISOString()
}

// Funciones de testing
export const testCheckoutFlow = {
  // Simular selección de método de pago
  selectPaymentMethod: (methodId) => {
    const method = Object.values(PAYMENT_METHODS).find(m => m.id === methodId)
    return {
      success: !!method,
      method: method || null,
      error: method ? null : 'Método no encontrado'
    }
  },

  // Simular validación de pago
  validatePayment: (methodId, amount) => {
    const method = Object.values(PAYMENT_METHODS).find(m => m.id === methodId)
    if (!method) {
      return { isValid: false, errors: ['Método no encontrado'] }
    }

    const errors = []
    
    if (method.minAmount && amount < method.minAmount) {
      errors.push(`Monto mínimo: $${method.minAmount.toLocaleString()}`)
    }
    
    if (method.maxAmount && amount > method.maxAmount) {
      errors.push(`Monto máximo: $${method.maxAmount.toLocaleString()}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Simular procesamiento de pago
  processPayment: async (paymentData) => {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Simular fallos ocasionales para testing
    if (Math.random() < 0.1) { // 10% de probabilidad de fallo
      throw new Error('Error simulado de procesamiento')
    }
    
    return {
      ...mockPaymentResponse,
      amount: paymentData.amount,
      transactionId: `TEST_${Date.now()}`,
      paymentReference: `REF_${Math.random().toString(36).substr(2, 9)}`
    }
  }
}

// Utilidades de testing para estados del checkout
export const testCheckoutStates = {
  // Estado inicial
  initial: {
    currentStep: CHECKOUT_STEPS.CART,
    completedSteps: [],
    paymentMethod: null,
    orderData: mockOrderData,
    isProcessing: false,
    error: null
  },

  // Estado con método seleccionado
  methodSelected: {
    currentStep: CHECKOUT_STEPS.PAYMENT_METHOD,
    completedSteps: [CHECKOUT_STEPS.CART],
    paymentMethod: PAYMENT_METHODS.KHIPU,
    orderData: mockOrderData,
    isProcessing: false,
    error: null
  },

  // Estado procesando pago
  processing: {
    currentStep: CHECKOUT_STEPS.PROCESSING,
    completedSteps: [CHECKOUT_STEPS.CART, CHECKOUT_STEPS.PAYMENT_METHOD],
    paymentMethod: PAYMENT_METHODS.KHIPU,
    orderData: mockOrderData,
    isProcessing: true,
    error: null
  },

  // Estado con error
  error: {
    currentStep: CHECKOUT_STEPS.PAYMENT_METHOD,
    completedSteps: [CHECKOUT_STEPS.CART],
    paymentMethod: PAYMENT_METHODS.KHIPU,
    orderData: mockOrderData,
    isProcessing: false,
    error: 'Error de procesamiento de pago'
  },

  // Estado completado
  completed: {
    currentStep: CHECKOUT_STEPS.SUCCESS,
    completedSteps: [
      CHECKOUT_STEPS.CART,
      CHECKOUT_STEPS.PAYMENT_METHOD,
      CHECKOUT_STEPS.CONFIRMATION,
      CHECKOUT_STEPS.PROCESSING
    ],
    paymentMethod: PAYMENT_METHODS.KHIPU,
    orderData: mockOrderData,
    isProcessing: false,
    error: null,
    transactionId: 'TEST_TXN_123456',
    paymentReference: 'TEST_REF_ABC123'
  }
}

// Funciones de debug
export const debugCheckout = {
  // Imprimir estado actual
  logState: (state) => {
    console.group('🛒 Checkout State')
    console.log('Current Step:', state.currentStep?.name || 'None')
    console.log('Completed Steps:', state.completedSteps.map(s => s.name))
    console.log('Payment Method:', state.paymentMethod?.name || 'None')
    console.log('Order Total:', state.orderData?.total || 0)
    console.log('Is Processing:', state.isProcessing)
    console.log('Error:', state.error || 'None')
    console.groupEnd()
  },

  // Validar integridad del estado
  validateState: (state) => {
    const issues = []
    
    if (!state.currentStep) {
      issues.push('currentStep is missing')
    }
    
    if (!state.orderData || !state.orderData.items || state.orderData.items.length === 0) {
      issues.push('orderData is invalid or empty')
    }
    
    if (state.currentStep?.id === CHECKOUT_STEPS.PAYMENT_METHOD.id && !state.paymentMethod) {
      issues.push('paymentMethod should be selected at this step')
    }
    
    if (state.isProcessing && state.currentStep?.id !== CHECKOUT_STEPS.PROCESSING.id) {
      issues.push('processing state mismatch')
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

// Constantes para testing
export const testConstants = {
  VALID_AMOUNTS: [1000, 50000, 100000],
  INVALID_AMOUNTS: [0, -1000, 20000000],
  PROCESSING_DELAY: 1000,
  ERROR_SIMULATION_RATE: 0.1
}
