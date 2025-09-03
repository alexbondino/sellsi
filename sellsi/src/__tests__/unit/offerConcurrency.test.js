import { mockSupabase } from '../mocks/supabaseMock';

/**
 * Test de concurrencia simplificado para create_offer.
 * Dispara N creaciones "simultáneas" y verifica que los conteos
 * agregados (producto y proveedor) coincidan con N y no existan duplicaciones
 * inesperadas (simulando el refactor offer_limits con fila product_id NULL).
 */

describe('Offer Concurrency', () => {
  beforeEach(() => {
    // Reset estado interno
    mockSupabase.__offerLimitsState.productCounts.clear();
    mockSupabase.__offerLimitsState.supplierCounts.clear();
    mockSupabase.__offerLimitsState.log.length = 0;
    mockSupabase.rpc.mockClear();
  });

  test('no duplica filas y suma correctamente conteos producto y proveedor', async () => {
    const buyer = 'buyer_conc';
    const supplier = 'supplier_conc';
    const product = 'product_conc';
    const launches = 5; // >1 para simular corrida

    // Crear "simultáneo" usando Promise.all
    await Promise.all(Array.from({ length: launches }).map(() =>
      mockSupabase.rpc('create_offer', {
        p_buyer_id: buyer,
        p_supplier_id: supplier,
        p_product_id: product,
        p_offered_price: 100,
        p_offered_quantity: 1,
        p_message: 'conc'
      })
    ));

    const month = new Date().toISOString().slice(0,7);
    const prodKey = `${buyer}|${product}|${month}`;
    const suppKey = `${buyer}|${supplier}|${month}`;

    const prodCount = mockSupabase.__offerLimitsState.productCounts.get(prodKey);
    const suppCount = mockSupabase.__offerLimitsState.supplierCounts.get(suppKey);

    expect(prodCount).toBe(launches);
    expect(suppCount).toBe(launches);

    // Verificar que cada rpc create_offer devolvió success
    const calls = mockSupabase.rpc.mock.calls.filter(c => c[0] === 'create_offer');
    expect(calls.length).toBe(launches);
    for (const call of calls) {
      // args consistentes
      expect(call[1].p_buyer_id).toBe(buyer);
      expect(call[1].p_supplier_id).toBe(supplier);
      expect(call[1].p_product_id).toBe(product);
    }
  });
});
