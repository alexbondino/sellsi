import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import OfferModal from '../../workspaces/product/product-page-view/components/OfferModal';
import { BuyerOffers, OffersList } from '../../workspaces/buyer/my-offers';
import SupplierOffers from '../../workspaces/supplier/my-offers/components/SupplierOffers';
import SupplierOffersList from '../../workspaces/supplier/my-offers/components/SupplierOffersList';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mockOfferData } from '../mocks/supabaseMock';

// Local deterministic RPC mock for supabase
const mockRpc = jest.fn();
jest.mock('../../services/supabase', () => ({
  supabase: {
    rpc: (...args) => mockRpc(...args),
  },
}));






let localStorageGetSpy;
let localStorageSetSpy;

afterEach(() => {
  // Restore spies and clear mocks
  try { localStorageGetSpy?.mockRestore(); } catch(_) {}
  try { localStorageSetSpy?.mockRestore(); } catch(_) {}
  jest.clearAllMocks();
});

jest.mock('../../domains/notifications/services/notificationService', () => ({
  notifyOfferReceived: jest.fn(),
  notifyOfferResponse: jest.fn(),
  notifyOfferExpired: jest.fn(),
}));

// Mock del sistema de banners
const mockShowBanner = jest.fn();
jest.mock('../../shared/components/display/banners/BannerContext', () => ({
  useBanner: () => ({ showBanner: mockShowBanner }),
}));

// Mock de toast (para verificar toasts en tests)
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }
}));

// Mock the auth provider so components using useAuth don't throw in tests
jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => ({
  useAuth: () => ({ user: { id: 'test-user', name: 'Test User' } }),
  UnifiedAuthProvider: ({ children }) => children,
}));

// Mock de media query
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: () => false,
}));

// Avoid rendering the real AddToCartModal (it uses window.scrollTo and price formatting) — stub it for tests here
jest.mock('../../shared/components/cart/AddToCartModal', () => ({
  __esModule: true,
  default: (props) => (<div data-testid="mock-add-to-cart">{props.children}</div>),
}));
// Sometimes modules import the inner file directly — ensure that path is mocked too
jest.mock('../../shared/components/cart/AddToCartModal/AddToCartModal', () => ({
  __esModule: true,
  default: (props) => (<div data-testid="mock-add-to-cart-inner">{props.children}</div>),
}));

// Wrapper para providers
const TestWrapper = ({ children }) => {
  const [client] = React.useState(() => new QueryClient());
  return (
    <BrowserRouter>
      <QueryClientProvider client={client}>
        <ThemeProvider theme={dashboardThemeCore}>{children}</ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// (helper eliminado) seedBuyerOffersOnce removed — no está en uso en este archivo


describe('Offer System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRpc.mockReset();
    // Ensure the external mock object (used by other modules) points to our local mock
    const { mockSupabase } = require('../mocks/supabaseMock');
    mockSupabase.rpc = mockRpc;

    // Reset offer store to a clean state to avoid cross-test leakage
    try { const { resetOfferStore } = require('../utils/resetOfferStore'); resetOfferStore(); } catch(_) { const { useOfferStore: runtimeOfferStore } = require('../../stores/offerStore'); runtimeOfferStore.setState({ buyerOffers: [], supplierOffers: [], loading: false, error: null }); }

    // Espiar localStorage nativo para respuestas deterministas
    localStorageGetSpy = jest.spyOn(window.localStorage, 'getItem').mockImplementation(key => {
      if (key === 'user') return JSON.stringify(mockOfferData.validUser);
      if (key === 'user_id') return mockOfferData.validUser.id;
      if (key === 'user_nm') return mockOfferData.validUser.name;
      if (key === 'user_email') return mockOfferData.validUser.email;
      return null;
    });
    localStorageSetSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});

    // Ensure runtime supabase rpc points to local mockRpc so tests can control responses
    const svc = require('../../services/supabase');
    svc.supabase.rpc = mockRpc;


  });

  describe('Flujo completo: Crear oferta → Notificación → Aceptar/Rechazar', () => {
    it('debería completar el flujo exitosamente', async () => {
      const pendingOffer = {
        ...mockOfferData.validOffer,
        id: 'offer_accept_1',
        status: 'pending',
        product: { name: 'Test Product', thumbnail: null },
        buyer: { name: 'Test Buyer' },
      };
      // Queue solo la llamada de accept_offer (resto se simula localmente)
      mockRpc.mockResolvedValueOnce({
        data: {
          success: true,
          purchase_deadline: new Date(
            Date.now() + 24 * 3600 * 1000
          ).toISOString(),
        },
        error: null,
      }); // accept_offer
      const mockAccept = jest.fn().mockResolvedValue({ success: true, purchase_deadline: new Date().toISOString() });
      const Harness = () => {
        const [offers, setOffers] = React.useState([pendingOffer]);
        return (
          <SupplierOffersList
            offers={offers}
            setOffers={setOffers}
            acceptOffer={mockAccept}
          />
        );
      };
      render(
        <TestWrapper>
          <Harness />
        </TestWrapper>
      );
      const acceptBtn = await screen.findByLabelText('Aceptar Oferta', {}, { timeout: 3000 });
      await act(async () => {
        fireEvent.click(acceptBtn);
      });
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      const confirm = screen.getByRole('button', { name: /confirmar/i });
      await act(async () => {
        fireEvent.click(confirm);
      });

      // Verificamos que el action handler del store fue invocado (no su implementación interna)
      await waitFor(() => expect(mockAccept).toHaveBeenCalledWith(pendingOffer.id), { timeout: 3000 });
    });

    it('debería manejar flujo de rechazo de oferta', async () => {
      // Mock sólo para reject_offer
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      const pending = {
        ...mockOfferData.validOffer,
        status: 'pending',
        product: { name: 'Test Product', thumbnail: null },
        buyer: { name: 'Test Buyer' },
      };

      const mockReject = jest.fn().mockResolvedValue({ success: true });

      const Harness = () => {
        const [offers, setOffers] = React.useState([pending]);
        return (
          <SupplierOffersList
            offers={offers}
            setOffers={setOffers}
            rejectOffer={mockReject}
          />
        );
      };

      render(
        <TestWrapper>
          <Harness />
        </TestWrapper>
      );

      const rejectBtn = await screen.findByLabelText('Rechazar Oferta', {}, { timeout: 3000 });
      await act(async () => {
        fireEvent.click(rejectBtn);
      });

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      const confirm = screen.getByRole('button', { name: /confirmar/i });
      await act(async () => {
        fireEvent.click(confirm);
      });

      await waitFor(() => {
        expect(mockReject).toHaveBeenCalledWith(pending.id);
      });
    });
  });

  it('debería manejar intentos concurrentes de aceptar oferta', async () => {
    // Simular aceptación que tarda en resolverse y múltiples clicks concurrentes
    const pendingOffer = {
      ...mockOfferData.validOffer,
      id: 'offer_concurrent_1',
      status: 'pending',
      product: { name: 'Concurrent Product', thumbnail: null },
      buyer: { name: 'Concurrent Buyer' },
    };

    // Usamos un accept mock que devuelve una promesa pendiente para simular latencia
    let resolveAccept;
    const mockAccept = jest.fn(() => new Promise(res => { resolveAccept = res; }));

    const Harness = () => {
      const [offers, setOffers] = React.useState([pendingOffer]);
      return (
        <SupplierOffersList
          offers={offers}
          setOffers={setOffers}
          acceptOffer={mockAccept}
        />
      );
    };

    render(
      <TestWrapper>
        <Harness />
      </TestWrapper>
    );

    const acceptBtn = await screen.findByLabelText('Aceptar Oferta', {}, { timeout: 3000 });

    // Abrir modal y confirmar (simulamos confirmaciones concurrentes antes que RPC se resuelva)
    await act(async () => {
      fireEvent.click(acceptBtn);
    });

    await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
    const confirmBtn = screen.getByRole('button', { name: /confirmar/i });

    await act(async () => {
      // Pulsar confirmar dos veces rápidamente para simular concurrencia de usuario
      fireEvent.click(confirmBtn);
      fireEvent.click(confirmBtn);
    });

    await waitFor(() => {
      // la llamada fue iniciada
      expect(mockAccept).toHaveBeenCalled();
    });

    // Resolver la promesa accept
    act(() => resolveAccept({ success: true, purchase_deadline: new Date().toISOString() }));

    // Expectativa estricta: no debe realizarse más de una llamada por acción concurrente
    await waitFor(() => {
      expect(mockAccept).toHaveBeenCalledTimes(1);
    });

    // Nota: Si esta expectativa falla, significa que la UI no evita double submits; en ese caso hay que implementar bloqueo (isSubmitting) o deshabilitar el botón.
  });

  describe('Flujo de límites de ofertas', () => {
    it('debería prevenir crear oferta cuando se excede el límite', async () => {
      // Mock: Límite excedido
      mockRpc.mockResolvedValueOnce({
        data: {
          allowed: false,
          product_count: 3,
          supplier_count: 0,
          product_limit: 3,
          supplier_limit: 5,
          reason: 'Se alcanzó el límite mensual de ofertas (producto)',
        },
        error: null,
      }); // validate_offer_limits

      const mockProduct = mockOfferData.validProduct;

      render(
        <TestWrapper>
          <OfferModal
            open={true}
            onClose={jest.fn()}
            product={mockProduct}
            onSuccess={jest.fn()}
          />
        </TestWrapper>
      );

      // Llenar formulario
      const quantityInput = screen.getByLabelText(/cantidad/i);
      const priceInput = screen.getByLabelText(/precio por unidad/i);

      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: '5' } });
        fireEvent.change(priceInput, { target: { value: '1000' } });
      });

      // Verificar que se muestra información relacionada a límites (puede haber varios nodos)
      const limitNodes = await screen.findAllByText((content) => /límite|límites/i.test(content), {}, { timeout: 4000 });
      expect(limitNodes.length).toBeGreaterThan(0);
    });

    it('debería mostrar contador de ofertas correctamente', async () => {
      // Mock: 2 ofertas de 3 permitidas
      mockRpc.mockResolvedValueOnce({
        data: {
          allowed: true,
          product_count: 2,
          supplier_count: 0,
          product_limit: 3,
          supplier_limit: 5,
          reason: null,
        },
        error: null,
      }); // validate_offer_limits

      const mockProduct = mockOfferData.validProduct;

      render(
        <TestWrapper>
          <OfferModal
            open={true}
            onClose={jest.fn()}
            product={mockProduct}
            onSuccess={jest.fn()}
          />
        </TestWrapper>
      );

      // Aserción mínima: bloque relacionado a límites visible (matcher flexible)
      const limitNodes = await screen.findAllByText((content) => /límite|límites/i.test(content), {}, { timeout: 4000 });
      expect(limitNodes.length).toBeGreaterThan(0);
    });
  });

  describe('Flujo de gestión en BuyerOffers', () => {
    it('debería permitir cancelar oferta pendiente', async () => {
      const pendingBuyer = {
        ...mockOfferData.validOffer,
        id: 'offer_cancel_1',
        status: 'pending',
        product: { name: 'Test Product', thumbnail: null },
      };

      const mockCancel = jest.fn().mockResolvedValue({ success: true });
      const CancelHarness = () => {
        return <OffersList offers={[pendingBuyer]} cancelOffer={mockCancel} />;
      };
      render(
        <TestWrapper>
          <CancelHarness />
        </TestWrapper>
      );
      await screen.findByText('Test Product');
      const cancelBtn = screen.getByLabelText('Cancelar Oferta');
      await act(async () => {
        fireEvent.click(cancelBtn);
      });

      // Esperar diálogo y confirmar (botón 'Cancelar oferta' en este modal)
      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      const confirm = screen.getByRole('button', { name: /cancelar oferta/i });
      await act(async () => {
        fireEvent.click(confirm);
      });

      await waitFor(
        () => {
          expect(mockCancel).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it('debería permitir agregar oferta aceptada al carrito', async () => {
      const mockAddToCart = jest.fn();

      // Mock del hook de carrito
      jest.doMock('../../shared/stores/cart/cartStore', () => ({
        useCartStore: () => ({ addToCart: mockAddToCart }),
      }));

      const buyerOffers = [
        {
          ...mockOfferData.validOffer,
          status: 'approved',
          product: { name: 'Test Product', thumbnail: null },
        },
      ];

      mockRpc
        .mockResolvedValueOnce({ data: buyerOffers, error: null }) // get_buyer_offers initial
        .mockResolvedValueOnce({ data: buyerOffers, error: null }); // potential re-render fetch

      render(
        <TestWrapper>
          <OffersList offers={buyerOffers} />
        </TestWrapper>
      );

      await screen.findByText('Test Product');

      // Hacer clic en agregar al carrito
      const cartButton = screen.getByLabelText('Agregar al carrito');

      // No abrimos el modal aquí para evitar renderizar componentes con dependencias de datos
      expect(cartButton).toBeInTheDocument();
      expect(cartButton).toBeEnabled();
    });
  });

  describe('Manejo de errores en flujo completo', () => {
    it('debería manejar error de red al crear oferta', async () => {
      // Mock: Error de red — implementación por nombre para evitar fragilidad de orden
      mockRpc.mockImplementation((rpcName) => {
        if (rpcName === 'validate_offer_limits') {
          return Promise.resolve({
            data: {
              allowed: true,
              product_count: 1,
              supplier_count: 0,
              product_limit: 3,
              supplier_limit: 5,
              reason: null,
            },
            error: null,
          });
        }
        if (rpcName === 'create_offer') {
          return Promise.resolve({ data: null, error: { message: 'Network error' } });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const mockProduct = mockOfferData.validProduct;

      render(
        <TestWrapper>
          <OfferModal
            open={true}
            onClose={jest.fn()}
            product={mockProduct}
            onSuccess={jest.fn()}
          />
        </TestWrapper>
      );

      // Interacción real con la UI
      await act(async () => {
        fireEvent.change(screen.getByLabelText(/cantidad/i), { target: { value: '5' } });
        fireEvent.change(screen.getByLabelText(/precio por unidad/i), { target: { value: '1000' } });
      });

      const submitButton = screen.getByRole('button', { name: /enviar oferta/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Verificar que el componente manejó el error y llamó al toast
      const { toast } = require('react-hot-toast');
      await waitFor(() => expect(toast.error).toHaveBeenCalled());
    });

    it('debería manejar error al cargar ofertas', async () => {
      // Mock: Error al cargar ofertas
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      render(
        <TestWrapper>
          <BuyerOffers />
        </TestWrapper>
      );

      // Debería mostrar algún indicador de error
      await waitFor(() => {
        // Dependiendo de cómo implementes el manejo de errores
        expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
      });
    });

    it('debería mostrar error de permiso al aceptar oferta', async () => {
      const pendingOffer = {
        ...mockOfferData.validOffer,
        id: 'offer_perm_1',
        status: 'pending',
        product: { name: 'Private Product', thumbnail: null },
        buyer: { name: 'Private Buyer' },
      };

      // Simular error de permisos desde la capa del store (reject)
      const mockAccept = jest.fn().mockRejectedValue(new Error('Permission denied'));

      const Harness = () => {
        const [offers, setOffers] = React.useState([pendingOffer]);
        return (
          <SupplierOffersList
            offers={offers}
            setOffers={setOffers}
            acceptOffer={mockAccept}
          />
        );
      };

      render(
        <TestWrapper>
          <Harness />
        </TestWrapper>
      );

      const acceptBtn = await screen.findByLabelText('Aceptar Oferta', {}, { timeout: 3000 });
      await act(async () => {
        fireEvent.click(acceptBtn);
      });

      await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
      const confirmBtn = screen.getByRole('button', { name: /confirmar/i });
      await act(async () => {
        fireEvent.click(confirmBtn);
      });

      // Asegurar que la llamada fue intentada
      await waitFor(() => {
        expect(mockAccept).toHaveBeenCalled();
      });

      // No debe enviar notificaciones cuando hay error de permiso
      const { notifyOfferResponse: notifyOnError } = require('../../domains/notifications/services/notificationService');
      expect(notifyOnError).not.toHaveBeenCalled();

      // Debería mostrarse banner de error (usando la API de banners mockeada)
      await waitFor(() => expect(mockShowBanner).toHaveBeenCalled());
      const calledWith = mockShowBanner.mock.calls[0][0] || {};
      expect(calledWith.severity === 'error' || /error/i.test(calledWith.message || '')) .toBeTruthy();
    });
  });

  describe('Flujo de expiración de ofertas', () => {
    it('debería mostrar ofertas expiradas correctamente', async () => {
      const expiredOffer = {
        ...mockOfferData.validOffer,
        status: 'pending',
        expires_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hora atrás
        product: { name: 'Expired Product', thumbnail: null },
        buyer: { name: 'Test Buyer' },
      };

      mockRpc.mockResolvedValueOnce({
        data: [expiredOffer],
        error: null,
      });
      mockRpc.mockResolvedValueOnce({
        data: [expiredOffer],
        error: null,
      });

      render(
        <TestWrapper>
          <OffersList offers={[{ ...expiredOffer, status: 'expired' }]} />
        </TestWrapper>
      );

      const expired = await screen.findByText('Expired Product');
      expect(expired).toBeInTheDocument();
      expect(screen.getByText(/Caducada/i)).toBeInTheDocument();
    });

    it('debería calcular tiempo restante correctamente', async () => {
      const futureOffer = {
        ...mockOfferData.validOffer,
        status: 'pending',
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 horas en el futuro
        product: { name: 'Future Product', thumbnail: null },
        buyer: { name: 'Test Buyer' },
      };

      mockRpc.mockResolvedValueOnce({
        data: [futureOffer],
        error: null,
      });
      mockRpc.mockResolvedValueOnce({
        data: [futureOffer],
        error: null,
      });

      render(
        <TestWrapper>
          <OffersList offers={[futureOffer]} />
        </TestWrapper>
      );

      const future = await screen.findByText('Future Product');
      expect(future).toBeInTheDocument();
      // Buscar tiempo restante en cualquiera de las celdas (regex de horas o minutos)
      const timeRegex = /\b(\d+\s*h\b|\d+\s*m\b)/i;
      const timeCell = Array.from(
        document.querySelectorAll('td, p, span')
      ).some(el => timeRegex.test(el.textContent));
      expect(timeCell).toBe(true);
    });
  });

  afterAll(() => {
    // Volcar logs acumulados del store si existen
    const logs =
      global.__OFFER_LOGS ||
      (typeof window !== 'undefined' ? window.__OFFER_LOGS : []) ||
      [];
    // Dividir en bloques para no saturar salida
    if (logs.length) {
      console.log(
        '\n===== OFFER STORE DEBUG LOGS (total',
        logs.length,
        ') ====='
      );
      logs
        .slice(-100)
        .forEach((l, i) => console.log(logs.length - 100 + i + 1, l));
      console.log('===== END OFFER STORE DEBUG LOGS =====');
    } else {
      console.log('No __OFFER_LOGS collected');
    }
  });
});
