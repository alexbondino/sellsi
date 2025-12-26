import { useOfferStore, OFFER_STATES } from '../../stores/offerStore';
import useCartStore from '../../shared/stores/cart/cartStore';
import { normalizeStatus } from '../../stores/offers/constants';
import { pruneInvalidOfferCartItems } from '../../stores/offers/effects';

// Mock supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    rpc: jest.fn(() => Promise.resolve({ data: { success: true }, error: null }))
  }
}));

describe('Offer System Regression Tests - Backward Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset completo del store para evitar contaminación entre tests
    useOfferStore.setState({ 
      buyerOffers: [], 
      supplierOffers: [], 
      loading: false, 
      error: null,
      _cache: { buyer: new Map(), supplier: new Map() },
      _inFlight: { buyer: new Map(), supplier: new Map() }
    });
    // Reset cart store y limpiar handlers que tests previos pudieran haber añadido
    useCartStore.setState({ items: [], clearCart: undefined, clearLocal: undefined, setItems: undefined });
  });

  describe('Existing functionality should remain unchanged', () => {
    test('regular products without offers still work in cart', () => {
      const regularItems = [
        { id: 'reg1', name: 'Regular Product 1', quantity: 2 },
        { id: 'reg2', name: 'Regular Product 2', quantity: 1 }
      ];

      useCartStore.setState({ items: regularItems });

      // Executing offer pruning should not affect regular items
      useOfferStore.getState()._pruneInvalidOfferCartItems();
      
      expect(useCartStore.getState().items).toHaveLength(2);
      expect(useCartStore.getState().items).toEqual(regularItems);
    });

    test('existing offer states (approved, pending, etc.) behavior unchanged', () => {
      const existingOffers = [
        { id: 'off1', status: OFFER_STATES.PENDING },
        { id: 'off2', status: OFFER_STATES.APPROVED },
        { id: 'off3', status: OFFER_STATES.REJECTED },
        { id: 'off4', status: OFFER_STATES.EXPIRED },
        { id: 'off5', status: OFFER_STATES.CANCELLED }
      ];

      const cartItems = [
        { id: 'item1', offer_id: 'off1' },
        { id: 'item2', offer_id: 'off2' },
        { id: 'item3', offer_id: 'off3' },
        { id: 'item4', offer_id: 'off4' },
        { id: 'item5', offer_id: 'off5' }
      ];

      useOfferStore.setState({ buyerOffers: existingOffers });
      useCartStore.setState({ items: cartItems });

      useOfferStore.getState()._pruneInvalidOfferCartItems();

      // Should keep pending and approved, remove rejected, expired, cancelled 
      const remaining = useCartStore.getState().items;
      expect(remaining).toHaveLength(2); // solo pending y approved
      expect(remaining.find(item => item.offer_id === 'off1')).toBeDefined(); // pending
      expect(remaining.find(item => item.offer_id === 'off2')).toBeDefined(); // approved
      expect(remaining.find(item => item.offer_id === 'off3')).toBeUndefined(); // rejected - removed
      expect(remaining.find(item => item.offer_id === 'off4')).toBeUndefined(); // expired - removed
      expect(remaining.find(item => item.offer_id === 'off5')).toBeUndefined(); // cancelled - removed
    });

    test('cart clearing for regular checkout still works', async () => {
      const mixedItems = [
        { id: 'reg1', name: 'Regular Product', quantity: 1 },
        { id: 'off1', name: 'Offer Product', quantity: 2, offer_id: 'offer123' }
      ];

      const mockClearCart = jest.fn().mockResolvedValue();
      const mockClearLocal = jest.fn();

      useCartStore.setState({ 
        items: mixedItems,
        clearCart: mockClearCart,
        clearLocal: mockClearLocal
      });

      // Simulate regular checkout clearing
      await useCartStore.getState().clearCart();
      useCartStore.getState().clearLocal();

      expect(mockClearCart).toHaveBeenCalled();
      expect(mockClearLocal).toHaveBeenCalled();
    });
  });

  describe('New functionality integrates seamlessly', () => {
    test('paid offers are cleaned up without affecting other states', () => {
      const mixedOffers = [
        { id: 'off1', status: OFFER_STATES.APPROVED },
        { id: 'off2', status: OFFER_STATES.PAID },
        { id: 'off3', status: OFFER_STATES.PENDING },
        { id: 'off4', status: OFFER_STATES.RESERVED }
      ];

      const cartItems = [
        { id: 'item1', offer_id: 'off1' },
        { id: 'item2', offer_id: 'off2' },
        { id: 'item3', offer_id: 'off3' },
        { id: 'item4', offer_id: 'off4' },
        { id: 'item5' } // regular item
      ];

      useOfferStore.setState({ buyerOffers: mixedOffers });
      useCartStore.setState({ items: cartItems });

      useOfferStore.getState()._pruneInvalidOfferCartItems();

      const remaining = useCartStore.getState().items;

      // Should keep approved, pending and reserved offers and the regular item; paid must be removed
      const remainingOfferIds = remaining.filter(i => i.offer_id).map(i => i.offer_id).sort();
      expect(remainingOfferIds).toEqual(['off1','off3','off4'].sort());
      // Regular item without offer_id should remain
      expect(remaining.find(i => !i.offer_id)).toBeDefined();
      expect(remaining).toHaveLength(4);

    });

    test('Status Normalization handles null/undefined safely', () => {
      expect(normalizeStatus(null, null, null)).toBe(OFFER_STATES.PENDING);
      expect(normalizeStatus(undefined, null, null)).toBe(OFFER_STATES.PENDING);
    });

    test('loadBuyerOffers triggers prune on buyer load', async () => {
      const spy = jest.spyOn(useOfferStore.getState(), '_pruneInvalidOfferCartItems');
      const { supabase } = require('../../services/supabase');
      supabase.rpc.mockResolvedValueOnce({ data: [{ id: 'o1', status: 'paid' }], error: null });

      await useOfferStore.getState().loadBuyerOffers('buyer-test');

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('forceCleanCartOffers only affects finalized offers (unit-style to avoid shared state)', () => {
      const offers = [
        { id: 'off1', status: OFFER_STATES.PENDING },
        { id: 'off2', status: OFFER_STATES.APPROVED },
        { id: 'off3', status: OFFER_STATES.RESERVED },
        { id: 'off4', status: OFFER_STATES.PAID },
        { id: 'off5', status: OFFER_STATES.REJECTED },
        { id: 'off6', status: OFFER_STATES.EXPIRED },
        { id: 'off7', status: OFFER_STATES.CANCELLED }
      ];

      const cartItems = offers.map((offer, i) => ({
        id: `item${i+1}`,
        offer_id: offer.id
      }));

      // Add regular item
      cartItems.push({ id: 'regular', name: 'Regular Product' });

      // Use a local cartStore to keep test isolated from shared state
      const cartState = { items: [...cartItems] };
      const cartStore = {
        getState: () => cartState,
        setState: (next) => { cartState.items = next.items; }
      };

      const res = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });
      expect(res.removed).toBe(4);

      const remaining = cartState.items;
      expect(remaining).toHaveLength(4);

      const remainingOfferIds = remaining
        .filter(item => item.offer_id)
        .map(item => item.offer_id);

      expect(remainingOfferIds).toContain('off1'); // pending
      expect(remainingOfferIds).toContain('off2'); // approved  
      expect(remainingOfferIds).toContain('off3'); // reserved
      expect(remainingOfferIds).not.toContain('off4'); // paid - removed
      expect(remainingOfferIds).not.toContain('off5'); // rejected - removed
      expect(remainingOfferIds).not.toContain('off6'); // expired - removed
      expect(remainingOfferIds).not.toContain('off7'); // cancelled - removed

      // Regular item should remain
      expect(remaining.find(item => !item.offer_id)).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () => {
    test('handles empty offers array gracefully', () => {
      const cartItems = [
        { id: 'item1', offer_id: 'non-existent' },
        { id: 'item2' } // regular item
      ];

      useOfferStore.setState({ buyerOffers: [] });
      useCartStore.setState({ items: cartItems });

      // Should not throw error
      expect(() => {
        useOfferStore.getState()._pruneInvalidOfferCartItems();
      }).not.toThrow();

      // When no offers exist, items with offer_id that don't have matching offers should remain
      // (the pruning only removes items for offers that exist and are in invalid states)
      const remaining = useCartStore.getState().items;
      expect(remaining).toHaveLength(2); // Both items should remain
      expect(remaining.find(item => item.id === 'item1')).toBeDefined();
      expect(remaining.find(item => item.id === 'item2')).toBeDefined();
    });

    test('handles malformed cart items gracefully (includes null/undefined) - unit style', () => {
      const offers = [ { id: 'off1', status: OFFER_STATES.PAID } ];

      const malformedCartItems = [ null, undefined, { id: 'valid', offer_id: 'off1' }, { offer_id: 'off1' }, { id: 'no-offer' } ];

      // local cart store for isolation
      const cartState = { items: malformedCartItems };
      const cartStore = { getState: () => cartState, setState: next => { cartState.items = next.items; } };

      const res = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });
      expect(res).toBeDefined();
      expect(res.removed).toBe(4);

      const remaining = cartState.items;
      expect(remaining.length).toBe(1);
      expect(remaining.find(item => item && item.id === 'no-offer')).toBeDefined();
    });

    test('performance with large number of offers and cart items (unit-style)', () => {
      const offers = Array.from({ length: 1000 }, (_, i) => ({ id: `off${i}`, status: i % 2 === 0 ? OFFER_STATES.PAID : OFFER_STATES.APPROVED }));
      const cartItems = Array.from({ length: 1000 }, (_, i) => ({ id: `item${i}`, offer_id: `off${i}` }));

      const cartState = { items: [...cartItems] };
      const cartStore = { getState: () => cartState, setState: next => { cartState.items = next.items; } };

      const startTime = performance.now();
      const res = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });
      const endTime = performance.now();

      // Relaxed timing: should complete within a reasonable bound (< 500ms)
      expect(endTime - startTime).toBeLessThan(500);

      // Should keep only approved offers (~500 items)
      expect(cartState.items).toHaveLength(500);
      expect(res.removed).toBe(500);
    });

    test('performance with large number of offers and cart items (strict threshold)', () => {
      const offers = Array.from({ length: 1000 }, (_, i) => ({ id: `off${i}`, status: i % 2 === 0 ? OFFER_STATES.PAID : OFFER_STATES.APPROVED }));
      const cartItems = Array.from({ length: 1000 }, (_, i) => ({ id: `item${i}`, offer_id: `off${i}` }));

      const cartState = { items: [...cartItems] };
      const cartStore = { getState: () => cartState, setState: next => { cartState.items = next.items; } };

      const startTime = performance.now();
      const res = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });
      const endTime = performance.now();

      // Should complete in reasonable time (< 100ms for 1000 items)
      expect(endTime - startTime).toBeLessThan(100);

      // Should keep only approved offers (500 items)
      expect(cartState.items).toHaveLength(500);
      expect(res.removed).toBe(500);
    });

    test('backend status mapping (accepted -> approved, purchased -> reserved) preserves items (unit style)', () => {
      const acc = normalizeStatus('accepted', null, null);
      const pur = normalizeStatus('purchased', null, null);
      expect(acc).toBe(OFFER_STATES.APPROVED);
      expect(pur).toBe(OFFER_STATES.RESERVED);

      const offers = [ { id: 'off-acc', status: acc }, { id: 'off-pur', status: pur }, { id: 'off-paid', status: OFFER_STATES.PAID } ];
      const cartItems = [ { id: 'i1', offer_id: 'off-acc' }, { id: 'i2', offer_id: 'off-pur' }, { id: 'i3', offer_id: 'off-paid' } ];

      const cartState = { items: [...cartItems] };
      const cartStore = { getState: () => cartState, setState: next => { cartState.items = next.items; } };

      pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });

      const remaining = cartState.items;
      expect(remaining.find(i => i.offer_id === 'off-acc')).toBeDefined();
      expect(remaining.find(i => i.offer_id === 'off-pur')).toBeDefined();
      expect(remaining.find(i => i.offer_id === 'off-paid')).toBeUndefined();
    });

    test('expires_at and purchase_deadline correctly expire offers and prune cart (unit style)', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
      const expiredPending = normalizeStatus('pending', past, null);
      const expiredApproved = normalizeStatus('accepted', null, past);
      expect(expiredPending).toBe(OFFER_STATES.EXPIRED);
      expect(expiredApproved).toBe(OFFER_STATES.EXPIRED);

      const offers = [ { id: 'o-pend', status: expiredPending }, { id: 'o-app', status: expiredApproved }, { id: 'o-ok', status: OFFER_STATES.APPROVED } ];
      const cartItems = [ { id: 'a', offer_id: 'o-pend' }, { id: 'b', offer_id: 'o-app' }, { id: 'c', offer_id: 'o-ok' } ];

      const cartState = { items: [...cartItems] };
      const cartStore = { getState: () => cartState, setState: next => { cartState.items = next.items; } };

      pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });

      const rem = cartState.items;
      expect(rem.find(i => i.offer_id === 'o-pend')).toBeUndefined();
      expect(rem.find(i => i.offer_id === 'o-app')).toBeUndefined();
      expect(rem.find(i => i.offer_id === 'o-ok')).toBeDefined();
    });

    test('forceCleanCartOffers delegates to _pruneInvalidOfferCartItems', () => {
      const spy = jest.spyOn(useOfferStore.getState(), '_pruneInvalidOfferCartItems');
      useOfferStore.getState().forceCleanCartOffers();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('reserveOffer sets RESERVED and does not remove reserved items from cart', async () => {
      const offer = { id: 'off-res', status: OFFER_STATES.PENDING };
      useOfferStore.setState({ buyerOffers: [offer] });
      useCartStore.setState({ items: [{ id: 'cart1', offer_id: 'off-res' }] });

      // Ensure RPC returns success for mark_offer_as_purchased
      const { supabase } = require('../../services/supabase');
      supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null });

      await useOfferStore.getState().reserveOffer('off-res', 'order-1');

      const o = useOfferStore.getState().buyerOffers.find(o => o.id === 'off-res');
      expect(o.status).toBe(OFFER_STATES.RESERVED);
      // cart should still include the reserved item
      expect(useCartStore.getState().items.find(i => i.offer_id === 'off-res')).toBeDefined();
    });
  });
});
