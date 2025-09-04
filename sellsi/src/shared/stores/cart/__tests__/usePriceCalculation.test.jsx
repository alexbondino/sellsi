import { describe, it, expect, vi } from 'vitest'
import {
  computePriceCalculation
} from '../priceCalculationUtils'

vi.mock('../useShipping', () => ({
  default: () => ({ getShippingCost: (subtotal) => subtotal > 100 ? 20 : 5 })
}))

vi.mock('../../../utils/shippingCalculation', () => ({
  calculateProductShippingCost: (item, region) => {
    if (!region) return 0
    return typeof item.id === 'string' ? 7.5 : 0
  }
}))

describe('computePriceCalculation (pure)', () => {
  it('basic calculation without shipping when includeShipping false', () => {
    const items = [{ id: 'a', price: 10, quantity: 2 }, { id: 'b', price: '5', quantity: 1 }]
    const res = computePriceCalculation(items, { includeShipping: false }, { getShippingCost: () => 0 }, null)
    expect(res.subtotal).toBe(10 * 2 + 5 * 1)
    expect(res.shipping).toBe(0)
    expect(res.total).toBe(res.subtotal)
  })

  it('advanced calculation with userRegion and numeric shipping', () => {
    const items = [{ id: 'a', price: 50, quantity: 1 }]
    const res = computePriceCalculation(items, { useAdvancedShipping: true, userRegion: 'metropolitana' }, null, () => 7.5)
    expect(res.shipping).toBeCloseTo(7.5)
    expect(res.total).toBeCloseTo(res.subtotal + 7.5)
  })

  it('advanced calculation with realShippingCost override', () => {
    const items = [{ id: 'a', price: 30, quantity: 1 }]
    const res = computePriceCalculation(items, { useAdvancedShipping: true, realShippingCost: 12 }, null, () => 7)
    expect(res.shipping).toBe(12)
    expect(res.total).toBe(res.subtotal + 12)
  })
})
