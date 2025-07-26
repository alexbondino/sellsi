/**
 * 🚚 CONSTANTES DE ENVÍO - SHARED
 * 
 * Migrado desde: domains/marketplace/hooks/constants.js
 * Motivo: Shared components no deberían depender de dominios específicos
 * 
 * USADO EN:
 * - shared/stores/cart/useShipping.js
 * - domains/buyer/pages/cart/CartItem.jsx
 * - domains/marketplace (re-export)
 */

// Opciones de envío disponibles
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
    days: 'Inmediato',
    icon: '🏪',
  }
];

// Configuración de envío
export const SHIPPING_CONFIG = {
  FREE_SHIPPING_THRESHOLD: 50000, // Envío gratis sobre $50.000
  DEFAULT_SHIPPING_OPTION: 'standard',
  REGIONS: {
    RM: { multiplier: 1.0, name: 'Región Metropolitana' },
    V: { multiplier: 1.2, name: 'Valparaíso' },
    VIII: { multiplier: 1.3, name: 'Biobío' },
    OTHER: { multiplier: 1.5, name: 'Otras regiones' }
  }
};
