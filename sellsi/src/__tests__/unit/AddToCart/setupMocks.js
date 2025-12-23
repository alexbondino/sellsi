// Shared test setup for AddToCart unit tests
// Place at the top of test files: import './setupMocks'

// Mutable state objects tests can modify
export const mockBillingState = { isComplete: true, missingFieldLabels: [] }
export const mockShippingState = { userRegion: 'Region Test', canShip: true, shippingInfo: { cost: 1000 } }

// Supabase mock (simple chainable builder supporting common calls)
const mockSelect = jest.fn().mockReturnThis()
const mockEq = jest.fn().mockResolvedValue({ data: [], error: null })
const mockIn = jest.fn().mockResolvedValue({ data: [], error: null })
const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null })

// Note: variable names prefixed with `mock` are allowed to be referenced by jest.mock factories
let mockFrom = jest.fn(() => ({ select: mockSelect, eq: mockEq, in: mockIn, maybeSingle: mockMaybeSingle }))

jest.mock('../../../services/supabase', () => ({
  supabase: {
    auth: { getSession: jest.fn() },
    from: mockFrom,
  },
}))

// Thumbnail service stub to silence background requests in tests
jest.mock('../../../services/phase1ETAGThumbnailService.js', () => ({
  getOrFetchMainThumbnail: jest.fn().mockResolvedValue(null),
  getOrFetchManyMainThumbnails: jest.fn().mockResolvedValue([]),
  phase1ETAGService: { fetchThumbnailWithETag: jest.fn().mockResolvedValue(null) },
}))

// Billing hook mock uses the mutable state object
jest.mock('../../../shared/hooks/profile/useBillingInfoValidation', () => ({
  useBillingInfoValidation: () => ({
    isComplete: mockBillingState.isComplete,
    isLoading: false,
    missingFieldLabels: mockBillingState.missingFieldLabels,
    refreshIfStale: jest.fn(),
    state: {},
  }),
}))

// Shipping hook mock
jest.mock('../../../shared/hooks/shipping/useUnifiedShippingValidation', () => ({
  useUnifiedShippingValidation: () => ({
    validateSingleProduct: jest.fn().mockResolvedValue({ canShip: mockShippingState.canShip, shippingInfo: mockShippingState.shippingInfo }),
    validateProductShipping: jest.fn().mockReturnValue({ canShip: mockShippingState.canShip, shippingInfo: mockShippingState.shippingInfo }),
    getUserRegionName: () => mockShippingState.userRegion,
    userRegion: mockShippingState.userRegion,
    isLoadingUserRegion: false,
  }),
}))

jest.mock('../../../shared/utils/supplierDocumentTypes', () => ({
  useSupplierDocumentTypes: () => ({ documentTypes: [], availableOptions: [ { value: 'factura', label: 'Factura' }, { value: 'boleta', label: 'Boleta' } ], loading: false, error: null })
}))

// Helper to reset mutable mock state and implementation between tests
export const resetSetupMocks = () => {
  mockBillingState.isComplete = true
  mockBillingState.missingFieldLabels = []
  mockShippingState.userRegion = 'Region Test'
  mockShippingState.canShip = true
  mockShippingState.shippingInfo = { cost: 1000 }

  const { supabase } = require('../../../services/supabase')
  supabase.auth.getSession.mockClear && supabase.auth.getSession.mockClear()
  supabase.from.mockClear && supabase.from.mockClear()

  // restore default implementations for chain methods
  supabase.from.mockImplementation(() => ({ select: defaultSelect, eq: defaultEq, in: defaultIn, maybeSingle: defaultMaybeSingle }))
}

// Expose helpers for tests
export const getSupabaseMock = () => require('../../../services/supabase').supabase

// Ensure this module executes before other imports in tests
export default null
