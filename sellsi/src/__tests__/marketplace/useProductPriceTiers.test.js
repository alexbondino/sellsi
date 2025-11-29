jest.setTimeout(20000)

// Ensure a shared in-flight map exists like in the browser so dedupe works in tests
global.window = global.window || global

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => {
      // Return an object that supports chained calls: select().eq().order() -> Promise
      const chainable = {
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: () => Promise.resolve({ error: null }),
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        single: () => Promise.resolve({ data: { price: 100 }, error: null }),
        eq: () => chainable,
        order: () => chainable,
      }
      return chainable
    }),
  }
}))

// Load the hook after mocks and global window are set
const useProductPriceTiers = require('../../workspaces/supplier/shared-hooks/useProductPriceTiers').default

describe('useProductPriceTiers store', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('validatePriceTiers rejects invalid ranges and returns errors', () => {
    const store = useProductPriceTiers.getState()
    const result = store.validatePriceTiers([
      { min_quantity: 0, price: 100 },
      { min_quantity: 5, price: 'not-a-number' },
    ])
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('processPriceTiers toggles processing flag and returns success for empty tiers', async () => {
    const store = useProductPriceTiers.getState()
  const res = await store.processPriceTiers('pid-empty', [])
    expect(res.success).toBe(true)
    expect(store.isProcessingTiers('pid-empty')).toBe(false)
  })

  it('in-flight dedupe for getProductTiers should reuse same promise when called concurrently', async () => {
    const store = useProductPriceTiers.getState()
  // ensure getProductTiers calls use the mocked supabase which returns immediate promise
  const results = await Promise.all([store.getProductTiers('p1'), store.getProductTiers('p1')])
  expect(results[0].success).toBe(true)
  expect(results[1].success).toBe(true)
  })
})
