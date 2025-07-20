/**
 * ============================================================================
 * CART STORE - COMPATIBILITY WRAPPER (DEPRECATED)
 * ============================================================================
 *
 * ⚠️  DEPRECATED: Este archivo solo mantiene compatibilidad hacia atrás.
 * 
 * 🚨 MIGRACIÓN COMPLETADA:
 * El cartStore se ha migrado a `shared/stores/cart/` según el plan de refactor.
 * 
 * 📋 NUEVO IMPORT:
 * import useCartStore from '../../../shared/stores/cart'
 * 
 * 🔄 TODO: Actualizar todos los imports a la nueva ubicación y eliminar este archivo
 */

// Re-export desde la nueva ubicación en shared/stores
export { default } from '../../../shared/stores/cart/cartStore'

// También disponible con import por named export
export { useCartStore } from '../../../shared/stores/cart'
