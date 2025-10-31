jest.setTimeout(20000)


// Mock supabase update path and count calls (inline factory for jest.mock)
jest.mock('../../services/supabase', () => {
  const fromFn = jest.fn((table) => ({
    update: (payload) => ({ eq: () => Promise.resolve({ data: payload, error: null }) })
  }))
  return { supabase: { from: fromFn } }
})

const { cartService } = require('../../services/user/cartService')

describe('cartService.updateCartTimestamp coalescing', () => {
  it('coalesces multiple quick calls into a single supabase update', async () => {
    const CART_ID = 'coalesce-test-1'
    const callers = 6
    const promises = []
    for (let i = 0; i < callers; i++) {
      promises.push(cartService.updateCartTimestamp(CART_ID))
    }

    const results = await Promise.all(promises)
    expect(results.length).toBe(callers)
    // supabase.from should be called only once due to coalescing window
    const supabase = require('../../services/supabase').supabase
    expect(supabase.from.mock.calls.length).toBe(1)
  })
})
