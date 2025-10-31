import { useOfferStore, OFFER_STATES } from '../../stores/offerStore';

// Mock de Supabase ANTES de importar (se reutiliza el mock global de otros tests)
jest.mock('../../services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    channel: jest.fn(() => ({ on: jest.fn(() => ({ subscribe: jest.fn(() => ({ id: 'sub_mock' })) })), subscribe: jest.fn(() => ({ id: 'sub_mock' })) })),
    removeChannel: jest.fn(() => {})
  }
}));

describe('offerStore deadlines & reservation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset estado del store
    useOfferStore.setState({ buyerOffers: [], supplierOffers: [], loading: false, error: null });
  });

  test('reserveOffer (éxito) cambia a RESERVED y envía orderId', async () => {
    const { supabase } = require('../../services/supabase');
    // Preparar oferta aceptada dentro del plazo
    const purchase_deadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    useOfferStore.setState({ buyerOffers: [{ id: 'o_ok', status: OFFER_STATES.ACCEPTED, purchase_deadline }] });

    supabase.rpc.mockImplementationOnce((fn, args) => {
      expect(fn).toBe('mark_offer_as_purchased');
      expect(args).toEqual({ p_offer_id: 'o_ok', p_order_id: 'order_123' });
      return Promise.resolve({ data: { success: true }, error: null });
    });

    const res = await useOfferStore.getState().reserveOffer('o_ok', 'order_123');
    expect(res).toEqual(expect.objectContaining({ success: true }));

    const offer = useOfferStore.getState().buyerOffers.find(o => o.id === 'o_ok');
    expect(offer.status).toBe(OFFER_STATES.RESERVED);
    expect(offer.reserved_at).toBeDefined();
    expect(offer.purchased_at).toBeDefined();
  });

  test('reserveOffer bloquea cuando purchase_deadline expiró', async () => {
    const { supabase } = require('../../services/supabase');
    const pastDeadline = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    useOfferStore.setState({ buyerOffers: [{ id: 'o_exp', status: OFFER_STATES.ACCEPTED, purchase_deadline: pastDeadline }] });

    const initialCalls = supabase.rpc.mock.calls.length;
    const res = await useOfferStore.getState().reserveOffer('o_exp');
    // No debe llamar al RPC de mark_offer_as_purchased
    expect(supabase.rpc.mock.calls.length).toBe(initialCalls);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/caducó/i);
    const offer = useOfferStore.getState().buyerOffers.find(o => o.id === 'o_exp');
    expect(offer.status).toBe(OFFER_STATES.EXPIRED);
    expect(offer.expired_at).toBeDefined();
  });

  test('acceptOffer sincroniza purchase_deadline -> expires_at y status approved', async () => {
    const { supabase } = require('../../services/supabase');
    // Insertar oferta pendiente en supplierOffers
    useOfferStore.setState({ supplierOffers: [{ id: 'o_acc', status: 'pending', expires_at: new Date(Date.now() + 48*3600*1000).toISOString() }] });

    const deadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    supabase.rpc.mockImplementationOnce((fn, args) => {
      expect(fn).toBe('accept_offer');
      expect(args).toEqual({ p_offer_id: 'o_acc' });
      return Promise.resolve({ data: { purchase_deadline: deadline }, error: null });
    });

    await useOfferStore.getState().acceptOffer('o_acc');
    const offer = useOfferStore.getState().supplierOffers.find(o => o.id === 'o_acc');
    expect(offer.status).toBe('approved'); // mapping interno
    expect(offer.purchase_deadline).toBe(deadline);
    expect(offer.expires_at).toBe(deadline); // sincronizado
  });
});
