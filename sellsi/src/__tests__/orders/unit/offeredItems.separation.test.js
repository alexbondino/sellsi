// Usamos las globals de Jest (describe/it/expect) sin importar Vitest

// Placeholder: se activará cuando la UI muestre chip Ofertado

describe.skip('BuyerOrders - separación items ofertados vs regulares', () => {
  it('mantiene dos líneas con mismo product_id cuando uno es ofertado', () => {
    const items = [
      { product_id: 'p1', quantity: 1, price_at_addition: 1000 },
      { product_id: 'p1', quantity: 2, price_at_addition: 700, offered_price: 700, isOffered: true, offer_id: 'offer-123' }
    ];
    expect(items).toHaveLength(2);
    // Futuro: render y assert chips
  });
});
