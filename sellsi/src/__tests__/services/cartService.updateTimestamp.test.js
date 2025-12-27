jest.setTimeout(20000)

// Use a controlled mock and fake timers to reliably test coalescing
const mockSupabaseFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: { from: (...args) => mockSupabaseFrom(...args) },
}))

const createDeferred = () => {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

// Helper to advance timers and flush microtasks/promises reliably
const advanceAndFlush = async (ms) => {
  jest.advanceTimersByTime(ms);
  // Ensure any promises queued by the timer callback are processed
  await new Promise((resolve) => {
    const setImmediateFn = jest.requireActual('timers').setImmediate;
    setImmediateFn(resolve);
  });
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.resetModules();
});

afterEach(() => {
  // Restore real timers to avoid affecting other tests
  jest.useRealTimers();
});

describe('cartService.updateCartTimestamp coalescing', () => {
  it('coalesces multiple quick calls into a single supabase update', async () => {
    const { cartService } = require('../../services/user/cartService');
    const CART_ID = 'coalesce-test-1'

    // capture payload used in update
    const updateSpy = jest.fn((payload) => ({ eq: () => Promise.resolve({ data: payload, error: null }) }));
    mockSupabaseFrom.mockReturnValue({ update: updateSpy });

    const callers = 6
    const promises = []
    for (let i = 0; i < callers; i++) {
      promises.push(cartService.updateCartTimestamp(CART_ID))
    }

    // ensure DB hasn't been called yet (still debouncing)
    expect(mockSupabaseFrom).not.toHaveBeenCalled();

    // advance timers past debounce window and flush microtasks
    await advanceAndFlush(200);

    const results = await Promise.all(promises)
    expect(results.length).toBe(callers)

    // supabase.from should be called only once due to coalescing window
    expect(mockSupabaseFrom).toHaveBeenCalledTimes(1)
    expect(mockSupabaseFrom).toHaveBeenCalledWith('carts')

    // ensure update payload contains updated_at
    expect(updateSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy.mock.calls[0][0]).toHaveProperty('updated_at')
  })

  it('makes separate updates when calls are outside coalescing window', async () => {
    const { cartService } = require('../../services/user/cartService');
    const CART_ID = 'coalesce-test-2'

    const updateSpy = jest.fn((payload) => ({ eq: () => Promise.resolve({ data: payload, error: null }) }));
    mockSupabaseFrom.mockReturnValue({ update: updateSpy });

    // First call
    const p1 = cartService.updateCartTimestamp(CART_ID)
    // ensure DB hasn't been called yet
    expect(mockSupabaseFrom).not.toHaveBeenCalled();
    await advanceAndFlush(200)
    await p1

    // Second call after window
    const p2 = cartService.updateCartTimestamp(CART_ID)
    expect(mockSupabaseFrom).toHaveBeenCalledTimes(1)
    await advanceAndFlush(200)
    await p2

    expect(mockSupabaseFrom).toHaveBeenCalledTimes(2)
    expect(updateSpy).toHaveBeenCalledTimes(2)
  })

  it('handles supabase errors gracefully', async () => {
    const { cartService } = require('../../services/user/cartService');
    const CART_ID = 'coalesce-test-err'

    mockSupabaseFrom.mockReturnValue({ update: () => ({ eq: () => Promise.reject(new Error('db')) }) });

    const p = cartService.updateCartTimestamp(CART_ID)
    await advanceAndFlush(200)

    const res = await p
    // the implementation returns { error } object in case of failure
    expect(res).toHaveProperty('error')
  })
})
