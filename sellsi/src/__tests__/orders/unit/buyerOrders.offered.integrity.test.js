/**
 * O-2 / O-3 / O-5: Integridad de items ofertados (separación, precio fijo, preservación tras invoice + refetch).
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useBuyerOrders } from '../../../domains/buyer/hooks/orders/useBuyerOrders';

// ==== Mocks ====
const mockGetPaymentOrdersForBuyer = jest.fn();
const mockSubscribeToBuyerPaymentOrders = jest.fn(() => () => {});
const mockGetPaymentStatusesForBuyer = jest.fn();

jest.mock('../../../services/user', () => ({
  orderService: {
    getPaymentOrdersForBuyer: (...a) => mockGetPaymentOrdersForBuyer(...a),
    subscribeToBuyerPaymentOrders: (...a) => mockSubscribeToBuyerPaymentOrders(...a),
    getPaymentStatusesForBuyer: (...a) => mockGetPaymentStatusesForBuyer(...a),
  }
}));

let mockInvoicesSelectCall = 0; // name prefixed with mock* so jest.mock factory can reference it
jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: () => {
          mockInvoicesSelectCall += 1;
          // Primera carga: sin invoice. Segunda: invoice disponible.
          if (mockInvoicesSelectCall === 1) return Promise.resolve({ data: [], error: null });
          return Promise.resolve({ data: [{ order_id: 'po-int-1', supplier_id: 'sup-1', path: 'invoices/sup-1/inv.pdf', created_at: '2025-09-02T12:05:00Z' }], error: null });
        }
      })
    }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: jest.fn()
  }
}));

const BUYER_ID = '123e4567-e89b-12d3-a456-426614174abc';
const baseTime = '2025-09-02T10:00:00.000Z';

function poBefore() {
  return [{
    order_id: 'po-int-1',
    id: 'po-int-1',
    status: 'accepted',
    payment_status: 'paid',
    created_at: baseTime,
    items: [
      { product: { supplier_id: 'sup-1', name: 'Producto X' }, quantity: 1, price_at_addition: 900, product_id: 'px', isOffered: true, offer_id: 'offer-1', offered_price: 900 },
      { product: { supplier_id: 'sup-1', name: 'Producto X' }, quantity: 2, price_at_addition: 1100, product_id: 'px' },
      { product: { supplier_id: 'sup-1', name: 'Producto X' }, quantity: 1, price_at_addition: 800, product_id: 'px', isOffered: true, offer_id: 'offer-2', offered_price: 800 },
    ],
    supplier_parts_meta: { 'sup-1': { status: 'accepted' } }
  }];
}

function poAfter() {
  return [{
    order_id: 'po-int-1',
    id: 'po-int-1',
    status: 'accepted',
    payment_status: 'paid',
    created_at: baseTime,
    items: [
      // Cambiamos product price interno para simular variación externa que NO debe afectar precio ofertado
      { product: { supplier_id: 'sup-1', name: 'Producto X', price: 999999 }, quantity: 1, price_at_addition: 900, product_id: 'px', isOffered: true, offer_id: 'offer-1', offered_price: 900 },
      { product: { supplier_id: 'sup-1', name: 'Producto X' }, quantity: 2, price_at_addition: 1200, product_id: 'px' },
      { product: { supplier_id: 'sup-1', name: 'Producto X' }, quantity: 1, price_at_addition: 800, product_id: 'px', isOffered: true, offer_id: 'offer-2', offered_price: 800 },
    ],
    supplier_parts_meta: { 'sup-1': { status: 'accepted' } }
  }];
}

mockGetPaymentOrdersForBuyer
  .mockResolvedValueOnce(poBefore())
  .mockResolvedValueOnce(poAfter());

function Harness() {
  const { orders, fetchOrders } = useBuyerOrders(BUYER_ID);
  return (
    <div>
      <button data-testid="refetch" onClick={() => fetchOrders()}>refetch</button>
      <div data-testid="count" data-value={orders.length}></div>
      {orders.map(p => (
        <div key={p.order_id} data-part>
          <div data-items-length={p.items.length}></div>
          {p.items.map((it, idx) => (
            <div
              key={idx}
              data-item
              data-product={it.product_id}
              data-offered={it.isOffered ? '1' : ''}
              data-offer-id={it.offer_id || ''}
              data-price={it.price_at_addition}
              data-offered-price={it.offered_price || ''}
              data-invoice={it.invoice_path || ''}
            ></div>
          ))}
        </div>
      ))}
    </div>
  );
}

describe('Ofertados integridad (O-2/O-3/O-5)', () => {
  it('mantiene líneas separadas, precios ofertados fijos y preserva tras invoice + refetch', async () => {
    const { getByTestId, container } = render(<Harness />);

    await waitFor(() => {
      const items = container.querySelectorAll('[data-item]');
      expect(items.length).toBe(3); // O-2: no se fusionan
    });
    const firstFetchItems = Array.from(container.querySelectorAll('[data-item]'));
    const offeredItems = firstFetchItems.filter(n => n.getAttribute('data-offered') === '1');
    expect(offeredItems.length).toBe(2); // dos ofertados
    // O-5 (inicio): no hay invoice aún
    offeredItems.forEach(n => expect(n.getAttribute('data-invoice')).toBe(''));

    // Refetch (segundo fetch con invoice select aportando path)
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const second = Array.from(container.querySelectorAll('[data-item]'));
      expect(second.length).toBe(3); // sigue igual
      const invoicesApplied = second.map(n => n.getAttribute('data-invoice'));
      // Tras segunda carga, invoice_path aplicado a cada item
      invoicesApplied.forEach(v => expect(v).toBe('invoices/sup-1/inv.pdf'));
    });

    const secondItems = Array.from(container.querySelectorAll('[data-item]'));
    const secondOffered = secondItems.filter(n => n.getAttribute('data-offered') === '1');
    // O-5: preserva offered flags tras enrichment
    expect(secondOffered.length).toBe(2);
    // O-3: precios ofertados fijos (900 y 800) ignorando product.price inflado
    const prices = secondOffered.map(n => Number(n.getAttribute('data-price'))).sort();
    expect(prices).toEqual([800, 900]);
    const offeredPrices = secondOffered.map(n => Number(n.getAttribute('data-offered-price'))).sort();
    expect(offeredPrices).toEqual([800, 900]);
  });
});
