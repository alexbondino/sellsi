import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductInfo from '../../../workspaces/buyer/my-orders/components/ProductInfo';

describe('BuyerOrders - separación items ofertados vs regulares (ProductInfo)', () => {
  it('mantiene dos renglones separados y muestra chip OFERTADO solo en el item ofertado', () => {
    const offeredItem = { product: { name: 'Producto X', supplier: { name: 'Proveedor' } }, quantity: 1, price_at_addition: 700, product_id: 'p1', isOffered: true, offer_id: 'offer-123', offered_price: 700 };
    const regularItem = { product: { name: 'Producto X', supplier: { name: 'Proveedor' } }, quantity: 2, price_at_addition: 1000, product_id: 'p1' };

    render(
      <div>
        <ProductInfo item={offeredItem} formatCurrency={(v) => `$${v}`} isMobile={false} order={{}} />
        <ProductInfo item={regularItem} formatCurrency={(v) => `$${v}`} isMobile={false} order={{}} />
      </div>
    );

    const chips = screen.getAllByTestId('chip-ofertado');
    expect(chips).toHaveLength(1);
    expect(screen.getByText(/1 uds/)).toBeTruthy();
    expect(screen.getByText(/2 uds/)).toBeTruthy();
  });
});
