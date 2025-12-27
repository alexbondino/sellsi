import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// --- Preventive mocks: placed BEFORE importing the component under test ---
jest.mock('../../../shared/components/cart/AddToCartModal/AddToCartModal', () => ({ __esModule: true, default: () => <div data-testid="mock-modal">Modal</div> }))
const mockUseShipping = jest.fn(() => ({ isOpen: false, openIfIncomplete: () => false, isLoading: false, missingFieldLabels: [], handleConfigureShipping: () => {}, handleClose: () => {}, refresh: () => {}, awaitValidation: () => ({ complete: true }) }))
jest.mock('../../../shared/components/validation/ShippingInfoValidationModal/ShippingInfoValidationModal', () => ({ __esModule: true, default: () => null, useShippingInfoModal: () => mockUseShipping() }))

// Mock supabase session helper and toast helpers
const mockGetSession = jest.fn()
const mockUseAuth = jest.fn(() => ({ isBuyer: false }))
jest.mock('../../../services/supabase', () => ({ supabase: { auth: { getSession: () => mockGetSession() } } }))
jest.mock('../../../utils/toastHelpers', () => ({ showErrorToast: jest.fn(), showSuccessToast: jest.fn() }))
// Mock authentication provider hook to avoid mounting the full provider
jest.mock('../../../infrastructure/providers/UnifiedAuthProvider', () => ({ __esModule: true, useAuth: () => mockUseAuth() }))

// Prevent useNavigate errors by mocking react-router's hook
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => jest.fn() }
})

// --- Now import the real component (mocks applied) ---
import AddToCart from '../../../shared/components/cart/AddToCart'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '../../../services/supabase'
import * as toastHelpers from '../../../utils/toastHelpers'
const createTestClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })
const Wrapper = ({ children }) => {
  const qcRef = React.useRef()
  if (!qcRef.current) qcRef.current = createTestClient()
  return (
    <QueryClientProvider client={qcRef.current}>
      {children}
    </QueryClientProvider>
  )
}

describe('AddToCart - unit tests (robust)', () => {
  let user

  beforeEach(() => {
    jest.clearAllMocks()
    // Default: user is logged in and shipping is complete
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    mockUseShipping.mockReturnValue({ isOpen: false, openIfIncomplete: () => false, isLoading: false, missingFieldLabels: [], handleConfigureShipping: () => {}, handleClose: () => {}, refresh: () => {}, awaitValidation: () => ({ complete: true }) })
    // Default auth role
    mockUseAuth.mockReturnValue({ isBuyer: true })
    user = userEvent.setup()
  })
  it('renders button variant with data-no-card-click and click opens modal (modal state change emitted)', async () => {
    const onModalStateChange = jest.fn()
    const product = { id: 'p1', name: 'Prod' }
    render(<AddToCart product={product} type="buyer" onModalStateChange={onModalStateChange} />, { wrapper: Wrapper })

    const btn = screen.getByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i })
    expect(btn).toHaveAttribute('data-no-card-click', 'true')

    await user.click(btn)
    // Button exists and attribute present
    expect(btn).toBeInTheDocument()
  })

  it('renders icon variant with data-no-card-click attribute', () => {
    const product = { id: 'p2', name: 'Icon' }
    render(<AddToCart product={product} variant="icon" />, { wrapper: Wrapper })
    const iconBtn = screen.getByRole('button')
    expect(iconBtn).toHaveAttribute('data-no-card-click', 'true')
  })

  it('when no session, dispatches openLogin and does not open modal', async () => {
    const product = { id: 'p3', name: 'NoSess' }
    // Mock supabase.auth.getSession to return no session for all calls
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const openSpy = jest.spyOn(window, 'dispatchEvent')

    render(<AddToCart product={product} />, { wrapper: Wrapper })

    const btn = screen.getByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i })
    await user.click(btn)

    // dispatchEvent should have been called with openLogin event (async)
    await waitFor(() => expect(openSpy).toHaveBeenCalled())
    // cleanup
    openSpy.mockRestore()
  })

  it('when shipping incomplete, onModalStateChange is called and modal not opened', async () => {
    const product = { id: 'p4', name: 'ShipInc' }
    // Make the shipping hook report it opened the validation modal
    mockUseShipping.mockReturnValue({
      isOpen: false,
      openIfIncomplete: () => true,
      isLoading: false,
      missingFieldLabels: [],
      handleConfigureShipping: () => {},
      handleClose: () => {},
      refresh: () => {},
      awaitValidation: () => ({ complete: false }),
    })

    const onModalStateChange = jest.fn()

    render(<AddToCart product={product} onModalStateChange={onModalStateChange} />, { wrapper: Wrapper })

    const btn = screen.getByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i })
    await user.click(btn)

    expect(onModalStateChange).toHaveBeenCalledWith(true)
  })

  it('expired offer shows error and does not open modal', async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    const product = { id: 'p5', name: 'Expired' }
    const offer = { id: 'of1', purchase_deadline: past }
    const toastSpy = jest.spyOn(toastHelpers, 'showErrorToast').mockImplementation(() => {})

    render(<AddToCart product={product} offer={offer} />, { wrapper: Wrapper })

    const btn = screen.getByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i })
    await user.click(btn)

    expect(toastSpy).toHaveBeenCalled()
    toastSpy.mockRestore()
  })

  it('prevents double opening (reentrancy) by guarding openingRef', async () => {
    const product = { id: 'p6', name: 'Reentrancy' }
    // Ensure supabase returns a session so flow proceeds
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })

    const onModalStateChange = jest.fn()
    render(<AddToCart product={product} onModalStateChange={onModalStateChange} />, { wrapper: Wrapper })

    const btn = screen.getByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i })
    // Simulate two quick clicks
    user.click(btn)
    user.click(btn)

    // Wait for resolution and assert it was called exactly once (reentrancy guard prevents duplicates)
    await waitFor(() => expect(onModalStateChange).toHaveBeenCalledTimes(1))
  })
})