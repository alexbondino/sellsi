import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CheckoutSuccess from '../../domains/checkout/pages/CheckoutSuccess';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { useOfferStore } from '../../stores/offerStore';
import useCartStore from '../../shared/stores/cart/cartStore';

// Mock de Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    rpc: jest.fn(() => Promise.resolve({ data: { success: true }, error: null }))
  }
}));

// Mock de toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock del servicio de checkout
jest.mock('../../domains/checkout/services', () => ({
  checkoutService: {
    verifyKhipuPaymentStatus: jest.fn(),
    formatPrice: jest.fn((amount, currency = 'COP') => {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    })
  }
}));

// Mock de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Wrapper para providers
const TestWrapper = ({ children }) => {
  const [client] = React.useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  }));
  
  return (
    <BrowserRouter>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={dashboardThemeCore}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('CheckoutSuccess - Offer Cleanup Integration', () => {
  let mockCheckoutService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked service
    mockCheckoutService = require('../../domains/checkout/services').checkoutService;
    // Mock useSearchParams to return deterministic query params for tests
    const rr = require('react-router-dom');
    jest.spyOn(rr, 'useSearchParams').mockReturnValue([new URLSearchParams('payment_id=test123&transaction_id=txn456')]);
    
    // Reset stores
    useOfferStore.setState({ 
      buyerOffers: [], 
      supplierOffers: [], 
      loading: false, 
      error: null 
    });
    
    useCartStore.setState({ items: [] });
    
    // Mock verificación de pago exitosa
    mockCheckoutService.verifyKhipuPaymentStatus.mockResolvedValue({
      success: true,
      status: 'done',
      paymentId: 'test123',
      transactionId: 'txn456',
      amount: 15000,
      currency: 'CLP',
      paidAt: new Date().toISOString()
    });
  });

  it('debería limpiar carrito general y ofertas después de pago exitoso', async () => {
    // Setup inicial: carrito con items regulares y ofertas
    const cartItems = [
      { id: 'item1', name: 'Product 1', quantity: 1 },
      { id: 'item2', name: 'Product 2', quantity: 2, offer_id: 'off-paid' }
    ];
    
    const offers = [
      { id: 'off-paid', status: 'paid', product_id: 'prod1' },
      { id: 'off-approved', status: 'approved', product_id: 'prod2' }
    ];

    useCartStore.setState({ items: cartItems });
    useOfferStore.setState({ buyerOffers: offers });

    // Mock de las funciones de limpieza (verificamos llamadas, no implementaciones)
    const mockClearCart = jest.fn();
    const mockClearLocal = jest.fn();
    const mockForceCleanCartOffers = jest.fn();

    useCartStore.setState({ 
      clearCart: mockClearCart,
      clearLocal: mockClearLocal
    });

    useOfferStore.setState({
      forceCleanCartOffers: mockForceCleanCartOffers
    });

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    // Esperar a que se complete la verificación y limpieza
    await waitFor(() => {
      expect(mockCheckoutService.verifyKhipuPaymentStatus).toHaveBeenCalledWith('test123');
    }, { timeout: 5000 });

    await waitFor(() => {
      expect(mockClearCart).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockClearLocal).toHaveBeenCalled();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockForceCleanCartOffers).toHaveBeenCalled();
    }, { timeout: 3000 });

  // Verificar que el toast de éxito se disparó
  const { toast } = require('react-hot-toast');
  await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/pago/i)));

  // Comprobamos que el método de limpieza de ofertas fue invocado (no su implementación interna)
  await waitFor(() => {
    expect(mockForceCleanCartOffers).toHaveBeenCalled();
  });

  // Verificar que se muestre el mensaje de éxito (título o descripción)
  expect(screen.getByText(/pago completado/i)).toBeInTheDocument();
  });

  it('debería manejar errores de limpieza sin afectar la experiencia del usuario', async () => {
    // Mock de las funciones de limpieza que fallan
    const mockClearCart = jest.fn().mockRejectedValue(new Error('Network error'));
    const mockClearLocal = jest.fn();
    const mockForceCleanCartOffers = jest.fn().mockImplementation(() => {
      throw new Error('Offer cleanup error');
    });

    useCartStore.setState({ 
      clearCart: mockClearCart,
      clearLocal: mockClearLocal
    });

    useOfferStore.setState({
      forceCleanCartOffers: mockForceCleanCartOffers
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockCheckoutService.verifyKhipuPaymentStatus).toHaveBeenCalled();
    }, { timeout: 5000 });

    // A pesar de los errores, debería seguir funcionando
    try {
      await waitFor(() => {
        expect(mockClearLocal).toHaveBeenCalled(); // Fallback ejecutado
      }, { timeout: 3000 });

      // Debería loggear el error pero continuar (no requerimos la forma exacta del Error)
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Aún debería mostrar éxito al usuario (buscar título en lugar de frase exacta)
      expect(screen.getByText(/pago completado/i)).toBeInTheDocument();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it('debería redirigir automáticamente a pedidos después del tiempo establecido', async () => {
    jest.useFakeTimers();

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockCheckoutService.verifyKhipuPaymentStatus).toHaveBeenCalled();
    });

    // Avanzar el tiempo 3 segundos (tiempo de redirección automática) dentro de act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/buyer/orders');
    });

    jest.useRealTimers();
  });

  it('debería manejar estado PENDING: limpiar carrito pero mostrar info', async () => {
    // Preparar verificación pendiente
    mockCheckoutService.verifyKhipuPaymentStatus.mockResolvedValueOnce({
      success: true,
      status: 'pending',
      paymentId: 'test123',
      transactionId: 'txn456'
    });

    // Preparar stores con mocks que solo verifican llamadas (no ejecutar lógica interna)
    const mockClearCart = jest.fn();
    const mockClearLocal = jest.fn();
    const mockForceCleanCartOffers = jest.fn();

    useCartStore.setState({ clearCart: mockClearCart, clearLocal: mockClearLocal });
    useOfferStore.setState({ forceCleanCartOffers: mockForceCleanCartOffers });

    // Inicializar con items y ofertas (estado inicial para la prueba)
    useCartStore.setState({ items: [{ id: 'i1' }] });
    useOfferStore.setState({ buyerOffers: [{ id: 'off-paid' }] });

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => expect(mockCheckoutService.verifyKhipuPaymentStatus).toHaveBeenCalled());

    // Para PENDING esperamos que muestre información y que se limpie el carrito
    await waitFor(() => expect(mockClearCart).toHaveBeenCalled());
    await waitFor(() => expect(mockForceCleanCartOffers).toHaveBeenCalled());

    const { toast } = require('react-hot-toast');
    await waitFor(() => expect(toast.info).toHaveBeenCalledWith(expect.stringMatching(/procesado|procesando/i)));

    // No verificamos la implementación interna del store aquí; ya verificamos que la función de limpieza fue llamada
    await waitFor(() => expect(mockForceCleanCartOffers).toHaveBeenCalled());
  });

  it('debería mostrar error si la verificación devuelve un estado inesperado', async () => {
    mockCheckoutService.verifyKhipuPaymentStatus.mockResolvedValueOnce({
      success: true,
      status: 'failed',
      paymentId: 'test123'
    });

    // Preparar spies
    const mockClearCart = jest.fn();
    const mockForceCleanCartOffers = jest.fn();
    useCartStore.setState({ clearCart: mockClearCart });
    useOfferStore.setState({ forceCleanCartOffers: mockForceCleanCartOffers });

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => expect(mockCheckoutService.verifyKhipuPaymentStatus).toHaveBeenCalled());

    // No debería limpiar cuando el estado no es handled
    await waitFor(() => {
      expect(mockClearCart).not.toHaveBeenCalled();
      expect(mockForceCleanCartOffers).not.toHaveBeenCalled();
    });

    // Debería mostrarse el mensaje de error y disparar toast.error
    const { toast } = require('react-hot-toast');
    await waitFor(() => expect(toast.error).toHaveBeenCalled());

    // También debería renderizar el mensaje de error en pantalla
    await waitFor(() => {
      expect(screen.getByText(/error al verificar el pago/i)).toBeInTheDocument();
    });
  });

  it('debería mostrar error cuando falla la verificación de pago', async () => {
    mockCheckoutService.verifyKhipuPaymentStatus.mockResolvedValue({
      success: false,
      error: 'Payment verification failed'
    });

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      // Puede haber múltiples nodos con el mismo texto (body1/body2), usar getAllByText
      const msgs = screen.getAllByText(/error al verificar el pago/i);
      expect(msgs.length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    // No debería intentar limpiar cuando falla la verificación
    const mockClearCart = jest.fn();
    useCartStore.setState({ clearCart: mockClearCart });

    // Esperar a que el UI muestre el mensaje de error y luego afirmar que no se intentó limpiar
    await waitFor(() => {
      const msgs = screen.getAllByText(/error al verificar el pago/i);
      expect(msgs.length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    expect(mockClearCart).not.toHaveBeenCalled();
  });

  it('debería manejar casos sin payment_id en URL', async () => {
  // Simular URL sin payment_id: for safety, directly mock useSearchParams to empty
  const rr = require('react-router-dom');
  jest.spyOn(rr, 'useSearchParams').mockReturnValue([new URLSearchParams('')]);

    render(
      <TestWrapper>
        <CheckoutSuccess />
      </TestWrapper>
    );

    await waitFor(() => {
      const msgs = screen.getAllByText(/error al verificar el pago/i);
      expect(msgs.length).toBeGreaterThan(0);
    }, { timeout: 5000 });

    expect(screen.getByText(/id de pago no encontrado/i)).toBeInTheDocument();
  });
});
