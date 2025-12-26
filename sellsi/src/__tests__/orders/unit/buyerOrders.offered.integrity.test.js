/**
 * O-2 / O-3 / O-5: Integridad de items ofertados (separación, precio fijo, preservación tras invoice + refetch).
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useBuyerOrders } from '../../../workspaces/buyer/my-orders/hooks/useBuyerOrders';

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

let mockInvoicesResponses = [
  [],
  [{ order_id: 'po-int-1', supplier_id: 'sup-1', path: 'invoices/sup-1/inv.pdf', created_at: '2025-09-02T12:05:00Z' }]
];
let mockInvoicesSelectCall = 0;
let mockInvoicesCallback = null; 

jest.mock('../../../services/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: () => {
          mockInvoicesSelectCall += 1;
          const resp = mockInvoicesResponses[mockInvoicesSelectCall - 1] ?? [];
          return Promise.resolve({ data: resp, error: null });
        }
      })
    }),
    channel: () => ({
      on: (event, filter, cb) => {
        mockInvoicesCallback = cb;
        return { subscribe: () => ({}) };
      }
    }),
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
  .mockResolvedValueOnce({ orders: poBefore(), count: poBefore().length })
  .mockResolvedValueOnce({ orders: poAfter(), count: poAfter().length });

function Harness() {
  const { orders, fetchOrders, error } = useBuyerOrders(BUYER_ID);
  return (
    <div>
      <button data-testid="refetch" onClick={() => fetchOrders()}>refetch</button>
      <div data-testid="count" data-value={orders.length}></div>
      {error && <div data-testid="error" data-value={error}></div>}
      {orders.map(p => (
        <div key={`${p.order_id}-${p.supplier_id || ''}`} data-part>
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

    // Trigger initial fetch (in production BuyerOrders triggers this; harness exposes a button)
    fireEvent.click(getByTestId('refetch'));

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

  it('applies invoices only to matching supplier (multi-supplier)', async () => {
    const poMulti = [{
      order_id: 'po-ms-1',
      id: 'po-ms-1',
      status: 'accepted',
      payment_status: 'paid',
      created_at: baseTime,
      items: [
        { product: { supplier_id: 'sup-1', name: 'P1' }, quantity: 1, price_at_addition: 1000, product_id: 'p1', isOffered: true, offer_id: 'off-1', offered_price: 900 },
        { product: { supplier_id: 'sup-2', name: 'P2' }, quantity: 1, price_at_addition: 200, product_id: 'p2' }
      ],
      supplier_parts_meta: { 'sup-1': { status: 'accepted' }, 'sup-2': { status: 'accepted' } }
    }];

    mockGetPaymentOrdersForBuyer.mockResolvedValueOnce({ orders: poMulti, count: poMulti.length });
mockInvoicesSelectCall = 0;
mockInvoicesResponses = [[], [{ order_id: 'po-ms-1', supplier_id: 'sup-2', path: 'invoices/sup-2/inv.pdf', created_at: '2025-09-02T12:00:00Z' }]];

    const { getByTestId, container } = render(<Harness />);
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const items = container.querySelectorAll('[data-item]');
      expect(items.length).toBe(2);
    });

    // Second fetch (invoice now available for sup-2)
    mockGetPaymentOrdersForBuyer.mockResolvedValueOnce({ orders: poMulti, count: poMulti.length });
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const items = Array.from(container.querySelectorAll('[data-item]'));
      const sup2 = items.find(n => n.getAttribute('data-product') === 'p2');
      expect(sup2.getAttribute('data-invoice')).toBe('invoices/sup-2/inv.pdf');
      const sup1 = items.find(n => n.getAttribute('data-product') === 'p1');
      expect(sup1.getAttribute('data-invoice')).toBe('');
    });
  });

  it('applies the latest invoice when multiple rows exist (last-write-wins)', async () => {
    const po = [{
      order_id: 'po-lw-1',
      id: 'po-lw-1',
      status: 'accepted',
      payment_status: 'paid',
      created_at: baseTime,
      items: [
        { product: { supplier_id: 'sup-1', name: 'P1' }, quantity: 1, price_at_addition: 100, product_id: 'plw' }
      ],
      supplier_parts_meta: { 'sup-1': { status: 'accepted' } }
    }];

    mockGetPaymentOrdersForBuyer.mockResolvedValueOnce({ orders: po, count: po.length });
mockInvoicesSelectCall = 0;
    mockInvoicesResponses = [[
      { order_id: 'po-lw-1', supplier_id: 'sup-1', path: 'inv-new.pdf', created_at: '2025-09-02T13:00:00Z' }
    ]];

    const { getByTestId, container } = render(<Harness />);
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const items = Array.from(container.querySelectorAll('[data-item]'));
      expect(items[0].getAttribute('data-invoice')).toBe('inv-new.pdf');
    });
  });

  it('sets error when orderService fails', async () => {
    mockGetPaymentOrdersForBuyer.mockRejectedValueOnce(new Error('service down'));

    const { getByTestId } = render(<Harness />);
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const err = getByTestId('error');
      expect(err.getAttribute('data-value')).toBe('service down');
    });
  });

  it('preserves offered flag when offered_price missing and falls back to price_at_addition', async () => {
    const po = [{
      order_id: 'po-no-offer-price',
      id: 'po-no-offer-price',
      status: 'accepted',
      payment_status: 'paid',
      created_at: baseTime,
      items: [
        { product: { supplier_id: 'sup-1', name: 'P' }, quantity: 1, price_at_addition: 500, product_id: 'p1', isOffered: true, offer_id: 'off-noprice' }
      ],
      supplier_parts_meta: { 'sup-1': { status: 'accepted' } }
    }];

    mockGetPaymentOrdersForBuyer.mockResolvedValueOnce({ orders: po, count: po.length });
    mockInvoicesSelectCall = 0;
    mockInvoicesResponses = [[]];

    const { getByTestId, container } = render(<Harness />);
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const items = Array.from(container.querySelectorAll('[data-item]'));
      const offered = items.find(n => n.getAttribute('data-offered') === '1');
      expect(offered).toBeDefined();
      expect(Number(offered.getAttribute('data-price'))).toBe(500);
      expect(offered.getAttribute('data-offered-price')).toBe('');
    });
  });

  it('applies invoice when INSERT arrives via channel (realtime)', async () => {
    const po = [{
      order_id: 'po-rt-1',
      id: 'po-rt-1',
      status: 'accepted',
      payment_status: 'paid',
      created_at: baseTime,
      items: [
        { product: { supplier_id: 'sup-1', name: 'P' }, quantity: 1, price_at_addition: 100, product_id: 'prt' }
      ],
      supplier_parts_meta: { 'sup-1': { status: 'accepted' } }
    }];

    mockGetPaymentOrdersForBuyer.mockResolvedValueOnce({ orders: po, count: po.length });
    mockInvoicesSelectCall = 0;
    mockInvoicesResponses = [[]];

    const { getByTestId, container } = render(<Harness />);
    fireEvent.click(getByTestId('refetch'));

    await waitFor(() => {
      const items = Array.from(container.querySelectorAll('[data-item]'));
      expect(items.length).toBe(1);
      expect(items[0].getAttribute('data-invoice')).toBe('');
    });

    // Simulate channel INSERT callback
    if (typeof mockInvoicesCallback === 'function') {
      mockInvoicesCallback({ new: { order_id: 'po-rt-1', supplier_id: 'sup-1', path: 'invoices/sup-1/rt.pdf', created_at: '2025-09-02T14:00:00Z' } });
    }

    await waitFor(() => {
      const items2 = Array.from(container.querySelectorAll('[data-item]'));
      expect(items2[0].getAttribute('data-invoice')).toBe('invoices/sup-1/rt.pdf');
    });
  });
});
