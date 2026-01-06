// ============================================================================
// PAYMENT METHODS CONSTANTS
// ============================================================================

export const PAYMENT_METHODS = {
  KHIPU: {
    id: 'khipu',
    name: 'Transferencia por Khipu',
    description: 'Pago seguro mediante transferencia bancaria instantánea',
    icon: '/Checkout/khipu.svg',
    enabled: false, // Temporalmente deshabilitado
    fees: {
      percentage: 0, // Sin comisiones adicionales por parte de Sellsi
      fixed: 500 // Comisión fija $500 CLP
    },
    minAmount: 10, // Mínimo CLP $10
    maxAmount: 10000000, // Máximo CLP $10M
    supportedCurrencies: ['CLP'],
    processingTime: 'Instantáneo',
    security: {
      ssl: true,
      encrypted: true,
      verified: true,
      description: 'Certificado por CMF y protegido con encriptación bancaria'
    },
    features: [
      'Comisión fija de $500',
      'Transferencia instantánea',
      'Disponible 24/7',
      'Compatible con todos los bancos',
      'Confirmación inmediata'
    ]
  },
  FLOW: {
    id: 'flow',
    name: 'Tarjeta de Crédito/Débito',
    description: 'Pago con Webpay, Visa, Mastercard y más',
    icon: '/Checkout/flow.svg',
    enabled: true,
    fees: {
      percentage: 3.8, // 3.8% del total
      fixed: 0
    },
    minAmount: 350, // Flow mínimo ~$350 CLP
    maxAmount: 10000000,
    supportedCurrencies: ['CLP'],
    processingTime: 'Instantáneo',
    security: {
      ssl: true,
      encrypted: true,
      verified: true,
      description: 'Procesado por Flow.cl con encriptación SSL'
    },
    features: [
      'Tarjetas de crédito y débito',
      'Webpay Plus',
      'Confirmación inmediata',
      'Múltiples medios de pago'
    ]
  },
  BANK_TRANSFER: {
    id: 'bank_transfer',
    name: 'Transferencia Bancaria',
    description: 'Transferencia manual - Verificación en menos de 24 horas',
    icon: 'AccountBalance', // Icono MUI - se manejará diferente
    enabled: true,
    fees: {
      percentage: 0.5, // 0.5% del total
      fixed: 0
    },
    minAmount: null, // Sin límite inferior
    maxAmount: null, // Sin límite superior
    supportedCurrencies: ['CLP'],
    processingTime: 'Hasta 24 horas',
    security: {
      ssl: true,
      encrypted: false,
      verified: true,
      description: 'Verificación manual por equipo Sellsi'
    },
    features: [
      'Comisión de solo 0.5%',
      'Sin límites de monto',
      'Transferencia manual',
      'Confirmación hasta 24 horas',
      'Seguro y confiable'
    ],
    bankDetails: {
      bank: 'Banco de Chile',
      accountType: 'Cuenta Vista',
      accountNumber: '000246625363',
      accountName: 'Sellsi SpA',
      rut: '78.322.743-6'
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
