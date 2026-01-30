import { cartService } from '../../services/user/cartService'
import * as cartActions from '../../services/user/cartActions'
import { QUANTITY_LIMITS } from '../../utils/quantityValidation'
import { assertSpyIntercepts } from '../testUtils/assertSpyIntercepts'

describe('migrateLocalCart (robust)', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.clearAllMocks()
  })

  test('sanity: spy intercepts internal calls (detect self-spying)', async () => {
    const spy = jest.spyOn(cartActions, 'updateItemQuantity')
    // Ensure getOrCreateActiveCart returns a usable cart so migrateLocalCart reaches updateItemQuantity
    jest.spyOn(cartService, 'getOrCreateActiveCart').mockResolvedValue({ cart_id: 'cart-s', items: [] })
    // If this helper throws, the spy did not intercept internal calls — test will fail (no false green)
    await assertSpyIntercepts(spy, () => cartService.migrateLocalCart('u1', [{ product_id: 'p1', quantity: 1, name: 'a' }]))
  })

  test('updates quantities to the max(local, backend) and updates timestamp', async () => {
    const cart = {
      cart_id: 'cart123',
      items: [
        { product_id: 'p1', quantity: 1 },
        { product_id: 'p2', quantity: 5 }
      ]
    }

    jest.spyOn(cartService, 'getOrCreateActiveCart').mockResolvedValue(cart)
    const updateItemQuantity = jest.spyOn(cartActions, 'updateItemQuantity').mockResolvedValue(undefined)
    const updateCartTimestamp = jest.spyOn(cartService, 'updateCartTimestamp').mockResolvedValue(undefined)

    const localItems = [
      { product_id: 'p1', quantity: 2, name: 'one' }, // backend 1 -> final 2
      { product_id: 'p2', quantity: 3, name: 'two' }, // backend 5 -> final 5
      { product_id: 'p3', quantity: 4, name: 'three' } // backend 0 -> final 4
    ]

    const res = await cartService.migrateLocalCart('u1', localItems)

    expect(updateItemQuantity).toHaveBeenCalledTimes(3)
    expect(updateItemQuantity).toHaveBeenCalledWith(cart.cart_id, 'p1', 2, expect.objectContaining({ skipTimestamp: true }))
    expect(updateItemQuantity).toHaveBeenCalledWith(cart.cart_id, 'p2', 5, expect.objectContaining({ skipTimestamp: true }))
    expect(updateItemQuantity).toHaveBeenCalledWith(cart.cart_id, 'p3', 4, expect.objectContaining({ skipTimestamp: true }))

    expect(updateCartTimestamp).toHaveBeenCalledTimes(1)

    // migrateLocalCart should return the final cart (getOrCreateActiveCart result)
    expect(res).toBe(cart)
  })

  test('retries with quantity 1 when update throws a quantity error', async () => {
    const cart = { cart_id: 'cart123', items: [] }
    jest.spyOn(cartService, 'getOrCreateActiveCart').mockResolvedValue(cart)

    const updateItemQuantity = jest
      .spyOn(cartActions, 'updateItemQuantity')
      .mockImplementationOnce(() => Promise.reject(new Error('out of range for type integer')))
      .mockResolvedValueOnce(undefined)

    const updateCartTimestamp = jest.spyOn(cartService, 'updateCartTimestamp').mockResolvedValue(undefined)

    // Quantity will be sanitized (capped) before updateItemQuantity is called
    const localItems = [{ product_id: 'pX', quantity: 999999999, name: 'huge' }]

    await cartService.migrateLocalCart('u1', localItems)

    // First attempt with the sanitized/capped quantity, second attempt with quantity 1
    expect(updateItemQuantity).toHaveBeenCalledTimes(2)
    expect(updateItemQuantity).toHaveBeenNthCalledWith(1, cart.cart_id, 'pX', QUANTITY_LIMITS.MAX, expect.objectContaining({ skipTimestamp: true }))
    expect(updateItemQuantity).toHaveBeenNthCalledWith(2, cart.cart_id, 'pX', 1, expect.objectContaining({ skipTimestamp: true }))

    expect(updateCartTimestamp).toHaveBeenCalledTimes(1)
  })

  test('ignores invalid items and does not update timestamp when nothing valid', async () => {
    const cart = { cart_id: 'cart123', items: [] }
    const getOrCreateSpy = jest.spyOn(cartService, 'getOrCreateActiveCart').mockResolvedValue(cart)
    const updateItemQuantity = jest.spyOn(cartActions, 'updateItemQuantity').mockResolvedValue(undefined)
    const updateCartTimestamp = jest.spyOn(cartService, 'updateCartTimestamp').mockResolvedValue(undefined)

    // Missing name -> sanitized out
    const localItems = [{ id: 'pBad', quantity: 3 }]

    const res = await cartService.migrateLocalCart('u1', localItems)

    expect(updateItemQuantity).not.toHaveBeenCalled()
    expect(updateCartTimestamp).not.toHaveBeenCalled()

    // Should still return whatever getOrCreateActiveCart returns
    expect(res).toBe(cart)
    expect(getOrCreateSpy).toHaveBeenCalled()
  })

  test('when skipFinalFetch and existingCart provided returns cart_id/user_id and avoids final fetch', async () => {
    const existingCart = { cart_id: 'c-skip', items: [] }
    const getOrCreateSpy = jest.spyOn(cartService, 'getOrCreateActiveCart')

    const updateItemQuantity = jest.spyOn(cartService, 'updateItemQuantity').mockResolvedValue(undefined)
    const updateCartTimestamp = jest.spyOn(cartService, 'updateCartTimestamp').mockResolvedValue(undefined)

    const localItems = [{ product_id: 'p1', quantity: 2, name: 'ok' }]

    const res = await cartService.migrateLocalCart('user-42', localItems, { skipFinalFetch: true, existingCart })

    expect(updateItemQuantity).toHaveBeenCalled()
    expect(updateCartTimestamp).toHaveBeenCalled()

    expect(res).toEqual({ cart_id: existingCart.cart_id, user_id: 'user-42' })
    // No final fetch
    expect(getOrCreateSpy).not.toHaveBeenCalled()
  })

  test('propagates a descriptive error when getOrCreateActiveCart fails', async () => {
    jest.spyOn(cartService, 'getOrCreateActiveCart').mockImplementation(() => { throw new Error('boom') })

    await expect(cartService.migrateLocalCart('u1', [{ product_id: 'p1', quantity: 1, name: 'a' }])).rejects.toThrow(/No se pudo migrar el carrito local: boom/)
  })
})
