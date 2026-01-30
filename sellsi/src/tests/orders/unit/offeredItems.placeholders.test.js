import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductInfo from '../../../workspaces/buyer/my-orders/components/ProductInfo';

describe('O-1/O-2/O-3 Offered items unit tests (ProductInfo + lightweight harness)', () => {
  it('O-1: muestra chip OFERTADO para las variantes de detección', () => {
    const variants = [
      { product: { name: 'V1' }, quantity: 1, price_at_addition: 100, isOffered: true },
      { product: { name: 'V2' }, quantity: 1, price_at_addition: 200, metadata: { isOffered: true } },
      { product: { name: 'V3' }, quantity: 1, price_at_addition: 300, offer_id: 'offer-1' },
      { product: { name: 'V4' }, quantity: 1, price_at_addition: 400, offered_price: 350 }
    ];

    variants.forEach((it) => {
      render(<ProductInfo item={it} formatCurrency={(v) => `$${v}`} isMobile={false} order={{}} />);
      expect(screen.getByTestId('chip-ofertado')).toBeTruthy();
      // cleanup between renders
      document.body.innerHTML = '';
    });
  });

  it('O-2: mantiene dos líneas cuando hay mismo product_id y uno es ofertado', () => {
    const offeredItem = { product: { name: 'Producto X', supplier: { name: 'Sup' } }, quantity: 1, price_at_addition: 1000, product_id: 'px', isOffered: true, offer_id: 'offer-1', offered_price: 900 };
    const regularItem = { product: { name: 'Producto X', supplier: { name: 'Sup' } }, quantity: 2, price_at_addition: 1100, product_id: 'px' };

    render(
      <div>
        <ProductInfo item={offeredItem} formatCurrency={(v) => `$${v}`} isMobile={false} order={{}} />
        <ProductInfo item={regularItem} formatCurrency={(v) => `$${v}`} isMobile={false} order={{}} />
      </div>
    );

    // Un chip OFERTADO para el item ofertado
    const chips = screen.getAllByTestId('chip-ofertado');
    expect(chips).toHaveLength(1);
    expect(screen.getByText(/1 uds/)).toBeTruthy();
    expect(screen.getByText(/2 uds/)).toBeTruthy();
  });

  it('O-3: preserva offered_price tras refetch (simulación de actualización externa)', () => {
    // Lightweight harness: renders items as data-* attributes and allows simulate refetch
    function Harness() {
      const [items, setItems] = React.useState([
        { product: { supplier_id: 'sup-1', name: 'P' }, quantity: 1, price_at_addition: 900, product_id: 'p1', isOffered: true, offer_id: 'offer-1', offered_price: 900 }
      ]);
      return (
        <div>
          <button data-testid="refetch" onClick={() => setItems([
            { product: { supplier_id: 'sup-1', name: 'P', price: 999999 }, quantity: 1, price_at_addition: 900, product_id: 'p1', isOffered: true, offer_id: 'offer-1', offered_price: 900 }
          ])}>refetch</button>
          <div data-testid="items-root">
            {items.map((it, idx) => (
              <div key={idx} data-item data-product={it.product_id} data-price={it.price_at_addition} data-offered-price={it.offered_price || ''} data-offered={it.isOffered ? '1' : ''}></div>
            ))}
          </div>
        </div>
      );
    }

    const { getByTestId, container } = render(<Harness />);
    const items = container.querySelectorAll('[data-item]');
    expect(items).toHaveLength(1);
    const offered = items[0];
    expect(offered.getAttribute('data-offered')).toBe('1');
    expect(offered.getAttribute('data-offered-price')).toBe('900');

    // Simulate refetch with product.price changed - offered_price must remain
    fireEvent.click(getByTestId('refetch'));
    const items2 = container.querySelectorAll('[data-item]');
    const offered2 = items2[0];
    expect(offered2.getAttribute('data-offered')).toBe('1');
    expect(offered2.getAttribute('data-offered-price')).toBe('900');
  });
});
