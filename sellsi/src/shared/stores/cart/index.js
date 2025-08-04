/**
 * ============================================================================
 * CART STORE - EXPORT UNIFICADO DESDE SHARED/STORES
 * ============================================================================
 * 
 * Export centralizado del cart store y sus hooks relacionados.
 * Migrado desde features/buyer/hooks/ para uso global.
 * 
 * MIGRACIÓN COMPLETADA:
 * - ✅ Store principal modularizado
 * - ✅ Hooks relacionados migrados
 * - ✅ Paths actualizados
 * - ✅ API externa mantenida
 */

// Store principal del carrito
export { default as useCartStore } from './cartStore'

// Hooks especializados
export { default as useCartHistory } from './useCartHistory'
export { default as useShipping } from './useShipping'

// Hook unificado de cálculos de precio
export { 
  usePriceCalculation,
  useBasicPriceCalculation,
  useAdvancedPriceCalculation,
  useCartStats
} from './usePriceCalculation'

// Constantes y helpers para uso externo si es necesario
export { CART_CONFIG } from './cartStore.constants'
