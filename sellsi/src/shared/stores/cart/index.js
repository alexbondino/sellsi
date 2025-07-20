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
export { default as useWishlist } from './useWishlist'
export { default as useCoupons } from './useCoupons'
export { default as useShipping } from './useShipping'

// Constantes y helpers para uso externo si es necesario
export { CART_CONFIG } from './cartStore.constants'
