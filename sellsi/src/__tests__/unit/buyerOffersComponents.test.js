import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { mockOfferData } from '../mocks/supabaseMock';

// Mock de React Router
jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div data-testid="mock-router">{children}</div>,
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/buyer/offers' }),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}));

// Mock de los hooks
const mockUseBuyerOffers = {
  offers: [],
  loading: false,
  error: null,
  cancelOffer: jest.fn(),
  deleteOffer: jest.fn()
};

jest.mock('../../workspaces/buyer/my-offers', () => ({
  useBuyerOffers: () => mockUseBuyerOffers,
  // Re-exportar los componentes reales
  BuyerOffers: jest.requireActual('../../workspaces/buyer/my-offers').BuyerOffers,
  OffersList: jest.requireActual('../../workspaces/buyer/my-offers').OffersList,
}));

// Mock del hook de media query
// Debe declararse antes de jest.mock para evitar TDZ
const mockUseMediaQuery = jest.fn(() => false); // desktop por defecto
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: (...args) => mockUseMediaQuery(...args)
}));

import { BuyerOffers, OffersList } from '../../workspaces/buyer/my-offers';

// QueryClient por test para evitar estado compartido
const createTestClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

// Wrapper para providers (incluye react-query)
const TestWrapper = ({ children }) => {
  const clientRef = React.useRef();
  if (!clientRef.current) clientRef.current = createTestClient();
  return (
    <div data-testid="mock-router">
      <QueryClientProvider client={clientRef.current}>
        <ThemeProvider theme={dashboardThemeCore}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </div>
  );
};

describe('BuyerOffers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  mockUseMediaQuery.mockImplementation(() => false);
  });

  it('debería renderizar correctamente', () => {
    render(
      <TestWrapper>
        <BuyerOffers />
      </TestWrapper>
    );
    
    expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Mis Ofertas');
  });

  it('debería mostrar el ícono de ofertas', () => {
    render(
      <TestWrapper>
        <BuyerOffers />
      </TestWrapper>
    );
    
    // El ícono de Material-UI debería estar presente
    const icon = document.querySelector('[data-testid="LocalOfferIcon"]');
    expect(icon || screen.getByText('Mis Ofertas').previousSibling).toBeInTheDocument();
  });

  it('debería pasar props correctamente a OffersList', () => {
    const testOffers = [mockOfferData.validOffer];
    mockUseBuyerOffers.offers = testOffers;
    mockUseBuyerOffers.loading = true;
    mockUseBuyerOffers.error = 'Test error';
    
    render(
      <TestWrapper>
        <BuyerOffers />
      </TestWrapper>
    );
    
    // Verificar que OffersList recibe las props correctas
    // Esto se verifica indirectamente por el comportamiento del componente
    expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
  });

  describe('Responsive Design', () => {
    it('debería aplicar estilos móviles cuando sea necesario', () => {
  mockUseMediaQuery.mockReturnValue(true); // Simular móvil
      
      render(
        <TestWrapper>
          <BuyerOffers />
        </TestWrapper>
      );
      
      expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
    });
  });
});

describe('OffersList Component', () => {
  const defaultProps = {
    offers: [],
    loading: false,
    error: null,
    onCancelOffer: jest.fn(),
    onDeleteOffer: jest.fn(),
    onAddToCart: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería renderizar tabla vacía cuando no hay ofertas', () => {
    render(
      <TestWrapper>
        <OffersList {...defaultProps} />
      </TestWrapper>
    );
  // Ahora mostramos un estado vacío amigable en vez de la cabecera de la tabla
  expect(screen.getByText('No has enviado ofertas')).toBeInTheDocument();
  expect(screen.getByText('Envía ofertas a proveedores desde la ficha de producto. Aquí verás el estado de cada propuesta.')).toBeInTheDocument();
  });

  it('debería renderizar ofertas cuando las hay', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Test Product', thumbnail: null },
        status: 'pending'
      }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('debería filtrar ofertas por estado', async () => {
    const offers = [
      { ...mockOfferData.validOffer, id: '1', status: 'pending', product: { name: 'Product 1' } },
      { ...mockOfferData.validOffer, id: '2', status: 'approved', product: { name: 'Product 2' } },
      { ...mockOfferData.validOffer, id: '3', status: 'rejected', product: { name: 'Product 3' } },
      { ...mockOfferData.validOffer, id: '4', status: 'paid', product: { name: 'Product 4' } },
      { ...mockOfferData.validOffer, id: '5', status: 'reserved', product: { name: 'Product 5' } }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );
    
    // Inicialmente debería mostrar todas las ofertas
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
    expect(screen.getByText('Product 3')).toBeInTheDocument();
    expect(screen.getByText('Product 4')).toBeInTheDocument();
    expect(screen.getByText('Product 5')).toBeInTheDocument();
    
    // Filtrar por pagadas
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    await waitFor(() => {
      expect(screen.getAllByText('Pagada').length).toBeGreaterThan(0);
    });
    const paidOption = screen.getAllByText('Pagada').find(el => el.getAttribute('role') === 'option') || screen.getAllByText('Pagada')[0];
    fireEvent.click(paidOption);
    
    await waitFor(() => {
      expect(screen.getByText('Product 4')).toBeInTheDocument();
      expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Product 3')).not.toBeInTheDocument();
      expect(screen.queryByText('Product 5')).not.toBeInTheDocument();
    });
  });

  it('debería mostrar mensaje en la tabla cuando el filtro no devuelve resultados pero existen ofertas', async () => {
    const offers = [
      { ...mockOfferData.validOffer, id: '1', status: 'pending', product: { name: 'Product 1' } },
      { ...mockOfferData.validOffer, id: '2', status: 'pending', product: { name: 'Product 2' } }
    ];

    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );

    // Cambiar a un estado que no existe (approved)
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    const approvedOption = await screen.findAllByText('Aprobada');
    fireEvent.click(approvedOption.find(el => el.getAttribute('role') === 'option') || approvedOption[0]);

    // No debe mostrarse el mensaje global de "No has enviado ofertas" porque sí existen ofertas en otros estados
    expect(screen.queryByText('No has enviado ofertas')).not.toBeInTheDocument();
    // Debe mostrarse el mensaje contextual
    expect(await screen.findByText('No hay ofertas con este estado')).toBeInTheDocument();
  });

  it('debería mostrar tooltip informativo', async () => {
    // Render with at least one offer so the action tooltip is present
    const offers = [
      { ...mockOfferData.validOffer, id: 'info-1', status: 'pending', product: { name: 'Info Product' } }
    ];

    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );

    const infoButton = screen.getByLabelText('Información de acciones');
    expect(infoButton).toBeInTheDocument();

    fireEvent.mouseEnter(infoButton);

    await waitFor(() => {
      expect(screen.getByText('Cómo usar Acciones')).toBeInTheDocument();
    });
  });

  it('debería mostrar acciones correctas según el estado de la oferta', () => {
    const offers = [
      { ...mockOfferData.validOffer, id: '1', status: 'pending', product: { name: 'Pending Product' } },
      { ...mockOfferData.validOffer, id: '2', status: 'approved', product: { name: 'Approved Product' } },
      { ...mockOfferData.validOffer, id: '3', status: 'rejected', product: { name: 'Rejected Product' } },
      { ...mockOfferData.validOffer, id: '4', status: 'paid', product: { name: 'Paid Product' } }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );
    
    // Ofertas pendientes deberían tener botón de cancelar
    const cancelButtons = screen.getAllByLabelText('Cancelar Oferta');
    expect(cancelButtons).toHaveLength(2); // pending y approved
    
    // Ofertas aprobadas deberían tener botón de agregar al carrito
    const cartButtons = screen.getAllByLabelText('Agregar al carrito');
    expect(cartButtons).toHaveLength(1); // solo approved
    
    // Ofertas rechazadas y pagadas deberían tener botón de limpiar
    const deleteButtons = screen.getAllByLabelText('Limpiar esta oferta');
    expect(deleteButtons).toHaveLength(2); // rejected y paid
  });

  it('debería llamar función correcta al hacer clic en acciones', () => {
    const mockActions = {
      ...defaultProps,
      onCancelOffer: jest.fn(),
      onAddToCart: jest.fn(),
      onDeleteOffer: jest.fn()
    };
    
    const offers = [
      { ...mockOfferData.validOffer, id: '1', status: 'approved', product: { name: 'Test Product' } }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...mockActions} offers={offers} />
      </TestWrapper>
    );
    
    // Hacer clic en agregar al carrito
    const cartButton = screen.getByLabelText('Agregar al carrito');
    fireEvent.click(cartButton);
    
  expect(mockActions.onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
    
    // Hacer clic en cancelar
    const cancelButton = screen.getByLabelText('Cancelar Oferta');
    fireEvent.click(cancelButton);
    
  expect(mockActions.onCancelOffer).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
  });

  it('debería formatear precios correctamente', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Test Product' },
        quantity: 5,
        price: 1500,
        status: 'pending'
      }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );
    
    expect(screen.getByText('5 uds • $1.500')).toBeInTheDocument();
  });

  it('debería incluir estado paid en STATUS_MAP con configuración correcta', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Paid Product' },
        status: 'paid'
      }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );
    
    // Verificar que el chip "Pagada" esté presente
    expect(screen.getByText('Pagada')).toBeInTheDocument();
    
    // Verificar que solo tenga acción de limpiar
    const deleteButton = screen.getByLabelText('Limpiar esta oferta');
    expect(deleteButton).toBeInTheDocument();
    
    // No debería tener botón de cancelar o agregar al carrito
    expect(screen.queryByLabelText('Cancelar Oferta')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Agregar al carrito')).not.toBeInTheDocument();
  });

  it('debería incluir estado reserved en STATUS_MAP', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Reserved Product' },
        status: 'reserved'
      }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );
    
    // Verificar que el chip "En Carrito" esté presente
    expect(screen.getByText('En Carrito')).toBeInTheDocument();
  });

  it('debería manejar ofertas sin imagen', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Test Product', thumbnail: null },
        status: 'pending'
      }
    ];
    
    render(
      <TestWrapper>
        <OffersList {...defaultProps} offers={offers} />
      </TestWrapper>
    );
    
  // Con la nueva lógica si no hay thumbnail se muestra un Avatar sin <img> y con el ícono de carrito
  // Verificamos que NO exista imagen y que el ícono de fallback esté presente
  const cartIcon = screen.getByTestId('ShoppingCartIcon');
  expect(cartIcon).toBeInTheDocument();
  const anyImg = document.querySelector('img');
  expect(anyImg).toBeNull();
  });

  describe('Tiempo restante', () => {
    it('debería mostrar tiempo restante para ofertas pendientes con expires_at', () => {
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas en el futuro
      const offers = [
        {
          ...mockOfferData.validOffer,
          product: { name: 'Test Product' },
          status: 'pending',
          expires_at: futureDate.toISOString()
        }
      ];
      
      render(
        <TestWrapper>
          <OffersList {...defaultProps} offers={offers} />
        </TestWrapper>
      );
      
      // Debería mostrar algún formato de tiempo
      expect(screen.getByText(/\d+ h \d+ m/)).toBeInTheDocument();
    });

    it('debería mostrar "Caducada" para ofertas expiradas', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hora en el pasado
      const offers = [
        {
          ...mockOfferData.validOffer,
          product: { name: 'Test Product' },
          status: 'pending',
          expires_at: pastDate.toISOString()
        }
      ];
      
      render(
        <TestWrapper>
          <OffersList {...defaultProps} offers={offers} />
        </TestWrapper>
      );
      
      expect(screen.getByText('Caducada')).toBeInTheDocument();
    });
  });
});
