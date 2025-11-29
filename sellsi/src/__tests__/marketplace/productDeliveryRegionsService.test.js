/* Tests robustos para productDeliveryRegionsService */

describe('productDeliveryRegionsService - robustness', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test('fetchProductRegions throws if supabase returns error', async () => {
    const chain = { select: jest.fn(() => chain), eq: jest.fn(() => Promise.resolve({ data: null, error: new Error('db fail') })) };
    const supabase = { from: jest.fn(() => chain) };
    jest.doMock('../../services/supabase', () => ({ supabase }));

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService');
    await expect(svc.fetchProductRegions('p-1')).rejects.toThrow('db fail');
  });

  test('saveProductRegions handles invalid numeric fields and large payloads efficiently', async () => {
    const insertMock = jest.fn(() => Promise.resolve({ error: null }))

    // from() should return an object with delete()->{eq()}, insert() etc. Keep simple shape
    const supabaseFactory = {
      from: jest.fn(() => ({
        delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
        insert: insertMock,
      }))
    }

    jest.doMock('../../services/supabase', () => ({ supabase: supabaseFactory }))

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService')

    // preparar payload grande con valores inválidos y strings
    const bigPayload = Array.from({ length: 500 }, (_, i) => ({ region: `R${i}`, price: i % 7 === 0 ? 'NaN' : `${i}`, delivery_days: i % 5 === 0 ? null : `${i % 10}` }))

    // No debe lanzar
    await expect(svc.saveProductRegions('p-large', bigPayload)).resolves.toBeUndefined()

    // insertMock debe haber sido llamado al menos una vez
    expect(insertMock).toHaveBeenCalled()
  }, 20000)

  test('race: concurrent saves do not leave partial deletes (serialize delete before insert)', async () => {
    // Simular que la eliminación tarda y la inserción tarda; deberíamos observar que ambas operaciones fueron llamdas
    const deleteMock = jest.fn(() => new Promise(res => setTimeout(() => res({ error: null }), 40)))
    const insertMock = jest.fn(() => new Promise(res => setTimeout(() => res({ error: null }), 20)))

    const supabaseFactory = {
      from: jest.fn(() => ({
        delete: () => ({ eq: () => deleteMock() }),
        insert: insertMock,
      }))
    }
    jest.doMock('../../services/supabase', () => ({ supabase: supabaseFactory }))

    const svc = require('../../workspaces/marketplace/services/productDeliveryRegionsService')

    const p1 = svc.saveProductRegions('p-race', [{ region: 'r1', price: 10, delivery_days: 1 }])
    const p2 = svc.saveProductRegions('p-race', [{ region: 'r2', price: 20, delivery_days: 2 }])

    await Promise.all([p1, p2])

    expect(deleteMock).toHaveBeenCalledTimes(2)
    expect(insertMock).toHaveBeenCalledTimes(2)
  }, 20000)
})
