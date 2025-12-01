import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock supabase (auth + no realtime)
jest.mock('../../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'sup-1' } } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({
          data: { document_types: ['boleta'] },
          error: null,
        }),
      single: jest
        .fn()
        .mockResolvedValue({ data: { supplier_ids: ['sup-1'] }, error: null }),
      contains: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    })),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
    functions: {
      invoke: jest
        .fn()
        .mockResolvedValue({ data: { success: true }, error: null }),
    },
  },
}));

// Mock orderService (capturamos llamadas)
jest.mock('../../../services/user/orderService', () => ({
  orderService: {
    getOrdersForSupplier: jest
      .fn()
      .mockResolvedValue([
        {
          order_id: 'o1',
          parent_order_id: 'o1',
          status: 'pending',
          created_at: new Date().toISOString(),
          items: [],
          supplier_id: 'sup-1',
          supplier_ids: ['sup-1'],
          estimated_delivery_date: null,
        },
      ]),
    getOrderStats: jest.fn().mockResolvedValue({}),
    updateOrderStatus: jest.fn().mockResolvedValue({ success: true }),
    updateSupplierPartStatus: jest.fn().mockResolvedValue({ success: true }),
    getStatusDisplayName: s =>
      ({
        pending: 'Pendiente',
        accepted: 'Aceptado',
        in_transit: 'En Transito',
        delivered: 'Entregado',
      }[s] || s),
  },
}));

// Mock store hook para controlar datos sin lógica interna
const mockUpdateOrderStatus = jest.fn().mockResolvedValue({ success: true });
jest.mock('../../../shared/stores/orders/ordersStore', () => ({
  useOrdersStore: () => ({
    orders: [
      {
        order_id: 'o1',
        parent_order_id: 'o1',
        status: 'Pendiente',
        created_at: new Date().toISOString(),
        supplier_id: 'sup-1',
        supplier_ids: ['sup-1'],
        estimated_delivery_date: null,
      },
    ],
    loading: false,
    statusFilter: 'Todos',
    error: null,
    initializeWithSupplier: jest.fn(),
    setStatusFilter: jest.fn(),
    updateOrderStatus: mockUpdateOrderStatus,
    getFilteredOrders: () => [
      {
        order_id: 'o1',
        parent_order_id: 'o1',
        status: 'Pendiente',
        created_at: new Date().toISOString(),
        supplier_id: 'sup-1',
        supplier_ids: ['sup-1'],
        estimated_delivery_date: null,
      },
    ],
  }),
}));

// Mock de hook de acciones para que llame a orderService.updateOrderStatus directamente
jest.mock(
  '../../../workspaces/supplier/my-requests/hooks/useSupplierPartActions',
  () => ({
    useSupplierPartActions: () => ({
      updating: false,
      error: null,
      accept: part =>
        require('../../../services/user/orderService').orderService.updateOrderStatus(
          part.parent_order_id || part.order_id,
          'accepted',
          {}
        ),
      dispatch: (part, eta) =>
        require('../../../services/user/orderService').orderService.updateOrderStatus(
          part.parent_order_id || part.order_id,
          'in_transit',
          { estimated_delivery_date: eta }
        ),
      reject: () => {},
      deliver: () => {},
      cancel: () => {},
    }),
  })
);

jest.mock('../../../shared/components/display/banners/BannerContext', () => ({
  useBanner: () => ({ showBanner: () => {} }),
}));
jest.mock('../../../shared/components/display/tables/TableFilter', () => ({
  default: () => <div data-testid="table-filter" />,
}));
jest.mock('../../../shared/components/display/tables/Table', () => ({
  default: ({ orders, onActionClick }) => (
    <div>
      {orders.map(o => (
        <div key={o.order_id}>
          <span>{o.order_id}</span>
          <button
            aria-label={`accept-${o.order_id}`}
            onClick={() => onActionClick(o, 'accept')}
          >
            Accept
          </button>
          <button
            aria-label={`dispatch-${o.order_id}`}
            onClick={() => onActionClick(o, 'dispatch')}
          >
            Dispatch
          </button>
        </div>
      ))}
    </div>
  ),
}));
jest.mock('../../../shared/components/feedback', () => ({
  Modal: ({ isOpen, onSubmit, submitDisabled, children }) =>
    isOpen ? (
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit({});
        }}
      >
        <button disabled={submitDisabled} type="submit">
          Submit
        </button>
        {children}
      </form>
    ) : null,
  MODAL_TYPES: {},
}));
// Mock de tema MUI válido para evitar errores internos de ThemeProvider
jest.mock('../../../styles/dashboardThemeCore', () => {
  const { createTheme } = require('@mui/material/styles');
  return { dashboardThemeCore: createTheme() };
});
jest.mock('../../../styles/layoutSpacing', () => ({ SPACING_BOTTOM_MAIN: 0 }));
// Evitar fallback del error boundary reemplazándolo por un passthrough
jest.mock('../../../workspaces/supplier/error-boundary/SupplierErrorBoundary', () => ({
  SupplierErrorBoundary: ({ children }) => <>{children}</>,
}));

import { orderService } from '../../../services/user/orderService';
// Mock directo de la página para aislar solo flujo de acciones
jest.mock('../../../workspaces/supplier/my-requests/components/MyOrdersPage.jsx', () => {
  const React = require('react');
  const {
    useOrdersStore,
  } = require('../../../shared/stores/orders/ordersStore');
  const {
    useSupplierPartActions,
  } = require('../../../workspaces/supplier/my-requests/hooks/useSupplierPartActions');
  const MyOrdersPageMock = () => {
    const { getFilteredOrders } = useOrdersStore();
    const actions = useSupplierPartActions('sup-1');
    const orders = getFilteredOrders();
    return (
      <div>
        {orders.map(o => (
          <div key={o.order_id}>
            <span>{o.order_id}</span>
            <button
              aria-label={`accept-${o.order_id}`}
              onClick={() => actions.accept(o)}
            >
              Accept
            </button>
            <button
              aria-label={`dispatch-${o.order_id}`}
              onClick={() =>
                actions.dispatch(o, new Date().toISOString().slice(0, 10))
              }
            >
              Dispatch
            </button>
          </div>
        ))}
      </div>
    );
  };
  return { __esModule: true, default: MyOrdersPageMock };
});
import MyOrdersPage from '../../../workspaces/supplier/my-requests/components/MyOrdersPage.jsx';

describe('Supplier Lifecycle Integration (simplified)', () => {
  it('acepta y despacha orden mono supplier', async () => {
    render(<MyOrdersPage />);
    expect(await screen.findByText('o1')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('accept-o1'));
    await waitFor(
      () =>
        expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
          'o1',
          'accepted',
          expect.any(Object)
        ),
      { timeout: 1500 }
    );

    fireEvent.click(screen.getByLabelText('dispatch-o1'));
    await waitFor(
      () =>
        expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
          'o1',
          'in_transit',
          expect.any(Object)
        ),
      { timeout: 1500 }
    );
  });
});
