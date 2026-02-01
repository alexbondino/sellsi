import { act } from 'react';

// Mock temprano del módulo user service
const statusMap = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  in_transit: 'En Transito',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
};

jest.mock('../../../services/user', () => {
  const updateOrderStatus = jest.fn().mockResolvedValue({ success: true });
  const getOrdersForSupplier = jest.fn().mockResolvedValue([
    { order_id: '1', status: 'pending', created_at: new Date().toISOString(), items: [], supplier_ids: ['sup-1'] }
  ]);
  return {
    orderService: {
      getOrdersForSupplier: (...args) => getOrdersForSupplier(...args),
      getOrderStats: jest.fn().mockResolvedValue({}),
      searchOrders: jest.fn().mockResolvedValue([]),
      updateOrderStatus: (...args) => updateOrderStatus(...args),
      getStatusDisplayName: (s) => statusMap[s] || s,
      // Exponer internamente para assertions
      __m: { updateOrderStatus, getOrdersForSupplier }
    }
  };
});

import { useOrdersStore } from '../../../shared/stores/orders/ordersStore';
import { orderService } from '../../../services/user';

const seedOrderDisplay = (overrides={}) => ({
  order_id: '1',
  status: 'Pendiente',
  created_at: new Date().toISOString(),
  items: [],
  supplier_ids: ['sup-1'],
  ...overrides
});

// Helper to set state safely
const setState = (partial) => act(() => { useOrdersStore.setState(partial); });

beforeEach(() => {
  jest.useFakeTimers();
  useOrdersStore.setState({ orders: [], statusFilter: 'Todos', supplierId: 'sup-1', loading: false, error: null });
  orderService.__m.updateOrderStatus.mockReset().mockResolvedValue({ success: true });
  orderService.__m.getOrdersForSupplier.mockReset().mockResolvedValue([
    { order_id: '1', status: 'pending', created_at: new Date().toISOString(), items: [], supplier_ids: ['sup-1'] }
  ]);
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('ordersStore.updateOrderStatus - optimistic flow', () => {
  it('aplica update optimista y mantiene estado en éxito', async () => {
    setState({ orders: [seedOrderDisplay()] });
    await act(async () => {
      await useOrdersStore.getState().updateOrderStatus('1','accepted');
    });
    const order = useOrdersStore.getState().orders[0];
    expect(order.status).toBe('Aceptado');
  expect(orderService.__m.updateOrderStatus).toHaveBeenCalledWith('1','accepted', {});
  });

  it('revert en fallo (result.success=false)', async () => {
    setState({ orders: [seedOrderDisplay()] });
  orderService.__m.updateOrderStatus.mockResolvedValueOnce({ success: false, message: 'boom' });
    let error; 
    await act(async () => {
      try { await useOrdersStore.getState().updateOrderStatus('1','accepted'); } catch(e){ error = e; }
    });
    expect(error).toBeTruthy();
    // fetchOrders debió restaurar status original desde getOrdersForSupplierMock
    const order = useOrdersStore.getState().orders[0];
    expect(order.status).toBe('Pendiente');
  expect(orderService.__m.updateOrderStatus).toHaveBeenCalled();
  expect(orderService.__m.getOrdersForSupplier).toHaveBeenCalled();
  });

  it('revert cuando updateOrderStatus lanza excepción', async () => {
    setState({ orders: [seedOrderDisplay()] });
  orderService.__m.updateOrderStatus.mockRejectedValueOnce(new Error('network')); 
    let error; 
    await act(async () => {
      try { await useOrdersStore.getState().updateOrderStatus('1','accepted'); } catch(e){ error = e; }
    });
    expect(error).toBeTruthy();
    const order = useOrdersStore.getState().orders[0];
    expect(order.status).toBe('Pendiente');
  });

  it('actualiza estimated_delivery_date en dispatch (in_transit)', async () => {
    const future = new Date(Date.now() + 3*86400000).toISOString();
    setState({ orders: [seedOrderDisplay({ status: 'Aceptado' })] });
    await act(async () => {
      await useOrdersStore.getState().updateOrderStatus('1','in_transit', { estimated_delivery_date: future });
    });
    const order = useOrdersStore.getState().orders[0];
    expect(order.status).toBe('En Transito');
    expect(order.estimated_delivery_date).toBe(future);
    expect(order.isLate).toBe(false);
  expect(orderService.__m.updateOrderStatus).toHaveBeenCalledWith('1','in_transit', { estimated_delivery_date: future });
  });

  it('deduplica llamadas concurrentes a updateOrderStatus (misma orden+status)', async () => {
    const { createDeferred } = require('../../utils/deferred');
    const deferred = createDeferred();

    // Replace backend mock to a deferred promise
    orderService.__m.updateOrderStatus.mockReset().mockImplementation(() => deferred.promise);

    setState({ orders: [seedOrderDisplay()] });

    // Fire two concurrent calls
    const p1 = useOrdersStore.getState().updateOrderStatus('1', 'accepted');
    const p2 = useOrdersStore.getState().updateOrderStatus('1', 'accepted');

    // Backend should have been called exactly once thanks to dedupe
    expect(orderService.__m.updateOrderStatus.mock.calls.length).toBe(1);

    // Resolve backend
    deferred.resolve({ success: true });
    await Promise.all([p1, p2]);

    // Both promises resolved and order remains accepted
    const order = useOrdersStore.getState().orders[0];
    expect(order.status).toBe('Aceptado');
  });

  it('no falla ni altera estado al llamar updateOrderStatus para orden inexistente', async () => {
    // No orders in state
    setState({ orders: [] });

    await act(async () => {
      await useOrdersStore.getState().updateOrderStatus('missing', 'accepted');
    });

    // Backend still fue invocado
    expect(orderService.__m.updateOrderStatus).toHaveBeenCalledWith('missing', 'accepted', {});
    expect(useOrdersStore.getState().orders.length).toBe(0);
  });
});
