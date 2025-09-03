import React from 'react';
import { mockSupabase, mockOfferData } from '../mocks/supabaseMock';

// Mock de Supabase ANTES de importar
jest.mock('../../services/supabase', () => ({
  supabase: mockSupabase
}));

import { renderHook, act, waitFor } from '@testing-library/react';
import { useOfferStore } from '../../stores/offerStore';

describe('Offer System Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        .mockResolvedValueOnce({ data: 1, error: null }) // count_monthly_offers
        .mockResolvedValueOnce({ data: { id: 'offer_123' }, error: null }); // create_offer
      
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
        .mockResolvedValueOnce({ data: 1, error: null }) // Primera validación OK
        .mockResolvedValueOnce({ data: { id: 'offer_1' }, error: null }) // Primera creación OK
        .mockResolvedValueOnce({ data: 3, error: null }); // Segunda validación FAIL (límite alcanzado)
      
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
      
      mockSupabase.rpc.mockResolvedValueOnce({ data: largeOfferList, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      const startTime = performance.now();
      
      await act(async () => {
        await result.current.loadBuyerOffers('buyer_123');
      });
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Debería procesar las ofertas en menos de 100ms
      expect(executionTime).toBeLessThan(100);
      expect(result.current.buyerOffers).toHaveLength(1000);
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
        .mockResolvedValueOnce({ data: 1, error: null })
        .mockResolvedValueOnce({ data: { id: 'offer_123' }, error: null });
      
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
          p_message: expect.not.stringContaining('<script>') // Sanitizado
        })
      );
    });
  });

  describe('Condiciones de carrera en UI', () => {
    it('debería prevenir doble submit de ofertas', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: 1, error: null })
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { id: 'offer_123' }, error: null }), 1000)));
      
      const { result } = renderHook(() => useOfferStore());
      
      // Iniciar primera oferta
      const promise1 = act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: 5,
          price: 1000
        });
      });
      
      // Intentar segunda oferta inmediatamente
      const promise2 = act(async () => {
        await result.current.createOffer({
          productId: 'prod_123',
          supplierId: 'supplier_456',
          quantity: 3,
          price: 900
        });
      });
      
      await Promise.all([promise1, promise2]);
      
      // Solo debería haber una llamada a create_offer
      const createOfferCalls = mockSupabase.rpc.mock.calls.filter(call => call[0] === 'create_offer');
      expect(createOfferCalls).toHaveLength(1);
    });
  });

  describe('Casos extremos de tiempo', () => {
    it('debería manejar ofertas que expiran exactamente al momento de aceptarlas', async () => {
      const almostExpiredOffer = {
        ...mockOfferData.validOffer,
        expires_at: new Date(Date.now() + 100).toISOString() // Expira en 100ms
      };
      
      // Esperar a que expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Offer has expired' } 
      });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.acceptOffer(almostExpiredOffer.id);
      });
      
      expect(result.current.error).toContain('expired');
    });

    it('debería manejar cambios de zona horaria', async () => {
      // Mock de Date para simular cambio de zona horaria
      const originalDate = Date;
      const mockDate = new Date('2025-09-02T10:00:00-03:00'); // UTC-3
      
      global.Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            return mockDate;
          }
          return new originalDate(...args);
        }
        
        static now() {
          return mockDate.getTime();
        }
      };
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
  await result.current.validateOfferLimits({ buyerId: 'buyer_123', productId: 'prod_456', supplierId: 'supplier_789' });
      });
      
      // Debería funcionar correctamente independientemente de la zona horaria
      expect(mockSupabase.rpc).toHaveBeenCalledWith('count_monthly_offers', expect.any(Object));
      
      // Restaurar Date original
      global.Date = originalDate;
    });
  });
});
