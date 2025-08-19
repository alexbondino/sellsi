import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client used in orderService
vi.mock('../../../services/supabase', () => {
  const selectImpl = vi.fn().mockReturnThis();
  const eqImpl = vi.fn().mockReturnThis();
  const inImpl = vi.fn().mockReturnThis();
  const orderImpl = vi.fn().mockReturnThis();
  const updateImpl = vi.fn().mockReturnThis();
  const maybeSingleImpl = vi.fn().mockResolvedValue({ data: null, error: null });
  const singleImpl = vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } });

  const from = vi.fn(() => ({
    select: selectImpl,
    eq: eqImpl,
    in: inImpl,
    order: orderImpl,
    update: updateImpl,
    maybeSingle: maybeSingleImpl,
    single: singleImpl
  }));

  return { supabase: { from, rpc: vi.fn(), channel: () => ({ on: () => ({ subscribe: () => {} }) }), removeChannel: () => {} } };
});

import { orderService } from '../../../services/user/orderService';

// Helper UUID
const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000';

describe('orderService snapshots (shape smoke tests)', () => {
  beforeEach(() => {
    // No stateful singletons to reset beyond mocks
  });

  it('getPaymentOrdersForSupplier returns empty array shape', async () => {
    const res = await orderService.getPaymentOrdersForSupplier(VALID_UUID);
    expect(res).toEqual([]);
  });

  it('getPaymentOrdersForBuyer returns empty array shape', async () => {
    const res = await orderService.getPaymentOrdersForBuyer(VALID_UUID);
    expect(res).toEqual([]);
  });

  it('getOrdersForSupplier returns empty array shape', async () => {
    const res = await orderService.getOrdersForSupplier(VALID_UUID, {});
    expect(res).toEqual([]);
  });

  it('getOrdersForBuyer returns empty array shape', async () => {
    const res = await orderService.getOrdersForBuyer(VALID_UUID, {});
    expect(res).toEqual([]);
  });

  it('getPaymentStatusesForBuyer returns empty array', async () => {
    const res = await orderService.getPaymentStatusesForBuyer(VALID_UUID);
    expect(res).toEqual([]);
  });

  it('getOrderStats returns structure with zeros', async () => {
    const res = await orderService.getOrderStats(VALID_UUID, {});
    expect(res).toMatchObject({
      total_orders: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
      total_revenue: 0,
      total_items_sold: 0
    });
  });

  it('updateOrderStatus throws for not found order', async () => {
    await expect(orderService.updateOrderStatus(VALID_UUID, 'accepted')).rejects.toThrow();
  });
});
