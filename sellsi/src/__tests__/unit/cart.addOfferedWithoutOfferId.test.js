/**
 * Verifica que agregar un item marcado como ofertado sin offer_id / offered_price es rechazado (hardening).
 */
import useCartStore from '../../shared/stores/cart/cartStore';

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) })
  }
}));

const mockAddItemToCart = jest.fn();
const mockGetCartItems = jest.fn(async () => []);
jest.mock('../../services/user', () => ({
  cartService: {
    getOrCreateActiveCart: async () => ({ cart_id: 'cart-1', items: [] }),
    getCartItems: (...a) => mockGetCartItems(...a),
    addItemToCart: (...a) => mockAddItemToCart(...a)
  }
}));

describe('Cart hardening offered item sin offer_id', () => {
  beforeEach(() => {
    useCartStore.setState({ items: [], userId: 'user-1', cartId: 'cart-1', isBackendSynced: true, isSyncing: false, error: null });
  });

  it('rechaza agregar oferta incompleta', async () => {
    const product = { product_id: 'p1', isOffered: true }; // falta offer_id y offered_price
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(false);
    const { error, items } = useCartStore.getState();
    expect(error).toMatch(/Oferta incompleta/i);
    expect(items).toHaveLength(0);
  });

  it('permite oferta completa', async () => {
  mockAddItemToCart.mockResolvedValueOnce({ cart_items_id: 'ci-1', product_id: 'p1', offer_id: 'off-1', offered_price: 500, quantity: 1 });
  mockGetCartItems.mockResolvedValueOnce([{ cart_items_id: 'ci-1', product_id: 'p1', offer_id: 'off-1', offered_price: 500, quantity: 1 }]);
    const product = { product_id: 'p1', isOffered: true, offer_id: 'off-1', offered_price: 500 };
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(true);
  const { error, items } = useCartStore.getState();
  expect(mockAddItemToCart).toHaveBeenCalled();
    expect(error).toBeNull();
    expect(items.some(it => it.offer_id === 'off-1')).toBe(true);
  });
});
