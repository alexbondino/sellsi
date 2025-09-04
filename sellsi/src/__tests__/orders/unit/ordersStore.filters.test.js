import { act } from 'react';

// Mock temprano del módulo que importa supabase indirectamente para evitar `import.meta.env` en Jest
jest.mock('../../../services/user', () => {
  const map = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    rejected: 'Rechazado',
    in_transit: 'En Transito',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };
  return {
    orderService: {
      getOrdersForSupplier: jest.fn().mockResolvedValue([]),
      getOrderStats: jest.fn().mockResolvedValue({}),
      searchOrders: jest.fn().mockResolvedValue([]),
      updateOrderStatus: jest.fn().mockResolvedValue({ success: true }),
      getStatusDisplayName: (s) => map[s] || s,
    }
  };
});

// Importar después del mock
import { useOrdersStore } from '../../../shared/stores/orders/ordersStore';

// Helper para set estado directamente
const setState = (partial) => {
  act(() => {
    useOrdersStore.setState(partial);
  });
};

describe('ordersStore - filtros y selectores', () => {
  beforeEach(() => {
    useOrdersStore.setState({ orders: [], statusFilter: 'Todos' });
  });

  it('retorna todas cuando filtro = Todos', () => {
    setState({ orders: [ { order_id: '1', status: 'Pendiente' }, { order_id: '2', status: 'Aceptado' } ] });
    const all = useOrdersStore.getState().getFilteredOrders();
    expect(all).toHaveLength(2);
  });

  it('filtra por estado display (Aceptado)', () => {
    setState({ orders: [ { order_id: '1', status: 'Pendiente' }, { order_id: '2', status: 'Aceptado' } ] });
    useOrdersStore.getState().setStatusFilter('Aceptado');
    const filtered = useOrdersStore.getState().getFilteredOrders();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].order_id).toBe('2');
  });

  it('filtra Atrasado usando isLate', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    setState({ orders: [
      { order_id: '1', status: 'Pendiente', isLate: true, estimated_delivery_date: past },
      { order_id: '2', status: 'Pendiente', isLate: false }
    ] });
    useOrdersStore.getState().setStatusFilter('Atrasado');
    const filtered = useOrdersStore.getState().getFilteredOrders();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].order_id).toBe('1');
  });
});
