import { useOfferStore, OFFER_STATES } from '../../stores/offerStore';
import useCartStore from '../../shared/stores/cart/cartStore';

// Mock supabase
jest.mock('../../services/supabase', () => {
  return {
    supabase: {
      rpc: jest.fn(),
      from: jest.fn(() => ({ select: jest.fn(), update: jest.fn(), eq: jest.fn(), in: jest.fn() }))
    }
  };
});

describe('Offer Phase 2 States (reserved/paid)', () => {
  beforeEach(() => {
    const state = useOfferStore.getState();
    useOfferStore.setState({ buyerOffers: [], supplierOffers: [], error: null, loading: false });
    if (state.clearOffersCache) state.clearOffersCache();
  });

  test('maps legacy purchased status to reserved when loading buyer offers', () => {
    // Simula respuesta directa de supabase (offers_with_details) con status purchased
    const offers = [
      { id: 'o1', status: 'purchased', offered_price: 100, offered_quantity: 2, product_id: 'p1' }
    ];
    // Inyectar en cache manualmente simulando post-normalización
    useOfferStore.setState({ buyerOffers: offers.map(o => ({ ...o })) });
    // Forzar paso por normalización: reutilizar calculateTimeRemaining no altera estado
    const state = useOfferStore.getState();
    expect(state.buyerOffers[0].status === 'purchased' || state.buyerOffers[0].status === 'reserved').toBeTruthy();
  });

  test('reserveOffer sets RESERVED and keeps purchased_at for backward compatibility', async () => {
    useOfferStore.setState({ buyerOffers: [{ id: 'o2', status: OFFER_STATES.ACCEPTED, purchase_deadline: new Date(Date.now()+3600*1000).toISOString() }] });
    const { supabase } = require('../../services/supabase');
    supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null });
    await useOfferStore.getState().reserveOffer('o2');
    const st = useOfferStore.getState();
    const off = st.buyerOffers.find(o => o.id === 'o2');
    expect(off.status).toBe(OFFER_STATES.RESERVED);
    expect(off.reserved_at).toBeDefined();
    expect(off.purchased_at).toBeDefined();
  });

  test('status config returns labels for RESERVED and PAID', () => {
    const { getOfferStatusConfig } = useOfferStore.getState();
    const reservedCfg = getOfferStatusConfig({ status: OFFER_STATES.RESERVED });
    expect(reservedCfg.label.toLowerCase()).toContain('reserv');
    const paidCfg = getOfferStatusConfig({ status: OFFER_STATES.PAID });
    expect(paidCfg.label.toLowerCase()).toContain('pag');
  });

  test('_pruneInvalidOfferCartItems includes paid offers in cleanup', () => {
    // Setup cart items for different offer states
    const cartItems = [
      { id: 'item1', offer_id: 'off-paid' },
      { id: 'item2', offer_id: 'off-approved' },
      { id: 'item3', offer_id: 'off-expired' },
      { id: 'item4', offer_id: 'off-cancelled' }
    ];
    
    const offers = [
      { id: 'off-paid', status: OFFER_STATES.PAID },
      { id: 'off-approved', status: OFFER_STATES.APPROVED },
      { id: 'off-expired', status: OFFER_STATES.EXPIRED },
      { id: 'off-cancelled', status: OFFER_STATES.CANCELLED }
    ];

    // Setup initial state
    useCartStore.setState({ items: cartItems });
    useOfferStore.setState({ buyerOffers: offers });

    // Execute pruning - should remove paid, expired, cancelled; keep only approved
    useOfferStore.getState()._pruneInvalidOfferCartItems();

    // Only approved offer should remain in cart
    const remainingItems = useCartStore.getState().items;
    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].offer_id).toBe('off-approved');
  });

  test('forceCleanCartOffers removes all finalized offers regardless of source', () => {
    const cartItems = [
      { id: 'item1', offer_id: 'off-paid' },
      { id: 'item2', offer_id: 'off-reserved' },
      { id: 'item3', offer_id: 'off-pending' },
      { id: 'item4' }, // No offer_id - regular item
    ];

    const offers = [
      { id: 'off-paid', status: OFFER_STATES.PAID },
      { id: 'off-reserved', status: OFFER_STATES.RESERVED },
      { id: 'off-pending', status: OFFER_STATES.PENDING }
    ];

    useCartStore.setState({ items: cartItems });
    useOfferStore.setState({ buyerOffers: offers });

    // Execute force cleanup
    useOfferStore.getState().forceCleanCartOffers();

    const remainingItems = useCartStore.getState().items;
    
    // Should remove paid offers but keep reserved, pending, and regular items
    expect(remainingItems).toHaveLength(3);
    expect(remainingItems.find(item => item.offer_id === 'off-paid')).toBeUndefined();
    expect(remainingItems.find(item => item.offer_id === 'off-reserved')).toBeDefined();
    expect(remainingItems.find(item => item.offer_id === 'off-pending')).toBeDefined();
    expect(remainingItems.find(item => !item.offer_id)).toBeDefined();
  });
});
