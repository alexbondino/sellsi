// ============================================================================
// CHECKOUT STEPS CONSTANTS
// ============================================================================

export const CHECKOUT_STEPS = {
  CART: {
    id: 'cart',
    name: 'Carrito',
    path: '/buyer/cart',
    order: 1,
    icon: 'ShoppingCart',
    completed: false
  },
  PAYMENT_METHOD: {
    id: 'payment_method',
    name: 'Método de Pago',
    path: '/buyer/paymentmethod',
    order: 2,
    icon: 'Payment',
    completed: false
  },
  CONFIRMATION: {
    id: 'confirmation',
    name: 'Confirmación',
    path: '/buyer/checkout/confirmation',
    order: 3,
    icon: 'CheckCircle',
    completed: false
  },
  PROCESSING: {
    id: 'processing',
    name: 'Procesando',
    path: '/buyer/checkout/processing',
    order: 4,
    icon: 'HourglassEmpty',
    completed: false
  },
  SUCCESS: {
    id: 'success',
    name: 'Completado',
    path: '/buyer/checkout/success',
    order: 5,
    icon: 'CheckCircle',
    completed: false
  }
}

export const CHECKOUT_FLOW = [
  CHECKOUT_STEPS.CART,
  CHECKOUT_STEPS.PAYMENT_METHOD,
  CHECKOUT_STEPS.CONFIRMATION,
  CHECKOUT_STEPS.PROCESSING,
  CHECKOUT_STEPS.SUCCESS
]
