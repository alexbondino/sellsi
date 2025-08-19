// src/shared/hooks/index.js
// (Se eliminó re-export de useAppInitialization para evitar ciclo con páginas que usan este barrel)

// ✅ ROLE SYNCHRONIZATION HOOKS
export { useRoleSync, useCurrentRole } from './useRoleSync';

// ✅ MARKETPLACE HOOKS MIGRADOS
export { useMarketplaceLogic } from './marketplace/useMarketplaceLogic.js';

// ✅ PRODUCT HOOKS MIGRADOS
export { useProductPriceTiers } from './product/useProductPriceTiers.js';
