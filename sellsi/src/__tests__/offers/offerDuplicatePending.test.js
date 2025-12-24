import { renderHook, act } from '@testing-library/react';
import { useOfferStore } from '../../stores/offerStore';
import { mockSupabase, mockLocalStorage } from '../mocks/supabaseMock';

// Usar require dentro del factory para evitar problema de hoisting con la variable
jest.mock('../../services/supabase', () => {
  const { mockSupabase } = require('../mocks/supabaseMock');
  return { supabase: mockSupabase };
});

describe('createOffer duplicate pending handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('buyer_dup_1');
    act(() => {
      useOfferStore.setState({ buyerOffers: [], supplierOffers: [], loading: false, error: null });
    });
  });

  it('should surface duplicate_pending error from backend', async () => {
    // First call (success) validate limits + create_offer
    mockSupabase.rpc
      .mockResolvedValueOnce({ data: { allowed: true, product_count: 0, supplier_count: 0, product_limit: 3, supplier_limit: 5 }, error: null }) // validate_offer_limits
      .mockResolvedValueOnce({ data: { success: true, offer_id: 'offer_ok' }, error: null }) // create_offer success
      // Second attempt: validate ok then duplicate
      .mockResolvedValueOnce({ data: { allowed: true, product_count: 1, supplier_count: 0, product_limit: 3, supplier_limit: 5 }, error: null })
      .mockResolvedValueOnce({ data: { success: false, error_type: 'duplicate_pending', error: 'Ya existe una oferta pendiente para este producto' }, error: null });

    const { result } = renderHook(() => useOfferStore());

    // First offer
    await act(async () => {
      await result.current.createOffer({
        productId: 'prod_dup',
        supplierId: 'sup_dup',
        quantity: 1,
        price: 100,
        message: 'first'
      });
    });

    // Second duplicate
    let resp;
    await act(async () => {
      resp = await result.current.createOffer({
        productId: 'prod_dup',
        supplierId: 'sup_dup',
        quantity: 1,
        price: 110,
        message: 'second'
      });
    });

    expect(resp.success).toBe(false);
    expect(result.current.error).toMatch(/ya existe una oferta pendiente/i);

    // Calls: 4 RPC invocations
    const createCalls = mockSupabase.rpc.mock.calls.filter(c => c[0] === 'create_offer');
    expect(createCalls.length).toBe(2);
  });
});
