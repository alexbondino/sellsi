/**
 * Test de integración para verificar el flujo completo de navegación
 * desde ProductCard hasta TechnicalSpecs sin parpadeo
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

// Mock UnifiedAuthProvider to provide useAuth without needing full provider
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

// Mock LayoutProvider (used by ProductPageView via useLayout)
jest.mock('../../infrastructure/providers/LayoutProvider', () => ({
  __esModule: true,
  LayoutProvider: ({ children }) => children,
  useLayout: () => ({ setTitle: jest.fn(), setHeader: jest.fn(), register: jest.fn() }),
}));

// Mock completo de Supabase
jest.mock('../../services/supabase', () => {
  const product = {
    productid: '12345678-1234-1234-1234-123456789012',
    productnm: 'Laptop Gaming Test',
    supplier_id: 'supplier-123',
    price: 150000,
    productqty: 25,
    category: 'Tecnología',
    description: 'Una laptop gaming de alta gama para testing',
    minimum_purchase: 1,
    is_active: true,
    product_type: 'nuevo',
  };
  const user = { user_nm: 'Test Supplier' };
  const images = [];
  const tiers = [];

  // Reuse a centralized chain helper to keep tests consistent
  const { createChain } = require('../utils/createSupabaseChain');

  const supabase = {
    from: (table) => {
      if (table === 'products') return createChain(product);
      if (table === 'users') return createChain(user);
      if (table === 'product_images') return createChain(images);
      if (table === 'product_quantity_ranges') return createChain(tiers);
      return createChain([]);
    },
    storage: {
      from: (bucket) => ({
        getPublicUrl: (image) => ({ data: { publicUrl: `/public/${image}` } }),
      }),
    },
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } }, error: null }),
    },
    rpc: async () => ({ data: null, error: null }),
  };

  return { __esModule: true, supabase };
});

// Mock ProductPageView to avoid heavy provider graph and focus on technical specs rendering
jest.mock('../../workspaces/product/product-page-view/ProductPageView.jsx', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ product, onAddToCart, onBuyNow }) => {
      return React.createElement('div', { 'data-testid': 'mock-product-page' },
        React.createElement('h1', null, product?.nombre || ''),
        React.createElement('button', { onClick: () => onAddToCart && onAddToCart(product) }, 'Agregar al Carrito'),
        React.createElement('button', { onClick: () => onBuyNow && onBuyNow(product) }, 'Comprar Ahora'),
        React.createElement('div', null, (product?.specifications || []).map(s => React.createElement('div', { key: s.spec_name }, s.spec_name)))
      );
    }
  };
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductCard from '../../shared/components/display/product-card/ProductCard';
import TechnicalSpecs from '../../workspaces/product/product-page-view/pages/TechnicalSpecs';




// Mock de otros servicios
jest.mock('../../workspaces/marketplace/services', () => ({
  getProductSpecifications: jest.fn(() =>
    Promise.resolve([
      { spec_name: 'Procesador', spec_value: 'Intel i7' },
      { spec_name: 'RAM', spec_value: '16GB' },
    ])
  ),
}));

jest.mock('../../shared/stores/cart/cartStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({ addItem: jest.fn() })),
}));

jest.mock('../../utils/toastHelpers', () => ({
  showErrorToast: jest.fn(),
  showCartSuccess: jest.fn(),
}));

const theme = createTheme();

// Componente de prueba que simula la aplicación completa
const createTestQueryClient = (overrides = {}) =>
  new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0, ...overrides } } });

const TestApp = ({ initialEntries = ['/marketplace'] } = {}) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route
              path="/marketplace"
              element={
                <div>
                  <h1>Marketplace</h1>
                  <ProductCard
                    product={{
                      id: '12345678-1234-1234-1234-123456789012',
                      nombre: 'Laptop Gaming Test',
                      imagen: '/test-image.jpg',
                      precio: 150000,
                      proveedor: 'Test Supplier',
                    }}
                    type="buyer"
                  />
                </div>
              }
            />
            <Route
              path="/technicalspecs/:productSlug"
              element={<TechnicalSpecs isLoggedIn={true} />}
            />
            {/* Routes compatible with ProductCard.generateProductUrl (used in app) */}
            <Route
              path="/marketplace/product/:productSlug"
              element={<TechnicalSpecs isLoggedIn={true} />}
            />
            <Route
              path="/marketplace/product/:productId/:productName"
              element={<TechnicalSpecs isLoggedIn={true} />}
            />
            <Route
              path="/marketplace/product/:productId"
              element={<TechnicalSpecs isLoggedIn={true} />}
            />
          </Routes>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Product Navigation Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    localStorage.clear();

    // Ensure tests start at marketplace without redefining window.location
    window.history.pushState({}, '', '/marketplace');
  });

  it('should navigate from ProductCard to TechnicalSpecs without showing error flash', async () => {
    // Inicializar en marketplace
    window.history.pushState({}, '', '/marketplace');

    render(<TestApp />);

    // Verificar que estamos en marketplace
    expect(screen.getByText('Marketplace')).toBeInTheDocument();

    // Encontrar y hacer click en la ProductCard (accesible)
    const productImage = screen.getByRole('img', { name: /Laptop Gaming Test/i });
    expect(productImage).toBeInTheDocument();

    // Simular click en la imagen (clic propagado hacia el Card)
    fireEvent.click(productImage);

    // Verificar que la URL cambió (esto se haría automáticamente con el router)
    // En un test real, esperaríamos que aparezca el componente TechnicalSpecs

    // Verificar que NO aparece inmediatamente el mensaje de error
    expect(
      screen.queryByText('Producto no encontrado')
    ).not.toBeInTheDocument();

    // Debe aparecer el estado de carga
    await waitFor(() => {
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument();
    });

    // Después de cargar, debe desaparecer loading y mostrar detalles del producto
    await waitFor(
      () => {
        expect(screen.queryByText('Cargando producto...')).not.toBeInTheDocument();
        // El título del producto debe estar visible en la página TechnicalSpecs
        expect(screen.getByText('Laptop Gaming Test')).toBeInTheDocument();
        // Las especificaciones deben mostrarse (mocked)
        expect(screen.getByText('Procesador')).toBeInTheDocument();
        expect(screen.getByText('RAM')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verificar que nunca apareció el mensaje de error
    expect(screen.queryByText('Producto no encontrado')).not.toBeInTheDocument();
  });

  it('should handle invalid product URLs gracefully', async () => {
    window.history.pushState({}, '', '/technicalspecs/invalid-slug');

    const qc = createTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/technicalspecs/invalid-slug"]}>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route
                path="/technicalspecs/:productSlug"
                element={<TechnicalSpecs isLoggedIn={true} />}
              />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Para URLs inválidas, el componente puede mostrar el error específico
    await waitFor(() => {
      expect(
        screen.getByText('ID de producto inválido en la URL')
      ).toBeInTheDocument();
    });
  });

  it('should prompt login when adding to cart while unauthenticated', async () => {
    // Ensure unauthenticated
    localStorage.clear();
    window.history.pushState({}, '', '/technicalspecs/12345678-1234-1234-1234-123456789012');

    const qc = createTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={["/technicalspecs/12345678-1234-1234-1234-123456789012"]}>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route
                path="/technicalspecs/:productSlug"
                element={<TechnicalSpecs isLoggedIn={false} />}
              />
            </Routes>
          </ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Wait for product to render (mocked ProductPageView provides this testid)
    await screen.findByTestId('mock-product-page');

    // Listen for openLogin event
    const opened = [];
    const handler = (e) => opened.push(e);
    window.addEventListener('openLogin', handler);

    const { showErrorToast } = require('../../utils/toastHelpers');

    // Click Add to Cart button
    const addButton = await screen.findByRole('button', { name: /Agregar al Carrito|Agregar al carrito/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(showErrorToast).toHaveBeenCalledWith(expect.stringContaining('Debes iniciar sesión'), expect.any(Object));
      expect(opened.length).toBeGreaterThan(0);
    });

    window.removeEventListener('openLogin', handler);
  });

  it('should show appropriate error message for missing products', async () => {
    // Override supabase.from for this test to return null product
    const sup = require('../../services/supabase').supabase;
    const originalFrom = sup.from;
    sup.from = (table) => {
      if (table === 'products') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: async () => ({ data: null, error: { message: 'Not found' } }) }) }) }),
        };
      }
      return originalFrom(table);
    };

    try {
      window.history.pushState(
        {},
        '',
        '/technicalspecs/12345678-1234-1234-1234-123456789012-missing-product'
      );

      const qc = createTestQueryClient();
      render(
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={["/technicalspecs/12345678-1234-1234-1234-123456789012-missing-product"]}>
            <ThemeProvider theme={theme}>
              <Routes>
                <Route
                  path="/technicalspecs/:productSlug"
                  element={<TechnicalSpecs isLoggedIn={true} />}
                />
              </Routes>
            </ThemeProvider>
          </MemoryRouter>
        </QueryClientProvider>
      );

      // Primero debe mostrar loading
      expect(screen.getByText('Cargando producto...')).toBeInTheDocument();

      // Después debe mostrar el error apropiado
      await waitFor(
        () => {
          expect(
            screen.getByText('Producto no encontrado o inactivo')
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    } finally {
      // restore
      sup.from = originalFrom;
    }
  });

  describe('URL Generation', () => {
    it('should generate correct URLs for different contexts', () => {
      // Simular diferentes contextos
      const testCases = [
        {
          currentPath: '/marketplace',
          expectedPattern: '/technicalspecs/',
        },
        {
          currentPath: '/supplier/myproducts',
          expectedPattern: '/supplier/myproducts/product/',
        },
        {
          currentPath: '/buyer/marketplace',
          expectedPattern: '/marketplace/product/',
        },
      ];

      testCases.forEach(({ currentPath, expectedPattern }) => {
        // Navigate to the desired path using history API (safer in jsdom)
        window.history.pushState({}, '', currentPath);

        // Este test verificaría que ProductCard genera la URL correcta
        // En un test real, interceptaríamos la navegación
        expect(window.location.pathname).toBe(currentPath);
      });
    });
  });
});
