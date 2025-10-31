import useProductSpecifications from '@/domains/supplier/hooks/specifications/useProductSpecifications'

describe('useProductSpecifications hook - robustness and race tests', () => {
  beforeEach(() => {
    // reset the zustand store between tests to avoid state leakage
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('validateSpecifications removes invalid entries and reports errors', () => {
    const hook = require('@/domains/supplier/hooks/specifications/useProductSpecifications').default;
    const input = [
      { nombre: '', valor: 'v' },
      { nombre: 'Good', valor: '' },
      { nombre: 'Naughty💥', valor: '1' },
      { nombre: 'Ok', valor: 'Val' }
    ];

    const res = hook.getState().validateSpecifications(input);
    expect(res.isValid).toBe(false);
    expect(Array.isArray(res.errors)).toBe(true);
    // validated data only includes the last valid spec
    expect(res.data.length).toBeGreaterThanOrEqual(1);
  });

  test('bulkValidateAndClean eliminates duplicates and reports duplicatesRemoved', () => {
    const hook = require('@/domains/supplier/hooks/specifications/useProductSpecifications').default;
    const input = [
      { nombre: 'A', valor: '1' },
      { nombre: 'a', valor: '1' },
      { nombre: 'B', valor: '2' },
    ];

    const res = hook.getState().bulkValidateAndClean(input);
    expect(res.duplicatesRemoved).toBeGreaterThanOrEqual(1);
    expect(res.data.length).toBe(2);
  });

  test('processProductSpecifications sets processing flag and clears it after completion (race safety)', async () => {
    // Mock updateProductSpecifications to delay
    jest.doMock('@/services/marketplace', () => ({ updateProductSpecifications: jest.fn(() => new Promise(res => setTimeout(() => res(true), 40))) }));
    const hook = require('@/domains/supplier/hooks/specifications/useProductSpecifications').default;

    const p1 = hook.getState().processProductSpecifications('p-1', [{ nombre: 'X', valor: '1' }]);
    // Immediately check processing flag
    expect(hook.getState().isProcessingSpecs('p-1')).toBe(true);

    await p1;
    // After completion flag must be false
    expect(hook.getState().isProcessingSpecs('p-1')).toBe(false);
  }, 10000);

  test('concurrent process calls for same product serialize processing flag correctly', async () => {
    jest.doMock('@/services/marketplace', () => ({ updateProductSpecifications: jest.fn(() => new Promise(res => setTimeout(() => res(true), 30))) }));
    const hook = require('@/domains/supplier/hooks/specifications/useProductSpecifications').default;

    const p1 = hook.getState().processProductSpecifications('p-2', [{ nombre: 'X', valor: '1' }]);
    const p2 = hook.getState().processProductSpecifications('p-2', [{ nombre: 'Y', valor: '2' }]);

    // While any is in flight, the flag should be true
    expect(hook.getState().isProcessingSpecs('p-2')).toBe(true);

    await Promise.all([p1, p2]);
    expect(hook.getState().isProcessingSpecs('p-2')).toBe(false);
  }, 15000);
});
