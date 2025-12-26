import React from 'react';
import { mockSupabase, mockOfferData } from '../mocks/supabaseMock';
import { resetOfferStore } from '../utils/resetOfferStore';

// Mock de Supabase ANTES de importar
jest.mock('../../services/supabase', () => ({
  supabase: mockSupabase
}));

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfferStore } from '../../stores/offerStore';

describe('Offer System Edge Cases', () => {
  let localStorageGetSpy;
  let localStorageSetSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    // Reset store to known baseline
    resetOfferStore();
    // spy localStorage
    localStorageGetSpy = jest.spyOn(window.localStorage, 'getItem').mockImplementation(() => null);
    localStorageSetSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorageGetSpy.mockRestore();
    localStorageSetSpy.mockRestore();
  });

  describe('Casos límite de validación', () => {
    it('debería manejar cantidades extremadamente grandes', async () => {
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: Number.MAX_SAFE_INTEGER,
          price: 1000
        });
      });
      
      expect(result.current.error).toContain('Datos de oferta inválidos');
    });

    it('debería manejar precios con decimales', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { allowed: true, product_count: 1, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: null }, error: null }) // validate_offer_limits
        .mockResolvedValueOnce({ data: { success: true, offer_id: 'offer_123' }, error: null }); // create_offer
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: 5,
          price: 1000.99
        });
      });
      
      expect(result.current.error).toBe(null);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_offer', expect.objectContaining({
        p_offered_price: 1001
      }));
    });

    it('debería manejar respuesta duplicate_pending desde backend', async () => {
      // validate OK then create_offer returns duplicate_pending
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { allowed: true, product_count: 1, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: null }, error: null }) // validate
        .mockResolvedValueOnce({ data: { success: false, error_type: 'duplicate_pending', error: 'Ya hay una oferta pendiente' }, error: null }); // create_offer duplicate

      const { result } = renderHook(() => useOfferStore());

      const res = await act(async () => {
        return await result.current.createOffer({ productId: 'prod_123', supplierId: 'supplier_456', quantity: 1, price: 1000 });
      });

      // debería devolver el error y setear estado error
      expect(res).toEqual({ success: false, error: 'Ya hay una oferta pendiente' });
      expect(result.current.error).toContain('Ya hay una oferta pendiente');
    });

    it('debería manejar secuencia success -> duplicate_pending en llamadas consecutivas', async () => {
      // Preparación: buyer en localStorage y reset del store
      localStorageGetSpy.mockReturnValue('buyer_dup_1');
      act(() => { useOfferStore.setState({ buyerOffers: [], supplierOffers: [], loading: false, error: null }); });

      // First call: validate ok + create success
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { allowed: true, product_count: 0, supplier_count: 0, product_limit: 3, supplier_limit: 5 }, error: null })
        .mockResolvedValueOnce({ data: { success: true, offer_id: 'offer_ok' }, error: null })
        // Second call: validate ok + create duplicate_pending
        .mockResolvedValueOnce({ data: { allowed: true, product_count: 1, supplier_count: 0, product_limit: 3, supplier_limit: 5 }, error: null })
        .mockResolvedValueOnce({ data: { success: false, error_type: 'duplicate_pending', error: 'Ya existe una oferta pendiente para este producto' }, error: null });

      const { result } = renderHook(() => useOfferStore());

      // Primera oferta (exitosa)
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_dup',
          supplierId: 'sup_dup',
          quantity: 1,
          price: 100,
          message: 'first'
        });
      });

      // Segunda oferta (duplicate)
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

      // Calls: 2 create_offer invocados
      const createCalls = mockSupabase.rpc.mock.calls.filter(c => c[0] === 'create_offer');
      expect(createCalls.length).toBe(2);
    });

    it('debería rechazar precios negativos', async () => {
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: 5,
          price: -100
        });
      });
      
      expect(result.current.error).toContain('Datos de oferta inválidos');
    });

    it('debería rechazar cantidad cero', async () => {
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: 0,
          price: 1000
        });
      });
      
      expect(result.current.error).toContain('Datos de oferta inválidos');
    });
  });

  describe('Concurrencia y condiciones de carrera', () => {
    it('debería manejar múltiples ofertas simultáneas correctamente', async () => {
      // Mock: Primera oferta pasa validación, segunda no
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { allowed: true, product_count: 1, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: null }, error: null }) // Primera validación OK
        .mockResolvedValueOnce({ data: { success: true, offer_id: 'offer_1' }, error: null }) // Primera creación OK
        .mockResolvedValueOnce({ data: { allowed: false, product_count: 3, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: 'Se alcanzó el límite mensual de ofertas (producto)' }, error: null }); // Segunda validación FAIL
      
      const { result } = renderHook(() => useOfferStore());
      
      // Crear primera oferta
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: 5,
          price: 1000
        });
      });
      
      expect(result.current.error).toBe(null);
      
      // Intentar crear segunda oferta (debería fallar por límite)
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: 3,
          price: 900
        });
      });
      
      expect(result.current.error).toContain('límite mensual');
    });

    it('debería manejar ofertas que expiran durante el proceso', async () => {
      const expiredOffer = {
        ...mockOfferData.validOffer,
        expires_at: new Date(Date.now() - 1000).toISOString() // Expiró hace 1 segundo
      };
      
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Offer has expired' } 
      });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.acceptOffer(expiredOffer.id);
      });
      
      expect(result.current.error).toBe('Error al aceptar oferta: Offer has expired');
    });

    it('debería aceptar oferta correctamente y notificar al comprador', async () => {
      const offer = { ...mockOfferData.validOffer, id: 'off-accept', buyer_id: 'buyer_1', supplier_id: 'supplier_1', product_id: 'prod_1', offered_price: 1234, offered_quantity: 1 };
      // Poner la oferta en supplierOffers para que acceptOffer la encuentre
      const { result } = renderHook(() => useOfferStore());
      act(() => { result.current.setState?.({ supplierOffers: [offer] }) || require('../../stores/offerStore').useOfferStore.setState({ supplierOffers: [offer] }); });

      // Mock RPC de accept_offer exitoso
      const deadline = new Date(Date.now() + 24*3600*1000).toISOString();
      mockSupabase.rpc.mockResolvedValueOnce({ data: { success: true, purchase_deadline: deadline }, error: null });

      // Espiar notifier
      const notifModule = require('../../domains/notifications/services/notificationService');
      const notifInstance = notifModule.notificationService || notifModule.default || notifModule;
      const notifySpy = jest.spyOn(notifInstance, 'notifyOfferResponse').mockImplementation(async () => ({ success: true }));

      await act(async () => {
        await result.current.acceptOffer(offer.id);
      });

      const updated = result.current.supplierOffers.find(o => o.id === offer.id);
      expect(updated).toBeDefined();
      expect(updated.status).toBe('approved');
      expect(updated.purchase_deadline).toBeDefined();
      expect(notifySpy).toHaveBeenCalled();

      notifySpy.mockRestore();
    });
  });

  describe('Manejo de memoria y performance', () => {
    it('debería limpiar listeners y subscripciones al desmontar', () => {
      const { result } = renderHook(() => useOfferStore());
      const supabaseModule = require('../../services/supabase');
      const removeSpy = jest.spyOn(supabaseModule.supabase, 'removeChannel');
      // Generar suscripciones mediante API pública
      act(() => {
        result.current.subscribeToBuyerOffers('buyer_123');
        result.current.subscribeToSupplierOffers('supplier_456');
      });
      act(() => { result.current.unsubscribeAll(); });
      expect(removeSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
      removeSpy.mockRestore();
    });

    it('debería manejar listas grandes de ofertas eficientemente', async () => {
      // Generar 1000 ofertas mock
      const largeOfferList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockOfferData.validOffer,
        id: `offer_${i}`,
        product: { name: `Product ${i}` }
      }));
      
  mockSupabase.rpc.mockResolvedValueOnce({ data: largeOfferList, error: null }); // get_buyer_offers
      
      const { result } = renderHook(() => useOfferStore());
      
      const startTime = performance.now();
      
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Propiedad: debe procesar el lote y poblar buyerOffers con 1000 elementos.
      // Evitamos aserciones estrictas de tiempo que son frágiles en CI; dejamos un umbral generoso.
      expect(result.current.buyerOffers).toHaveLength(1000);
      expect(executionTime).toBeLessThan(2000);
    });
  });

  describe('Estados de red inconsistentes', () => {
    it('debería manejar conexión intermitente', async () => {
      // Simular fallo de red seguido de éxito
      mockSupabase.rpc
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ data: [mockOfferData.validOffer], error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      // Primera llamada falla
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      // Verificar inmediatamente (el store set ya ocurrió dentro de act)
      expect(result.current.error).toMatch(/Network error/);
      
      // Segunda llamada exitosa
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      
      expect(result.current.error).toBe(null);
      expect(result.current.buyerOffers).toHaveLength(1);
    });

    it('debería implementar retry con backoff exponencial', async () => {
      let attempt = 0;
      mockSupabase.rpc.mockImplementation(() => {
        attempt++;
        if (attempt < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ data: [mockOfferData.validOffer], error: null });
      });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      
      expect(attempt).toBe(3); // Debería haber intentado 3 veces
      expect(result.current.buyerOffers).toHaveLength(1);
    });
  });

  describe('Datos corruptos o inesperados', () => {
    it('debería manejar respuestas con estructura incorrecta', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: {
          unexpected: 'structure',
          not: 'an array'
        }, 
        error: null 
      });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      
      // Debería manejar graciosamente y devolver array vacío
      expect(result.current.buyerOffers).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('debería sanitizar datos de entrada', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { allowed: true, product_count: 1, supplier_count: 0, product_limit: 3, supplier_limit: 5, reason: null }, error: null })
        .mockResolvedValueOnce({ data: { success: true, offer_id: 'offer_123' }, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: '<script>alert("xss")</script>',
          supplierId: 'supplier_456',
          quantity: '5', // String en lugar de number
          price: '1000.00', // String en lugar de number
          message: '<img src="x" onerror="alert(1)">'
        });
      });
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_offer', 
        expect.objectContaining({
          p_quantity: 5, // Convertido a number
          p_price: 1000, // Convertido a number y sanitizado
          p_message: expect.not.stringContaining('<script>'), // Sanitizado
          p_message: expect.not.stringContaining('onerror'), // Atributos peligrosos removidos
          p_message: expect.stringContaining('<img') // Contenido preservado
        })
      );
    });
  });

  describe('Condiciones de carrera en UI', () => {
    it('debería prevenir doble submit de ofertas (usando fake timers)', async () => {
      // Usar fake timers para simular latencia sin flakiness
      jest.useFakeTimers();

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: { allowed: true }, error: null }) // validate
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { success: true, offer_id: 'offer_123' }, error: null }), 5000)));

      const { result } = renderHook(() => useOfferStore());

      // Llamada 1: iniciar pero no await, quedará en flight. Wrap in act so state updates flush
      let p1;
      await act(async () => { p1 = result.current.createOffer({ productId: 'prod_123', supplierId: 'supplier_456', quantity: 5, price: 1000 }); });

      // Después de iniciar, el store debería marcar loading=true inmediatamente
      expect(result.current.loading).toBe(true);

      // Llamada 2: debe retornar inmediatamente (no hacer RPC) porque loading=true
      let res2;
      await act(async () => { res2 = await result.current.createOffer({ productId: 'prod_123', supplierId: 'supplier_456', quantity: 3, price: 900 }); });
      expect(res2).toBeUndefined();

      // Avanzar timers para resolver la primera llamada
      await act(async () => { jest.advanceTimersByTime(5000); });
      await p1; // esperar resolución

      // Validar que RPC 'create_offer' se llamó exactamente 1 vez
      const createOfferCalls = mockSupabase.rpc.mock.calls.filter(call => call[0] === 'create_offer');
      expect(createOfferCalls).toHaveLength(1);

      // Restaurar timers reales
      jest.useRealTimers();
    });
  });

  describe('Casos extremos de tiempo', () => {
    it('debería manejar ofertas que expiran exactamente al momento de aceptarlas (sin sleep)', async () => {
      jest.useFakeTimers();

      const almostExpiredOffer = {
        ...mockOfferData.validOffer,
        expires_at: new Date(Date.now() + 100).toISOString() // Expira en 100ms
      };

      // Avanzar el tiempo 150ms para simular expiración
      await act(async () => { jest.advanceTimersByTime(150); });

      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Offer has expired' } 
      });

      const { result } = renderHook(() => useOfferStore());

      await act(async () => {
        await result.current.acceptOffer(almostExpiredOffer.id);
      });

      expect(result.current.error).toContain('expired');

      jest.useRealTimers();
    });

    it('debería manejar cambios de zona horaria (sin sobrescribir global.Date)', async () => {
      // Evitar fake timers que pueden interferir con otras pruebas; mockear Date.now directamente
      const fixed = new Date('2025-09-02T10:00:00-03:00'); // UTC-3
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => fixed.getTime());

      const { result } = renderHook(() => useOfferStore());

      await act(async () => {
        await result.current.validateOfferLimits({ buyerId: 'buyer_123', productId: 'prod_456', supplierId: 'supplier_789' });
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_offer_limits', expect.any(Object));

      nowSpy.mockRestore();
    });
  });
});
