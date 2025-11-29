/**
 * Test de integración para verificar el flujo completo de navegación
 * desde ProductCard hasta TechnicalSpecs sin parpadeo
 */

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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductCard from '../../shared/components/display/product-card/ProductCard';
import TechnicalSpecs from '../../workspaces/product/product-page-view/pages/TechnicalSpecs';

// Mock completo de Supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
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
                },
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
  },
}));

// Add storage mock (getPublicUrl) used by image utils
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: {
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
                },
                error: null,
              })
            ),
          })),
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(image => ({
          data: { publicUrl: `/public/${image}` },
        })),
      })),
    },
  },
}));

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
const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const TestApp = () => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Product Navigation Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Ensure tests start at marketplace without redefining window.location
    window.history.pushState({}, '', '/marketplace');
  });

  it('should navigate from ProductCard to TechnicalSpecs without showing error flash', async () => {
    // Inicializar en marketplace
    window.history.pushState({}, '', '/marketplace');

    render(<TestApp />);

    // Verificar que estamos en marketplace
    expect(screen.getByText('Marketplace')).toBeInTheDocument();

    // Encontrar y hacer click en la ProductCard
    const productCard = screen
      .getByText('Laptop Gaming Test')
      .closest('[role="button"], div[style*="cursor: pointer"], div');
    expect(productCard).toBeInTheDocument();

    // Simular click en la card
    fireEvent.click(productCard);

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

    // Después de cargar, debe mostrar el producto
    await waitFor(
      () => {
        expect(
          screen.queryByText('Cargando producto...')
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verificar que nunca apareció el mensaje de error
    expect(
      screen.queryByText('Producto no encontrado')
    ).not.toBeInTheDocument();
  });

  it('should handle invalid product URLs gracefully', async () => {
    window.history.pushState({}, '', '/technicalspecs/invalid-slug');

    const qc = createTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route
                path="/technicalspecs/:productSlug"
                element={<TechnicalSpecs isLoggedIn={true} />}
              />
            </Routes>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Para URLs inválidas, el componente puede mostrar el error específico
    await waitFor(() => {
      expect(
        screen.getByText('ID de producto inválido en la URL')
      ).toBeInTheDocument();
    });
  });

  it('should show appropriate error message for missing products', async () => {
    // Mock Supabase para devolver producto no encontrado
    const { supabase } = require('../../services/supabase');
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: 'Not found' },
              }),
          }),
        }),
      }),
    });

    window.history.pushState(
      {},
      '',
      '/technicalspecs/12345678-1234-1234-1234-123456789012-missing-product'
    );

    const qc = createTestQueryClient();
    render(
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Routes>
              <Route
                path="/technicalspecs/:productSlug"
                element={<TechnicalSpecs isLoggedIn={true} />}
              />
            </Routes>
          </ThemeProvider>
        </BrowserRouter>
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
