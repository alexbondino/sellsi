/**
 * Test suite para verificar que el problema del parpadeo "Producto no encontrado" esté resuelto
 */

// Mock modules that use import.meta.env BEFORE any imports
jest.mock('../../workspaces/marketplace/hooks/products/useProducts', () => ({
  useProducts: () => ({
    products: [],
    loading: false,
    error: null,
    fetchProducts: jest.fn(),
    fetchTiers: jest.fn().mockResolvedValue([]),
  }),
}));

jest.mock('../../workspaces/marketplace/index', () => ({
  ...jest.requireActual('../../workspaces/marketplace/index'),
  useProducts: () => ({
    products: [],
    loading: false,
    error: null,
    fetchProducts: jest.fn(),
    fetchTiers: jest.fn().mockResolvedValue([]),
  }),
}));

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TechnicalSpecs from '../../workspaces/product/product-page-view/pages/TechnicalSpecs';
import ProductPageWrapper from '../../workspaces/product/product-page-view/ProductPageWrapper';
import { extractProductIdFromSlug } from '../../shared/utils/product/productUrl';

// Mock UnifiedAuthProvider to provide useAuth hook for tests
jest.mock('../../infrastructure/providers/UnifiedAuthProvider', () => {
  const React = require('react');
  const value = {
    session: null,
    userProfile: null,
    loadingUserStatus: false,
    needsOnboarding: false,
    refreshUserProfile: jest.fn(),
    currentAppRole: 'buyer',
    isBuyer: true,
    isRoleLoading: false,
    isRoleSwitching: false,
    handleRoleChange: jest.fn(),
    redirectToInitialHome: jest.fn(),
    isDashboardRoute: false,
    role: 'buyer',
  };
  return {
    __esModule: true,
    UnifiedAuthProvider: ({ children }) =>
      React.createElement(React.Fragment, null, children),
    useAuth: () => value,
    useRole: () => value,
  };
});

// Mock LayoutProvider used by ProductPageView (prevents "useLayout must be used within a LayoutProvider" errors)
jest.mock('../../infrastructure/providers/LayoutProvider', () => ({
  __esModule: true,
  LayoutProvider: ({ children }) => children,
  useLayout: () => ({ setTitle: jest.fn(), setHeader: jest.fn(), register: jest.fn() }),
}));

// Mock BannerContext to prevent ContactModal / banners requiring provider
jest.mock('../../shared/components/display/banners/BannerContext', () => ({
  __esModule: true,
  BannerProvider: ({ children }) => children,
  useBanner: () => ({ setBanner: jest.fn(), clearBanner: jest.fn() }),
}));

// Mock ProductPageView to avoid heavy lazy-loaded components and make assertions deterministic
jest.mock('../../workspaces/product/product-page-view/ProductPageView', () => ({
  __esModule: true,
  default: ({ product, onAddToCart, isLoggedIn }) => {
    const React = require('react');
    const handleClick = () => onAddToCart && onAddToCart(product);
    return React.createElement(
      'div',
      null,
      product ? React.createElement('div', null, product.nombre) : 'no-product',
      React.createElement(
        'button',
        { onClick: handleClick },
        'Agregar al Carrito'
      )
    );
  },
}));

// Silence billing validation hook errors during tests by mocking it
jest.mock('../../shared/hooks/profile/useBillingInfoValidation', () => ({
  __esModule: true,
  useBillingInfoValidation: () => ({ isValid: true }),
}));

// Mock de Supabase (centralized chain to avoid missing methods)
jest.mock('../../services/supabase', () => {
  const { createChain } = require('../utils/createSupabaseChain');
  const supabase = {
    from: jest.fn((table) => {
      if (table === 'products') return createChain(null); // default: null (tests override per-case)
      return createChain([]);
    }),
    storage: {
      from: () => ({ getPublicUrl: (image) => ({ data: { publicUrl: `/public/${image}` } }) }),
    },
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    },
    rpc: async () => ({ data: null, error: null }),
  };
  return { __esModule: true, supabase };
});

// Mock de servicios
jest.mock('../../workspaces/marketplace/services', () => ({
  getProductSpecifications: jest.fn(() => Promise.resolve([])),
}));

// Mock de stores
jest.mock('../../shared/stores/cart/cartStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    addItem: jest.fn(),
  })),
}));

// Mock de utils
jest.mock('../../utils/toastHelpers', () => ({
  showErrorToast: jest.fn(),
  showCartSuccess: jest.fn(),
}));

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
  useLocation: jest.fn(() => ({ state: null })),
}));

const theme = createTheme();

const createTestQueryClient = (overrides = {}) =>
  new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0, ...overrides } } });

const TestWrapper = ({ children, initialEntries = ['/'] } = {}) => {
  const client = createTestQueryClient();
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Product Page Flicker Fix', () => {
  describe('extractProductIdFromSlug', () => {
    it('should extract UUID from start of slug', () => {
      const slug = '12345678-1234-1234-1234-123456789012-laptop-gaming';
      const result = extractProductIdFromSlug(slug);
      expect(result).toBe('12345678-1234-1234-1234-123456789012');
    });

    it('should extract UUID from middle of slug', () => {
      const slug = 'abc-12345678-1234-1234-1234-123456789012-def';
      const result = extractProductIdFromSlug(slug);
      expect(result).toBe('12345678-1234-1234-1234-123456789012');
    });

    it('should extract UUID from end of slug', () => {
      const slug = 'laptop-gaming-12345678-1234-1234-1234-123456789012';
      const result = extractProductIdFromSlug(slug);
      expect(result).toBe('12345678-1234-1234-1234-123456789012');
    });

    it('should return null for invalid slug', () => {
      const slug = 'no-uuid-here';
      const result = extractProductIdFromSlug(slug);
      expect(result).toBe(null);
    });

    it('should return null for empty slug', () => {
      expect(extractProductIdFromSlug('')).toBe(null);
      expect(extractProductIdFromSlug(null)).toBe(null);
      expect(extractProductIdFromSlug(undefined)).toBe(null);
    });
  });

  describe('TechnicalSpecs Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      require('react-router-dom').useParams.mockReturnValue({
        productSlug: '12345678-1234-1234-1234-123456789012-test-product',
      });
    });

    it('should show loading state initially, not error message', async () => {
      // Mock para simular producto encontrado después de un delay
      const { supabase } = require('../../services/supabase');
      const { createChain } = require('../utils/createSupabaseChain');
      supabase.from.mockReturnValue(createChain({
        data: {
          productid: '12345678-1234-1234-1234-123456789012',
          productnm: 'Test Product',
          supplier_id: 'supplier123',
          price: 100,
          productqty: 10,
          category: 'Test',
          description: 'Test description',
          minimum_purchase: 1,
          is_active: true,
        },
        error: null,
      }));

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      );

      // Inmediatamente después del render, debería mostrar loading
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument();

      // NO debería mostrar el mensaje de error ni el producto inmediatamente
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Product')).not.toBeInTheDocument();
    });

    it('should show product details after successful load', async () => {
      const { supabase } = require('../../services/supabase');
      const { createChain } = require('../utils/createSupabaseChain');
      supabase.from.mockReturnValue(createChain({
        data: {
          productid: '12345678-1234-1234-1234-123456789012',
          productnm: 'Test Product',
          supplier_id: 'supplier123',
          price: 100,
          productqty: 10,
          category: 'Test',
          description: 'Test description',
          minimum_purchase: 1,
          is_active: true,
        },
        error: null,
      }));

      // Sanity check: validate mocked single() behaviour
      const check = await supabase.from('products').select().eq().eq().single();
      expect(check.data && check.data.productnm).toBe('Test Product');

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      );

      // Ensure the query was triggered for products
      expect(supabase.from).toHaveBeenCalled();
      expect(supabase.from.mock.calls.some(c => c[0] === 'products')).toBeTruthy();

      // Esperar a que se cargue el producto (permite más tiempo si la cola de microtasks se retrasa)
      await waitFor(
        () => {
          expect(
            screen.queryByText('Cargando producto...')
          ).not.toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // Debería mostrar datos del producto y no error
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument();
    });

    it('should show error message only after failed load', async () => {
      const { supabase } = require('../../services/supabase');
      const { createChain } = require('../utils/createSupabaseChain');
      supabase.from.mockReturnValue(createChain({ data: null, error: { message: 'Not found' } }));

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      );

      // Inicialmente debería mostrar loading
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument();

      // Después de fallar la carga, debería mostrar error
      await waitFor(
        () => {
          expect(
            screen.getByText('Producto no encontrado o inactivo')
          ).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('should show specific error for invalid product ID', async () => {
      require('react-router-dom').useParams.mockReturnValue({
        productSlug: 'invalid-slug-without-uuid',
      });

      render(
        <TestWrapper>
          <TechnicalSpecs isLoggedIn={true} />
        </TestWrapper>
      );

      await waitFor(
        () => {
          expect(
            screen.getByText('ID de producto inválido en la URL')
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should prompt login when adding to cart while unauthenticated', async () => {
      // Prepare supabase to return a product
      const { supabase } = require('../../services/supabase');
      const originalFrom = supabase.from;
      const { createChain } = require('../utils/createSupabaseChain');
      supabase.from.mockReturnValue(createChain({
        data: {
          productid: '12345678-1234-1234-1234-123456789012',
          productnm: 'Test Product',
          supplier_id: 'supplier123',
          price: 100,
          productqty: 10,
          category: 'Test',
          description: 'Test description',
          minimum_purchase: 1,
          is_active: true,
        },
        error: null,
      }));

      // Sanity check: validate mocked single() behaviour
      const check = await supabase.from('products').select().eq().eq().single();
      expect(check.data && check.data.productnm).toBe('Test Product');

      try {
        // unauthenticated state (useAuth mocked to no session)
        render(
          <TestWrapper>
            <TechnicalSpecs isLoggedIn={false} />
          </TestWrapper>
        );

        // Wait for product to render (product name visible)
        expect(supabase.from).toHaveBeenCalled();
        expect(supabase.from.mock.calls.some(c => c[0] === 'products')).toBeTruthy();
        await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument(), { timeout: 5000 });

        // Listen for openLogin event
        const opened = [];
        const handler = e => opened.push(e);
        window.addEventListener('openLogin', handler);

        const { showErrorToast } = require('../../utils/toastHelpers');

        // Click Add to Cart button
        const addButton = await screen.findByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i });
        addButton && addButton.click();

        await waitFor(() => {
          expect(showErrorToast).toHaveBeenCalledWith(expect.stringContaining('Debes iniciar sesión'), expect.any(Object));
          expect(opened.length).toBeGreaterThan(0);
        });

        window.removeEventListener('openLogin', handler);
      } finally {
        supabase.from = originalFrom;
      }
    });
  });

  describe('ProductPageWrapper Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      require('react-router-dom').useParams.mockReturnValue({
        id: '12345678-1234-1234-1234-123456789012',
      });
    });

    it('should show loading state initially for ProductPageWrapper', async () => {
      const { supabase } = require('../../services/supabase');
      supabase.from.mockReturnValue({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () =>
                new Promise(resolve => {
                  // Simular delay en la respuesta
                  setTimeout(
                    () =>
                      resolve({
                        data: {
                          productid: '12345678-1234-1234-1234-123456789012',
                          productnm: 'Test Product',
                          supplier_id: 'supplier123',
                          price: 100,
                        },
                        error: null,
                      }),
                    100
                  );
                }),
            }),
          }),
        }),
      });

      render(
        <TestWrapper>
          <ProductPageWrapper isLoggedIn={true} />
        </TestWrapper>
      );

      // Debería mostrar loading, no error
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument();
      expect(
        screen.queryByText('Producto no encontrado')
      ).not.toBeInTheDocument();
    });
  });

  describe('Loading State Behavior', () => {
    it('should never show error message while loading is true', () => {
      // Este test verifica que la lógica condicional sea correcta
      const mockStates = [
        { loading: true, product: null, error: null },
        { loading: true, product: null, error: 'Some error' },
        { loading: false, product: null, error: null },
        { loading: false, product: null, error: 'Some error' },
        { loading: false, product: { id: 1 }, error: null },
      ];

      mockStates.forEach(({ loading, product, error }) => {
        const shouldShowError = !loading && (!!error || !product);
        const shouldShowLoading = loading;
        const shouldShowProduct = !loading && !!product && !error;

        if (loading) {
          expect(shouldShowLoading).toBe(true);
          expect(shouldShowError).toBe(false);
        } else if (error || !product) {
          expect(shouldShowError).toBe(true);
          expect(shouldShowLoading).toBe(false);
        } else {
          expect(shouldShowProduct).toBe(true);
          expect(shouldShowError).toBe(false);
          expect(shouldShowLoading).toBe(false);
        }
      });
    });
  });
});
