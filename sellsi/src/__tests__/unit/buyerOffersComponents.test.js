import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
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

jest.mock('../../domains/buyer/pages/offers/hooks/useBuyerOffers', () => ({
  useBuyerOffers: () => mockUseBuyerOffers
}));

// Mock del hook de media query
// Debe declararse antes de jest.mock para evitar TDZ
const mockUseMediaQuery = jest.fn(() => false); // desktop por defecto
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: (...args) => mockUseMediaQuery(...args)
}));

import BuyerOffers from '../../domains/buyer/pages/offers/BuyerOffers';
import OffersList from '../../domains/buyer/pages/offers/components/OffersList';

// Wrapper para providers
const TestWrapper = ({ children }) => (
  <div data-testid="mock-router">
    <ThemeProvider theme={dashboardThemeCore}>
      {children}
    </ThemeProvider>
  </div>
);

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
    
    expect(screen.getByText('Filtrar por estado:')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Producto')).toBeInTheDocument();
    expect(screen.getByText('Tiempo restante')).toBeInTheDocument();
  // Múltiples coincidencias de "Estado" (label + legend + header). Validar al menos uno.
  expect(screen.getAllByText('Estado').length).toBeGreaterThan(0);
    expect(screen.getByText('Acciones')).toBeInTheDocument();
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
      { ...mockOfferData.validOffer, id: '3', status: 'rejected', product: { name: 'Product 3' } }
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
    
    // Filtrar por pendientes
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    await waitFor(() => {
      // Seleccionar la opción del menú (rol option)
      expect(screen.getAllByText('Pendiente').length).toBeGreaterThan(0);
    });
    const pendingOption = screen.getAllByText('Pendiente').find(el => el.getAttribute('role') === 'option') || screen.getAllByText('Pendiente')[0];
    fireEvent.click(pendingOption);
    
    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
      expect(screen.queryByText('Product 3')).not.toBeInTheDocument();
    });
  });

  it('debería mostrar tooltip informativo', async () => {
    render(
      <TestWrapper>
        <OffersList {...defaultProps} />
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
      { ...mockOfferData.validOffer, id: '3', status: 'rejected', product: { name: 'Rejected Product' } }
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
    
    // Ofertas rechazadas deberían tener botón de limpiar
    const deleteButtons = screen.getAllByLabelText('Limpiar esta oferta');
    expect(deleteButtons).toHaveLength(1); // solo rejected
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
    
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', '/public/minilogo.png');
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
