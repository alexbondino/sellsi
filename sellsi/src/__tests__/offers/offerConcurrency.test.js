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
    mockSupabase.__offerLimitsState.pendingOffers.clear();
    // Restaurar límites por defecto
    mockSupabase.__offerLimitsState.limits = { product: 3, supplier: 5 };
    mockSupabase.rpc.mockClear();
  });

  test('mismo producto: 1 éxito y N-1 duplicate_pending, contadores incrementan solo por el éxito', async () => {
    const buyer = 'buyer_conc';
    const supplier = 'supplier_conc';
    const product = 'product_conc';
    const launches = 5; // >1 para simular corrida

    const responses = await Promise.all(Array.from({ length: launches }).map(() =>
      mockSupabase.rpc('create_offer', {
        p_buyer_id: buyer,
        p_supplier_id: supplier,
        p_product_id: product,
        p_offered_price: 100,
        p_offered_quantity: 1,
        p_message: 'conc'
      })
    ));

    const successes = responses.filter(r => r.data && r.data.success);
    const duplicates = responses.filter(r => r.data && r.data.error_type === 'duplicate_pending');

    expect(successes.length).toBe(1);
    expect(duplicates.length).toBe(launches - 1);

    const month = new Date().toISOString().slice(0,7);
    const prodKey = `${buyer}|${product}|${month}`;
    const suppKey = `${buyer}|${supplier}|${month}`;

    const prodCount = mockSupabase.__offerLimitsState.productCounts.get(prodKey);
    const suppCount = mockSupabase.__offerLimitsState.supplierCounts.get(suppKey);

    expect(prodCount).toBe(1);
    expect(suppCount).toBe(1);

    // Verificar que se hicieron N llamadas a create_offer
    const calls = mockSupabase.rpc.mock.calls.filter(c => c[0] === 'create_offer');
    expect(calls.length).toBe(launches);
    // Verificar que los args pasados fueron consistentes
    for (const call of calls) {
      expect(call[1].p_buyer_id).toBe(buyer);
      expect(call[1].p_supplier_id).toBe(supplier);
      expect(call[1].p_product_id).toBe(product);
    }
  });

  test('distintos productos: N éxitos y contadores incrementan para cada producto y proveedor agregado', async () => {
    const buyer = 'buyer_conc_2';
    const supplier = 'supplier_conc_2';
    const launches = 5;

    const products = Array.from({ length: launches }).map((_, i) => `product_conc_${i}`);

    const responses = await Promise.all(products.map(product =>
      mockSupabase.rpc('create_offer', {
        p_buyer_id: buyer,
        p_supplier_id: supplier,
        p_product_id: product,
        p_offered_price: 50 + Math.floor(Math.random()*10),
        p_offered_quantity: 1,
        p_message: 'conc'
      })
    ));

    // Todos deberían ser éxitos
    expect(responses.every(r => r.data && r.data.success)).toBe(true);

    const month = new Date().toISOString().slice(0,7);
    const suppKey = `${buyer}|${supplier}|${month}`;
    const suppCount = mockSupabase.__offerLimitsState.supplierCounts.get(suppKey);
    expect(suppCount).toBe(launches);

    for (const product of products) {
      const prodKey = `${buyer}|${product}|${month}`;
      expect(mockSupabase.__offerLimitsState.productCounts.get(prodKey)).toBe(1);
    }

    const calls = mockSupabase.rpc.mock.calls.filter(c => c[0] === 'create_offer');
    expect(calls.length).toBe(launches);
  });

  test('Límite de proveedor alcanzado bajo concurrencia (Race Condition Limit)', async () => {
    const buyer = 'buyer_limit';
    const supplier = 'supplier_limit_3';
    const supplierLimit = 3;
    const launches = 10;

    // Forzamos límite bajo
    mockSupabase.__offerLimitsState.limits = { product: 100, supplier: supplierLimit };

    const products = Array.from({ length: launches }).map((_, i) => `prod_limit_${i}`);

    const responses = await Promise.all(products.map(product =>
      mockSupabase.rpc('create_offer', {
        p_buyer_id: buyer,
        p_supplier_id: supplier,
        p_product_id: product,
        p_offered_price: 100,
        p_offered_quantity: 1,
        p_message: 'conc'
      })
    ));

    const successes = responses.filter(r => r.data && r.data.success);
    const failures = responses.filter(r => r.data && r.data.error_type === 'limit_exceeded');

    // Comprobaciones
    expect(successes.length).toBeLessThanOrEqual(supplierLimit);
    expect(successes.length + failures.length).toBe(launches);

    const month = new Date().toISOString().slice(0,7);
    const suppKey = `${buyer}|${supplier}|${month}`;
    expect(mockSupabase.__offerLimitsState.supplierCounts.get(suppKey)).toBe(successes.length);
  });

  test('Producto: si el contador ya está en el límite, devuelve limit_exceeded', async () => {
    const buyer = 'buyer_prod_limit';
    const supplier = 'supplier_prod_limit';
    const product = 'product_limit';

    // Forzamos límite de producto = 3 y prellenamos contador a 3
    mockSupabase.__offerLimitsState.limits = { product: 3, supplier: 100 };
    const month = new Date().toISOString().slice(0,7);
    const prodKey = `${buyer}|${product}|${month}`;
    mockSupabase.__offerLimitsState.productCounts.set(prodKey, 3);

    const resp = await mockSupabase.rpc('create_offer', {
      p_buyer_id: buyer,
      p_supplier_id: supplier,
      p_product_id: product,
      p_offered_price: 200,
      p_offered_quantity: 1,
      p_message: 'limit test'
    });

    expect(resp.data && resp.data.success).toBe(false);
    expect(resp.data && resp.data.error_type).toBe('limit_exceeded');
  });

  test('Escenario mixto: duplicate_pending + limit_exceeded bajo carga mixta', async () => {
    const buyer = 'buyer_mixed';
    const supplier = 'supplier_mixed';
    const supplierLimit = 2;

    // Configuramos límite de proveedor bajo
    mockSupabase.__offerLimitsState.limits = { product: 100, supplier: supplierLimit };

    // Preparar lista de productos donde uno se repite (para provocar duplicate_pending)
    const products = ['pA', 'pA', 'pB', 'pC', 'pD']; // 5 intentos, pA repetido

    const responses = await Promise.all(products.map(product =>
      mockSupabase.rpc('create_offer', {
        p_buyer_id: buyer,
        p_supplier_id: supplier,
        p_product_id: product,
        p_offered_price: 99,
        p_offered_quantity: 1,
        p_message: 'mix'
      })
    ));

    const successes = responses.filter(r => r.data && r.data.success);
    const duplicates = responses.filter(r => r.data && r.data.error_type === 'duplicate_pending');
    const limits = responses.filter(r => r.data && r.data.error_type === 'limit_exceeded');

    // Debe haber exactamente una duplicate_pending para pA
    expect(duplicates.length).toBe(1);

    // El número de éxitos no puede exceder el límite por proveedor
    expect(successes.length).toBeLessThanOrEqual(supplierLimit);

    // La suma debe cubrir todos los intentos
    expect(successes.length + duplicates.length + limits.length).toBe(products.length);

    // Verificar contador del proveedor coincide con éxitos
    const month2 = new Date().toISOString().slice(0,7);
    const suppKey = `${buyer}|${supplier}|${month2}`;
    expect(mockSupabase.__offerLimitsState.supplierCounts.get(suppKey)).toBe(successes.length);
  });
});
