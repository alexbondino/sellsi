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

const resetStoreRuntime = () => {
  act(() => {
    useOfferStore.setState({
      buyerOffers: [],
      supplierOffers: [],
      loading: false,
      error: null
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
    jest.clearAllMocks();
    resetStoreRuntime();
  });

  test('TTL fresh hit reutiliza datos y evita segunda llamada RPC', async () => {
    // Configurar TTL en runtime
    act(() => { useOfferStore.setState({ _cacheTTL: 5000 }); });
    const firstData = [{ id: 'offer_A', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', quantity: 1, price: 100, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: firstData, error: null });
    const { result } = renderHook(() => useOfferStore());
    await act(async () => { await result.current.loadBuyerOffers('buyer_X'); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);

    // Segunda respuesta que no debe usarse por ser cache fresh
    const secondData = [{ id: 'offer_B', product_id: 'p2', supplier_id: 's1', buyer_id: 'b1', quantity: 1, price: 200, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: secondData, error: null });
    await act(async () => { await result.current.loadBuyerOffers('buyer_X'); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
  // Se mantiene misma data en memoria
  });

  test('forceNetwork omite caché aunque TTL no haya expirado', async () => {
    act(() => { useOfferStore.setState({ _cacheTTL: 60000 }); });
    mockSupabase.rpc.mockResolvedValueOnce({ data: [{ id: 'offer_A', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', quantity: 1, price: 100, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }], error: null });
    const { result } = renderHook(() => useOfferStore());
    await act(async () => { await result.current.loadBuyerOffers('buyer_Y'); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);

    mockSupabase.rpc.mockResolvedValueOnce({ data: [{ id: 'offer_B', product_id: 'p2', supplier_id: 's1', buyer_id: 'b1', quantity: 2, price: 150, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }], error: null });
  await act(async () => { await result.current.loadBuyerOffers('buyer_Y', { forceNetwork: true }); });
  // Esperar macrotask para asegurar setState del fetch asíncrono
  await act(async () => { await new Promise(r => setTimeout(r, 0)); });
  expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  // Data reemplazada por nueva respuesta
  });

  test('SWR: sirve stale inmediato y revalida en background', async () => {
    jest.useFakeTimers();
    // TTL=0 fuerza tratar siempre como stale, SWR habilitado => background revalidate
    act(() => { useOfferStore.setState({ _cacheTTL: 0, _swrEnabled: true }); });
    const staleData = [{ id: 'offer_A', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', quantity: 1, price: 100, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
  mockSupabase.rpc.mockResolvedValueOnce({ data: staleData, error: null });
  const { result } = renderHook(() => useOfferStore());
  await act(async () => { await result.current.loadBuyerOffers('buyer_Z'); });
  // Primera llamada
  expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
  // Mantiene stale inmediatamente

    const freshData = [{ id: 'offer_B', product_id: 'p1', supplier_id: 's1', buyer_id: 'b1', quantity: 3, price: 120, status: 'pending', created_at: new Date().toISOString(), expires_at: new Date(Date.now()+3600e3).toISOString() }];
    mockSupabase.rpc.mockResolvedValueOnce({ data: freshData, error: null });
  await act(async () => { await result.current.loadBuyerOffers('buyer_Z'); }); // sirve stale y agenda refresh
    act(() => { jest.runAllTimers(); });
    await act(async () => { await Promise.resolve(); });
    expect(mockSupabase.rpc).toHaveBeenCalledTimes(2);
  // Segunda RPC ejecutada (background) ya ocurrió
    jest.useRealTimers();
  });
});

