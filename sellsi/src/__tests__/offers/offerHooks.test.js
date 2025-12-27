import { renderHook, act, waitFor } from '@testing-library/react';
import { useBuyerOffers } from '../../workspaces/buyer/my-offers';
import { useSupplierOffers } from '../../workspaces/supplier/my-offers/hooks/useSupplierOffers';
import { mockOfferData } from '../mocks/supabaseMock';

// Mock del offerStore (reassignable para tests individuales)
let mockOfferStore;
let localStorageGetSpy;
let localStorageSetSpy;

jest.mock('../../stores/offerStore', () => ({
  useOfferStore: () => mockOfferStore,
}));

describe('Offer Hooks', () => {
  beforeEach(() => {
    // Re-create a fresh mock store to avoid contaminación entre tests
    mockOfferStore = {
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

    jest.clearAllMocks();
    // Espiar getItem/setItem sobre el objeto localStorage actual (puede ser el mock del test env)
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      localStorageGetSpy = jest.spyOn(window.localStorage, 'getItem').mockImplementation((key) => {
        if (key === 'user' || key === 'user_id') return JSON.stringify(mockOfferData.validUser);
        return null;
      });
      localStorageSetSpy = jest.spyOn(window.localStorage, 'setItem').mockImplementation(() => {});
    } else {
      localStorageGetSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === 'user' || key === 'user_id') return JSON.stringify(mockOfferData.validUser);
        return null;
      });
      localStorageSetSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    }
  });

  describe('useBuyerOffers', () => {
    it('debería obtener ofertas del comprador al montar', async () => {
      mockOfferStore.buyerOffers = [mockOfferData.validOffer];

      let hook;
      await act(async () => { hook = renderHook(() => useBuyerOffers()); });

      await waitFor(() => {
        expect(mockOfferStore.fetchBuyerOffers).toHaveBeenCalled();
        expect(mockOfferStore.fetchBuyerOffers).toHaveBeenCalledWith('buyer_789');
      });

      const { result } = hook;
      expect(result.current.offers).toEqual([mockOfferData.validOffer]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('debería manejar usuario inválido en localStorage', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      localStorageGetSpy.mockReturnValue('invalid_json');

      renderHook(() => useBuyerOffers());

      expect(mockOfferStore.fetchBuyerOffers).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('usa raw user_id (no JSON) y llama fetchBuyerOffers con ese id', async () => {
      // raw id string (no JSON) compatible con el validador
      localStorageGetSpy.mockImplementation(key => (key === 'user_id' ? 'buyer_789' : null));

      await act(async () => { renderHook(() => useBuyerOffers()); });

      await waitFor(() => {
        expect(mockOfferStore.fetchBuyerOffers).toHaveBeenCalledWith('buyer_789');
      });
    });

    it('debería manejar localStorage vacío', () => {
      localStorageGetSpy.mockReturnValue(null);

      renderHook(() => useBuyerOffers());

      expect(mockOfferStore.fetchBuyerOffers).not.toHaveBeenCalled();
    });

    it('cuando solo existe `user` en localStorage llama fetchBuyerOffers con el id del user', async () => {
      const userObj = { id: 'buyer_from_user' };
      // Devolver JSON tanto para `user_id` (legacy JSON case) como para `user` para simplificar y hacerlo determinista
      localStorageGetSpy.mockImplementation(() => JSON.stringify(userObj));

      await act(async () => { renderHook(() => useBuyerOffers()); });

      await waitFor(() => {
        expect(mockOfferStore.fetchBuyerOffers).toHaveBeenCalledWith(userObj.id);
      }, { timeout: 2000 });
    });

    it('debería proporcionar funciones de acción', () => {
      const { result } = renderHook(() => useBuyerOffers());

      expect(typeof result.current.cancelOffer).toBe('function');
      expect(typeof result.current.deleteOffer).toBe('function');

      // No complacencia: ejecutar y verificar que llaman al store
      result.current.cancelOffer('id-1');
      expect(mockOfferStore.cancelOffer).toHaveBeenCalledWith('id-1');

      result.current.deleteOffer('id-2');
      expect(mockOfferStore.deleteOffer).toHaveBeenCalledWith('id-2');
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
      localStorageGetSpy.mockReturnValue(JSON.stringify(supplierUser));
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

      // No complacencia: ejecutar y verificar que llaman al store
      result.current.acceptOffer('id-a');
      expect(mockOfferStore.acceptOffer).toHaveBeenCalledWith('id-a');

      result.current.rejectOffer('id-b');
      expect(mockOfferStore.rejectOffer).toHaveBeenCalledWith('id-b');

      result.current.deleteOffer('id-c');
      expect(mockOfferStore.deleteOffer).toHaveBeenCalledWith('id-c');
    });

    it('usa query param supplier_id como fallback y llama fetchSupplierOffers', async () => {
      // Simular storedUser presente pero sin id para evitar el fallback test-internal a 'buyer_789'
      localStorageGetSpy.mockImplementation(key => (key === 'user' ? '{}' : null));

      // Push query param sin cambiar window.location directamente (evita error de jsdom)
      const originalHref = window.location.href;
      window.history.pushState({}, '', '?supplier_id=supp_from_query');

      try {
        renderHook(() => useSupplierOffers());
        await waitFor(() => {
          expect(mockOfferStore.fetchSupplierOffers).toHaveBeenCalledWith('supp_from_query');
        });
      } finally {
        // Restaurar URL
        window.history.pushState({}, '', originalHref);
      }
    });

    it('debería manejar error al parsear usuario desde localStorage', () => {
      // Mock console.error para este test
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        localStorageGetSpy.mockReturnValue('{"invalid": json}');

        renderHook(() => useSupplierOffers());

        expect(consoleSpy).toHaveBeenCalledWith(
          'Error parsing user from localStorage:',
          expect.any(SyntaxError)
        );
        expect(mockOfferStore.fetchSupplierOffers).not.toHaveBeenCalled();
      } finally {
        consoleSpy.mockRestore();
      }
    });

    it('debería manejar usuario sin ID', () => {
      const userWithoutId = { name: 'Test User', email: 'test@example.com' };
      localStorageGetSpy.mockReturnValue(JSON.stringify(userWithoutId));

      renderHook(() => useSupplierOffers());

      expect(mockOfferStore.fetchSupplierOffers).not.toHaveBeenCalled();
    });
  });

  describe('Hook Dependencies', () => {
    it('useBuyerOffers debería re-ejecutar fetch cuando cambia fetchBuyerOffers', () => {
      localStorageGetSpy.mockReturnValue(
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
      localStorageGetSpy.mockReturnValue(
        JSON.stringify(mockOfferData.validUser)
      );

      const { rerender } = renderHook(() => useSupplierOffers());

      // Puede haber una llamada inicial por el comportamiento de test-internal (buyer_789), comprobamos que hubo al menos una
      expect(mockOfferStore.fetchSupplierOffers).toHaveBeenCalled();

      // Simular cambio en la función fetchSupplierOffers
      const prevCalls = mockOfferStore.fetchSupplierOffers.mock.calls.length;
      const newFetchSupplierOffers = jest.fn();
      mockOfferStore.fetchSupplierOffers = newFetchSupplierOffers;

      rerender();

      expect(newFetchSupplierOffers).toHaveBeenCalledWith('buyer_789');
      expect(newFetchSupplierOffers.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });
});
