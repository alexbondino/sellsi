import { renderHook, act } from '@testing-library/react';

// Mocks tempranos para evitar import.meta.env
jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockResolvedValue({
        data: { supplier_ids: ['sup-1', 'sup-2'] },
        error: null,
      }),
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    functions: { invoke: jest.fn() },
    channel: () => ({ on: () => ({ subscribe: () => {} }) }),
    removeChannel: () => {},
  },
}));
jest.mock('../../../services/user', () => ({
  orderService: {
    updateOrderStatus: jest.fn().mockResolvedValue({ success: true }),
    updateSupplierPartStatus: jest.fn().mockResolvedValue({ success: true }),
  },
}));


import { useSupplierPartActions } from '../../../workspaces/supplier/my-requests/hooks/useSupplierPartActions';
import { orderService } from '../../../services/user';

describe('useSupplierPartActions - routing mono vs multi supplier', () => {
  it('usa updateOrderStatus cuando supplier_ids.length === 1', async () => {
    const part = {
      order_id: 'o1',
      parent_order_id: 'o1',
      supplier_id: 'sup-1',
      supplier_ids: ['sup-1'],
    };
    const { result } = renderHook(() => useSupplierPartActions('sup-1'));
    await act(async () => {
      await result.current.accept(part);
    });
    expect(orderService.updateOrderStatus).toHaveBeenCalled();
    expect(orderService.updateSupplierPartStatus).not.toHaveBeenCalled();
  });

  it('usa updateSupplierPartStatus cuando supplier_ids.length > 1', async () => {
    const part = {
      order_id: 'o2',
      parent_order_id: 'o2',
      supplier_id: 'sup-1',
      supplier_ids: ['sup-1', 'sup-2'],
    };
    const { result } = renderHook(() => useSupplierPartActions('sup-1'));
    await act(async () => {
      await result.current.dispatch(part, '2025-12-31');
    });
    expect(orderService.updateSupplierPartStatus).toHaveBeenCalled();
  });

  it('revisa la rama que obtiene supplier_ids desde supabase cuando faltan en el part', async () => {
    const part = {
      order_id: 'o3',
      parent_order_id: 'o3',
      supplier_id: 'sup-1',
      supplier_ids: undefined,
    };
    const { result } = renderHook(() => useSupplierPartActions('sup-1'));
    await act(async () => {
      await result.current.accept(part);
    });
    // Supabase mock devuelve ['sup-1','sup-2'] -> multi-supplier -> should call updateSupplierPartStatus
    expect(orderService.updateSupplierPartStatus).toHaveBeenCalled();
  });

  it('dedupe: llamadas concurrentes devuelven la misma promesa y sólo hacen una llamada al backend', async () => {
    const { createDeferred } = require('../../utils/deferred');
    const deferred = createDeferred();
    orderService.updateSupplierPartStatus.mockReset().mockImplementation(() => deferred.promise);

    const part = { order_id: 'o4', parent_order_id: 'o4', supplier_id: 'sup-1', supplier_ids: ['sup-1','sup-2'] };
    const { result } = renderHook(() => useSupplierPartActions('sup-1'));

    let p1, p2;
    await act(async () => {
      p1 = result.current.accept(part);
      p2 = result.current.accept(part);
    });

    expect(orderService.updateSupplierPartStatus.mock.calls.length).toBe(1);

    await act(async () => {
      deferred.resolve({ success: true });
      await Promise.all([p1, p2]);
    });

    expect(result.current.error).toBe(null);
  });

  it('error en backend setea error y propaga la excepción', async () => {
    orderService.updateSupplierPartStatus.mockReset().mockRejectedValueOnce(new Error('boom'));
    const part = { order_id: 'o5', parent_order_id: 'o5', supplier_id: 'sup-1', supplier_ids: ['sup-1','sup-2'] };
    const { result } = renderHook(() => useSupplierPartActions('sup-1'));

    let err;
    await act(async () => {
      try { await result.current.accept(part); } catch(e) { err = e; }
    });
    expect(err).toBeTruthy();
    expect(result.current.error).toMatch(/boom/);
  });

});
