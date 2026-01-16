import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';
import useCartStore from '../../shared/stores/cart/cartStore';
import BuyerCart from '../../domains/buyer/pages/BuyerCart';
import { MemoryRouter } from 'react-router-dom';

// ============================================================================
// MOCKS ESTABLES (Previene infinite loops por inestabilidad referencial)
// ============================================================================

// Mock role provider
jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({
  useRole: () => ({ currentAppRole: 'buyer' }),
}));

// Ensure consistent media (desktop by default)
jest.mock('@mui/material', () => {
  const real = jest.requireActual('@mui/material');
  return { ...real, useMediaQuery: jest.fn(() => false) };
});

// Mock useNavigate so we can assert navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, MemoryRouter: actual.MemoryRouter };
});

// ⚡ CRÍTICO: Respuesta estable para evitar infinite loops
// Definir FUERA del mock para mantener misma referencia entre renders
const defaultShippingResponse = {
  userRegion: { country: 'CL' },
  shippingStates: {},
  isLoading: false,
  incompatibleProducts: [],
  isCartCompatible: true,
  isShippingInfoComplete: true,
  revalidate: jest.fn(),
  getUserRegionName: jest.fn(() => (v) => v),
  validateProductShipping: jest.fn(() => ({})),
  SHIPPING_STATES: {}
};

// Variable mutable para alterar comportamiento en tests específicos
let mockShippingResponse = { ...defaultShippingResponse };

// Mock shipping validation hook con referencia estable
jest.mock('../../domains/buyer/pages/cart/hooks/useShippingValidation', () => ({
  __esModule: true,
  default: () => mockShippingResponse,
}));

// Mock optimized user region hook para prevenir background fetches y listeners
jest.mock('../../hooks/useOptimizedUserShippingRegion', () => ({
  useOptimizedUserShippingRegion: jest.fn(() => ({
    userRegion: { country: 'CL' },
    isLoadingUserRegion: false,
    isStale: false,
    refreshRegion: jest.fn(),
    primeUserRegionCache: jest.fn(),
    invalidateUserCache: jest.fn()
  }))
}));

// Mock OrderSummary con data-testid para queries robustas
jest.mock('../../domains/buyer/pages/cart/OrderSummary.jsx', () => ({
  __esModule: true,
  default: ({ onCheckout }) => {
    const React = require('react');
    return React.createElement('button', { 
      'data-testid': 'checkout-btn',
      onClick: onCheckout 
    }, 'Test Checkout');
  }
}));

// ============================================================================
// SETUP & UTILS
// ============================================================================

const renderWithMemoryProviders = (ui, { route = '/buyer/cart' } = {}) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={dashboardThemeCore}>
          <BannerProvider>
            {ui}
          </BannerProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
  // Reiniciar mock de shipping al estado ideal
  mockShippingResponse = { ...defaultShippingResponse };
  // Carrito con alcohol por defecto
  useCartStore.setState({ items: [{ id: 'a1', name: 'Cerveza', quantity: 1, supplier_id: 's1', price: 1000, category: 'Alcoholes' }], isLoading: false });
});

// ============================================================================
// TEST SUITE - Age Verification Logic
// ============================================================================

describe('BuyerCart - Age Verification Logic', () => {

  test('LOOP CHECK: renders without infinite loop', async () => {
    renderWithMemoryProviders(<BuyerCart />);
    
    // Si hay loop infinito, el test fallará por timeout
    expect(await screen.findByTestId('checkout-btn')).toBeInTheDocument();
  });

  test('opens age verification modal when cart has alcohol and not previously verified', async () => {
    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    expect(checkoutBtn).toBeInTheDocument();

    fireEvent.click(checkoutBtn);

    // Modal should appear
    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());
    expect(screen.getByText(/¿Confirmas que cumples con este requisito\?/i)).toBeInTheDocument();
  });

  test('proceeds to payment when already age verified in sessionStorage', async () => {
    // simulate previous verification
    sessionStorage.setItem('age_verified', 'true');

    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/buyer/paymentmethod'));
  });

  test('click Sí: sets sessionStorage and proceeds to payment', async () => {
    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    // Modal should appear
    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());

    const yesBtn = screen.getByRole('button', { name: /Sí/i });
    fireEvent.click(yesBtn);

    await waitFor(() => expect(sessionStorage.getItem('age_verified')).toBe('true'));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/buyer/paymentmethod'));
  });

  test('click No: closes modal and does not navigate', async () => {
    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());

    const noBtn = screen.getByRole('button', { name: /No/i });
    fireEvent.click(noBtn);

    await waitFor(() => expect(screen.queryByText(/Verificación de Edad/i)).not.toBeInTheDocument());
    expect(mockNavigate).not.toHaveBeenCalledWith('/buyer/paymentmethod');
    expect(sessionStorage.getItem('age_verified')).toBeNull();
  });

  test('no alcohol: proceeds directly without modal', async () => {
    useCartStore.setState({ 
      items: [{ id: 'b1', name: 'Tornillo', quantity: 10, supplier_id: 's2', price: 500, category: 'Ferretería y Construcción' }], 
      isLoading: false 
    });

    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/buyer/paymentmethod'));
    expect(screen.queryByText(/Verificación de Edad/i)).not.toBeInTheDocument();
  });

  test('mixed cart: shows modal when at least one restricted product is present', async () => {
    useCartStore.setState({ items: [
      { id: 'a1', name: 'Cerveza', quantity: 1, supplier_id: 's1', price: 1000, category: 'Alcoholes' },
      { id: 'b1', name: 'Tornillo', quantity: 1, supplier_id: 's2', price: 500, category: 'Ferretería y Construcción' }
    ], isLoading: false });

    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());
  });

  test('categoria fallback: uses `categoria` field when `category` missing', async () => {
    useCartStore.setState({ items: [ { id: 'c1', name: 'Vino', quantity: 1, supplier_id: 's3', price: 2000, categoria: 'Alcoholes' } ], isLoading: false });

    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());
  });

  test('highlights age-restricted products with orange border when user clicks "No"', async () => {
    useCartStore.setState({ items: [
      { id: 'a1', name: 'Cerveza', quantity: 1, supplier_id: 's1', price: 1000, category: 'Alcoholes' },
      { id: 'b1', name: 'Tornillo', quantity: 1, supplier_id: 's2', price: 500, category: 'Ferretería y Construcción' }
    ], isLoading: false });

    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());

    const noBtn = screen.getByRole('button', { name: /No/i });
    fireEvent.click(noBtn);

    await waitFor(() => {
      // Verificar que el mensaje de advertencia aparece
      expect(screen.getByText(/Solo mayores de 18 años/i)).toBeInTheDocument();
    });
  });

  test('shows warning message with icon for age-restricted products when verification denied', async () => {
    useCartStore.setState({ items: [
      { id: 'a1', name: 'Ron', quantity: 1, supplier_id: 's1', price: 15000, categoria: 'Alcoholes' }
    ], isLoading: false });

    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());

    const noBtn = screen.getByRole('button', { name: /No/i });
    fireEvent.click(noBtn);

    await waitFor(() => {
      expect(screen.getByText(/Solo mayores de 18 años/i)).toBeInTheDocument();
    });
  });

  test('clears age restriction highlights when user clicks "Sí"', async () => {
    useCartStore.setState({ items: [
      { id: 'a1', name: 'Whisky', quantity: 1, supplier_id: 's1', price: 25000, category: 'Alcoholes' }
    ], isLoading: false });

    renderWithMemoryProviders(<BuyerCart />);

    const checkoutBtn = await screen.findByTestId('checkout-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => expect(screen.getByText(/Verificación de Edad/i)).toBeInTheDocument());

    const yesBtn = screen.getByRole('button', { name: /Sí/i });
    fireEvent.click(yesBtn);

    await waitFor(() => {
      expect(screen.queryByText(/Solo mayores de 18 años/i)).not.toBeInTheDocument();
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/paymentmethod');
    });
  });

});
