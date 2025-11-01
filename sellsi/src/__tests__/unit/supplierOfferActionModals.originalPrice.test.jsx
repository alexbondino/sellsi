import React from 'react';
import { render, screen } from '@testing-library/react';
import SupplierOfferActionModals from '../../workspaces/supplier/my-offers/components/SupplierOfferActionModals';

// Helper CLP
const clp = v => '$' + new Intl.NumberFormat('es-CL').format(Math.round(v));

describe('SupplierOfferActionModals - Original vs Offered Price', () => {
  const baseBuyer = { id: 'b1', name: 'Comprador Test' };

  const renderModal = (partial = {}) => {
    const def = {
      id: 'offer_x',
      price: 18000, // precio ofertado inferior al original
      quantity: 10,
      buyer: baseBuyer,
      product: {
        id: 'p1',
        name: 'Producto Demo',
        price: 25000,
        previousPrice: 25000,
        stock: 40,
      },
    };
    const offer = {
      ...def,
      ...partial,
      product: { ...def.product, ...(partial.product || {}) },
    };
    render(
      <SupplierOfferActionModals
        open
        mode="accept"
        offer={offer}
        onClose={() => {}}
      />
    );
    return offer;
  };

  test('muestra precio original distinto al precio ofertado cuando previousPrice > offer.price', () => {
    const offer = renderModal();
    const line = screen.getByTestId('original-unit-price-line');
    // Debe mostrar 25.000 y no 18.000
    expect(line).toHaveTextContent(clp(25000));
    expect(line).not.toHaveTextContent(clp(18000));
  });

  test('cuando falta previousPrice usa product.price como original', () => {
    renderModal({ product: { previousPrice: null } });
    const line = screen.getByTestId('original-unit-price-line');
    expect(line).toHaveTextContent(clp(25000));
  });

  test('stock se muestra desde product.stock o productqty', () => {
    renderModal({ product: { stock: null, productqty: 55 } });
    const stockLine = screen.getByTestId('stock-line');
    expect(stockLine).toHaveTextContent('55');
  });
});
