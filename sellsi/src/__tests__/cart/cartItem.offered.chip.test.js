import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock heavy internal modules that pull import.meta (avoid jest parsing issues)
jest.mock('../../components/UniversalProductImage', () => ({
  CartItemImage: () => null
}));

// Mock ShippingDisplay component to avoid importing shipping hooks/services that use import.meta
jest.mock('../../domains/buyer/pages/cart/components/ShippingDisplay', () => () => null);

import CartItem from '../../domains/buyer/pages/cart/CartItem';

// Mock useNavigate used inside CartItem
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

describe('CartItem Ofertado chip', () => {
  const baseItem = {
    id: 'ci-1',
    product_id: 'p-1',
    name: 'Producto Test',
    proveedor: 'Proveedor A',
    quantity: 1,
    maxStock: 10,
    originalPrice: 1000,
  };

  it('muestra chip Ofertado cuando item.isOffered es true (desktop)', () => {
    const item = { ...baseItem, isOffered: true };
    render(
      <CartItem
        item={item}
        formatPrice={(v) => `$${v}`}
        updateQuantity={() => {}}
        handleRemoveWithAnimation={() => {}}
        itemVariants={{}}
      />
    );
    // The chip text is now rendered as a subtitle with data-testid="chip-ofertado-text"
    expect(screen.getByTestId('chip-ofertado-text')).toBeTruthy();
    expect(screen.getByText('OFERTADO')).toBeInTheDocument();
  });

});
