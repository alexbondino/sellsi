jest.setTimeout(20000)

// Minimal supabase 'from' spy used by tests; individual tests configure behavior (no globals)
const mockSupabaseFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: { from: (...args) => mockSupabaseFrom(...args) },
}));

const createDeferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules(); // ensure cartService module state (in-flight map) is reset per test
});

describe('cartService.fetchCartById in-flight dedupe', () => {
  it('reuses the same DB call for concurrent callers and calls supabase.from only once', async () => {
    const { cartService } = require('../../services/user/cartService');
    const id = '125d1517-55b9-4a5e-8ddb-118459281956';

    // Controlled pending DB result
    const deferred = createDeferred();
    const chain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(() => deferred.promise),
      single: jest.fn(() => deferred.promise),
    };
    mockSupabaseFrom.mockReturnValue(chain);

    const callers = 8;
    const promises = [];
    for (let i = 0; i < callers; i++) {
      promises.push(cartService.fetchCartById(id));
    }

    // Ensure DB was invoked only once while pending
    expect(mockSupabaseFrom).toHaveBeenCalledTimes(1);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('carts');

    // Resolve DB
    deferred.resolve({ data: { cart_id: id, status: 'active' }, error: null });

    const results = await Promise.all(promises);

    for (const r of results) {
      expect(r).toHaveProperty('data');
      expect(r.data).toHaveProperty('cart_id', id);
    }
  });

  it('separates calls for different cartIds (no dedupe across ids)', async () => {
    const { cartService } = require('../../services/user/cartService');
    const idA = 'id-A';
    const idB = 'id-B';

    const d1 = createDeferred();
    const d2 = createDeferred();

    mockSupabaseFrom.mockImplementation(() => ({
      select: () => ({
        eq: (col, val) => ({
          maybeSingle: () => (val === idA ? d1.promise : d2.promise),
          single: () => (val === idA ? d1.promise : d2.promise),
        }),
      }),
    }));

    const p1 = cartService.fetchCartById(idA);
    const p2 = cartService.fetchCartById(idB);

    // Two DB calls registered (one per distinct id)
    expect(mockSupabaseFrom).toHaveBeenCalledTimes(2);

    d1.resolve({ data: { cart_id: idA }, error: null });
    d2.resolve({ data: { cart_id: idB }, error: null });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.data).toHaveProperty('cart_id', idA);
    expect(r2.data).toHaveProperty('cart_id', idB);
  });

  it('propagates errors as { data: null, error } when DB fails', async () => {
    const { cartService } = require('../../services/user/cartService');
    const id = 'id-error';

    const deferred = createDeferred();
    mockSupabaseFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () => deferred.promise, single: () => deferred.promise }) }) });

    const p = cartService.fetchCartById(id);

    const err = new Error('boom');
    deferred.reject(err);

    const res = await p;
    expect(res).toHaveProperty('data', null);
    expect(res).toHaveProperty('error');
    expect(res.error).toBe(err);
  });

  it('allows subsequent calls after resolution (no sticky cache)', async () => {
    const { cartService } = require('../../services/user/cartService');
    const id = 'id-refetch';

    // First round
    mockSupabaseFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { cart_id: id, seq: 1 } }) }) }) });
    const r1 = await cartService.fetchCartById(id);
    expect(r1.data).toHaveProperty('seq', 1);
    expect(mockSupabaseFrom).toHaveBeenCalledTimes(1);

    // Second round: ensure a new fetch happens
    mockSupabaseFrom.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { cart_id: id, seq: 2 } }) }) }) });
    const r2 = await cartService.fetchCartById(id);
    expect(r2.data).toHaveProperty('seq', 2);
    expect(mockSupabaseFrom).toHaveBeenCalledTimes(2);
  });
});
