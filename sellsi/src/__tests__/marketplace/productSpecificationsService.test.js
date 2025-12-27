/* Tests robustos para productSpecificationsService */

function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r });
  return { promise, resolve };
}

describe('productSpecificationsService - robust behavior', () => {
  let mockSupabase;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        update: jest.fn().mockReturnThis(),
      }))
    };

    jest.doMock('../../services/supabase', () => ({ supabase: mockSupabase }));
  });

  test('getProductSpecifications returns [] when supabase.single returns error', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: new Error('db error') })
    }));

    const specs = require('../../workspaces/marketplace/services/productSpecificationsService');
    const result = await specs.getProductSpecifications('p-x');
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  test('getProductSpecifications returns spec array on success', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { spec_name: 'Color', spec_value: 'Red' }, error: null })
    }));

    const { getProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');
    const res = await getProductSpecifications('p-ok');
    expect(res).toEqual([{ spec_name: 'Color', spec_value: 'Red', product_id: 'p-ok' }]);
  });

  test('getProductSpecifications returns [] for N/A or missing specs', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: { spec_name: 'N/A', spec_value: 'N/A' }, error: null }),
      single: jest.fn().mockResolvedValue({ data: { spec_name: 'N/A', spec_value: 'N/A' }, error: null })
    }));

    const { getProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');
    const res = await getProductSpecifications('p-na');
    expect(res).toEqual([]);
  });

  test('getProductSpecifications handles thrown errors by returning []', async () => {
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.reject(new Error('boom')))
    }));

    const { getProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');
    const res = await getProductSpecifications('p-throw');
    expect(res).toEqual([]);
  });

  test('updateProductSpecifications returns false when update fails', async () => {
    mockSupabase.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn(() => Promise.resolve({ error: new Error('update failed') }))
    });

    const { updateProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');
    const ok = await updateProductSpecifications('p-x', [{ key: 'k', value: 'v' }]);
    expect(ok).toBe(false);
  });

  test('updateProductSpecifications returns true on success and sends correct payload', async () => {
    const updateSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn(() => Promise.resolve({ error: null }));

    mockSupabase.from.mockReturnValue({ update: updateSpy, eq: eqSpy });

    const { updateProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');

    const ok = await updateProductSpecifications('p-ok', [{ key: 'Size', value: 'M' }]);
    expect(ok).toBe(true);

    // payload verification
    expect(updateSpy).toHaveBeenCalled();
    const payloadArg = updateSpy.mock.calls[0][0];
    expect(payloadArg).toMatchObject({ spec_name: 'Size', spec_value: 'M' });
    expect(typeof payloadArg.updateddt).toBe('string');

    // eq called with productid
    expect(eqSpy).toHaveBeenCalledWith('productid', 'p-ok');
  });

  test('updateProductSpecifications clears when given empty or invalid specs', async () => {
    const updateSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn(() => Promise.resolve({ error: null }));

    mockSupabase.from.mockReturnValue({ update: updateSpy, eq: eqSpy });

    const { updateProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');

    const ok1 = await updateProductSpecifications('p-empty', []);
    expect(ok1).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ spec_name: 'N/A', spec_value: 'N/A' }));

    const ok2 = await updateProductSpecifications('p-invalid', [{ key: '', value: null }]);
    expect(ok2).toBe(true);
  });

  test('updateProductSpecifications uses first valid spec only', async () => {
    const updateSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn(() => Promise.resolve({ error: null }));

    mockSupabase.from.mockReturnValue({ update: updateSpy, eq: eqSpy });

    const { updateProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');
    const ok = await updateProductSpecifications('p-multi', [ { key: '', value: null }, { key: 'K1', value: 'V1' }, { key: 'K2', value: 'V2' } ]);
    expect(ok).toBe(true);

    const payloadArg = updateSpy.mock.calls[0][0];
    expect(payloadArg.spec_name).toBe('K1');
    expect(payloadArg.spec_value).toBe('V1');
  });

  test('deleteProductSpecifications (clear) returns false on update error and true on success', async () => {
    const updateSpy = jest.fn().mockReturnThis();
    const eqFail = jest.fn(() => Promise.resolve({ error: new Error('fail') }));
    mockSupabase.from.mockReturnValueOnce({ update: updateSpy, eq: eqFail });

    const { deleteProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');
    const resFail = await deleteProductSpecifications('p-fail');
    expect(resFail).toBe(false);

    // now success
    const eqOk = jest.fn(() => Promise.resolve({ error: null }));
    mockSupabase.from.mockReturnValueOnce({ update: updateSpy, eq: eqOk });
    const resOk = await deleteProductSpecifications('p-ok');
    expect(resOk).toBe(true);

    // verify payload used to clear
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ spec_name: 'N/A', spec_value: 'N/A' }));
  });

  test('concurrent update calls are deterministic using deferreds', async () => {
    const deferreds = {};
    const ops = [];

    mockSupabase.from.mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      eq: (field, pid) => {
        ops.push(`EQ_CALLED_${pid}`);
        deferreds[pid] = deferreds[pid] || [];
        const d = deferred();
        deferreds[pid].push(d);
        return d.promise.then(() => ({ error: null }));
      }
    }));

    const { updateProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');

    const p1 = updateProductSpecifications('PX', [{ key: 'A', value: '1' }]);
    const p2 = updateProductSpecifications('PX', [{ key: 'B', value: '2' }]);

    // let eq calls be registered
    await Promise.resolve();
    expect(ops).toEqual(expect.arrayContaining(['EQ_CALLED_PX', 'EQ_CALLED_PX']));

    // resolve all pending deferreds for PX
    deferreds['PX'].forEach(d => d.resolve());

    await Promise.all([p1, p2]);

    // both completed without throwing
    expect(true).toBe(true);
  }, 20000);

  test('concurrent same-product updates record payloads and applied order', async () => {
    const updateCalls = [];
    const applied = [];
    const deferreds = [];

    mockSupabase.from.mockImplementation(() => ({
      update: (payload) => {
        const idx = updateCalls.push(payload) - 1;
        return {
          eq: (field, pid) => {
            const d = deferred();
            deferreds.push({ d, idx, pid });
            return d.promise.then(() => {
              applied.push(idx);
              return { error: null };
            });
          }
        };
      }
    }));

    const { updateProductSpecifications } = require('../../workspaces/marketplace/services/productSpecificationsService');

    // two concurrent updates for the same product
    const pA = updateProductSpecifications('PSAME', [{ key: 'A', value: '1' }]);
    const pB = updateProductSpecifications('PSAME', [{ key: 'B', value: '2' }]);

    // update() should have been called twice synchronously
    expect(updateCalls).toHaveLength(2);
    expect(updateCalls[0]).toEqual(expect.objectContaining({ spec_name: 'A', spec_value: '1' }));
    expect(updateCalls[1]).toEqual(expect.objectContaining({ spec_name: 'B', spec_value: '2' }));

    // resolve B first to simulate it being applied before A
    deferreds[1].d.resolve();
    await Promise.resolve();
    expect(applied).toEqual([1]);

    // now resolve A
    deferreds[0].d.resolve();
    await Promise.all([pA, pB]);

    // applied order should match resolution order
    expect(applied).toEqual([1, 0]);

    // payload timestamps exist and values are as expected
    expect(isFinite(Date.parse(updateCalls[0].updateddt))).toBe(true);
    expect(isFinite(Date.parse(updateCalls[1].updateddt))).toBe(true);
    expect(updateCalls[0].spec_value).toBe('1');
    expect(updateCalls[1].spec_value).toBe('2');
  });
});
