/**
 * O-1 / O-2 / O-3 (parcial): Chip Ofertado y separación regular vs ofertado.
 * Use the real ProductInfo component to assert the 'OFERTADO' chip and separation
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductInfo from '../../../workspaces/buyer/my-orders/components/ProductInfo';

describe('BuyerOrders offered items chip (ProductInfo)', () => {
  it('muestra chip OFERTADO cuando item tiene offer_id / isOffered y separa renglones', () => {
    const offeredItem = {
      product: { name: 'Producto X', supplier: { name: 'Sup', id: 'sup-1' } },
      quantity: 1,
      price_at_addition: 1000,
      product_id: 'px',
      isOffered: true,
      offer_id: 'offer-1',
      offered_price: 900
    };
    const regularItem = {
      product: { name: 'Producto X', supplier: { name: 'Sup', id: 'sup-1' } },
      quantity: 2,
      price_at_addition: 1100,
      product_id: 'px'
    };

    render(
      <div>
        <ProductInfo item={offeredItem} formatCurrency={v => `$${v}`} isMobile={false} order={{}} />
        <ProductInfo item={regularItem} formatCurrency={v => `$${v}`} isMobile={false} order={{}} />
      </div>
    );

    // El chip OFERTADO debe aparecer solo para el item ofertado
    const chips = screen.getAllByTestId('chip-ofertado');
    expect(chips).toHaveLength(1);
    expect(chips[0]).toHaveTextContent(/OFERTADO/);

    // Debe mostrar ambas cantidades para cada renglón (1 uds y 2 uds)
    expect(screen.getByText(/1 uds/)).toBeTruthy();
    expect(screen.getByText(/2 uds/)).toBeTruthy();
  });
});
