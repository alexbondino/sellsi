// ============================================================================
// CONSTANTES DEL MARKETPLACE - SELLSI
// ============================================================================

/**
 * ⚠️ MIGRACIÓN EN PROGRESO
 * 
 * Las constantes SHIPPING_OPTIONS y DISCOUNT_CODES han sido migradas a:
 * - src/shared/constants/shipping.js
 * - src/shared/constants/discounts.js
 * 
 * Se mantienen aquí los re-exports para compatibilidad.
 * TODO: Una vez migrados todos los imports, eliminar este archivo.
 */

// ✅ RE-EXPORTS desde shared constants
export { SHIPPING_OPTIONS, SHIPPING_CONFIG } from '../../../shared/constants/shipping';
export { DISCOUNT_CODES, DISCOUNT_CONFIG } from '../../../shared/constants/discounts';

// ============================================================================
// CONSTANTES ESPECÍFICAS DEL MARKETPLACE
// ============================================================================

// Filtros iniciales del marketplace
export const INITIAL_FILTERS = {
  precioMin: '',
  precioMax: '',
  soloConStock: false,
  ratingMin: 0,
  negociable: 'todos', // Filtro de negociable ('todos', 'si', 'no')
}

export const PRICE_RANGE = [0, 1000000]
export const RATING_RANGE = [0, 5]

// Datos de prueba para el carrito
export const SAMPLE_ITEMS = []
