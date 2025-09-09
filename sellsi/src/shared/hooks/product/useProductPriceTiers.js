/**
 * ============================================================================
 * USE PRODUCT PRICE TIERS HOOK - HOOK COMPARTIDO PARA TRAMOS DE PRECIOS
 * ============================================================================
 * 
 * Hook migrado desde domains/marketplace para uso compartido.
 * Evita cross-imports de shared components hacia domains específicos.
 */

// DEPRECATED: This hook is replaced by centralized deferred batching in useProducts.
// It now returns an empty stable structure to avoid accidental network calls.
// Remove remaining imports gradually. If you need tiers, rely on product.priceTiers
// and product.tiersStatus provided by the marketplace state.

export function useProductPriceTiers() {
  if (import.meta.env.DEV) {
    try { console.warn('[useProductPriceTiers] Deprecated hook called. Use centralized product.priceTiers instead.') } catch (_) {}
  }
  return { tiers: [], loading: false, error: null }
}

export const invalidateProductPriceTiers = () => { /* no-op deprecated */ }

export default useProductPriceTiers
