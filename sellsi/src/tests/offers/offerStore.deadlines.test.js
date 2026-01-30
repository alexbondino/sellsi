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



  test('acceptOffer sincroniza purchase_deadline -> expires_at y status approved', async () => {
    const { supabase } = require('../../services/supabase');
    // Insertar oferta pendiente en supplierOffers
    useOfferStore.setState({ supplierOffers: [{ id: 'o_acc', status: 'pending', expires_at: new Date(Date.now() + 48*3600*1000).toISOString() }] });

    const deadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    supabase.rpc.mockResolvedValueOnce({ data: { purchase_deadline: deadline }, error: null });

    await useOfferStore.getState().acceptOffer('o_acc');
    // RPC called with expected args
    expect(supabase.rpc).toHaveBeenCalledWith('accept_offer', expect.objectContaining({ p_offer_id: 'o_acc' }));

    const offer = useOfferStore.getState().supplierOffers.find(o => o.id === 'o_acc');
    expect(offer.status).toBe('approved'); // mapping interno
    expect(offer.purchase_deadline).toBe(deadline);
    expect(offer.expires_at).toBe(deadline); // sincronizado
  });

  test('reserveOffer handles backend error (success:false) without updating state', async () => {
    const { supabase } = require('../../services/supabase');
    const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    useOfferStore.setState({ buyerOffers: [{ id: 'o_err', status: OFFER_STATES.ACCEPTED, purchase_deadline: future }] });

    supabase.rpc.mockResolvedValueOnce({ data: { success: false, error: 'already paid' }, error: null });

    await expect(useOfferStore.getState().reserveOffer('o_err')).rejects.toThrow(/already paid/);

    // Verify RPC was invoked with expected args
    expect(supabase.rpc).toHaveBeenCalledWith('mark_offer_as_purchased', expect.objectContaining({ p_offer_id: 'o_err' }));

    const off = useOfferStore.getState().buyerOffers.find(o => o.id === 'o_err');
    expect(off.status).toBe(OFFER_STATES.ACCEPTED);
  });

  test('acceptOffer preserves expires_at when purchase_deadline missing', async () => {
    const { supabase } = require('../../services/supabase');
    const originalExpires = new Date(Date.now() + 48*3600*1000).toISOString();
    useOfferStore.setState({ supplierOffers: [{ id: 'o_no_dead', status: 'pending', expires_at: originalExpires }] });

    supabase.rpc.mockResolvedValueOnce({ data: { purchase_deadline: null }, error: null });

    await useOfferStore.getState().acceptOffer('o_no_dead');
    expect(supabase.rpc).toHaveBeenCalledWith('accept_offer', expect.objectContaining({ p_offer_id: 'o_no_dead' }));
    const offer = useOfferStore.getState().supplierOffers.find(o => o.id === 'o_no_dead');
    // expires_at should remain unchanged if backend did not provide a purchase_deadline
    expect(offer.expires_at).toBe(originalExpires);
  });

  test('reserveOffer handles RPC rejection (exception) gracefully', async () => {
    const { supabase } = require('../../services/supabase');
    const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    useOfferStore.setState({ buyerOffers: [{ id: 'o_rej', status: OFFER_STATES.ACCEPTED, purchase_deadline: future }] });

    supabase.rpc.mockImplementationOnce(() => Promise.reject(new Error('RPC down')));

    await expect(useOfferStore.getState().reserveOffer('o_rej')).rejects.toThrow(/RPC down/);

    const off = useOfferStore.getState().buyerOffers.find(o => o.id === 'o_rej');
    expect(off.status).toBe(OFFER_STATES.ACCEPTED);
  });

  test('reserveOffer is idempotent for already finalized offers (RESERVED/PAID)', async () => {
    const { supabase } = require('../../services/supabase');
    useOfferStore.setState({ buyerOffers: [{ id: 'o_done', status: OFFER_STATES.RESERVED }, { id: 'o_paid', status: OFFER_STATES.PAID }] });

    const resReserved = await useOfferStore.getState().reserveOffer('o_done');
    const resPaid = await useOfferStore.getState().reserveOffer('o_paid');

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(resReserved).toEqual(expect.objectContaining({ success: false }));
    expect(resPaid).toEqual(expect.objectContaining({ success: false }));
  });

  test('reserveOffer on missing offer still calls RPC and returns success', async () => {
    const { supabase } = require('../../services/supabase');
    supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null });

    const res = await useOfferStore.getState().reserveOffer('missing_offer', 'orderX');
    expect(supabase.rpc).toHaveBeenCalledWith('mark_offer_as_purchased', { p_offer_id: 'missing_offer', p_order_id: 'orderX' });
    expect(res).toEqual(expect.objectContaining({ success: true }));
  });

  test('reserveOffer treats purchase_deadline equal to now as allowed', async () => {
    const { supabase } = require('../../services/supabase');
    // Fix time to deterministic value
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const now = new Date().toISOString();
    useOfferStore.setState({ buyerOffers: [{ id: 'o_now', status: OFFER_STATES.ACCEPTED, purchase_deadline: now }] });
    supabase.rpc.mockResolvedValueOnce({ data: { success: true }, error: null });

    const res = await useOfferStore.getState().reserveOffer('o_now');
    expect(res).toEqual(expect.objectContaining({ success: true }));
    const off = useOfferStore.getState().buyerOffers.find(o => o.id === 'o_now');
    expect(off.status).toBe(OFFER_STATES.RESERVED);
    jest.useRealTimers();
  });
});
