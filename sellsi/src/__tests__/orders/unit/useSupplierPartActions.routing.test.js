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
});
