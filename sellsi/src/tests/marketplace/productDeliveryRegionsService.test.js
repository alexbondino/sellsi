/* Tests robustos para productDeliveryRegionsService */

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r });
  return { promise, resolve };
}

describe('productDeliveryRegionsService - robustness', () => {
  let mockSupabase;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        delete: jest.fn(() => ({ eq: jest.fn().mockResolvedValue({ error: null }) })),
        insert: jest.fn().mockResolvedValue({ error: null }),
      }))
    };

    jest.doMock('../../services/supabase', () => ({ supabase: mockSupabase }));
  });

  test('fetchProductRegions throws if supabase returns error', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: new Error('db fail') })
    }));

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(svc.fetchProductRegions('p-1')).rejects.toThrow('db fail');
  });

  test('fetchProductRegions returns data on success', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [{ id: '1', region: 'R', price: 10, delivery_days: 2 }], error: null })
    }));

    const { fetchProductRegions } = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(fetchProductRegions('p-1')).resolves.toEqual([{ id: '1', region: 'R', price: 10, delivery_days: 2 }]);
  });

  test('fetchProductRegions returns empty array when data is null and no error', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: null })
    }));

    const { fetchProductRegions } = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(fetchProductRegions('p-1')).resolves.toEqual([]);
  });

  test('saveProductRegions handles invalid numeric fields and large payloads efficiently', async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: null }));
    mockSupabase.from.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      insert: insertMock,
    });

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');

    const bigPayload = Array.from({ length: 500 }, (_, i) => ({ region: `R${i}`, price: i % 7 === 0 ? 'NaN' : `${i}`, delivery_days: i % 5 === 0 ? null : `${i % 10}` }));

    await expect(svc.saveProductRegions('p-large', bigPayload)).resolves.toBeUndefined();
    expect(insertMock).toHaveBeenCalled();
  }, 20000);

  test('saveProductRegions throws if delete fails', async () => {
    mockSupabase.from.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('del fail') }) }),
      insert: jest.fn()
    });

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(svc.saveProductRegions('p', [{ region: 'R', price: 1, delivery_days: 1 }])).rejects.toThrow('del fail');
  });

  test('saveProductRegions throws if insert fails', async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: new Error('ins fail') }));
    mockSupabase.from.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      insert: insertMock
    });

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(svc.saveProductRegions('p', [{ region: 'R', price: 1, delivery_days: 1 }])).rejects.toThrow('ins fail');
  });

  test('saveProductRegions sanitizes numeric fields before insert and sends structured array', async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: null }));
    mockSupabase.from.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      insert: insertMock
    });

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    const payload = [
      { region: 'r1', price: 'NaN', delivery_days: null },
      { region: 'r2', price: '5', delivery_days: '3' },
    ];

    await expect(svc.saveProductRegions('p-sanitize', payload)).resolves.toBeUndefined();
    expect(insertMock).toHaveBeenCalledTimes(1);

    const inserted = insertMock.mock.calls[0][0];
    expect(Array.isArray(inserted)).toBe(true);
    expect(inserted).toHaveLength(2);

    expect(inserted).toEqual(expect.arrayContaining([
      expect.objectContaining({ product_id: 'p-sanitize', region: 'r1', price: 0, delivery_days: 0 }),
      expect.objectContaining({ product_id: 'p-sanitize', region: 'r2', price: 5, delivery_days: 3 }),
    ]));
  });

  test('saveProductRegions converts floats and negatives correctly', async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: null }));
    mockSupabase.from.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      insert: insertMock
    });

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    const payload = [ { region: 'rF', price: '-5.5', delivery_days: '2.1' } ];

    await expect(svc.saveProductRegions('p-float', payload)).resolves.toBeUndefined();
    const inserted = insertMock.mock.calls[0][0];
    expect(inserted[0].price).toBeCloseTo(-5.5);
    expect(inserted[0].delivery_days).toBeCloseTo(2.1);
  });

  test('saveProductRegions handles empty payload by inserting empty array', async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: null }));
    mockSupabase.from.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      insert: insertMock
    });

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(svc.saveProductRegions('p-empty', [])).resolves.toBeUndefined();
    expect(insertMock).toHaveBeenCalledWith([]);
  });

  test('saveProductRegions tolerates missing region field and still inserts valid shape', async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: null }));
    mockSupabase.from.mockReturnValue({
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
      insert: insertMock
    });

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(svc.saveProductRegions('p-missing', [{ price: '10' }])).resolves.toBeUndefined();
    const inserted = insertMock.mock.calls[0][0];
    expect(inserted[0]).toMatchObject({ product_id: 'p-missing', price: 10 });
    expect(Object.prototype.hasOwnProperty.call(inserted[0], 'region')).toBe(true);
  });

  test('Concurrent saves: delete must resolve before insert for each product (deterministic)', async () => {
    const deferreds = {};
    const ops = [];

    mockSupabase.from.mockImplementation(() => ({
      delete: () => ({
        eq: (col, productId) => {
          ops.push(`DELETE_CALLED_${productId}`);
          deferreds[productId] = deferred();
          return deferreds[productId].promise.then(() => {
            ops.push(`DELETE_RESOLVED_${productId}`);
            return { error: null };
          });
        }
      }),
      insert: (data) => {
        const id = data[0] && data[0].product_id;
        ops.push(`INSERT_CALLED_${id}`);
        return Promise.resolve({ error: null });
      }
    }));

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');

    const p1 = svc.saveProductRegions('PROD_A', [{ region: 'R1', price: 10 }]);
    const p2 = svc.saveProductRegions('PROD_B', [{ region: 'R2', price: 20 }]);

    // give the delete() calls a chance to be invoked
    await Promise.resolve();

    expect(ops).toContain('DELETE_CALLED_PROD_A');
    expect(ops).toContain('DELETE_CALLED_PROD_B');
    expect(ops).not.toContain('INSERT_CALLED_PROD_A');
    expect(ops).not.toContain('INSERT_CALLED_PROD_B');

    // resolve B first -> should cause insert for B
    deferreds['PROD_B'].resolve();
    // wait a macrotask so the insert scheduled after delete's resolution runs
    await new Promise(r => process.nextTick(r));
    expect(ops).toContain('DELETE_RESOLVED_PROD_B');
    expect(ops).toContain('INSERT_CALLED_PROD_B');
    expect(ops).not.toContain('INSERT_CALLED_PROD_A');

    // then resolve A
    deferreds['PROD_A'].resolve();
    await new Promise(r => process.nextTick(r));

    await Promise.all([p1, p2]);

    expect(ops.indexOf('DELETE_RESOLVED_PROD_A')).toBeLessThan(ops.indexOf('INSERT_CALLED_PROD_A'));
    expect(ops.indexOf('DELETE_RESOLVED_PROD_B')).toBeLessThan(ops.indexOf('INSERT_CALLED_PROD_B'));
  }, 20000);
});
