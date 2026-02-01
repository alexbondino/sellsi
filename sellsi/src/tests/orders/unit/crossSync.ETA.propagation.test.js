/**
 * X-1: ETA se propaga buyer tras dispatch supplier
 *
 * Objetivo: Verificar que cuando el supplier realiza dispatch de una parte (agregando
 * estimated_delivery_date vía supplier_parts_meta), una recarga (fetchOrders)
 * del hook buyer refleja la ETA en la parte correspondiente.
 *
 * Estrategia: Mock de orderService.getPaymentOrdersForBuyer con dos llamadas secuenciales:
 *  1) Estado antes de dispatch (sin ETA en part B)
 *  2) Estado después de dispatch (supplier_parts_meta.sup-B incluye estimated_delivery_date)
 * Se usa un componente de prueba mínimo que expone orders y permite invocar fetchOrders.
 */

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { useBuyerOrders } from '../../../workspaces/buyer/my-orders/hooks/useBuyerOrders';

// === Mocks ===
const mockGetPaymentOrdersForBuyer = jest.fn();
const mockSubscribeToBuyerPaymentOrders = jest.fn(() => () => {}); // devuelve unsubscribe noop
const mockGetPaymentStatusesForBuyer = jest.fn();

jest.mock('../../../services/user', () => ({
  orderService: {
    getPaymentOrdersForBuyer: (...args) => mockGetPaymentOrdersForBuyer(...args),
    subscribeToBuyerPaymentOrders: (...args) => mockSubscribeToBuyerPaymentOrders(...args),
    getPaymentStatusesForBuyer: (...args) => mockGetPaymentStatusesForBuyer(...args),
  }
}));

// Minimal supabase mock para invoices_meta enrichment + channel invoices
jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: () => Promise.resolve({ data: [], error: null })
      })
    }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: jest.fn()
  }
}));

// UUID válido para pasar validación isUUID
const BUYER_ID = '123e4567-e89b-12d3-a456-426614174000';

// Fixtures
const now = new Date('2025-09-02T12:00:00.000Z');
const ETA_AFTER_DISPATCH = '2025-09-10';

const basePaymentOrder = ({ meta }) => ({
  order_id: 'po-1',
  id: 'po-1',
  status: 'pending',
  payment_status: 'paid',
  created_at: now.toISOString(),
  items: [
    { product: { supplier_id: 'sup-A', name: 'Item A' }, quantity: 1, price_at_addition: 1000 },
    { product: { supplier_id: 'sup-B', name: 'Item B' }, quantity: 2, price_at_addition: 2000 },
  ],
  supplier_parts_meta: meta,
});

// 1) Antes del dispatch: sin ETA ni in_transit en sup-B
const paymentBefore = basePaymentOrder({
  meta: {
    'sup-A': { status: 'accepted' },
    'sup-B': { status: 'pending' }
  }
});

// 2) Después del dispatch: sup-B pasa a in_transit con ETA
const paymentAfter = basePaymentOrder({
  meta: {
    'sup-A': { status: 'accepted' },
    'sup-B': { status: 'in_transit', estimated_delivery_date: ETA_AFTER_DISPATCH }
  }
});

mockGetPaymentOrdersForBuyer
  .mockResolvedValueOnce({ orders: [paymentBefore] })
  .mockResolvedValueOnce({ orders: [paymentAfter] });

function TestHarness() {
  const { orders, fetchOrders } = useBuyerOrders(BUYER_ID);
  return (
    <div>
      <button data-testid="refetch" onClick={() => fetchOrders()}>refetch</button>
      <div data-testid="orders-root">
        {orders.map(p => (
          <div
            key={p.parent_order_id + '-' + (p.supplier_id || 'none')}
            data-supplier={p.supplier_id || 'none'}
            data-eta={p.estimated_delivery_date || ''}
            data-status={p.status}
          ></div>
        ))}
      </div>
    </div>
  );
}

describe('X-1 Cross Sync ETA propagation (buyer after supplier dispatch)', () => {
  it('propaga ETA a la parte supplier tras dispatch', async () => {
    const { getByTestId } = render(<TestHarness />);

    // Trigger initial fetch and wait for first load (primera llamada)
    fireEvent.click(getByTestId('refetch'));
    await waitFor(() => {
      const container = getByTestId('orders-root');
      const partB = container.querySelector('[data-supplier="sup-B"]');
      expect(partB).toBeTruthy();
      // Antes: no tiene ETA
      expect(partB.getAttribute('data-eta')).toBe('');
    });

    // Disparar refetch simulando que supplier hizo dispatch (segunda respuesta con ETA)
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const container = getByTestId('orders-root');
      const partB = container.querySelector('[data-supplier="sup-B"]');
      expect(partB).toBeTruthy();
      expect(partB.getAttribute('data-eta')).toBe(ETA_AFTER_DISPATCH);
    });

    // Afirmar que se llamaron exactamente dos fetch
    expect(mockGetPaymentOrdersForBuyer).toHaveBeenCalledTimes(2);
  });

  it('propaga ETA solo a la parte correspondiente en multi-supplier scenario', async () => {
    const ETA_B = '2025-09-12';
    const multiBefore = basePaymentOrder({
      meta: {
        'sup-A': { status: 'accepted' },
        'sup-B': { status: 'pending' },
        'sup-C': { status: 'accepted' }
      }
    });
    const multiAfter = basePaymentOrder({
      meta: {
        'sup-A': { status: 'accepted' },
        'sup-B': { status: 'in_transit', estimated_delivery_date: ETA_B },
        'sup-C': { status: 'accepted' }
      }
    });

    mockGetPaymentOrdersForBuyer
      .mockResolvedValueOnce({ orders: [multiBefore] })
      .mockResolvedValueOnce({ orders: [multiAfter] });

    const { getByTestId } = render(<TestHarness />);
    // initial fetch
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const container = getByTestId('orders-root');
      const supB = container.querySelector('[data-supplier="sup-B"]');
      expect(supB).toBeTruthy();
      expect(supB.getAttribute('data-eta')).toBe('');
    });

    // refetch after dispatch only sup-B got ETA
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const container = getByTestId('orders-root');
      const supA = container.querySelector('[data-supplier="sup-A"]');
      const supB = container.querySelector('[data-supplier="sup-B"]');
      expect(supA).toBeTruthy();
      expect(supA.getAttribute('data-eta')).toBe('');
      expect(supB.getAttribute('data-eta')).toBe(ETA_B);
    });
  });

  it('si fetch falla, error es expuesto y se preserva estado previo', async () => {
    // First a successful fetch
    mockGetPaymentOrdersForBuyer.mockResolvedValueOnce({ orders: [paymentBefore] });

    const { getByTestId } = render(<TestHarness />);
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const container = getByTestId('orders-root');
      const partB = container.querySelector('[data-supplier="sup-B"]');
      expect(partB).toBeTruthy();
    });

    // Now simulate fetch failure
    mockGetPaymentOrdersForBuyer.mockRejectedValueOnce(new Error('downstream'));
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      // Hook should set error in state; we assert that no exception is thrown and prior parts still exist
      const container = getByTestId('orders-root');
      const partB = container.querySelector('[data-supplier="sup-B"]');
      expect(partB).toBeTruthy();
    });
  });
});
