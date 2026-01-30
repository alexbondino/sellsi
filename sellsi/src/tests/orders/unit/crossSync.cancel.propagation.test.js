/**
 * X-2: Cancel buyer refleja supplier (status Cancelado filtrable)
 *
 * Verifica que si una payment part cambia a estado 'cancelled' (simulando cancelación
 * originada del lado buyer / sistema), tras un refresh el store supplier refleja
 * el display status 'Cancelado' y puede ser filtrado.
 */
import { act } from 'react';
import { useOrdersStore } from '../../../shared/stores/orders/ordersStore';

// === Mock orderService (similar patrón a updateOrderStatus tests) ===
const statusMap = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  in_transit: 'En Transito',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

const mockGetOrdersForSupplier = jest.fn();

jest.mock('../../../services/user', () => ({
  orderService: {
    getOrdersForSupplier: (...a) => mockGetOrdersForSupplier(...a),
    getOrderStats: jest.fn().mockResolvedValue({}),
    searchOrders: jest.fn().mockResolvedValue([]),
    updateOrderStatus: jest.fn().mockResolvedValue({ success: true }),
    getStatusDisplayName: (s) => statusMap[s] || s,
  }
}));

// Estado inicial: pedido accepted
const BASE_ORDER_BACKEND = {
  order_id: 'cx-1',
  status: 'accepted',
  created_at: new Date().toISOString(),
  items: [],
  supplier_ids: ['sup-99']
};

beforeEach(() => {
  jest.useFakeTimers();
  useOrdersStore.setState({ orders: [], statusFilter: 'Todos', supplierId: 'sup-99', loading: false, error: null });
  mockGetOrdersForSupplier.mockReset();
  // Primera fetch: order accepted
  mockGetOrdersForSupplier.mockResolvedValueOnce([BASE_ORDER_BACKEND]);
  // Segunda fetch tras cancel: backend devuelve cancelled
  mockGetOrdersForSupplier.mockResolvedValueOnce([{ ...BASE_ORDER_BACKEND, status: 'cancelled', cancelled_at: new Date().toISOString() }]);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

function getOrder() { return useOrdersStore.getState().orders[0]; }

describe('X-2 Cross Sync cancel propagation supplier', () => {
  it('refresca y muestra estado Cancelado, filtrable por Cancelado', async () => {
    // Inicializar primer fetch
    await act(async () => { await useOrdersStore.getState().fetchOrders(); });
    expect(getOrder().status).toBe('Aceptado');

    // Segundo fetch simula cancelación externa
    await act(async () => { await useOrdersStore.getState().fetchOrders(); });
    expect(getOrder().status).toBe('Cancelado');

    // Aplicar filtro Cancelado y verificar que aparece
    act(() => { useOrdersStore.getState().setStatusFilter('Cancelado'); });
    const filtered = useOrdersStore.getState().getFilteredOrders();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe('Cancelado');

    // Control: filtro Aceptado ahora vacío
    act(() => { useOrdersStore.getState().setStatusFilter('Aceptado'); });
    const none = useOrdersStore.getState().getFilteredOrders();
    expect(none).toHaveLength(0);

    expect(mockGetOrdersForSupplier).toHaveBeenCalledTimes(2);
  });

  it('filtra entre multiple orders correctamente y reporta error on failure', async () => {
    // Setup multi orders: one accepted, one accepted (later one changes to cancelled)
    const base2 = { ...BASE_ORDER_BACKEND, order_id: 'cx-2' };
    mockGetOrdersForSupplier.mockReset();
    // first fetch: two accepted
    mockGetOrdersForSupplier.mockResolvedValueOnce([BASE_ORDER_BACKEND, base2]);
    // second fetch: cx-1 becomes cancelled, cx-2 remains accepted
    mockGetOrdersForSupplier.mockResolvedValueOnce([{ ...BASE_ORDER_BACKEND, status: 'cancelled', cancelled_at: new Date().toISOString() }, base2]);

    await act(async () => { await useOrdersStore.getState().fetchOrders(); });
    // both present
    expect(useOrdersStore.getState().orders.length).toBe(2);

    await act(async () => { await useOrdersStore.getState().fetchOrders(); });
    // now filter cancelled
    act(() => { useOrdersStore.getState().setStatusFilter('Cancelado'); });
    const filtered = useOrdersStore.getState().getFilteredOrders();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].order_id).toBe('cx-1');

    // error path: simulate backend failure
    mockGetOrdersForSupplier.mockRejectedValueOnce(new Error('service fail'));
    await act(async () => { await useOrdersStore.getState().fetchOrders(); });
    expect(useOrdersStore.getState().error).toBeTruthy();
  });
});
