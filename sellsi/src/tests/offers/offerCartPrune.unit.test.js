import { pruneInvalidOfferCartItems } from '../../stores/offers/effects';
import { OFFER_STATES } from '../../stores/offers/constants';

describe('pruneInvalidOfferCartItems (unit) - isolated cartStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes items whose offer_id is in INVALID_FOR_CART using setItems', () => {
    const cartItems = [
      { id: 'i1', offer_id: 'off-paid' },
      { id: 'i2', offer_id: 'off-ok' },
      { id: 'i3', offer_id: 'off-exp' }
    ];

    // cartState exposes setItems
    const cartState = {
      items: [...cartItems],
      setItems: jest.fn((items) => { cartState.items = items; })
    };
    const cartStore = { getState: () => cartState };

    const offers = [
      { id: 'off-paid', status: OFFER_STATES.PAID },
      { id: 'off-exp', status: OFFER_STATES.EXPIRED },
      { id: 'off-ok', status: OFFER_STATES.RESERVED }
    ];

    const res = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });

    expect(res).toEqual(expect.objectContaining({ removed: 2 }));
    expect(cartState.setItems).toHaveBeenCalled();
    expect(cartState.items).toEqual([{ id: 'i2', offer_id: 'off-ok' }]);
  });

  it('removes items using cartStore.setState fallback when setItems not present', () => {
    const cartItems = [
      { id: 'i1', offer_id: 'off-paid' },
      { id: 'i2', offer_id: 'off-ok' }
    ];

    // cartStore provides setState (fallback)
    const cartStore = {
      getState: () => ({ items: [...cartItems] }),
      setState: jest.fn((next) => { cartStore._items = next.items; })
    };

    const offers = [ { id: 'off-paid', status: OFFER_STATES.PAID } ];

    const res = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });

    expect(res.removed).toBe(1);
    expect(cartStore.setState).toHaveBeenCalled();
    // verify remaining was passed to setState
    expect(cartStore._items).toEqual([{ id: 'i2', offer_id: 'off-ok' }]);
  });

  it('is idempotent: second call removes 0 and does not call setItems again', () => {
    const cartItems = [ { id: 'i1', offer_id: 'off-paid' }, { id: 'i2', offer_id: 'off-ok' } ];
    const cartState = {
      items: [...cartItems],
      setItems: jest.fn((items) => { cartState.items = items; })
    };
    const cartStore = { getState: () => cartState };

    const offers = [ { id: 'off-paid', status: OFFER_STATES.PAID } ];

    const r1 = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });
    expect(r1.removed).toBe(1);
    expect(cartState.setItems).toHaveBeenCalledTimes(1);

    // Clear spy and call again
    cartState.setItems.mockClear();
    const r2 = pruneInvalidOfferCartItems({ cartStore, offers, log: () => {} });
    expect(r2.removed).toBe(0);
    expect(cartState.setItems).not.toHaveBeenCalled();
  });
});