import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock heavy internal modules that pull import.meta (avoid jest parsing issues)
jest.mock('../../components/UniversalProductImage', () => ({
  CartItemImage: () => null
}));

// Mock ShippingDisplay component to avoid importing shipping hooks/services that use import.meta
jest.mock('../../domains/buyer/pages/cart/components/ShippingDisplay', () => () => null);

// Mock workspaces/marketplace barrel that imports modules with import.meta
jest.mock('../../workspaces/marketplace', () => ({
  StockIndicator: () => null,
}));

// Mock shared hooks that use import.meta
jest.mock('../../shared/hooks', () => ({
  useMarketplaceLogic: () => ({}),
}));

import CartItem from '../../domains/buyer/pages/cart/CartItem';
import DocumentTypeSection from '../../workspaces/buyer/my-orders/components/DocumentTypeSection';

// Mock useNavigate used inside CartItem
jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));

describe('CartItem chips (Ofertado, Boleta, Factura)', () => {
  const baseItem = {
    id: 'ci-1',
    product_id: 'p-1',
    name: 'Producto Test',
    proveedor: 'Proveedor A',
    quantity: 1,
    maxStock: 10,
    originalPrice: 1000,
  };

  beforeEach(() => jest.clearAllMocks());

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
    expect(screen.getByTestId('chip-ofertado-text')).toBeInTheDocument();
    expect(screen.getByText('OFERTADO')).toBeInTheDocument();
  });

  it('no muestra chip Ofertado cuando item.isOffered es false', () => {
    const item = { ...baseItem, isOffered: false };
    render(
      <CartItem
        item={item}
        formatPrice={(v) => `$${v}`}
        updateQuantity={() => {}}
        handleRemoveWithAnimation={() => {}}
        itemVariants={{}}
      />
    );
    expect(screen.queryByTestId('chip-ofertado-text')).toBeNull();
    expect(screen.queryByText('OFERTADO')).not.toBeInTheDocument();
  });

  // DocumentTypeSection is the component responsible for rendering document chips. Test it directly.

  it('DocumentTypeSection shows Factura chip when item.document_type is factura', () => {
    const item = { document_type: 'factura' };
    render(<DocumentTypeSection item={item} order={{ status: 'accepted' }} />);
    expect(screen.getByText('Factura')).toBeInTheDocument();
  });

  it('DocumentTypeSection shows Boleta chip when item.document_type is boleta', () => {
    const item = { document_type: 'boleta' };
    render(<DocumentTypeSection item={item} order={{ status: 'accepted' }} />);
    expect(screen.getByText('Boleta')).toBeInTheDocument();
  });

});
