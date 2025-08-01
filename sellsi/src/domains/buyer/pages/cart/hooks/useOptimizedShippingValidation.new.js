/**
 * ============================================================================
 * COMPATIBILITY WRAPPER - CART SHIPPING VALIDATION
 * ============================================================================
 * 
 * Wrapper que mantiene compatibilidad con el hook específico del carrito
 * mientras usa internamente el nuevo hook unificado.
 */

import { useUnifiedShippingValidation } from '../../../../shared/hooks/shipping/useUnifiedShippingValidation';

/**
 * Hook de compatibilidad para el carrito
 * Mantiene la misma API que el hook original
 */
export const useOptimizedShippingValidation = (cartItems = [], isAdvancedMode = false) => {
  return useUnifiedShippingValidation(cartItems, isAdvancedMode);
};

// Exportar también los estados para compatibilidad
export { SHIPPING_STATES } from '../../../../shared/hooks/shipping/useUnifiedShippingValidation';

export default useOptimizedShippingValidation;
