// Test aislado de la lógica de highlight "Pago Confirmado" (B-1)
// Se replica la lógica del efecto en BuyerOrders para evitar dependencias de UI/MUI.

import { createRecentlyPaidTracker, HIGHLIGHT_MS } from '../../../workspaces/buyer/my-orders/utils/recentlyPaidTracker';

jest.useFakeTimers();

describe('BuyerOrders recentlyPaid highlight (B-1)', () => {
  it('agrega id al Set cuando pasa a paid y lo elimina tras 12s', () => {
    const tracker = createRecentlyPaidTracker();
    const baseOrder = { order_id: 'o1', payment_status: 'pending' };

    let r = tracker.applyOrders([baseOrder]);
    expect(r.recentlyPaid.size).toBe(0);

    const paidOrder = { ...baseOrder, payment_status: 'paid' };
    r = tracker.applyOrders([paidOrder]);
    expect(r.recentlyPaid.has('o1')).toBe(true);

    jest.advanceTimersByTime(HIGHLIGHT_MS - 100);
    expect(tracker.getRecentlyPaid().has('o1')).toBe(true);

    jest.advanceTimersByTime(200);
    expect(tracker.getRecentlyPaid().has('o1')).toBe(false);
  });

  it('no reprograma timeout si ya estaba agendado', () => {
    const tracker = createRecentlyPaidTracker();
    const paidOrder = { order_id: 'o2', payment_status: 'paid' };
    tracker.applyOrders([paidOrder]);

    jest.advanceTimersByTime(HIGHLIGHT_MS / 2);
    tracker.applyOrders([paidOrder]);

    jest.advanceTimersByTime(HIGHLIGHT_MS / 2);
    expect(tracker.getRecentlyPaid().has('o2')).toBe(false);
  });

  it('paid -> pending -> paid re-adds highlight and schedules new timeout', () => {
    const tracker = createRecentlyPaidTracker();
    const id = 'o3';
    tracker.applyOrders([{ order_id: id, payment_status: 'paid' }]);

    // advance half the timeout, then mark as pending
    jest.advanceTimersByTime(HIGHLIGHT_MS / 2);
    tracker.applyOrders([{ order_id: id, payment_status: 'pending' }]);

    // still highlighted until original timeout
    expect(tracker.getRecentlyPaid().has(id)).toBe(true);

    // advance remaining half -> removed
    jest.advanceTimersByTime(HIGHLIGHT_MS / 2 + 10);
    expect(tracker.getRecentlyPaid().has(id)).toBe(false);

    // mark paid again -> should re-add and set new timeout
    tracker.applyOrders([{ order_id: id, payment_status: 'paid' }]);
    expect(tracker.getRecentlyPaid().has(id)).toBe(true);

    jest.advanceTimersByTime(HIGHLIGHT_MS + 10);
    expect(tracker.getRecentlyPaid().has(id)).toBe(false);
  });

  it('multiple concurrent orders have independent timeouts', () => {
    const tracker = createRecentlyPaidTracker();
    tracker.applyOrders([
      { order_id: 'a', payment_status: 'paid' },
      { order_id: 'b', payment_status: 'paid' },
    ]);

    expect(tracker.getRecentlyPaid().has('a')).toBe(true);
    expect(tracker.getRecentlyPaid().has('b')).toBe(true);

    // advance to remove 'a' only
    jest.advanceTimersByTime(HIGHLIGHT_MS + 10);
    expect(tracker.getRecentlyPaid().has('a')).toBe(false);
    expect(tracker.getRecentlyPaid().has('b')).toBe(false);
  });

  it('dispose clears timeouts and recentlyPaid immediately', () => {
    const tracker = createRecentlyPaidTracker();
    tracker.applyOrders([{ order_id: 'x', payment_status: 'paid' }]);
    expect(tracker.getRecentlyPaid().has('x')).toBe(true);

    tracker.dispose();
    expect(tracker.getRecentlyPaid().has('x')).toBe(false);

    // advance timers; nothing should change or re-appear
    jest.advanceTimersByTime(HIGHLIGHT_MS * 2);
    expect(tracker.getRecentlyPaid().size).toBe(0);
  });
});
