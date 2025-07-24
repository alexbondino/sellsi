/**
 * 🎫 CONSTANTES DE CUPONES/DESCUENTOS - SHARED
 * 
 * Migrado desde: domains/marketplace/hooks/constants.js
 * Motivo: Shared components no deberían depender de dominios específicos
 * 
 * USADO EN:
 * - shared/stores/cart/useCoupons.js
 * - domains/marketplace (re-export)
 */

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
};

// Configuración de descuentos
export const DISCOUNT_CONFIG = {
  MAX_DISCOUNT_PERCENTAGE: 50, // Máximo 50% de descuento
  STACKABLE_DISCOUNTS: false, // No se pueden acumular descuentos
  MINIMUM_CART_VALUE: 10000, // Mínimo $10.000 para aplicar descuentos
};
