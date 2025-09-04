import { useOfferStore, OFFER_STATES } from '../../stores/offerStore';
import useCartStore from '../../shared/stores/cart/cartStore';

// Mock supabase RPC para no interferir
jest.mock('../../services/supabase', () => ({
  supabase: { rpc: jest.fn(() => Promise.resolve({ data: { success: true }, error: null })) }
}));

describe('Cart pruning for invalid offer statuses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset stores
    useOfferStore.setState({ buyerOffers: [], supplierOffers: [], loading: false, error: null });
    useCartStore.setState({ items: [] });
  });

  const addCartItemForOffer = (offerId) => {
    useCartStore.setState(state => ({ items: state.items.concat([{ id: `prod-${offerId}`, name: 'Prod', quantity: 1, offer_id: offerId }]) }));
  };

  test('removes cart item when offer loads as expired', () => {
    // Simular oferta expirada
    const expiredOffer = { id: 'off-exp', status: OFFER_STATES.EXPIRED };
    addCartItemForOffer('off-exp');
    expect(useCartStore.getState().items.length).toBe(1);
    // Inyectar oferta y disparar prune manual
    useOfferStore.setState({ buyerOffers: [expiredOffer] });
    useOfferStore.getState()._pruneInvalidOfferCartItems();
    expect(useCartStore.getState().items.length).toBe(0);
  });

  test('removes cart item after rejecting offer', async () => {
    const offer = { id: 'off-rej', status: OFFER_STATES.PENDING };
    useOfferStore.setState({ supplierOffers: [offer], buyerOffers: [] });
    addCartItemForOffer('off-rej');
    expect(useCartStore.getState().items.length).toBe(1);
    // Rechazar (afecta supplierOffers), no en buyerOffers todavía -> no prune
    await useOfferStore.getState().rejectOffer('off-rej', 'razon');
    // Simular sincronización al lado buyer (normalmente fetch posterior)
    useOfferStore.setState({ buyerOffers: [{ id: 'off-rej', status: OFFER_STATES.REJECTED }] });
    useOfferStore.getState()._pruneInvalidOfferCartItems();
    expect(useCartStore.getState().items.length).toBe(0);
  });

  test('removes cart item after cancelling offer (buyer action)', async () => {
    const offer = { id: 'off-can', status: OFFER_STATES.PENDING };
    useOfferStore.setState({ buyerOffers: [offer] });
    addCartItemForOffer('off-can');
    expect(useCartStore.getState().items.length).toBe(1);
    // Cancelar
    await useOfferStore.getState().cancelOffer('off-can');
    // Estado local ya actualizado a cancelled → prune ejecutado automáticamente
    expect(useCartStore.getState().items.length).toBe(0);
  });

  test('does NOT remove unrelated cart items', () => {
    useOfferStore.setState({ buyerOffers: [{ id: 'off-ok', status: OFFER_STATES.RESERVED }] });
    addCartItemForOffer('off-ok');
    useOfferStore.getState()._pruneInvalidOfferCartItems();
    expect(useCartStore.getState().items.length).toBe(1);
  });
});
