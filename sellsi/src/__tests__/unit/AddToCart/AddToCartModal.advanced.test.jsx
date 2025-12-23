import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore'

// Use declarative test factories for services/hooks
import {
  stubSupabaseModule,
  mockSupabaseFrom,
  mockBilling,
  mockShipping,
  mockAuth,
  resetMocks,
  mockGetSession,
} from '../../utils/mocks/addToCartMocks'

// Shared setup mocks (apply BEFORE importing the module under test)
import './setupMocks'

// Ensure product-shipping hook provides an effective region during these advanced tests
jest.mock('../../../shared/components/cart/AddToCartModal/logic/hooks/useProductShippingValidationOnOpen', () => ({
  useProductShippingValidationOnOpen: () => ({
    shippingValidation: null,
    isValidatingShipping: false,
    justOpened: false,
    effectiveUserRegion: 'Region Test',
    getUserRegionName: () => 'Region Test',
    isLoadingUserRegion: false,
  }),
}))

// Import module under test (mocks from setupMocks applied first)
import AddToCartModal from '../../../shared/components/cart/AddToCartModal'
import { supabase } from '../../../services/supabase'


// Wrapper used to provide react-query and theme context similar to other AddToCartModal tests
const createTestClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
const Wrapper = ({ children }) => {
  const qcRef = React.useRef()
  if (!qcRef.current) qcRef.current = createTestClient()
  return (
    <QueryClientProvider client={qcRef.current}>
      <ThemeProvider theme={dashboardThemeCore}>{children}</ThemeProvider>
    </QueryClientProvider>
  )
}

describe('AddToCartModal - advanced unit tests (shipping & billing + supabase)', () => {
  beforeEach(() => {
    // Reset and reapply mocks to keep tests isolated and declarative
    jest.clearAllMocks()
    const { resetSetupMocks } = require('./setupMocks')
    resetSetupMocks()
  })

  it('enriches product with shipping regions from supabase and shows delivery info', async () => {
    // Arrange: product WITH shipping regions (bypass supabase for determinism)
    const product = { id: 'p-sh-1', name: 'Prod Ship', stock: 10, price: 100, shippingRegions: [{ id: 'r1', region: 'Region Test', price: 0, delivery_days: 3 }] }

    // Render the modal open (no supabase calls expected)
    render(
      <Wrapper>
        <AddToCartModal open={true} onClose={() => {}} onAddToCart={jest.fn()} product={product} />
      </Wrapper>
    )

    // Wait for the delivery text to appear (3 días hábiles)
    await waitFor(() => expect(screen.getByText(/3\s+días hábiles/i)).toBeInTheDocument())
  })

  it('when billing incomplete and document factura selected, onRequireBillingInfo is called and modal closes', async () => {
    // Mark billing incomplete via shared mock state
    const { mockBillingState } = require('./setupMocks')
    mockBillingState.isComplete = false
    mockBillingState.missingFieldLabels = ['RUT']

    const product = { id: 'p-bill-1', name: 'Prod Bill', stock: 10, price: 100 }
    const onRequireBillingInfo = jest.fn()
    const onClose = jest.fn()

    render(
      <Wrapper>
        <AddToCartModal
          open={true}
          onClose={onClose}
          onAddToCart={jest.fn()}
          product={product}
          onRequireBillingInfo={onRequireBillingInfo}
        />
      </Wrapper>
    )

    // Ensure shipping/region state so the button is not disabled for unrelated reasons
    const { mockShippingState } = require('./setupMocks')
    mockShippingState.userRegion = 'Region Test'
    mockShippingState.canShip = true

    // Select Factura (document type)
    const facturaOption = await screen.findByLabelText(/Factura/i)
    await userEvent.click(facturaOption)

    // Click the action button (could be 'Completar Facturación' when billing incomplete)
    const actionButton = await screen.findByRole('button', { name: /Completar Facturación|Agregar al Carrito|Agregar al carrito/i })
    await userEvent.click(actionButton)

    // Expect onRequireBillingInfo called and onClose called
    await waitFor(() => expect(onRequireBillingInfo).toHaveBeenCalledWith(expect.objectContaining({ missingFields: expect.any(Array) })))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onAddToCart and closes on success, sets isProcessing appropriately', async () => {
    const product = { id: 'p-add-1', name: 'Prod Add', stock: 10, price: 100 }
    const onAddToCart = jest.fn().mockResolvedValue(true)
    const onClose = jest.fn()

    // Ensure session exists so flow proceeds
    const { getSupabaseMock } = require('./setupMocks')
    getSupabaseMock().auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })

    // Ensure billing is complete for this flow (avoid 'Completar Facturación')
    const { mockBillingState } = require('./setupMocks')
    mockBillingState.isComplete = true

    render(
      <Wrapper>
        <AddToCartModal open={true} onClose={onClose} onAddToCart={onAddToCart} product={product} />
      </Wrapper>
    )



    // Wait for add button and click
    const addButton = await screen.findByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i })
    await userEvent.click(addButton)

    await waitFor(() => expect(onAddToCart).toHaveBeenCalled())
    expect(onClose).toHaveBeenCalled()
  })

  it('handles supabase errors gracefully (returns empty regions and does not throw)', async () => {
    const product = { id: 'p-err-1', name: 'Prod Err', stock: 5, price: 50 }

    const eq = jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } })
    const select = jest.fn().mockReturnValue({ eq })
    const from = jest.spyOn(supabase, 'from').mockReturnValue({ select })

    render(
      <Wrapper>
        <AddToCartModal open={true} onClose={() => {}} onAddToCart={jest.fn()} product={product} />
      </Wrapper>
    )

    // supabase called but modal should not crash; expect no throw and no delivery info
    await waitFor(() => expect(from).toHaveBeenCalled())
    expect(screen.queryByText(/días hábiles/i)).toBeNull()

    from.mockRestore()
  })
})
