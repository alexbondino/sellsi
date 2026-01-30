// Declarative mock factories for AddToCart tests
// Usage:
// const { mockGetSession, mockSupabaseFrom, mockShippingState, mockBilling, resetMocks } = require('./addToCartMocks')

let mockGetSession = jest.fn()
let mockFrom = jest.fn()
let mockUseBilling = { isComplete: true, missingFieldLabels: [], refreshIfStale: jest.fn() }
let mockShippingState = { canShip: true, shippingInfo: { cost: 1000 }, userRegion: 'Region Test' }
let mockUseAuth = jest.fn(() => ({ isBuyer: true }))

const mockSupabaseFrom = (returned = []) => {
  // Helper to create a fresh builder for a given return value
  const createBuilder = (arr) => {
    let proxy = null
    proxy = new Proxy({ _returned: arr }, {
      get(target, prop) {
        if (prop === 'then') {
          return (resolve, reject) => {
            try {
              resolve({ data: target._returned, error: null })
            } catch (err) {
              reject(err)
            }
          }
        }
        if (prop === 'catch') return (fn) => proxy
        // Return a function for chainable calls (.select, .eq, .in, .maybeSingle)
        return () => proxy
      }
    })
    return proxy
  }

  // If caller passed an object map { tableName: rows }
  if (returned && typeof returned === 'object' && !Array.isArray(returned)) {
    const tableBuilders = Object.fromEntries(
      Object.entries(returned).map(([k, v]) => [k, createBuilder(v)])
    )
    mockFrom.mockImplementation((table) => tableBuilders[table] || createBuilder([]))
    return { tableBuilders, mockFrom }
  }

  // Simple case: single return array for any table
  const builder = createBuilder(returned)
  mockFrom.mockReturnValue(builder)
  return { builder, mockFrom }
}

const stubSupabaseModule = () => {
  jest.mock('../../../services/supabase', () => ({
    supabase: {
      auth: { getSession: () => mockGetSession() },
      from: (...args) => mockFrom(...args),
    },
  }))
}

const mockBilling = ({ isComplete = true, missing = [] } = {}) => {
  mockUseBilling.isComplete = isComplete
  mockUseBilling.missingFieldLabels = missing
  jest.mock('../../../shared/hooks/profile/useBillingInfoValidation', () => ({
    useBillingInfoValidation: () => ({
      isComplete: mockUseBilling.isComplete,
      isLoading: false,
      missingFieldLabels: mockUseBilling.missingFieldLabels,
      refreshIfStale: mockUseBilling.refreshIfStale,
      state: {},
    }),
  }))
}

const mockShipping = ({ userRegion = 'Region Test', canShip = true, shippingInfo = { cost: 1000 } } = {}) => {
  mockShippingState = { userRegion, canShip, shippingInfo }
  jest.mock('../../../shared/hooks/shipping/useUnifiedShippingValidation', () => ({
    useUnifiedShippingValidation: () => ({
      validateSingleProduct: jest.fn().mockResolvedValue({ canShip: mockShippingState.canShip, shippingInfo: mockShippingState.shippingInfo }),
      validateProductShipping: jest.fn().mockReturnValue({ canShip: mockShippingState.canShip, shippingInfo: mockShippingState.shippingInfo }),
      getUserRegionName: () => mockShippingState.userRegion,
      userRegion: mockShippingState.userRegion,
      isLoadingUserRegion: false,
    }),
  }))
}

const mockAuth = ({ isBuyer = true } = {}) => {
  mockUseAuth = jest.fn(() => ({ isBuyer }))
  jest.mock('../../../infrastructure/providers/UnifiedAuthProvider', () => ({ __esModule: true, useAuth: () => mockUseAuth() }))
}

const resetMocks = () => {
  // reset internal fns (avoid jest.resetModules to prevent React instance/context duplication)
  mockGetSession = jest.fn()
  mockFrom = jest.fn()
  mockUseBilling = { isComplete: true, missingFieldLabels: [], refreshIfStale: jest.fn() }
  mockShippingState = { canShip: true, shippingInfo: { cost: 1000 }, userRegion: 'Region Test' }
  mockUseAuth = jest.fn(() => ({ isBuyer: true }))
}

module.exports = {
  mockGetSession: () => mockGetSession,
  mockSupabaseFrom: mockSupabaseFrom,
  stubSupabaseModule,
  mockBilling,
  mockShipping,
  mockAuth,
  resetMocks,
}
