/**
 * BuyerOrders - Chip OFERTADO unified tests
 * These tests use the real ProductInfo component (which renders the OFERTADO chip)
 * and assert detection and displayed prices (aligned to current implementation).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductInfo from '../../../workspaces/buyer/my-orders/components/ProductInfo';

describe('BuyerOrders - Chip OFERTADO (unified)', () => {
  const mockOrders = [
    {
      order_id: 'test-order-1',
      items: [
        {
          product: { name: 'Producto Regular', supplier: { name: 'Proveedor A' } },
          quantity: 2,
          price_at_addition: 1000,
          product_id: 'prod-1'
        },
        {
          product: { name: 'Producto Ofertado', supplier: { name: 'Proveedor B' } },
          quantity: 1,
          // Note: offered_price differs from price_at_addition to assert current behavior
          price_at_addition: 900,
          product_id: 'prod-2',
          isOffered: true,
          offer_id: 'offer-123',
          offered_price: 800
        },
        {
          product: { name: 'Producto Ofertado Metadata', supplier: { name: 'Proveedor C' } },
          quantity: 3,
          price_at_addition: 1200,
          product_id: 'prod-3',
          metadata: { isOffered: true },
          offer_id: 'offer-456'
        }
      ]
    }
  ];

  it('detecta correctamente productos ofertados y aplica chip OFERTADO', () => {
    render(
      <div>
        {mockOrders[0].items.map((it, idx) => (
          <ProductInfo key={idx} item={it} formatCurrency={v => `$${v}`} isMobile={false} order={{}} />
        ))}
      </div>
    );

    // Debe haber 2 chips OFERTADO (para los items con isOffered/metadata/offer_id)
    const offeredChips = screen.getAllByTestId('chip-ofertado');
    expect(offeredChips).toHaveLength(2);
    offeredChips.forEach(chip => expect(chip).toHaveTextContent('OFERTADO'));
  });

  it('para item con offered_price distinto, la UI muestra price_at_addition (actual behavior) y no asume "Precio OFERTADO fijo"', () => {
    render(<ProductInfo item={mockOrders[0].items[1]} formatCurrency={v => `$${v}`} isMobile={false} order={{}} />);

    // The UI currently uses price_at_addition (900) when rendering unit price
    expect(screen.getByText(/1 uds a \$900 c\/u/)).toBeTruthy();

    // There is no explicit "Precio OFERTADO fijo" caption in current implementation
    const caption = screen.queryByText(/Precio OFERTADO fijo/);
    expect(caption).toBeNull();
  });

  it('detecta variantes de oferta por diferentes campos', () => {
    const specificItems = [
      { product: { name: 'Test isOffered' }, isOffered: true, quantity: 1, price_at_addition: 100 },
      { product: { name: 'Test metadata.isOffered' }, metadata: { isOffered: true }, quantity: 1, price_at_addition: 200 },
      { product: { name: 'Test offer_id' }, offer_id: 'some-offer-id', quantity: 1, price_at_addition: 300 },
      { product: { name: 'Test offered_price' }, offered_price: 400, quantity: 1, price_at_addition: 400 }
    ];

    render(
      <div>
        {specificItems.map((it, idx) => (
          <ProductInfo key={idx} item={it} formatCurrency={v => `$${v}`} isMobile={false} order={{}} />
        ))}
      </div>
    );

    const offeredChips = screen.getAllByTestId('chip-ofertado');
    expect(offeredChips).toHaveLength(4);
  });

  it('no muestra chip para productos regulares', () => {
    const regularItems = [
      { product: { name: 'Producto Regular 1' }, quantity: 1, price_at_addition: 500 },
      { product: { name: 'Producto Regular 2' }, quantity: 2, price_at_addition: 300 }
    ];

    render(
      <div>
        {regularItems.map((it, idx) => (
          <ProductInfo key={idx} item={it} formatCurrency={v => `$${v}`} isMobile={false} order={{}} />
        ))}
      </div>
    );

    const offeredChips = screen.queryAllByTestId('chip-ofertado');
    expect(offeredChips).toHaveLength(0);
  });
});
