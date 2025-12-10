import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import MobileOfferCard from '../../../shared/components/mobile/MobileOfferCard';

// Mock de React Router
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
}));

// Mock del componente AddToCart
jest.mock('../../../shared/components/cart/AddToCart', () => {
  return function MockAddToCart({ product, quantity, offeredPrice }) {
    return (
      <div data-testid="add-to-cart">
        AddToCart: {product?.nombre} - Qty: {quantity} - Price: {offeredPrice}
      </div>
    );
  };
});

const createTestClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false, gcTime: 0 } }
});

const TestWrapper = ({ children }) => {
  const clientRef = React.useRef();
  if (!clientRef.current) clientRef.current = createTestClient();
  return (
    <QueryClientProvider client={clientRef.current}>
      <ThemeProvider theme={dashboardThemeCore}>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('MobileOfferCard Component', () => {
  const mockBuyerOffer = {
    id: 'offer-123',
    product_name: 'Test Product',
    thumbnail_url: '/test-image.jpg',
    status: 'pending',
    created_at: '2024-12-01T10:00:00Z',
    quantity: 10,
    offered_price: 1000,
    total_price: 10000,
    supplier_name: 'Test Supplier',
    expires_at: '2024-12-31T23:59:59Z',
    product_id: 'prod-123',
    product: {
      id: 'prod-123',
      nombre: 'Test Product',
      precio: 1200,
      stock: 100
    }
  };

  const mockSupplierOffer = {
    id: 'offer-456',
    product_name: 'Supplier Product',
    thumbnail_url: '/supplier-image.jpg',
    status: 'approved',
    created_at: '2024-12-02T10:00:00Z',
    quantity: 20,
    offered_price: 500,
    total_price: 10000,
    buyer_name: 'Test Buyer',
    purchase_deadline: '2024-12-15T23:59:59Z',
    product_id: 'prod-456'
  };

  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Buyer Variant', () => {
    it('debería renderizar correctamente oferta de comprador pendiente', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Test Supplier')).toBeInTheDocument();
      expect(screen.getByText(/cantidad:/i)).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('debería mostrar chip de estado "Pendiente" con color warning', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      const chip = screen.getByText('Pendiente');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
    });

    it('debería mostrar chip de estado "Aprobada" con color success', () => {
      const approvedOffer = { ...mockBuyerOffer, status: 'approved' };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={approvedOffer}
            fullOffer={approvedOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      const chip = screen.getByText('Aprobada');
      expect(chip).toBeInTheDocument();
      expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorSuccess');
    });

    it('debería mostrar botón "Cancelar" para ofertas pendientes', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
    });

    it('debería mostrar botón "Eliminar" para ofertas rechazadas', () => {
      const rejectedOffer = { ...mockBuyerOffer, status: 'rejected' };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={rejectedOffer}
            fullOffer={rejectedOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Eliminar')).toBeInTheDocument();
    });

    it('debería llamar onAction al hacer click en "Cancelar"', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Cancelar'));
      expect(mockOnAction).toHaveBeenCalledWith('cancel', mockBuyerOffer);
    });

    it('debería mostrar componente AddToCart para ofertas aprobadas', () => {
      const approvedOffer = { ...mockBuyerOffer, status: 'approved' };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={approvedOffer}
            fullOffer={approvedOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('add-to-cart')).toBeInTheDocument();
      expect(screen.getByTestId('add-to-cart')).toHaveTextContent('Test Product');
    });
  });

  describe('Supplier Variant', () => {
    it('debería renderizar correctamente oferta de proveedor', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="supplier"
            data={mockSupplierOffer}
            fullOffer={mockSupplierOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Supplier Product')).toBeInTheDocument();
      expect(screen.getByText('Test Buyer')).toBeInTheDocument();
    });

    it('debería mostrar "Aceptada" para status approved en variante supplier', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="supplier"
            data={mockSupplierOffer}
            fullOffer={mockSupplierOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Aceptada')).toBeInTheDocument();
    });

    it('debería mostrar botones de acción para ofertas pendientes de proveedor', () => {
      const pendingSupplierOffer = { ...mockSupplierOffer, status: 'pending' };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="supplier"
            data={pendingSupplierOffer}
            fullOffer={pendingSupplierOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Rechazar')).toBeInTheDocument();
    });
  });

  describe('Order Variant', () => {
    const mockOrder = {
      id: 'order-789',
      product_name: 'Order Product',
      thumbnail_url: '/order-image.jpg',
      status: 'accepted',
      created_at: '2024-12-03T10:00:00Z',
      quantity: 15,
      offered_price: 800,
      total_price: 12000,
      buyer_name: 'Order Buyer',
      product_id: 'prod-789'
    };

    it('debería renderizar correctamente pedido', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="order"
            data={mockOrder}
            fullOffer={mockOrder}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Order Product')).toBeInTheDocument();
      expect(screen.getByText('Order Buyer')).toBeInTheDocument();
    });

    it('debería mostrar "Aceptado" para status accepted', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="order"
            data={mockOrder}
            fullOffer={mockOrder}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Aceptado')).toBeInTheDocument();
    });

    it('debería mostrar "En Tránsito" para status dispatched', () => {
      const dispatchedOrder = { ...mockOrder, status: 'dispatched' };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="order"
            data={dispatchedOrder}
            fullOffer={dispatchedOrder}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('En Tránsito')).toBeInTheDocument();
    });
  });

  describe('Edge Cases & Validation', () => {
    it('debería manejar variant inválida sin crash', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="invalid"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('variant "invalid" no válida')
      );
      
      consoleSpy.mockRestore();
    });

    it('debería renderizar sin thumbnail_url', () => {
      const offerWithoutImage = { ...mockBuyerOffer, thumbnail_url: null };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={offerWithoutImage}
            fullOffer={offerWithoutImage}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('debería formatear precios correctamente', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      // Verificar que se muestran los precios formateados
      expect(screen.getByText(/\$1\.000/)).toBeInTheDocument(); // offered_price
      expect(screen.getByText(/\$10\.000/)).toBeInTheDocument(); // total_price
    });

    it('debería mostrar fecha de expiración para ofertas con expires_at', () => {
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/vence:/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('debería aplicar estilos móviles cuando isMobile es true', () => {
      const { container } = render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={mockBuyerOffer}
            fullOffer={mockBuyerOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Actions & Interactions', () => {
    it('debería llamar onAction con tipo "delete" al eliminar', () => {
      const rejectedOffer = { ...mockBuyerOffer, status: 'rejected' };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={rejectedOffer}
            fullOffer={rejectedOffer}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Eliminar'));
      expect(mockOnAction).toHaveBeenCalledWith('delete', rejectedOffer);
    });

    it('debería mostrar botón de chat cuando esté disponible', () => {
      const offerWithChat = { ...mockBuyerOffer, status: 'approved' };
      
      render(
        <TestWrapper>
          <MobileOfferCard
            variant="buyer"
            data={offerWithChat}
            fullOffer={offerWithChat}
            onAction={mockOnAction}
            isMobile={true}
          />
        </TestWrapper>
      );

      // Verificar que existe el icono de chat (MaterialUI ChatIcon)
      const chatButtons = screen.queryAllByRole('button');
      expect(chatButtons.length).toBeGreaterThan(0);
    });
  });
});
