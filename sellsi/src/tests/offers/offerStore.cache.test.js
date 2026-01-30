// Tests de caché TTL + SWR para offerStore
// 1) TTL fresh hit evita segunda llamada RPC
// 2) forceNetwork omite caché
// 3) SWR: sirve stale y revalida en background actualizando datos

import { mockSupabase } from '../mocks/supabaseMock';

// Mock de Supabase ANTES del store
jest.mock('../../services/supabase', () => ({ supabase: mockSupabase }));
jest.mock('../../domains/notifications/services/notificationService', () => ({
  notifyOfferReceived: jest.fn(),
  notifyOfferResponse: jest.fn(),
  notifyOfferExpired: jest.fn()
}));

import { renderHook, act } from '@testing-library/react';
import { useOfferStore } from '../../stores/offerStore';
import { normalizeBuyerOffer } from '../../stores/offers/normalizers';

const resetStoreRuntime = () => {
  act(() => {
    useOfferStore.setState({
      buyerOffers: [],
      supplierOffers: [],
      loading: false,
      error: null,
      _cacheTTL: 60000, // default safe TTL
      _swrEnabled: false
    });
    // Reiniciar estructuras internas
    const s = useOfferStore.getState();
    s._cache.buyer.clear();
    s._cache.supplier.clear();
    s._inFlight.buyer.clear();
    s._inFlight.supplier.clear();
  });
};

describe('offerStore cache TTL & SWR', () => {
  beforeEach(() => {
    // Use fake timers consistently across the file to avoid mixing real and fake timers
    jest.useFakeTimers();
    // Fix system time to make TTL behavior deterministic
    jest.setSystemTime(new Date('2025-01-01T12:00:00Z'));

    jest.resetAllMocks();
    resetStoreRuntime();
  });

  afterEach(() => {
    try { jest.useRealTimers(); } catch(_) {}
  });

  test('TTL boundary: fresh when age < TTL and stale when age > TTL (populate cache then manipulate ts)', async () => {
    const TTL = 2000;
    act(() => { useOfferStore.setState({ _cacheTTL: TTL }); });
    const firstData = [{ id: 'offer_A', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', offered_quantity: 1, offered_price: 100 }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: firstData, error: null });

    const { result } = renderHook(() => useOfferStore());
    await act(async () => { await result.current.loadBuyerOffers('buyer_B'); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);

    // Force cache timestamp to be fresh (age < TTL)
    // Advance time less than TTL -> cache should be fresh
    await act(async () => { jest.advanceTimersByTime(TTL - 100); });

    // Call again without providing another RPC mock; should use cache
    await act(async () => { await result.current.loadBuyerOffers('buyer_B'); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    expect(useOfferStore.getState().buyerOffers[0].id).toBe('offer_A');

    // Advance time to exceed TTL -> should be stale and cause RPC
    await act(async () => { jest.advanceTimersByTime(200); });

    mockSupabase.rpc.mockResolvedValueOnce({ data: [{ id: 'newY', product_id: 'p2' }], error: null });
    await act(async () => { await result.current.loadBuyerOffers('buyer_B'); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  });

  test('forceNetwork omite caché aunque TTL no haya expirado y reemplaza datos', async () => {
    act(() => { useOfferStore.setState({ _cacheTTL: 60000 }); });
    const first = [{ id: 'offer_A', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', offered_quantity: 1, offered_price: 100, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: first, error: null });
    const { result } = renderHook(() => useOfferStore());
    await act(async () => { await result.current.loadBuyerOffers('buyer_Y'); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);

    const second = [{ id: 'offer_B', product_id: 'p2', supplier_id: 's1', buyer_id: 'b1', offered_quantity: 2, offered_price: 150, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: second, error: null });
    await act(async () => { await result.current.loadBuyerOffers('buyer_Y', { forceNetwork: true }); });
    // Run timers so any queued microtasks/macrotasks from the fetch settle
    await act(async () => { jest.runAllTimers(); await Promise.resolve(); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    // Data reemplazada por nueva respuesta
    const current = useOfferStore.getState().buyerOffers;
    expect(current.some(o => o.id === 'offer_B')).toBe(true);
  });

  test('in-flight dedupe: concurrent loads join same RPC', async () => {
    const data = [{ id: 'offer_C', product_id: 'pX', supplier_id: 's1', buyer_id: 'bD', offered_quantity: 1, offered_price: 99, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    // Use a delayed rpc mock that works with fake timers
    mockSupabase.rpc.mockImplementationOnce(() => new Promise(res => setTimeout(() => res({ data, error: null }), 100)));

    const { result } = renderHook(() => useOfferStore());
    // Launch two loads concurrently
    let p1, p2;
    await act(async () => {
      p1 = result.current.loadBuyerOffers('buyer_D');
      p2 = result.current.loadBuyerOffers('buyer_D');

      // Advance timers to resolve the mocked RPC
      jest.advanceTimersByTime(100);
      // Allow microtasks to flush
      await Promise.resolve();
    });

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(r2); // deep equality
    expect(useOfferStore.getState()._inFlight.buyer.has('buyer_D')).toBe(false);
  });

  test('RPC missing fallback to supabase.from', async () => {
    // Make rpc return an error indicating function missing
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'function does not exist' } });
    // Mock from->select path to return data
    mockSupabase.from.mockImplementationOnce(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({ data: [{ id: 'fb1', product_id: 'px' }], error: null })
        })
      })
    }));

    const { result } = renderHook(() => useOfferStore());
    await act(async () => { await result.current.loadBuyerOffers('fallback_B'); });

    // Should have attempted rpc and then fallback to from
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    expect(mockSupabase.from).toHaveBeenCalled();
    const state = useOfferStore.getState();
    expect(state.buyerOffers.some(o => o.id === 'fb1')).toBe(true);
  });

  test('retries and final error sets store.error and clears inFlight', async () => {
    // rpc throws network error (earlyAbort) -> should set error and not loop
    mockSupabase.rpc.mockImplementationOnce(() => { throw new Error('Network error'); });

    const { result } = renderHook(() => useOfferStore());
    await act(async () => { await result.current.loadBuyerOffers('buyer_ERR'); });

    const state = useOfferStore.getState();
    expect(state.error).toMatch(/Error al obtener ofertas|Network error/);
    expect(state._inFlight.buyer.has('buyer_ERR')).toBe(false);
  });

  test('SWR: sirve stale inmediato, revalida en background y actualiza el store + cache normalizado', async () => {
    jest.useFakeTimers();
    // TTL=0 fuerza tratar siempre como stale, SWR habilitado => background revalidate
    act(() => { useOfferStore.setState({ _cacheTTL: 0, _swrEnabled: true }); });
    const staleData = [{ id: 'offer_A', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', offered_quantity: 1, offered_price: 100, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: staleData, error: null });
    const { result } = renderHook(() => useOfferStore());
    await act(async () => { await result.current.loadBuyerOffers('buyer_Z'); });

    // Primera llamada - stale served
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    // The store should contain the stale normalized data
    const currentStale = useOfferStore.getState().buyerOffers;
    expect(currentStale.length).toBe(1);
    expect(currentStale[0].price || currentStale[0].offered_price).toBeDefined();

    // Prepare fresh data for background revalidate
    const freshData = [{ id: 'offer_B', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', offered_quantity: 3, offered_price: 120, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: freshData, error: null });

    // Call load again -> should serve stale and schedule background update
    await act(async () => { await result.current.loadBuyerOffers('buyer_Z'); });

    // Advance timers so background revalidation executes
    await act(async () => { jest.runAllTimers(); });
    // allow microtasks
    await act(async () => { await Promise.resolve(); });

    // Now the RPC should have been called twice and the store updated to fresh data
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
    const updated = useOfferStore.getState().buyerOffers;
    expect(updated.length).toBe(1);
    // normalized values available in cache
    const cacheEntry = useOfferStore.getState()._cache.buyer.get('buyer_Z');
    expect(cacheEntry).toBeDefined();
    expect(Array.isArray(cacheEntry.data)).toBe(true);
    const normalized = cacheEntry.data.map(d => normalizeBuyerOffer(d));
    expect(normalized[0].price).toBeGreaterThan(0);
  });
});

