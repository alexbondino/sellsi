/* Tests robustos para productSpecificationsService */
const { create } = require('zustand') // solo para evitar lint cuando se ejecuta en entornos distintos

describe('productSpecificationsService - robust behavior', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('getProductSpecifications returns [] when supabase returns error', async () => {
    // preparar mock del cliente supabase que devuelve error
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      single: jest.fn(() => Promise.resolve({ data: null, error: new Error('db error') })),
    };

    const supabase = { from: jest.fn(() => chain) };
    jest.doMock('../../services/supabase', () => ({ supabase }));

    const specs = require('../../workspaces/marketplace/services/productSpecificationsService');

    const result = await specs.getProductSpecifications('p-x');
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  test('updateProductSpecifications returns false when supabase.update produces error', async () => {
    const chainUpdate = {
      update: jest.fn(() => chainUpdate),
      eq: jest.fn(() => Promise.resolve({ error: new Error('update failed') })),
    };

    const supabase = { from: jest.fn(() => chainUpdate) };
    jest.doMock('../../services/supabase', () => ({ supabase }));

    const specs = require('../../workspaces/marketplace/services/productSpecificationsService');

    const ok = await specs.updateProductSpecifications('p-x', [{ key: 'k', value: 'v' }]);
    expect(ok).toBe(false);
  });

  test('concurrent update calls complete and do not throw (race stress)', async () => {
    // Simular supabase.update que tarda un poco y registra llamadas
    let calls = [];
    const chainUpdate = {
      update: jest.fn(() => chainUpdate),
      eq: jest.fn((field, val) => {
        // devolver una promesa que resuelve después de un timeout corto y registra el payload
        return new Promise((res) => setTimeout(() => { calls.push(val); res({ error: null }); }, 30));
      }),
    };

    const supabase = { from: jest.fn(() => chainUpdate) };
    jest.doMock('../../services/supabase', () => ({ supabase }));

    const specs = require('../../workspaces/marketplace/services/productSpecificationsService');

    const p1 = specs.updateProductSpecifications('p-race', [{ key: 'a', value: '1' }]);
    const p2 = specs.updateProductSpecifications('p-race', [{ key: 'b', value: '2' }]);

    await Promise.all([p1, p2]);

    // Ambas llamadas llegaron al supabase eq (por productid)
    expect(calls.length).toBe(2);
    // No deberían lanzar (ambos retornan boolean)
    // Los valores de calls son los productId pasados a eq, aquí 'p-race' dos veces
    expect(calls.every(c => c === 'p-race')).toBe(true);
  }, 10000);
});
