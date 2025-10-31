/**
 * Integration: Dual accepted offers for same product must remain separate lines through order creation and finalize_order_pricing.
 */
import { checkoutService } from '../../domains/checkout/services';

// Mock security services that rely on import.meta
jest.mock('../../services/security', () => ({
  trackUserAction: () => Promise.resolve(),
}));
jest.mock('../../services/security/ipTrackingService', () => ({ updateUserIP: () => Promise.resolve() }));
jest.mock('../../services/security/banService', () => ({ ensureNotBanned: () => Promise.resolve() }));

// Mocks
const mockInsert = jest.fn();
const mockRpc = jest.fn();
const mockNotify = jest.fn();

let mockLastOrderItems = [];
jest.mock('../../services/supabase', () => ({
  supabase: {
    from: (table) => ({
      insert: (payload) => ({ select: () => ({ single: () => {
        mockInsert(table, payload);
  mockLastOrderItems = payload.items;
        const order = { id: 'order-1', items: payload.items };
        return Promise.resolve({ data: order, error: null });
      } }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'order-1' }, error: null }) }) }) })
    }),
    rpc: (fn, args) => {
      mockRpc(fn, args);
      if (fn === 'finalize_order_pricing') {
  const sealedItems = mockLastOrderItems.map(it => ({
          ...it,
          unit_price_effective: it.offered_price || it.price_at_addition
        }));
        return Promise.resolve({ data: [{ id: 'order-1', items: sealedItems, total: 1700, payment_fee: 0, grand_total: 1700 }], error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }
  }
}));

jest.mock('../../services/user/orderService', () => ({
  orderService: { notifyNewOrder: (...a) => { mockNotify(...a); return Promise.resolve(); } }
}));

// Helper: build two distinct offers for same product id
function buildOffers() {
  const baseProductId = 'prod-123';
  return [
    { product_id: baseProductId, quantity: 1, price_at_addition: 900, offer_id: 'offer-A', offered_price: 900, isOffered: true },
    { product_id: baseProductId, quantity: 2, price_at_addition: 800, offer_id: 'offer-B', offered_price: 800, isOffered: true }
  ];
}

describe('Dual offers separation + finalize_order_pricing', () => {
  it('preserves two lines with distinct offer_id and effective pricing', async () => {
    const items = buildOffers();
    const order = await checkoutService.createOrder({
      userId: 'buyer-1',
      items,
      subtotal: 1700,
      tax: 0,
      shipping: 0,
      total: 1700,
      paymentMethod: 'khipu'
    });

    expect(order.items).toHaveLength(2);
    const offerIds = order.items.map(i => i.offer_id).sort();
    expect(offerIds).toEqual(['offer-A', 'offer-B']);

    // Invocar directamente finalize_order_pricing (más controlado que processKhipuPayment para este test)
    const { supabase } = require('../../services/supabase');
    const { data: sealed } = await supabase.rpc('finalize_order_pricing', { p_order_id: order.id });
    const sealedOrder = Array.isArray(sealed) ? sealed[0] : sealed;
    expect(sealedOrder.items).toHaveLength(2);
    sealedOrder.items.forEach(it => {
      expect(it.unit_price_effective).toBe(it.offered_price);
    });
    expect(mockRpc).toHaveBeenCalledWith('finalize_order_pricing', { p_order_id: 'order-1' });

    // Aserción adicional: no se intentó fusionar ofertas (seguimos con 2 líneas)
    const mergedByOffer = Object.values(order.items.reduce((acc, it) => {
      const key = `${it.product_id}-${it.offer_id}`;
      acc[key] = (acc[key] || 0) + it.quantity;
      return acc;
    }, {}));
    expect(mergedByOffer).toHaveLength(2);
  });
});
