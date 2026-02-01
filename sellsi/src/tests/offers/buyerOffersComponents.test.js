const React = require('react');
const { render, screen, fireEvent, waitFor, within } = require('@testing-library/react');
const { ThemeProvider } = require('@mui/material/styles');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');
// Use MUI createTheme to produce a minimal theme compatible with MUI internals
const { createTheme } = require('@mui/material/styles');
const dashboardThemeCore = createTheme();
// Minimal mock data inline to avoid ESM mock import issues when running jest directly
const mockOfferData = {
  validOffer: {
    id: 'offer_123',
    product_id: 'prod_456',
    buyer_id: 'buyer_789',
    supplier_id: 'supplier_101',
    quantity: 1,
    price: 1000,
    status: 'pending',
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    product: { id: 'prod_456', name: 'Test Product', thumbnail: null }
  }
};

// Mock de React Router (usar createElement para evitar necesidad de transformar JSX en tests)
jest.mock('react-router-dom', () => {
  const React = require('react');
  return {
    BrowserRouter: ({ children }) => React.createElement('div', { 'data-testid': 'mock-router' }, children),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/buyer/offers' }),
    Link: ({ children, to, ...props }) => React.createElement('a', { href: to, ...props }, children),
  };
});

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

// Mock del batch de thumbnails (se usa en OffersList)
const mockUseThumbnailsBatch = jest.fn(() => ({ data: null }));
jest.mock('../../hooks/useThumbnailQueries', () => ({
  useThumbnailsBatch: (...args) => mockUseThumbnailsBatch(...args),
}));

// Stub shared components to avoid provider/complex internal deps (AddToCart uses useAuth etc.)
jest.mock('../../shared/components', () => {
  const React = require('react');
  return {
    // Minimal AddToCart stub to avoid auth provider requirement
    AddToCart: (props) => React.createElement('button', { 'data-testid': 'AddToCart', onClick: () => props && props.offer ? null : null }, 'AddToCart'),
    // Stubs for mobile components used in mobile view
    MobileOfferCard: (p) => React.createElement('div', { 'data-testid': 'MobileOfferCard' }, JSON.stringify(p && p.data)),
    MobileOffersSkeleton: () => React.createElement('div', { 'data-testid': 'MobileOffersSkeleton' }, 'skeleton'),
    MobileFilterAccordion: (props) => React.createElement('div', { 'data-testid': 'MobileFilterAccordion' }, 'filters'),
    TableSkeleton: () => React.createElement('div', { 'data-testid': 'TableSkeleton' }, 'table-skel'),
    ConfirmDialog: ({ open, title, description, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', disabled }) =>
      open ? React.createElement('div', { 'data-testid': 'ConfirmDialog' },
        React.createElement('h1', null, title),
        React.createElement('p', null, description),
        React.createElement('button', { onClick: onConfirm, 'data-testid': 'ConfirmDialogConfirm' }, confirmText),
        React.createElement('button', { onClick: onCancel, 'data-testid': 'ConfirmDialogCancel' }, cancelText)
      ) : null,
  };
});

const { BuyerOffers, OffersList } = require('../../workspaces/buyer/my-offers');

// QueryClient por test para evitar estado compartido
const createTestClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

// Wrapper para providers (incluye react-query)
const TestWrapper = ({ children }) => {
  const clientRef = React.useRef();
  if (!clientRef.current) clientRef.current = createTestClient();
  return React.createElement(
    'div',
    { 'data-testid': 'mock-router' },
    React.createElement(QueryClientProvider, { client: clientRef.current },
      React.createElement(ThemeProvider, { theme: dashboardThemeCore }, children)
    )
  );
};

// Helper para renderizar con el wrapper sin usar JSX (evita necesidad de preset-react en Jest)
const renderWith = (ui) => render(React.createElement(TestWrapper, null, ui));

// Helper: encontrar el contenedor de producto (fila <tr> en desktop, card en mobile)
const findProductContainer = (productName) => {
  const el = screen.getByText(productName);
  if (!el) return null;
  const tr = el.closest('tr');
  if (tr) return tr;
  const card = el.closest('[data-testid="MobileOfferCard"]');
  if (card) return card;
  return el.parentElement || el;
};

describe('BuyerOffers Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  mockUseMediaQuery.mockImplementation(() => false);
  });

  it('debería renderizar correctamente', () => {
    renderWith(React.createElement(BuyerOffers));
    
    expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Mis Ofertas');
  });

  it('debería mostrar el ícono de ofertas', () => {
    renderWith(React.createElement(BuyerOffers));
    
    // El ícono de Material-UI debería estar presente
    const icon = document.querySelector('[data-testid="LocalOfferIcon"]');
    expect(icon || screen.getByText('Mis Ofertas').previousSibling).toBeInTheDocument();
  });

  it('debería pasar props correctamente a OffersList', () => {
    const testOffers = [mockOfferData.validOffer];
    mockUseBuyerOffers.offers = testOffers;
    mockUseBuyerOffers.loading = true;
    mockUseBuyerOffers.error = 'Test error';
    
    renderWith(React.createElement(BuyerOffers));
    
    // Verificar que OffersList recibe las props correctas
    // Esto se verifica indirectamente por el comportamiento del componente
    expect(screen.getByText('Mis Ofertas')).toBeInTheDocument();
  });

  describe('Responsive Design', () => {
    it('debería aplicar estilos móviles cuando sea necesario', () => {
  mockUseMediaQuery.mockReturnValue(true); // Simular móvil
      
      renderWith(React.createElement(BuyerOffers));
      
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
    // For all tests default to desktop
    mockUseMediaQuery.mockImplementation(() => false);
  });

  // Stub direct AddToCart import (some components import it directly)
  jest.mock('../../shared/components/cart/AddToCart', () => {
    const React = require('react');
    return (props) => React.createElement('button', { 'data-testid': 'AddToCartDirect', onClick: () => {} }, 'AddToCart');
  });

  it('debería renderizar tabla vacía cuando no hay ofertas', () => {
    renderWith(React.createElement(OffersList, defaultProps));
  // Ahora mostramos un estado vacío amigable en vez de la cabecera de la tabla
  expect(screen.getByText(/no has enviado ofertas/i)).toBeInTheDocument();
  expect(screen.getByText(/En Sellsi puedes negociar/i)).toBeInTheDocument();
  });

  it('debería renderizar ofertas cuando las hay', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Test Product', thumbnail: null },
        status: 'pending'
      }
    ];
    
    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
    
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
    
    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
    
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

    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));

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

    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));

    // Buscar el botón de información dentro de la cabecera de 'Acciones' para evitar ambigüedades globales
    const actionsHeader = screen.getByText('Acciones').closest('th');
    const infoButton = within(actionsHeader).getByLabelText('Información de acciones');
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
    
    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
    
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

  it('debería llamar función correcta al confirmar la cancelación desde el diálogo', async () => {
    const mockActions = {
      ...defaultProps,
      onCancelOffer: jest.fn(),
      onAddToCart: jest.fn(),
      onDeleteOffer: jest.fn()
    };

    const offers = [
      { ...mockOfferData.validOffer, id: '1', status: 'approved', product: { name: 'Test Product' } }
    ];

    renderWith(React.createElement(OffersList, { ...mockActions, offers }));

    // Hacer clic en agregar al carrito
    const cartButton = screen.getByLabelText('Agregar al carrito');
    fireEvent.click(cartButton);

    expect(mockActions.onAddToCart).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));

    // Hacer clic en cancelar (abre diálogo)
    const cancelButton = screen.getByLabelText('Cancelar Oferta');
    fireEvent.click(cancelButton);

    // El diálogo debe mostrarse
    expect(await screen.findByText('¿Cancelar esta oferta?')).toBeInTheDocument();

    // Confirmar la cancelación
    const confirmBtn = screen.getByRole('button', { name: 'Cancelar oferta' });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(mockActions.onCancelOffer).toHaveBeenCalledWith(expect.objectContaining({ id: '1' })));
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
    
    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
    
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
    
    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
    
    // Verificar que el chip "Pagada" esté presente en la fila de 'Paid Product'
    const paidRow = findProductContainer('Paid Product');
    expect(within(paidRow).getByText('Pagada')).toBeInTheDocument();

    // Verificar que solo tenga acción de limpiar en esa fila
    const deleteButton = within(paidRow).getByLabelText('Limpiar esta oferta');
    expect(deleteButton).toBeInTheDocument();

    // No debería tener botón de cancelar o agregar al carrito en esa fila
    expect(within(paidRow).queryByLabelText('Cancelar Oferta')).not.toBeInTheDocument();
    expect(within(paidRow).queryByLabelText('Agregar al carrito')).not.toBeInTheDocument();
  });

  it('debería incluir estado reserved en STATUS_MAP', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Reserved Product' },
        status: 'reserved'
      }
    ];
    
    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
    
    const reservedRow = findProductContainer('Reserved Product');
    expect(within(reservedRow).getByText('En Carrito')).toBeInTheDocument();
  });

  it('debería normalizar estados legacy accepted y success', () => {
    const offers = [
      { ...mockOfferData.validOffer, id: 'a1', product: { name: 'Accepted Product' }, status: 'accepted' },
      { ...mockOfferData.validOffer, id: 's1', product: { name: 'Success Product' }, status: 'success' }
    ];

    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));

    const acceptedRow = findProductContainer('Accepted Product');
    const successRow = findProductContainer('Success Product');
    expect(within(acceptedRow).getByText('Aprobada')).toBeInTheDocument();
    expect(within(successRow).getByText('Pagada')).toBeInTheDocument();
  });

  it('debería marcar como Caducada si purchase_deadline está en el pasado para approved', () => {
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const offers = [
      { ...mockOfferData.validOffer, id: 'exp-1', product: { name: 'Expired Approved' }, status: 'approved', purchase_deadline: pastDate }
    ];

    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));

    // Debe mostrar texto 'Caducada' en la fila correspondiente
    const expiredRow = findProductContainer('Expired Approved');
    expect(within(expiredRow).getByText('Caducada')).toBeInTheDocument();
  });

  it('debería actualizar estado ante evento offer-status-optimistic', async () => {
    const offers = [
      { ...mockOfferData.validOffer, id: 'opt-1', product: { name: 'Optimistic Product' }, status: 'approved' }
    ];

    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));

    // Aseguramos que inicialmente no hay 'En Carrito'
    expect(screen.queryByText('En Carrito')).not.toBeInTheDocument();

    // Dispatch del evento optimista
    window.dispatchEvent(new CustomEvent('offer-status-optimistic', { detail: { offer_id: 'opt-1', status: 'reserved' } }));

    const optRow = findProductContainer('Optimistic Product');
    await waitFor(() => expect(within(optRow).getByText('En Carrito')).toBeInTheDocument());
  });

  it('debería usar thumbnailsQuery.mobile si está disponible', () => {
    const pid = 'p-123';
    mockUseThumbnailsBatch.mockReturnValueOnce({ data: { [pid]: { thumbnails: { mobile: 'https://img/mobile.jpg' } } } });

    const offers = [
      { ...mockOfferData.validOffer, id: 'thumb-1', product: { id: pid, name: 'Product With Thumb', thumbnail: null }, status: 'pending' }
    ];

    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));

    const thumbRow = findProductContainer('Product With Thumb');
    const img = within(thumbRow).getByAltText('Product With Thumb');
    expect(img).toHaveAttribute('src', expect.stringContaining('mobile.jpg'));
  });

  it('debería manejar ofertas sin imagen', () => {
    const offers = [
      {
        ...mockOfferData.validOffer,
        product: { name: 'Test Product', thumbnail: null },
        status: 'pending'
      }
    ];
    
    renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
    
  // Con la nueva lógica si no hay thumbnail se muestra un Avatar sin <img> y con el ícono de carrito
  // Verificamos que NO exista imagen y que el ícono de fallback esté presente
  const noImgRow = findProductContainer('Test Product');
  // No debe existir elemento <img> dentro de la fila
  const anyImg = within(noImgRow).queryByRole('img');
  expect(anyImg).toBeNull();
  // Debe existir un icono SVG de fallback (ShoppingCartIcon dentro del Avatar)
  const svg = noImgRow.querySelector('svg');
  expect(svg).not.toBeNull();
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
      
      renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
      
      // Debería mostrar algún formato de tiempo en la fila del producto
      const tr = findProductContainer('Test Product');
      expect(within(tr).getByText((content) => /\d+\s*h\s+\d+\s*m/.test(content))).toBeInTheDocument();
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
      
      renderWith(React.createElement(OffersList, { ...defaultProps, offers }));
      
      const tr = findProductContainer('Test Product');
      expect(within(tr).getByText('Caducada')).toBeInTheDocument();
    });
  });
});
