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
const { createFromMock } = require('../utils/supabaseMock')
const { loadPriceTiersStore } = require('../utils/storeLoader')

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

  // --- Additional tests recommended ---
  it('validatePriceTiers accepts valid ranges and sorts them', () => {
    const store = useProductPriceTiers.getState()
    const input = [
      { min_quantity: 10, max_quantity: 49, price: 90 },
      { min_quantity: 1, max_quantity: 9, price: 100 },
    ]
    const res = store.validatePriceTiers(input)
    expect(res.isValid).toBe(true)
    expect(res.data).toHaveLength(2)
    // Should be sorted by min ascending
    expect(res.data[0].min).toBe(1)
    expect(res.data[1].min).toBe(10)
  })

  it('processPriceTiers inserts tiers successfully and toggles processing flag', async () => {
    jest.resetModules()
    const insertMock = jest.fn(() => Promise.resolve({ error: null }))
    const deleteMock = jest.fn(() => Promise.resolve({ error: null }))

    // Apply centralized supabase mock
    const { fromMock } = createFromMock({
      product_quantity_ranges: { delete: () => ({ eq: () => deleteMock() }), insert: insertMock },
      products: { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { price: 50 }, error: null }) }) }) }
    })

    const store = loadPriceTiersStore()

    const tiers = [ { min_quantity: 1, max_quantity: 9, price: 100 } ]
    const p = store.processPriceTiers('pid-success', tiers)
    // while in-flight, flag must be true
    expect(store.isProcessingTiers('pid-success')).toBe(true)
    const res = await p
    expect(res.success).toBe(true)
    expect(insertMock).toHaveBeenCalled()
    expect(store.isProcessingTiers('pid-success')).toBe(false)
  })

  it('processPriceTiers handles insert errors and sets error state', async () => {
    jest.resetModules()
    const insertMock = jest.fn(() => Promise.resolve({ error: new Error('ins fail') }))
    const deleteMock = jest.fn(() => Promise.resolve({ error: null }))

    // Apply centralized supabase mock that fails inserts
    const { fromMock } = createFromMock({
      product_quantity_ranges: { delete: () => ({ eq: () => deleteMock() }), insert: insertMock },
      products: { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { price: 50 }, error: null }) }) }) }
    })

    const store = loadPriceTiersStore()

    const tiers = [ { min_quantity: 1, max_quantity: 9, price: 100 } ]
    const res = await store.processPriceTiers('pid-fail', tiers)
    expect(res.success).toBe(false)
    expect(store.isProcessingTiers('pid-fail')).toBe(false)
    // read fresh state after operation
    const fresh = loadPriceTiersStore()
    expect(fresh.error).toMatch(/ins fail|Error procesando tramos/)
  })

  it('getProductTiers dedupes concurrent requests and calls DB only once', async () => {
    jest.resetModules()
    // deferred promise
    let resolve
    const p = new Promise(r => { resolve = r })
    const orderMock = jest.fn(() => p)
    const selectChain = { select: () => ({ eq: () => ({ order: orderMock }) }) }

    const { fromMock } = createFromMock({ product_quantity_ranges: selectChain })

    const store = loadPriceTiersStore()

    const p1 = store.getProductTiers('p-dedupe')
    const p2 = store.getProductTiers('p-dedupe')

    // resolve the DB promise
    resolve({ data: [{ min_quantity: 1, price: 100 }], error: null })
    const results = await Promise.all([p1, p2])

    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
    // supabase.from should be called once for the table
    expect(fromMock).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledWith('product_quantity_ranges')
  })

  it('calculatePriceForQuantity chooses correct tier and falls back to base price when no tiers', async () => {
    jest.resetModules()
    // first case: tiers exist
    const tiers = [{ min_quantity: 1, max_quantity: 5, price: 10 }, { min_quantity: 6, max_quantity: null, price: 8 }]
    const orderMock = jest.fn(() => Promise.resolve({ data: tiers, error: null }))
    const selectChain = { select: () => ({ eq: () => ({ order: orderMock }) }) }

    // also need products single for fallback
    const productSelectChain = { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { price: 123 }, error: null }) }) }) }

    createFromMock({ product_quantity_ranges: selectChain, products: productSelectChain })

    const store = loadPriceTiersStore()

    const r1 = await store.calculatePriceForQuantity('p1', 2)
    expect(r1.price).toBe(10)
    expect(r1.tierUsed).toBeTruthy()

    // second case: no tiers -> fallback to product price
    jest.resetModules()
    const selectEmpty = { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) }
    const prodSingle = { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { price: 555 }, error: null }) }) }) }

    createFromMock({ product_quantity_ranges: selectEmpty, products: prodSingle })

    const store2 = loadPriceTiersStore()

    const r2 = await store2.calculatePriceForQuantity('p2', 3)
    expect(r2.price).toBe(555)
    expect(r2.isBasePriceApplied).toBe(true)
  })

})
