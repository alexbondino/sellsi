// ============================================================================
// CONSTANTES DEL CARRITO - SELLSI MARKETPLACE
// ============================================================================

// Códigos de descuento disponibles
export const DISCOUNT_CODES = {
  BIENVENIDO: {
    percentage: 10,
    minAmount: 50000,
    description: '10% off para nuevos usuarios',
  },
  SELLSI20: {
    percentage: 20,
    minAmount: 100000,
    description: '20% off en compras sobre $100.000',
  },
  CYBERSI: {
    percentage: 15,
    minAmount: 75000,
    description: '15% off especial por Cyber',
  },
  FREESHIPING: {
    shipping: 0,
    minAmount: 0,
    description: 'Envío gratis',
  },
}

// Opciones de envío
export const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    name: 'Envío Estándar',
    price: 5990,
    days: '3-5 días hábiles',
    icon: '📦',
  },
  {
    id: 'express',
    name: 'Envío Express',
    price: 12990,
    days: '1-2 días hábiles',
    icon: '⚡',
  },
  {
    id: 'premium',
    name: 'Envío Premium',
    price: 18990,
    days: 'Mismo día',
    icon: '🚀',
  },
  {
    id: 'pickup',
    name: 'Retiro en Tienda',
    price: 0,
    days: 'Disponible hoy',
    icon: '🏪',
  },
]

// Datos de prueba para el carrito
export const SAMPLE_ITEMS = []
