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
    jest.clearAllMocks();
    // Reset store between tests
    useCartStore.setState({ items: [], userId: 'user-1', cartId: 'cart-1', isBackendSynced: true, isSyncing: false, error: null });
    // Defensive check: ensure no previous calls persisted on the mock
    expect(mockAddItemToCart).not.toHaveBeenCalled();
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
    // Defensive: ensure backend mock is clean
    expect(mockAddItemToCart).not.toHaveBeenCalled();
  mockAddItemToCart.mockResolvedValueOnce({ cart_items_id: 'ci-1', product_id: 'p1', offer_id: 'off-1', offered_price: 500, quantity: 1 });
  mockGetCartItems.mockResolvedValueOnce([{ cart_items_id: 'ci-1', product_id: 'p1', offer_id: 'off-1', offered_price: 500, quantity: 1 }]);
    const product = { product_id: 'p1', isOffered: true, offer_id: 'off-1', offered_price: 500 };
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(true);
  const { error, items } = useCartStore.getState();
  expect(mockAddItemToCart).toHaveBeenCalledWith('cart-1', expect.objectContaining({ offer_id: 'off-1', offered_price: 500 }), 1);
    expect(error).toBeNull();
    expect(items.some(it => it.offer_id === 'off-1' && it.offered_price === 500)).toBe(true);
  });

  it('normaliza producto estableciendo isOffered true antes de enviar al backend', async () => {
    // Defensive: ensure backend mock is clean
    expect(mockAddItemToCart).not.toHaveBeenCalled();
    mockAddItemToCart.mockResolvedValueOnce({ cart_items_id: 'ci-2', product_id: 'p2', offer_id: 'off-2', offered_price: 600, quantity: 1 });
    mockGetCartItems.mockResolvedValueOnce([{ cart_items_id: 'ci-2', product_id: 'p2', offer_id: 'off-2', offered_price: 600, quantity: 1 }]);

    const product = { product_id: 'p2', offer_id: 'off-2', offered_price: 600 };
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(true);

    // El store debe pasar isOffered: true al backend (normalización)
    expect(mockAddItemToCart).toHaveBeenCalledWith('cart-1', expect.objectContaining({ product_id: 'p2', offer_id: 'off-2', offered_price: 600, isOffered: true }), 1);
  });

  it('rechaza cuando falta offer_id pero hay offered_price', async () => {
    // Defensive: ensure backend mock is clean
    expect(mockAddItemToCart).not.toHaveBeenCalled();
    const product = { product_id: 'p1', isOffered: true, offered_price: 500 };
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(false);
    const { error, items } = useCartStore.getState();
    expect(error).toMatch(/Oferta incompleta/i);
    expect(items).toHaveLength(0);
    expect(mockAddItemToCart).not.toHaveBeenCalled();
  });

  it('rechaza cuando falta offered_price pero hay offer_id', async () => {
    // Defensive: ensure backend mock is clean
    expect(mockAddItemToCart).not.toHaveBeenCalled();
    const product = { product_id: 'p1', isOffered: true, offer_id: 'off-1' };
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(false);
    const { error, items } = useCartStore.getState();
    expect(error).toMatch(/Oferta incompleta/i);
    expect(items).toHaveLength(0);
    expect(mockAddItemToCart).not.toHaveBeenCalled();
  });

  it('rechaza cuando metadata.isOffered es true pero faltan datos', async () => {
    // Defensive: ensure backend mock is clean
    expect(mockAddItemToCart).not.toHaveBeenCalled();
    const product = { product_id: 'p1', metadata: { isOffered: true } };
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(false);
    const { error } = useCartStore.getState();
    expect(error).toMatch(/Oferta incompleta/i);
  });

  it('rechaza cantidad inválida (<= 0) en ruta backend', async () => {
    // Defensive: ensure backend mock is clean
    expect(mockAddItemToCart).not.toHaveBeenCalled();
    const product = { product_id: 'p1', isOffered: true, offer_id: 'off-1', offered_price: 500 };
    const ok = await useCartStore.getState().addItem(product, 0);
    expect(ok).toBe(false);
    const { error, isSyncing } = useCartStore.getState();
    expect(error).toMatch(/cantidad debe ser mayor/i);
    expect(isSyncing).toBe(false);
  });

  it('maneja fallo de backend en addItemToCart', async () => {
    // Defensive: ensure backend mock is clean
    expect(mockAddItemToCart).not.toHaveBeenCalled();
    mockAddItemToCart.mockRejectedValueOnce(new Error('backend fail'));
    const product = { product_id: 'p1', isOffered: true, offer_id: 'off-1', offered_price: 500 };
    const ok = await useCartStore.getState().addItem(product, 1);
    expect(ok).toBe(false);
    const state = useCartStore.getState();
    expect(state.isSyncing).toBe(false);
    expect(mockAddItemToCart).toHaveBeenCalled();
  });
});
