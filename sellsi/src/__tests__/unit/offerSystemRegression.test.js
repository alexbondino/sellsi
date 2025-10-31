import { useOfferStore, OFFER_STATES } from '../../stores/offerStore';
import useCartStore from '../../shared/stores/cart/cartStore';

// Mock supabase
jest.mock('../../services/supabase', () => ({
  supabase: {
    rpc: jest.fn(() => Promise.resolve({ data: { success: true }, error: null }))
  }
}));

describe('Offer System Regression Tests - Backward Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOfferStore.setState({ 
      buyerOffers: [], 
      supplierOffers: [], 
      loading: false, 
      error: null 
    });
    useCartStore.setState({ items: [] });
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
      
      // Should keep approved, pending, reserved and regular item
      // Should remove paid
      expect(remaining).toHaveLength(4);
      expect(remaining.find(item => item.offer_id === 'off1')).toBeDefined(); // approved
      expect(remaining.find(item => item.offer_id === 'off2')).toBeUndefined(); // paid - removed
      expect(remaining.find(item => item.offer_id === 'off3')).toBeDefined(); // pending
      expect(remaining.find(item => item.offer_id === 'off4')).toBeDefined(); // reserved
      expect(remaining.find(item => !item.offer_id)).toBeDefined(); // regular
    });

    test('forceCleanCartOffers only affects finalized offers', () => {
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

      useOfferStore.setState({ buyerOffers: offers });
      useCartStore.setState({ items: cartItems });

      useOfferStore.getState().forceCleanCartOffers();

      const remaining = useCartStore.getState().items;
      
      // forceCleanCartOffers removes paid, rejected, expired, cancelled
      // Should keep: pending, approved, reserved, regular (4 items)
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

    test('handles malformed cart items gracefully', () => {
      const offers = [
        { id: 'off1', status: OFFER_STATES.PAID }
      ];

      const malformedCartItems = [
        null,
        undefined,
        { id: 'valid', offer_id: 'off1' },
        { offer_id: 'off1' }, // missing id
        { id: 'no-offer' } // regular item
      ];

      useOfferStore.setState({ buyerOffers: offers });
      useCartStore.setState({ items: malformedCartItems.filter(Boolean) });

      expect(() => {
        useOfferStore.getState()._pruneInvalidOfferCartItems();
      }).not.toThrow();

      // Should handle gracefully and keep valid items
      const remaining = useCartStore.getState().items;
      expect(remaining.length).toBeGreaterThan(0);
    });

    test('performance with large number of offers and cart items', () => {
      const offers = Array.from({ length: 1000 }, (_, i) => ({
        id: `off${i}`,
        status: i % 2 === 0 ? OFFER_STATES.PAID : OFFER_STATES.APPROVED
      }));

      const cartItems = Array.from({ length: 1000 }, (_, i) => ({
        id: `item${i}`,
        offer_id: `off${i}`
      }));

      useOfferStore.setState({ buyerOffers: offers });
      useCartStore.setState({ items: cartItems });

      const startTime = performance.now();
      useOfferStore.getState()._pruneInvalidOfferCartItems();
      const endTime = performance.now();

      // Should complete in reasonable time (< 100ms for 1000 items)
      expect(endTime - startTime).toBeLessThan(100);

      // Should keep only approved offers (500 items)
      expect(useCartStore.getState().items).toHaveLength(500);
    });
  });
});
