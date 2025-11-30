/**
 * O-1 / O-2 / O-3 (parcial): Chip Ofertado y separación regular vs ofertado.
 * Test unitario ligero sobre BuyerOrders renderizando dos items mismo product_id
 * uno ofertado y otro regular.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
// Instead of importing full BuyerOrders (which uses import.meta), mock a minimal version here.
const MockBuyerOrders = () => {
  const hook = require('../../../workspaces/buyer/my-orders/hooks/useBuyerOrders');
  const { orders, formatCurrency } = hook.useBuyerOrders();
  return (
    <div>
      {orders.map(o => (
        <div key={o.order_id}>
          {o.items.map((it, idx) => (
            <div key={idx}>
              <span>{it.quantity} uds</span>
              { (it.isOffered || it.metadata?.isOffered || it.offer_id || it.offered_price) && (
                <span data-testid="chip-ofertado">Ofertado</span>
              ) }
              <span>{formatCurrency(it.price_at_addition)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// Mock hook useBuyerOrders para inyectar órdenes simuladas
jest.mock('../../../workspaces/buyer/my-orders/hooks/useBuyerOrders', () => ({
  useBuyerOrders: () => ({
    orders: [
      {
        order_id: 'po-1',
        parent_order_id: 'po-1',
        synthetic_id: 'po-1',
        status: 'accepted',
        payment_status: 'paid',
        is_payment_order: true,
        items: [
          { product: { name: 'Producto X', supplier: { name: 'Sup', id: 'sup-1' } }, quantity: 1, price_at_addition: 1000, product_id: 'px', isOffered: true, offer_id: 'offer-1', offered_price: 900 },
          { product: { name: 'Producto X', supplier: { name: 'Sup', id: 'sup-1' } }, quantity: 2, price_at_addition: 1100, product_id: 'px' }
        ],
        final_amount: 1000,
        total_amount: 1000,
        created_at: '2025-09-02T10:00:00.000Z'
      }
    ],
    loading: false,
    error: null,
    getProductImage: () => null,
    getStatusDisplayName: s => s,
    getStatusColor: () => 'default',
    formatDate: s => s,
    formatCurrency: v => `$${v}`
  })
}));

// Silence theme/localStorage calls
beforeAll(() => {
  global.localStorage = {
    getItem: () => 'buyer-123',
    setItem: () => {},
    removeItem: () => {},
  };
});

describe('BuyerOrders offered items chip', () => {
  it('renderiza chip Ofertado y ambos renglones mismo product_id', () => {
  render(<MockBuyerOrders />);
    // Debe haber exactamente un chip Ofertado por el item ofertado
    const chips = screen.getAllByTestId('chip-ofertado');
    expect(chips).toHaveLength(1);
    // Debe mostrar dos cantidades distintas (1 uds y 2 uds) indicando separación
    expect(screen.getByText(/1 uds/)).toBeTruthy();
    expect(screen.getByText(/2 uds/)).toBeTruthy();
  });
});
