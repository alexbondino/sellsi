import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { vi, expect, it, describe } from 'vitest';

// Spy on the real module that provides user region so the hook under test receives our mock
import * as regionHook from '../../../../hooks/useOptimizedUserShippingRegion';
vi.spyOn(regionHook, 'useOptimizedUserShippingRegion').mockImplementation(() => ({ userRegion: 'metropolitana', isLoadingUserShippingRegion: false, isLoadingUserRegion: false }));

import useUnifiedShippingValidation, { SHIPPING_STATES } from '../useUnifiedShippingValidation';

// Test harness: monta el hook y devuelve el objeto del hook via callback
function TestHarness({ onReady, cartItems = [] }) {
  const hook = useUnifiedShippingValidation(cartItems, true);
  useEffect(() => {
    if (onReady) onReady(hook);
  }, [hook, onReady]);
  return null;
}

describe('useUnifiedShippingValidation (unit)', () => {
  it('validateProductShipping -> COMPATIBLE when region matches', async () => {
    let hookRef = null;
    await act(async () => {
      render(<TestHarness onReady={(h) => (hookRef = h)} />);
    });

    const product = {
      id: 'p-1',
      name: 'Producto A',
      shippingRegions: [{ region: 'metropolitana', price: 1500, delivery_days: 3 }]
    };

    const res = hookRef.validateProductShipping(product, 'metropolitana');
    expect(res).toBeTruthy();
    expect(res.state).toBe(SHIPPING_STATES.COMPATIBLE);
    expect(res.canShip).toBe(true);
    expect(res.shippingInfo).toBeDefined();
  });

  it('validateProductShipping -> INCOMPATIBLE_REGION when region not present', async () => {
    let hookRef = null;
    await act(async () => {
      render(<TestHarness onReady={(h) => (hookRef = h)} />);
    });

    const product = {
      id: 'p-2',
      name: 'Producto B',
      shippingRegions: [{ region: 'valparaiso', price: 900, delivery_days: 5 }]
    };

    const res = hookRef.validateProductShipping(product, 'metropolitana');
    expect(res.state).toBe(SHIPPING_STATES.INCOMPATIBLE_REGION);
    expect(res.canShip).toBe(false);
    expect(Array.isArray(res.availableRegions)).toBe(true);
  });

  it('cache behavior: validateProductWithCache, invalidateGlobalCache and cacheStats', async () => {
    let hookRef = null;
    await act(async () => {
      render(<TestHarness onReady={(h) => (hookRef = h)} />);
    });

    const product = {
      id: 'p-cache-1',
      name: 'Cached product',
      shippingRegions: [{ region: 'metropolitana', price: 500, delivery_days: 2 }]
    };

  // set cache via validateProductWithCache
  const v1 = hookRef.validateProductWithCache(product);
  expect(v1.state).toBe(SHIPPING_STATES.COMPATIBLE);

  // second call should hit the cache and return the same shape/result
  const v2 = hookRef.validateProductWithCache(product);
  expect(v2.state).toBe(SHIPPING_STATES.COMPATIBLE);

  // invalidate specific product
  hookRef.invalidateGlobalCache(product.id);

  // after invalidation, a new validation should be computed (object may differ)
  const v3 = hookRef.validateProductWithCache(product);
  expect(v3.state).toBe(SHIPPING_STATES.COMPATIBLE);
  });
});
