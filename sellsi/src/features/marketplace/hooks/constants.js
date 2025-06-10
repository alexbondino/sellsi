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
export const SAMPLE_ITEMS = [
  {
    id: 1,
    name: 'LATE HARVEST DOÑA AURORA 6 unidades',
    price: 45990,
    quantity: 1,
    maxStock: 15,
    image: '/Marketplace productos/lavadora.jpg',
    supplier: 'Viña Doña Aurora',
    discount: 20,
    rating: 4.8,
    reviews: 89,
  },
  {
    id: 2,
    name: 'DOÑA AURORA BREBAJE ARTESANAL PAIS 6 unidades',
    price: 750000,
    quantity: 1,
    maxStock: 8,
    image: '/Marketplace productos/notebookasustuf.jpg',
    supplier: 'PC Factory',
    discount: 15,
    rating: 4.6,
    reviews: 124,
  },
  {
    id: 3,
    name: 'Silla Gaming Ergonómica',
    price: 349990,
    quantity: 2,
    maxStock: 15,
    image: '/Marketplace productos/silla.jpg',
    supplier: 'Comfort Zone',
    discount: 0,
    rating: 4.3,
    reviews: 203,
  },
]
