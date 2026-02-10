import { mockSupabase, mockOfferData } from '../mocks/supabaseMock';
import { resetOfferStore } from '../utils/resetOfferStore';

// Mock de Supabase ANTES de importar
jest.mock('../../services/supabase', () => ({
  supabase: mockSupabase
}));

// Mock del servicio de notificaciones
jest.mock('../../domains/notifications/services/notificationService', () => ({
  notifyOfferReceived: jest.fn(),
  notifyOfferResponse: jest.fn(),
  notifyOfferExpired: jest.fn()
}));

import { renderHook, act } from '@testing-library/react';
import { useOfferStore } from '../../stores/offerStore';

describe('offerStore', () => {
  let localStorageGetSpy;
  let localStorageSetSpy;

  beforeEach(() => {
    // Resetear mocks e implementaciones antes de cada test
    jest.resetAllMocks();

    // Asegurar que rpc tiene una implementación segura por defecto
    if (mockSupabase.rpc && jest.isMockFunction(mockSupabase.rpc)) {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    } else if (mockSupabase.rpc) {
      mockSupabase.rpc = jest.fn().mockResolvedValue({ data: null, error: null });
    }

    // Reset completo del store
    resetOfferStore();

    // Mock de localStorage con almacenamiento en memoria para evitar bucles
    let _mockStorage = {};
    _mockStorage['offer_user_data'] = JSON.stringify(mockOfferData.validUser);

    localStorageGetSpy = jest.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
      return _mockStorage[key] || null;
    });

    localStorageSetSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation((key, value) => {
      _mockStorage[key] = value.toString();
    });
  });

  afterEach(() => {
    // Restaurar spies e implementaciones
    jest.restoreAllMocks();

    // Asegurar estado base de rpc para el siguiente test
    if (mockSupabase.rpc && jest.isMockFunction(mockSupabase.rpc)) {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    }
  });

  describe('validateOfferLimits', () => {
    it('debería validar límites correctamente cuando no hay ofertas previas', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: {
        allowed: true,
        product_count: 0,
        supplier_count: 0,
        product_limit: 3,
        supplier_limit: 5,
        reason: null
      }, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      let validation;
      await act(async () => {
  validation = await result.current.validateOfferLimits({ buyerId: 'buyer_123', productId: 'prod_456', supplierId: 'supplier_789' });
      });
      
      expect(validation.isValid).toBe(true);
      expect(validation.currentCount).toBe(0);
      expect(validation.limit).toBe(3);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_offer_limits', expect.objectContaining({
        p_buyer_id: 'buyer_123',
        p_product_id: 'prod_456',
        p_supplier_id: 'supplier_789'
      }));
    });

    it('debería rechazar cuando se excede el límite mensual', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: {
        allowed: false,
        product_count: 3,
        supplier_count: 0,
        product_limit: 3,
        supplier_limit: 5,
        reason: 'Se alcanzó el límite mensual de ofertas (producto)'
      }, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      let validation;
      await act(async () => {
  validation = await result.current.validateOfferLimits({ buyerId: 'buyer_123', productId: 'prod_456', supplierId: 'supplier_789' });
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.currentCount).toBe(3);
      expect(validation.limit).toBe(3);
    });

    it('debería manejar errores de la base de datos', async () => {
  mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });
      
      const { result } = renderHook(() => useOfferStore());
      
      let validation;
      await act(async () => {
  validation = await result.current.validateOfferLimits({ buyerId: 'buyer_123', productId: 'prod_456', supplierId: 'supplier_789' });
      });
      
  // Estrategia no bloqueante: se permite continuar (isValid true) pero se adjunta razón de error
  expect(validation.isValid).toBe(true);
  expect(validation.error).toMatch(/Database error/);
    });

    it('debería manejar reject de validate_offer_limits', async () => {
      mockSupabase.rpc.mockImplementationOnce(() => Promise.reject(new Error('DB fail')));
      const { result } = renderHook(() => useOfferStore());

      let validation;
      await act(async () => {
        validation = await result.current.validateOfferLimits({ buyerId: 'b', productId: 'p', supplierId: 's' });
      });

      // Estrategia no bloqueante: continuar pero con aviso de error
      expect(validation.isValid).toBe(true);
      expect(validation.error).toMatch(/DB fail/i);
    });
  });

  describe('createOffer', () => {
    it('debería crear una oferta exitosamente y agregar supplierOffers', async () => {
  // 1) validate_offer_limits
  mockSupabase.rpc.mockResolvedValueOnce({ data: { allowed: true, product_count: 0, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: null }, error: null });
  // 2) create_offer
  mockSupabase.rpc.mockResolvedValueOnce({ data: { success: true, offer_id: 'new_offer_123' }, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_456',
          supplierId: 'supplier_789',
          quantity: 5,
          price: 1000,
          message: 'Test offer'
        });
      });
      
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
  expect(mockSupabase.rpc).toHaveBeenCalledWith('create_offer', expect.objectContaining({
        p_product_id: 'prod_456',
        p_supplier_id: 'supplier_789',
        p_quantity: 5,
        p_price: 1000,
        p_message: 'Test offer'
      }));
      // Supplier offers should include the new offer id
      expect(result.current.supplierOffers.some(s => s.id === 'new_offer_123')).toBe(true);
    });

    it('debería ejecutar validación ANTES de crear la oferta (Secuencia Crítica)', async () => {
      // 1) validate_offer_limits
      mockSupabase.rpc.mockResolvedValueOnce({ data: { allowed: true }, error: null });
      // 2) create_offer
      mockSupabase.rpc.mockResolvedValueOnce({ data: { success: true, offer_id: 'new_offer_123' }, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_456',
          supplierId: 'supplier_789',
          quantity: 5,
          price: 1000
        });
      });
      
      // Verificación de orden estricto
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'validate_offer_limits', expect.anything());
      expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'create_offer', expect.anything());
    });

    it('debería bloquear llamadas concurrentes a createOffer (idempotencia en vuelo)', async () => {
      // Implement deferred create_offer
      let resolveCreate;
      mockSupabase.rpc.mockImplementation((fnName) => {
        if (fnName === 'validate_offer_limits') return Promise.resolve({ data: { allowed: true }, error: null });
        if (fnName === 'create_offer') return new Promise(res => { resolveCreate = res; });
        return Promise.resolve({ data: null, error: null });
      });

      const { result } = renderHook(() => useOfferStore());

      // Start first and second calls inside a synchronous act to wrap state updates
      let p1, p2;
      try {
        act(() => {
          p1 = result.current.createOffer({ productId: 'p1', supplierId: 's1', quantity: 1, price: 100 });
          p2 = result.current.createOffer({ productId: 'p2', supplierId: 's2', quantity: 2, price: 200 });
        });

        // Allow event loop tick for RPC calls to be registered
        await new Promise(r => process.nextTick(r));

        // There should be only one create_offer invocation pending
        const createCalls = mockSupabase.rpc.mock.calls.filter(c => c[0] === 'create_offer').length;
        expect(createCalls).toBe(1);
        expect(resolveCreate).toBeDefined();

        // Resolve the pending create inside act so state updates are wrapped
        act(() => { resolveCreate({ data: { success: true, offer_id: 'concurrent_offer' }, error: null }); });

        // Wait both calls to finish inside act
        await act(async () => { await Promise.all([p1, p2]); });

        // After resolution, we should have the resulting offer in supplierOffers
        expect(result.current.supplierOffers.some(s => s.id === 'concurrent_offer')).toBe(true);
      } finally {
        // CRÍTICO: Limpiar la implementación personalizada para no contaminar otros tests
        mockSupabase.rpc.mockReset();
        mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
      }
    });

    it('debería manejar duplicate_pending desde backend y no agregar oferta', async () => {
      // validate ok
      mockSupabase.rpc.mockResolvedValueOnce({ data: { allowed: true, product_count: 0, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: null }, error: null });
      // create_offer duplicate pending
      mockSupabase.rpc.mockResolvedValueOnce({ data: { success: false, error_type: 'duplicate_pending', error: 'Ya existe una oferta pendiente para este producto' }, error: null });

      const { result } = renderHook(() => useOfferStore());
      const res = await act(async () => { return await result.current.createOffer({ productId: 'p', supplierId: 's', quantity: 1, price: 100 }); });

      // Should return error and not add to supplierOffers
      expect(res).toEqual(expect.objectContaining({ success: false, error: expect.stringMatching(/pendiente/i) }));
      expect(result.current.supplierOffers).toHaveLength(0);
    });

    it('debería manejar rechazo de RPC en createOffer', async () => {
      // validate ok
      mockSupabase.rpc.mockResolvedValueOnce({ data: { allowed: true, product_count: 0, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: null }, error: null });
      // create_offer rejects
      mockSupabase.rpc.mockImplementationOnce(() => Promise.reject(new Error('create failed')));

      const { result } = renderHook(() => useOfferStore());
      const res = await act(async () => { return await result.current.createOffer({ productId: 'p', supplierId: 's', quantity: 1, price: 100 }); });

      expect(res).toEqual(expect.objectContaining({ success: false, error: expect.stringMatching(/create failed/i) }));
      expect(result.current.supplierOffers).toHaveLength(0);
    });

    it('debería rechazar cantidades extremadamente grandes', async () => {
      const { result } = renderHook(() => useOfferStore());
      await act(async () => {
        await result.current.createOffer({ productId: 'p', supplierId: 's', quantity: 1000000000, price: 1000 });
      });
      expect(result.current.error).toMatch(/Datos de oferta inválidos/i);
    });

    it('debería bloquear segundo createOffer mientras loading=true (idempotencia)', async () => {
      const { result } = renderHook(() => useOfferStore());
      // Simulate the store is loading
      act(() => { result.current.loading = true; });

      const res = await act(async () => { return await result.current.createOffer({ productId: 'p', supplierId: 's', quantity: 1, price: 100 }); });
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
      expect(res).toBeUndefined();
    });

    it('debería fallar cuando se excede el límite de ofertas', async () => {
  // validate_offer_limits devuelve límite alcanzado
  mockSupabase.rpc.mockResolvedValueOnce({ data: { allowed: false, product_count: 3, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: 'Se alcanzó el límite mensual de ofertas (producto)' }, error: null });
      const { result } = renderHook(() => useOfferStore());
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_456',
          supplierId: 'supplier_789',
          quantity: 5,
          price: 1000
        });
      });
      expect(result.current.error).toMatch(/límite mensual/i);
  // Solo validate_offer_limits
  expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
  expect(mockSupabase.rpc.mock.calls[0][0]).toBe('validate_offer_limits');
    });

    it('debería validar datos de entrada', async () => {
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: '',
          supplierId: 'supplier_789',
          quantity: 0,
          price: -100
        });
      });
      
      expect(result.current.error).toContain('Datos de oferta inválidos');
      // Robustez: no debe llamar al backend cuando los inputs son inválidos
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('acceptOffer', () => {
    it('debería aceptar una oferta exitosamente', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.acceptOffer('offer_123');
      });
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('accept_offer', {
        p_offer_id: 'offer_123'
      });
      expect(result.current.error).toBe(null);
    });

    it('debería manejar errores al aceptar oferta', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Offer not found' } });
      const { result } = renderHook(() => useOfferStore());
      await act(async () => {
        await result.current.acceptOffer('invalid_offer');
      });
      expect(result.current.error).toBe('Error al aceptar oferta: Offer not found');
    });
  });

  describe('rejectOffer', () => {
    it('debería rechazar una oferta exitosamente', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.rejectOffer('offer_123');
      });
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('reject_offer', {
        p_offer_id: 'offer_123'
      });
      expect(result.current.error).toBe(null);
    });
  });

  describe('loadBuyerOffers', () => {
    it('debería obtener ofertas del comprador exitosamente', async () => {
      const mockOffers = [mockOfferData.validOffer];
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockOffers, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      
      // buyerOffers ahora contiene normalización (product, price, quantity) por lo que comparamos campos clave
      expect(result.current.buyerOffers[0]).toEqual(expect.objectContaining({
        id: mockOffers[0].id,
        status: 'pending',
        product_id: mockOffers[0].product_id,
        supplier_id: mockOffers[0].supplier_id,
        price: mockOffers[0].offered_price || mockOffers[0].price,
        quantity: mockOffers[0].offered_quantity || mockOffers[0].quantity
      }));
      expect(result.current.loading).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_buyer_offers', {
        p_buyer_id: 'buyer_123'
      });
    });

    it('debería manejar error al obtener ofertas del comprador', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      
      expect(result.current.buyerOffers).toEqual([]);
      expect(result.current.error).toBe('Error al obtener ofertas: Database error');
    });
  });

  describe('loadSupplierOffers', () => {
    it('debería obtener ofertas del proveedor exitosamente', async () => {
      const mockOffers = [mockOfferData.validOffer];
      mockSupabase.rpc.mockResolvedValueOnce({ data: mockOffers, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.loadSupplierOffers('supplier_101');
      });
      
      expect(result.current.supplierOffers[0]).toEqual(expect.objectContaining({
        id: mockOffers[0].id,
        status: 'pending',
        product_id: mockOffers[0].product_id,
        supplier_id: mockOffers[0].supplier_id,
        price: mockOffers[0].offered_price || mockOffers[0].price,
        quantity: mockOffers[0].offered_quantity || mockOffers[0].quantity
      }));
      expect(result.current.loading).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_supplier_offers', {
        p_supplier_id: 'supplier_101'
      });
    });
  });
});
