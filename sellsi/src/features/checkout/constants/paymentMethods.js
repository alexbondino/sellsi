// ============================================================================
// PAYMENT METHODS CONSTANTS
// ============================================================================

export const PAYMENT_METHODS = {
  KHIPU: {
    id: 'khipu',
    name: 'Transferencia por Khipu',
    description: 'Pago seguro mediante transferencia bancaria',
    icon: '/Checkout/khipu.svg',
    enabled: true,
    fees: {
      percentage: 0,
      fixed: 0
    },
    minAmount: 1000,
    maxAmount: 10000000,
    supportedCurrencies: ['CLP'],
    processingTime: 'Inmediato',
    security: {
      ssl: true,
      encrypted: true,
      verified: true
    }
  },
  // Métodos futuros
  WEBPAY: {
    id: 'webpay',
    name: 'Webpay Plus',
    description: 'Pago con tarjeta de crédito o débito',
    icon: '/Checkout/webpay.svg',
    enabled: false,
    fees: {
      percentage: 2.95,
      fixed: 0
    }
  },
  MERCADOPAGO: {
    id: 'mercadopago',
    name: 'Mercado Pago',
    description: 'Pago con múltiples métodos',
    icon: '/Checkout/mercadopago.svg',
    enabled: false,
    fees: {
      percentage: 3.99,
      fixed: 0
    }
  }
}

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

export const TRANSACTION_TYPES = {
  PURCHASE: 'purchase',
  REFUND: 'refund',
  PARTIAL_REFUND: 'partial_refund'
}
