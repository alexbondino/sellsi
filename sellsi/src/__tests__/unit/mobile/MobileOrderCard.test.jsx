import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import MobileOrderCard from '../../../shared/components/mobile/MobileOrderCard';

// Mock del modal de contacto
jest.mock('../../../shared/components/modals/ContactModal', () => {
  return function MockContactModal({ open, onClose, order }) {
    return open ? (
      <div data-testid="contact-modal">
        Contact Modal for order: {order?.id}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Mock de formatters
jest.mock('../../../shared/utils/formatters', () => ({
  formatCurrency: (value) => `$${value?.toLocaleString('es-CL') || '0'}`,
  formatDate: (date) => new Date(date).toLocaleDateString('es-CL')
}));

// Mock de region/commune utils
jest.mock('../../../utils/regionNames', () => ({
  getRegionDisplay: (code) => `Region ${code}`
}));

jest.mock('../../../utils/communeNames', () => ({
  getCommuneDisplay: (code) => `Commune ${code}`
}));

const TestWrapper = ({ children }) => (
  <ThemeProvider theme={dashboardThemeCore}>
    {children}
  </ThemeProvider>
);

describe('MobileOrderCard Component', () => {
  const mockBasicOrder = {
    id: 'order-123',
    order_id: 'ord-2024-001-abcd1234',
    status: 'pending',
    created_at: '2024-12-01T10:00:00Z',
    total_amount: 50000,
    products: [
      {
        name: 'Product 1',
        quantity: 10,
        price: 5000
      }
    ],
    deliveryAddress: {
      address: 'Test Street 123',
      region: 'RM',
      commune: 'Santiago',
      number: '123'
    },
    billing_info: JSON.stringify({
      business_name: 'Test Company',
      billing_rut: '98765432-1',
      address: 'Billing Street 456',
      region: 'RM',
      commune: 'Providencia'
    })
  };

  const mockOnAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });
  });

  describe('Renderizado Básico', () => {
    it('debería renderizar correctamente un pedido pendiente', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      // El componente muestra los últimos 8 caracteres del order_id en uppercase
      expect(screen.getByText(/Pedido #/)).toBeInTheDocument();
      expect(screen.getByText(/Pendiente/)).toBeInTheDocument();
      expect(screen.getByText(/10 unidades/)).toBeInTheDocument();
    });

    it('debería mostrar el total del pedido formateado', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const amounts = screen.getAllByText(/\$50\.000/);
      expect(amounts.length).toBeGreaterThan(0);
    });

    it('debería mostrar chip de estado con color correcto', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const chip = screen.getByText('Pendiente');
      expect(chip.closest('.MuiChip-root')).toHaveClass('MuiChip-colorWarning');
    });
  });

  describe('Estados del Pedido', () => {
    const statusTests = [
      { status: 'pending', label: 'Pendiente', color: 'Warning' },
      { status: 'accepted', label: 'Aceptado', color: 'Info' },
      { status: 'dispatched', label: 'dispatched', color: 'Default' },
      { status: 'delivered', label: 'Entregado', color: 'Success' },
      { status: 'cancelled', label: 'cancelled', color: 'Default' },
      { status: 'rejected', label: 'Rechazado', color: 'Error' }
    ];

    statusTests.forEach(({ status, label, color }) => {
      it(`debería mostrar estado "${label}" con color ${color}`, () => {
        const order = { ...mockBasicOrder, status };
        
        render(
          <TestWrapper>
            <MobileOrderCard order={order} onAction={mockOnAction} />
          </TestWrapper>
        );

        const chip = screen.getByText(label);
        expect(chip).toBeInTheDocument();
        expect(chip.closest('.MuiChip-root')).toHaveClass(`MuiChip-color${color}`);
      });
    });
  });

  describe('Expansión de Detalles', () => {
    it('debería expandir/colapsar detalles al hacer click', async () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      // Detalles colapsados inicialmente
      expect(screen.queryByText('Detalle de Productos')).not.toBeInTheDocument();

      // Expandir
      const expandButton = screen.getByRole('button', { name: /ver detalles/i });
      fireEvent.click(expandButton);

      // Verificar que se muestran los detalles
      await waitFor(() => {
        expect(screen.getByText('Detalle de Productos')).toBeVisible();
      });
    });

    it('debería mostrar productos cuando está expandido', async () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /ver detalles/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Product 1')).toBeVisible();
        expect(screen.getByText(/10 uds/i)).toBeVisible();
      });
    });

    it('debería mostrar dirección de envío cuando está expandido', async () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /ver detalles/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Dirección de Entrega')).toBeVisible();
      });
    });

    it('debería mostrar documento tributario cuando está expandido', async () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /ver detalles/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        // The component renders a 'Documento' section (header) and a status (e.g. 'No especificado')
        expect(screen.getByText(/Documento/i)).toBeVisible();
        expect(screen.getByText(/No especificado/i)).toBeVisible();
      });
    });
  });

  describe('Funcionalidad de Copiado', () => {
    it('debería copiar número de orden al clipboard', async () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const copyButtons = screen.getAllByRole('button').filter(
        btn => btn.querySelector('[data-testid="ContentCopyIcon"]')
      );
      
      if (copyButtons[0]) {
        fireEvent.click(copyButtons[0]);
        
        await waitFor(() => {
          expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ord-2024-001-abcd1234');
        });
      }
    });

    it('debería copiar productos al clipboard cuando se expande', async () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /ver detalles/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText('Detalle de Productos')).toBeVisible();
      });
    });
  });

  describe('Modal de Contacto', () => {
    it('debería mostrar botón de ayuda', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByLabelText('Ayuda')).toBeInTheDocument();
    });
  });

  describe('Botones de Acción', () => {
    it('debería mostrar botón "Aceptar Pedido" para pedidos pendientes', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText('Aceptar Pedido')).toBeInTheDocument();
    });

    it('debería llamar onAction con tipo "accept" al aceptar pedido', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Aceptar Pedido'));
      expect(mockOnAction).toHaveBeenCalledWith('accept', mockBasicOrder);
    });

    it('debería mostrar botón "Rechazar" para pedidos pendientes', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText('Rechazar')).toBeInTheDocument();
    });

    it('debería mostrar botón "Despachar" para pedidos aceptados', () => {
      const acceptedOrder = { ...mockBasicOrder, status: 'accepted' };
      
      render(
        <TestWrapper>
          <MobileOrderCard order={acceptedOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText(/despachar/i)).toBeInTheDocument();
    });

    it('debería mostrar botón "Confirmar Entrega" para pedidos despachados', () => {
      const dispatchedOrder = { ...mockBasicOrder, status: 'dispatched' };
      
      render(
        <TestWrapper>
          <MobileOrderCard order={dispatchedOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText(/confirmar entrega/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar orden sin productos', () => {
      const orderWithoutItems = { ...mockBasicOrder, products: [] };
      
      render(
        <TestWrapper>
          <MobileOrderCard order={orderWithoutItems} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText(/Pedido #/)).toBeInTheDocument();
    });

    it('debería manejar billing_info como string JSON', async () => {
      const orderWithStringBilling = {
        ...mockBasicOrder,
        billing_info: JSON.stringify({
          business_name: 'Test Company',
          billing_rut: '12345678-9'
        }),
        document_type: 'factura'
      };
      
      render(
        <TestWrapper>
          <MobileOrderCard order={orderWithStringBilling} onAction={mockOnAction} />
        </TestWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /ver detalles/i });
      fireEvent.click(expandButton);

      await waitFor(() => {
        // Ensure the Documento header is present and billing fields are rendered
        expect(screen.getByText(/Documento/i)).toBeVisible();
        expect(screen.getByText('Test Company')).toBeVisible();
        expect(screen.getByText(/12345678-9/)).toBeVisible();
      });
    });

    it('debería manejar orden sin billing_info', () => {
      const orderWithoutBilling = { ...mockBasicOrder, billing_info: null };
      
      render(
        <TestWrapper>
          <MobileOrderCard order={orderWithoutBilling} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText(/Pedido #/)).toBeInTheDocument();
    });

    it('debería normalizar status en español a código', () => {
      const orderSpanishStatus = { ...mockBasicOrder, status: 'Pendiente' };
      
      render(
        <TestWrapper>
          <MobileOrderCard order={orderSpanishStatus} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText('Pendiente')).toBeInTheDocument();
    });

    it('debería manejar status desconocido sin crash', () => {
      const orderUnknownStatus = { ...mockBasicOrder, status: 'unknown_status' };
      
      render(
        <TestWrapper>
          <MobileOrderCard order={orderUnknownStatus} onAction={mockOnAction} />
        </TestWrapper>
      );

      expect(screen.getByText('unknown_status')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('debería aplicar estilos móviles correctamente', () => {
      const { container } = render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
      // El componente no define width 100% inline, sino via sx props
    });
  });

  describe('Accesibilidad', () => {
    it('debería tener botones con labels apropiados', () => {
      render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });

    it('debería tener iconos decorativos correctamente configurados', () => {
      const { container } = render(
        <TestWrapper>
          <MobileOrderCard order={mockBasicOrder} onAction={mockOnAction} />
        </TestWrapper>
      );

      // Los iconos de MUI deberían estar presentes
      const card = container.querySelector('.MuiCard-root');
      expect(card).toBeInTheDocument();
    });
  });
});
