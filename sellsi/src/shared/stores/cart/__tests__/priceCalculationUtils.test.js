import { describe, it, expect } from 'vitest'
import {
  sumSubtotal,
  sumQuantity,
  computeAdvancedShipping,
  computeShippingFromStore,
  finalizeTotals
} from '../priceCalculationUtils'

describe('priceCalculationUtils pure functions', () => {
  it('sumSubtotal sums numeric and string prices and respects quantity', () => {
    const items = [
      { id: 'a', price: 100, quantity: 2 },
      { id: 'b', price: '50', quantity: 1 },
      { id: 'c', price: 0, quantity: 5 }
    ]

    const subtotal = sumSubtotal(items)
    expect(subtotal).toBe(100 * 2 + 50 * 1 + 0 * 5)
  })

  it('sumQuantity sums quantities', () => {
    const items = [{ quantity: 2 }, { quantity: 3 }, { quantity: 0 }]
    expect(sumQuantity(items)).toBe(5)
  })

  it('computeAdvancedShipping handles missing userRegion and marks calculating', () => {
    const items = [
      { id: 'p1', shippingRegions: [{ region: 'x' }], quantity: 1 },
      { id: 'p2', shippingRegions: [] }
    ]
    const res = computeAdvancedShipping(items, null, null)
    expect(res.isCalculating).toBe(true)
    expect(res.byProduct['p1']).toBe(0)
    expect(res.byProduct['p2']).toBe(0)
  })

  it('computeAdvancedShipping computes numeric shipping when userRegion provided', () => {
    const items = [{ id: 'p1', shippingRegions: [{ region: 'metropolitana' }], quantity: 1 }]
    const calc = (item, region) => 123.45
    const res = computeAdvancedShipping(items, 'metropolitana', calc)
    expect(res.isCalculating).toBe(false)
    expect(res.shipping).toBeCloseTo(123.45)
    expect(res.byProduct['p1']).toBeCloseTo(123.45)
  })

  it('computeShippingFromStore calls store function when present', () => {
    const store = { getShippingCost: (subtotal) => subtotal > 0 ? 10 : 0 }
    expect(computeShippingFromStore(100, store)).toBe(10)
    expect(computeShippingFromStore(0, store)).toBe(0)
  })

  it('finalizeTotals sums components correctly', () => {
    const out = finalizeTotals({ subtotalAfterDiscount: 100, shipping: 5, fees: 2, taxes: 9 })
    expect(out.total).toBe(116)
  })
})
