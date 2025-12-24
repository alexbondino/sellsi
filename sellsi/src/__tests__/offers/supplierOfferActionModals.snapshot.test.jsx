import React from 'react';
import { render, screen } from '@testing-library/react';
import SupplierOfferActionModals from '../../workspaces/supplier/my-offers/components/SupplierOfferActionModals';

const clp = v => '$' + new Intl.NumberFormat('es-CL').format(Math.round(v));

describe('SupplierOfferActionModals - snapshot fields', () => {
  test('muestra base_price_at_offer y current_stock cuando están presentes en la offer', () => {
    const offer = {
      id: 'o1',
      price: 20000,
      quantity: 20,
      buyer: { name: 'Buyer Test' },
      product: { id: 'p1', name: 'KRAVCHENCO' },
      base_price_at_offer: 25000,
      tier_price_at_offer: 25000,
      current_product_price: 25000,
      current_stock: 7000,
    };

    render(
      <SupplierOfferActionModals
        open
        mode="accept"
        offer={offer}
        onClose={() => {}}
      />
    );
    const priceLine = screen.getByTestId('original-unit-price-line');
    const stockLine = screen.getByTestId('stock-line');
    expect(priceLine).toHaveTextContent(clp(25000));
    expect(stockLine).toHaveTextContent('7000');
  });
});
