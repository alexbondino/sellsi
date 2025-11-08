import { renderHook, act, waitFor } from '@testing-library/react';
import { useBuyerOffers } from '../../workspaces/buyer/my-offers';
import { useSupplierOffers } from '../../workspaces/supplier/my-offers/hooks/useSupplierOffers';
import { mockLocalStorage, mockOfferData } from '../mocks/supabaseMock';

// Mock del offerStore
const mockOfferStore = {
  buyerOffers: [],
  supplierOffers: [],
  loading: false,
  error: null,
  fetchBuyerOffers: jest.fn(),
  fetchSupplierOffers: jest.fn(),
  acceptOffer: jest.fn(),
  rejectOffer: jest.fn(),
  deleteOffer: jest.fn(),
  cancelOffer: jest.fn(),
};

jest.mock('../../stores/offerStore', () => ({
  useOfferStore: () => mockOfferStore,
}));

describe('Offer Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify(mockOfferData.validUser)
    );
  });

  describe('useBuyerOffers', () => {
    it('debería obtener ofertas del comprador al montar', async () => {
      mockOfferStore.buyerOffers = [mockOfferData.validOffer];

      const { result } = renderHook(() => useBuyerOffers());

      await waitFor(() => {
        expect(mockOfferStore.fetchBuyerOffers).toHaveBeenCalledWith(
          'buyer_789'
        );
      });

      expect(result.current.offers).toEqual([mockOfferData.validOffer]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('debería manejar usuario inválido en localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid_json');

      renderHook(() => useBuyerOffers());

      expect(mockOfferStore.fetchBuyerOffers).not.toHaveBeenCalled();
    });

    it('debería manejar localStorage vacío', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      renderHook(() => useBuyerOffers());

      expect(mockOfferStore.fetchBuyerOffers).not.toHaveBeenCalled();
    });

    it('debería proporcionar funciones de acción', () => {
      const { result } = renderHook(() => useBuyerOffers());

      expect(typeof result.current.cancelOffer).toBe('function');
      expect(typeof result.current.deleteOffer).toBe('function');
    });

    it('debería manejar ofertas nulas como array vacío', () => {
      mockOfferStore.buyerOffers = null;

      const { result } = renderHook(() => useBuyerOffers());

      expect(result.current.offers).toEqual([]);
    });
  });

  describe('useSupplierOffers', () => {
    it('debería obtener ofertas del proveedor al montar', async () => {
      const supplierUser = { ...mockOfferData.validUser, role: 'supplier' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(supplierUser));
      mockOfferStore.supplierOffers = [mockOfferData.validOffer];

      const { result } = renderHook(() => useSupplierOffers());

      await waitFor(() => {
        expect(mockOfferStore.fetchSupplierOffers).toHaveBeenCalledWith(
          'buyer_789'
        );
      });

      expect(result.current.offers).toEqual([mockOfferData.validOffer]);
    });

    it('debería sincronizar estado local con el store', async () => {
      const initialOffers = [mockOfferData.validOffer];
      mockOfferStore.supplierOffers = initialOffers;

      const { result } = renderHook(() => useSupplierOffers());

      await waitFor(() => {
        expect(result.current.offers).toEqual(initialOffers);
      });

      // Simular cambio en el store
      const updatedOffers = [
        ...initialOffers,
        { ...mockOfferData.validOffer, id: 'offer_456' },
      ];
      mockOfferStore.supplierOffers = updatedOffers;

      // Re-renderizar
      const { result: result2 } = renderHook(() => useSupplierOffers());

      await waitFor(() => {
        expect(result2.current.offers).toEqual(updatedOffers);
      });
    });

    it('debería proporcionar setOffers para manipulación local', () => {
      const { result } = renderHook(() => useSupplierOffers());

      expect(typeof result.current.setOffers).toBe('function');

      act(() => {
        result.current.setOffers([mockOfferData.validOffer]);
      });

      expect(result.current.offers).toEqual([mockOfferData.validOffer]);
    });

    it('debería proporcionar funciones de acción del store', () => {
      const { result } = renderHook(() => useSupplierOffers());

      expect(typeof result.current.acceptOffer).toBe('function');
      expect(typeof result.current.rejectOffer).toBe('function');
      expect(typeof result.current.deleteOffer).toBe('function');
    });

    it('debería manejar error al parsear usuario desde localStorage', () => {
      // Mock console.error para este test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockLocalStorage.getItem.mockReturnValue('{"invalid": json}');

      renderHook(() => useSupplierOffers());

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing user from localStorage:',
        expect.any(SyntaxError)
      );
      expect(mockOfferStore.fetchSupplierOffers).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('debería manejar usuario sin ID', () => {
      const userWithoutId = { name: 'Test User', email: 'test@example.com' };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(userWithoutId));

      renderHook(() => useSupplierOffers());

      expect(mockOfferStore.fetchSupplierOffers).not.toHaveBeenCalled();
    });
  });

  describe('Hook Dependencies', () => {
    it('useBuyerOffers debería re-ejecutar fetch cuando cambia fetchBuyerOffers', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify(mockOfferData.validUser)
      );

      const { rerender } = renderHook(() => useBuyerOffers());

      expect(mockOfferStore.fetchBuyerOffers).toHaveBeenCalledTimes(1);

      // Simular cambio en la función fetchBuyerOffers
      const newFetchBuyerOffers = jest.fn();
      mockOfferStore.fetchBuyerOffers = newFetchBuyerOffers;

      rerender();

      expect(newFetchBuyerOffers).toHaveBeenCalledWith('buyer_789');
    });

    it('useSupplierOffers debería re-ejecutar fetch cuando cambia fetchSupplierOffers', () => {
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify(mockOfferData.validUser)
      );

      const { rerender } = renderHook(() => useSupplierOffers());

      expect(mockOfferStore.fetchSupplierOffers).toHaveBeenCalledTimes(1);

      // Simular cambio en la función fetchSupplierOffers
      const newFetchSupplierOffers = jest.fn();
      mockOfferStore.fetchSupplierOffers = newFetchSupplierOffers;

      rerender();

      expect(newFetchSupplierOffers).toHaveBeenCalledWith('buyer_789');
    });
  });
});
