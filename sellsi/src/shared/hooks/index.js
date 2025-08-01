// src/shared/hooks/index.js
export { useAppInitialization } from './useAppInitialization';
export { useCountrySelector } from './useCountrySelector';

// ✅ ROLE SYNCHRONIZATION HOOKS
export { useRoleSync, useCurrentRole } from './useRoleSync';

// ✅ MARKETPLACE HOOKS MIGRADOS
export { useMarketplaceLogic } from './marketplace/useMarketplaceLogic.js';

// ✅ PRODUCT HOOKS MIGRADOS
export { useProductPriceTiers } from './product/useProductPriceTiers.js';
