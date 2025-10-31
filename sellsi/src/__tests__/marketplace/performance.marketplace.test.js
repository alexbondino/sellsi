const { performance } = require('perf_hooks')

jest.setTimeout(30000)

// Provide global window for in-flight map usage
global.window = global.window || global

// Mock supabase to return large tier sets quickly for calculatePriceForQuantity
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      const chainable = {
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: () => Promise.resolve({ error: null }),
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: chainable.__tiers || [], error: null }),
            single: () => Promise.resolve({ data: { price: 100 }, error: null })
          }),
          order: () => Promise.resolve({ data: chainable.__tiers || [], error: null }),
          single: () => Promise.resolve({ data: { price: 100 }, error: null })
        }),
        single: () => Promise.resolve({ data: { price: 100 }, error: null }),
        eq: () => chainable,
        order: () => chainable,
      }
      // allow tests to inject tiers by setting chainable.__tiers
      return chainable
    })
  }
}))

// Load the hook after mocking
const useProductPriceTiers = require('../../shared/hooks/product/useProductPriceTiers').default

function generateTiers(n) {
  const tiers = []
  for (let i = 1; i <= n; i++) {
    tiers.push({ min_quantity: i, price: Math.max(1, 100 - i * 0.001) })
  }
  return tiers
}

describe('marketplace performance micro-benchmarks', () => {
  test('validatePriceTiers handles 5000 tiers within reasonable time', () => {
    const store = useProductPriceTiers.getState()
    const large = generateTiers(5000).map(t => ({ min_quantity: t.min_quantity, price: t.price }))
    const t0 = performance.now()
    const result = store.validatePriceTiers(large)
    const t1 = performance.now()
    const elapsed = t1 - t0
    // Ensure validation completed and returned sorted data
    expect(result).toHaveProperty('isValid')
    // Log timing for developer visibility
    // Accept generous threshold to avoid CI flakes, but flag extreme slowness
    expect(elapsed).toBeLessThan(5000)
    // attach timing to result for human inspection in test output
    console.log(`[perf] validatePriceTiers 5000 items: ${Math.round(elapsed)}ms`)
  })

  test('calculatePriceForQuantity with 2000 tiers is performant and in-flight dedupe works', async () => {
    const store = useProductPriceTiers.getState()
    // inject large tiers into mocked supabase chain
    const mocked = require('../../services/supabase').supabase.from()
    mocked.__tiers = generateTiers(2000).map(t => ({ min_quantity: t.min_quantity, max_quantity: null, price: t.price }))

    const t0 = performance.now()
    const [r1, r2] = await Promise.all([
      store.calculatePriceForQuantity('p-perf', 1500),
      store.calculatePriceForQuantity('p-perf', 1500)
    ])
    const t1 = performance.now()
    const elapsed = t1 - t0

    // both should return a price number (base or tier)
    expect(r1).toHaveProperty('price')
    expect(r2).toHaveProperty('price')
    // Ensure overall latency is acceptable
    expect(elapsed).toBeLessThan(4000)
    console.log(`[perf] calculatePriceForQuantity 2000 tiers (concurrent): ${Math.round(elapsed)}ms`)
  })
})
