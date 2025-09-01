Shipping hooks
===============

Status: brief note about shipping hooks and a recent cleanup.

What changed
------------
- Removed compatibility wrapper: `src/domains/buyer/pages/cart/hooks/useOptimizedShippingValidation.new.js`.
- The unified implementation to use is: `src/shared/hooks/shipping/useUnifiedShippingValidation.js`.

Why
---
We consolidated shipping validation logic into a single shared hook (`useUnifiedShippingValidation`) that:
- Encapsulates validation logic (pure functions) and a shared, memoized cache (LRU + TTL).
- Exposes utilities for forced refresh and selective invalidation:
  - `validateProductWithCache(product, { forceRefresh })`
  - `validateProductsBatch(products, { forceRefresh })`
  - `clearGlobalShippingCache()`
  - `invalidateGlobalCache(productId, region?)`

What to do if you were using the old wrapper
-------------------------------------------
- Replace imports of the old wrapper with:
  ```js
  import useUnifiedShippingValidation, { SHIPPING_STATES } from 'src/shared/hooks/shipping/useUnifiedShippingValidation'
  ```
- If you relied on any wrapper-specific behavior, verify it is still provided by the unified hook. The wrapper was a thin delegate and has been removed to reduce duplication.

Tests run
---------
- A lightweight flow test (`PaymentMethod.flow.test.jsx`) was executed after the removal and passed.

Notes
-----
- If you need the previous API surface preserved for backwards-compatibility, consider adding a thin adapter re-export in a central compatibility file (but prefer direct use of the unified hook).
- For large component tests (checkout with many MUI icons), prefer flow tests or aggressive mocking to avoid environment file descriptor issues.

Contact
-------
If you want me to open a PR for this change or revert the deletion, tell me and I will prepare the PR.
