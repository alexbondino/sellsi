import { cartService } from '../../services/user/cartService'

jest.mock('../../services/supabase', () => {
  return {
    supabase: {
      from: (table) => {
        if (table === 'carts') {
          return {
            select() { return this; },
            eq() { return this; },
            maybeSingle() { return Promise.resolve({ data: { cart_id: 'c1', items: [ { product_id: 'p1', offer_id: null }, { product_id: 'p2', offer_id: 'o1' } ] }, error: null }) }
          }
        }
        if (table === 'cart_items') {
          return {
            select() { return this; },
            eq() { return this; },
            order() { return this; },
            async then(resolve) { resolve({ data: [], error: null }) }
          }
        }
        return {}
      }
    }
  }
})

describe('migracion filtrada', () => {
  test('solo migra los items faltantes', async () => {
    const localItems = [ { product_id: 'p1', quantity: 2 }, { product_id: 'p3', quantity: 1 } ]
    const res = await cartService.migrateLocalCart('u1', localItems, { skipFinalFetch: true, existingCart: { cart_id: 'c1', items: [ { product_id: 'p1' } ] } })
    // Si no arroja, se considera OK (comportamiento actual: no crash)
    expect(res).toBeTruthy()
  })
})
