import { mockSupabase, mockOfferData, mockLocalStorage } from '../mocks/supabaseMock';

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
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
    
    // Reset store state manualmente
    act(() => {
      useOfferStore.setState({ 
        buyerOffers: [], 
        supplierOffers: [], 
        loading: false, 
        error: null 
      });
    });
    
    // Mock localStorage con datos de usuario válidos
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockOfferData.validUser));
  });

  describe('validateOfferLimits', () => {
    it('debería validar límites correctamente cuando no hay ofertas previas', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 0, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      let validation;
      await act(async () => {
        validation = await result.current.validateOfferLimits('buyer_123', 'prod_456', 'supplier_789');
      });
      
      expect(validation.isValid).toBe(true);
      expect(validation.currentCount).toBe(0);
      expect(validation.limit).toBe(3);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('count_monthly_offers', {
        p_buyer_id: 'buyer_123',
        p_product_id: 'prod_456',
        p_supplier_id: 'supplier_789'
      });
    });

    it('debería rechazar cuando se excede el límite mensual', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      let validation;
      await act(async () => {
        validation = await result.current.validateOfferLimits('buyer_123', 'prod_456', 'supplier_789');
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
        validation = await result.current.validateOfferLimits('buyer_123', 'prod_456', 'supplier_789');
      });
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toBe('Error al validar límites: Database error');
    });
  });

  describe('createOffer', () => {
    it('debería crear una oferta exitosamente', async () => {
      // Mock validación de límites exitosa
      mockSupabase.rpc.mockResolvedValueOnce({ data: 1, error: null });
      // Mock creación de oferta exitosa
      mockSupabase.rpc.mockResolvedValueOnce({ data: { id: 'new_offer_123' }, error: null });
      
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
    });

    it('debería fallar cuando se excede el límite de ofertas', async () => {
      // Mock validación de límites fallida
      mockSupabase.rpc.mockResolvedValueOnce({ data: 3, error: null });
      
      const { result } = renderHook(() => useOfferStore());
      
      await act(async () => {
        await result.current.createOffer({
          productId: 'prod_456',
          supplierId: 'supplier_789',
          quantity: 5,
          price: 1000
        });
      });
      
      expect(result.current.error).toContain('límite mensual');
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1); // Solo la validación, no la creación
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
      
      expect(result.current.buyerOffers).toEqual(mockOffers);
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
      
      expect(result.current.supplierOffers).toEqual(mockOffers);
      expect(result.current.loading).toBe(false);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_supplier_offers', {
        p_supplier_id: 'supplier_101'
      });
    });
  });
});
