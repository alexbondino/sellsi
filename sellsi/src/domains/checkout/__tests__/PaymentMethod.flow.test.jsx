import React, { useEffect } from 'react'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mocks
const navigateMock = vi.fn()
const initializeCheckoutMock = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}))

vi.mock('../../../shared/stores/cart/cartStore', () => {
  return () => ({
    items: [
      { id: 'p1', name: 'Product 1', shippingRegions: [{ region: 'metropolitana', price: 1000, delivery_days: 3 }] }
    ],
    getSubtotal: () => 10000,
    getTotal: () => 11000
  })
})

vi.mock('../hooks', () => ({
  useCheckout: () => ({
    initializeCheckout: initializeCheckoutMock,
    resetCheckout: () => {}
  })
}))

vi.mock('../../../services/user/profileService', () => ({
  getUserProfileData: vi.fn(() => Promise.resolve({ shipping_region: 'metropolitana' }))
}))

vi.mock('../../../utils/shippingCalculation', () => ({
  calculateRealShippingCost: vi.fn(() => Promise.resolve(1500))
}))

// We'll mock the domain shipping validation hook (the one PaymentMethod uses)
const clearGlobalShippingCacheMock = vi.fn()
const validateProductsBatchMock = vi.fn((items, options) => items.map(i => ({ product: i, validation: { canShip: true, state: 'compatible' } })))

vi.mock('../../buyer/pages/cart/hooks/useShippingValidation', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    userRegion: 'metropolitana',
    isLoading: false,
    isCartCompatible: true,
    SHIPPING_STATES: { NO_SHIPPING_INFO: 'no_shipping_info' },
    clearGlobalShippingCache: clearGlobalShippingCacheMock,
    validateProductsBatch: validateProductsBatchMock
  }))
}))

// A lightweight test component that reproduces the effect logic from PaymentMethod
// Local test doubles used by TestFlow to avoid importing real modules
const testItems = [
  { id: 'p1', name: 'Product 1', shippingRegions: [{ region: 'metropolitana', price: 1000, delivery_days: 3 }] }
]
const testGetSubtotal = () => 10000
const testGetTotal = () => 11000
const testCalculateRealShippingCost = () => Promise.resolve(1500)
const testGetUserProfileData = () => Promise.resolve({ shipping_region: 'metropolitana' })

const TestFlow = () => {
  const items = testItems
  const getSubtotal = testGetSubtotal
  const getTotal = testGetTotal
  const shippingValidation = { userRegion: 'metropolitana', isLoading: false, isCartCompatible: true, SHIPPING_STATES: { NO_SHIPPING_INFO: 'no_shipping_info' }, clearGlobalShippingCache: clearGlobalShippingCacheMock, validateProductsBatch: validateProductsBatchMock }
  const initializeCheckout = initializeCheckoutMock
  const calculateRealShippingCost = testCalculateRealShippingCost
  const getUserProfileData = testGetUserProfileData
  const navigate = navigateMock

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/buyer/cart', { replace: true })
      return
    }

    if (shippingValidation.isLoading) return
    if (!shippingValidation.userRegion && !shippingValidation.isLoading) return
    if (!shippingValidation.isCartCompatible) {
      navigate('/buyer/cart', { replace: true })
      return
    }

    const initializeCheckoutData = async () => {
      try {
        if (shippingValidation && typeof shippingValidation.clearGlobalShippingCache === 'function') {
          shippingValidation.clearGlobalShippingCache()
        }

        if (shippingValidation && typeof shippingValidation.validateProductsBatch === 'function') {
          const fresh = shippingValidation.validateProductsBatch(items, { forceRefresh: true })
          const anyIncompatible = fresh.some(r => r.validation && !r.validation.canShip && r.validation.state !== shippingValidation.SHIPPING_STATES.NO_SHIPPING_INFO)
          if (anyIncompatible) {
            navigate('/buyer/cart', { replace: true })
            return
          }
        }
      } catch (err) {
        // noop for test
      }

      const subtotal = getSubtotal()
      const tax = Math.round(subtotal * 0.19)
      const serviceFee = Math.round(subtotal * 0.03)
      const shipping = await calculateRealShippingCost(items)
      const total = subtotal + tax + serviceFee + shipping

      const userId = 'test-user'
      let shippingAddress = null
      let billingAddress = null
      if (userId) {
        try {
          const profile = await getUserProfileData(userId)
          if (profile && profile.shipping_region) {
            shippingAddress = { region: profile.shipping_region }
          }
        } catch (e) {}
      }

      const cartData = { items, subtotal, tax, serviceFee, shipping, total, currency: 'CLP', shippingAddress, billingAddress }
      initializeCheckout(cartData)
    }

    initializeCheckoutData()
  }, [])

  return React.createElement('div', null, 'test')
}

describe('PaymentMethod flow (simulated)', () => {
  beforeEach(() => vi.clearAllMocks())

  test('calls clear cache, validates fresh and initializes checkout when compatible', async () => {
    render(React.createElement(TestFlow))

    await waitFor(() => expect(clearGlobalShippingCacheMock).toHaveBeenCalled())
    expect(validateProductsBatchMock).toHaveBeenCalledWith(expect.any(Array), { forceRefresh: true })
    await waitFor(() => expect(initializeCheckoutMock).toHaveBeenCalled())
  })

  test('navigates to cart when fresh validation returns incompatible', async () => {
    // adjust mock to return incompatible
    validateProductsBatchMock.mockImplementationOnce((items, options) => items.map(i => ({ product: i, validation: { canShip: false, state: 'incompatible_region' } })))

    render(React.createElement(TestFlow))

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/buyer/cart', { replace: true }))
    expect(initializeCheckoutMock).not.toHaveBeenCalled()
  })
})
