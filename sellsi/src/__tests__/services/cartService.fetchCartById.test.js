jest.setTimeout(20000)

// Mock supabase to simulate a delayed DB response and allow us to count calls
jest.mock('../../services/supabase', () => {
  const fromFn = jest.fn((table) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () => new Promise((resolve) => setTimeout(() => resolve({ data: { cart_id: '125d1517-55b9-4a5e-8ddb-118459281956', status: 'active' }, error: null }), 50))
      })
    })
  }))
  return { supabase: { from: fromFn } }
})

const { cartService } = require('../../services/user/cartService')

describe('cartService.fetchCartById in-flight dedupe', () => {
  it('reuses the same promise for concurrent callers and calls supabase.from only once', async () => {
    const callers = 8
    const promises = []
    for (let i = 0; i < callers; i++) {
      promises.push(cartService.fetchCartById('125d1517-55b9-4a5e-8ddb-118459281956'))
    }

    const results = await Promise.all(promises)

    // All results should have the same cart_id
    for (const r of results) {
      expect(r).toHaveProperty('data')
      expect(r.data).toHaveProperty('cart_id', '125d1517-55b9-4a5e-8ddb-118459281956')
    }

    // supabase.from should be called only once due to in-flight dedupe
    const supabase = require('../../services/supabase').supabase
    expect(supabase.from.mock.calls.length).toBe(1)
  })
})
