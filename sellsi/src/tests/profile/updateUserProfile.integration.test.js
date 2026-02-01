// prevent module init order issues: mock a controllable from() before requiring the service
const mockSupabaseFrom = jest.fn();
const mockStorageFrom = jest.fn();
const mockAuthGetUser = jest.fn(() => Promise.resolve({ data: { user: { id: 'uid-123', email: 'a@b' } }, error: null }));

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: mockSupabaseFrom,
    storage: { from: () => ({ upload: jest.fn(() => Promise.resolve({ data: null, error: null })), getPublicUrl: jest.fn(() => Promise.resolve({ data: { publicUrl: 'https://cdn/fake.png' } })), list: jest.fn(() => Promise.resolve({ data: [], error: null })), remove: jest.fn(() => Promise.resolve({ data: null, error: null })) }) },
    auth: { getUser: () => mockAuthGetUser() }
  }
}));

const { supabase } = require('../../services/supabase');

// Mock the cache module to avoid fragile spies and ensure profileService picks up the mock
const mockInvalidateCache = jest.fn();
jest.mock('../../services/user/profileCache', () => ({ invalidateUserProfileCache: (...args) => mockInvalidateCache(...args) }));

const profileService = require('../../services/user/profileService');
const { updateUserProfile } = profileService;

describe('updateUserProfile integration (validation early return)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns validation error and does NOT call DB when shipping region provided but missing commune/address', async () => {
    const payload = { shippingRegion: 'metropolitana' };
    const res = await updateUserProfile('uid-123', payload);

    // Expect validation failure
    expect(res.success).toBe(false);
    expect(res.validationErrors).toBeDefined();
    expect(res.validationErrors).toHaveProperty('shipping');

    // Ensure supabase.from was never used to update users/shipping/billing
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('returns validation error and does NOT upsert billing when business name present but missing billing fields', async () => {
    const payload = { business_name: 'My Co' };
    const res = await updateUserProfile('uid-123', payload);
    expect(res.success).toBe(false);
    expect(res.validationErrors).toHaveProperty('billing');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('proceeds to DB operations when payload valid and maps fields correctly', async () => {
    // Prepare spies to capture update payload
    const updateSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn().mockResolvedValue({ error: null });

    mockSupabaseFrom.mockImplementation((table) => {
      if (table === 'users') return { update: updateSpy, eq: eqSpy };
      return { upsert: jest.fn().mockResolvedValue({ error: null }) };
    });

    const payload = { shipping_region: 'metropolitana', shipping_commune: 'Santiago', shipping_address: 'Av 1', minimumPurchaseAmount: 5000, logo_url: null };
    // Ensure cache mock is clean
    mockInvalidateCache.mockClear();

    const res = await updateUserProfile('uid-123', payload);
    expect(res.success).toBe(true);
    expect(mockSupabaseFrom).toHaveBeenCalledWith('users');

    const updateCall = updateSpy.mock.calls[0][0];
    expect(updateCall).toMatchObject({ logo_url: null, minimum_purchase_amount: 5000 });
    // Cache should be invalidated for the user
    expect(mockInvalidateCache).toHaveBeenCalledWith('uid-123');
  });

  test('returns overall failure when users.update DB call fails', async () => {
    // Simulate users.update -> eq() resolves with an error
    supabase.from.mockReturnValueOnce({
      update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: { message: 'users update failed' } })) }))
    });

    const payload = { user_nm: 'New Name' };
    const res = await updateUserProfile('uid-123', payload);

    expect(res.success).toBe(false);
    expect(res.error).toBeTruthy();
    // validationErrors should not be present for DB error
    expect(res.validationErrors).toBeUndefined();
  });

  test('succeeds even if shipping_info.upsert fails', async () => {
    // Simulate users.update success, shipping_info.upsert returns error
    supabase.from
      .mockReturnValueOnce({ update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) })) })
      .mockReturnValueOnce({ upsert: jest.fn(() => Promise.resolve({ error: { message: 'shipping upsert failed' } })) });

    const payload = { shipping_region: 'metropolitana', shipping_commune: 'Santiago', shipping_address: 'Av 1' };
    const res = await updateUserProfile('uid-123', payload);
    expect(res.success).toBe(true);
  });

  test('succeeds even if billing_info.upsert fails', async () => {
    // Simulate users.update success, billing_info.upsert returns error
    supabase.from
      .mockReturnValueOnce({ update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) })) })
      .mockReturnValueOnce({ upsert: jest.fn(() => Promise.resolve({ error: { message: 'billing upsert failed' } })) });

    const payload = { business_name: 'X', billing_rut: '1-9', business_line: 'Retail', billing_address: 'Calle 1', billing_region: 'metropolitana', billing_commune: 'Santiago' };
    const res = await updateUserProfile('uid-123', payload);
    expect(res.success).toBe(true);
  });

  test('swallows non-fatal bank_info upsert errors and returns success true and partialErrors', async () => {
    // users.update succeeds
    const updateSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn().mockResolvedValue({ error: null });

    mockSupabaseFrom
      .mockImplementationOnce((table) => (table === 'users' ? { update: updateSpy, eq: eqSpy } : {}))
      .mockImplementationOnce((table) => (table === 'bank_info' ? { upsert: jest.fn().mockResolvedValue({ error: { message: 'bank upsert failed' } }) } : {}));

    const payload = { account_holder: 'X', bank: 'BCI', account_number: '123' };
    // Ensure cache mock is clean
    mockInvalidateCache.mockClear();

    const res = await updateUserProfile('uid-123', payload);

    // Service catches bank upsert errors and does not fail the whole operation
    expect(res.success).toBe(true);
    expect(res.partialErrors).toBeDefined();
    expect(res.partialErrors.bank).toMatch(/bank upsert failed/);
    expect(mockSupabaseFrom).toHaveBeenCalled();
    // Cache invalidation should have been attempted
    expect(mockInvalidateCache).toHaveBeenCalledWith('uid-123');
  });

  test('upserts supplier info when supplier legal fields present and provides name fallback', async () => {
    const updateSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn().mockResolvedValue({ error: null });

    let capturedUpsertArg = null;

    mockSupabaseFrom
      .mockImplementationOnce((table) => (table === 'users' ? { update: updateSpy, eq: eqSpy } : {}))
      .mockImplementationOnce((table) => (table === 'supplier'
        ? { upsert: jest.fn((arg) => { capturedUpsertArg = arg; return Promise.resolve({ error: null }); }) }
        : {}));

    const payload = {
      supplier_legal_name: 'My Supplier SA',
      supplier_legal_rut: '12.345.678-9',
      supplier_legal_address: 'Av 1',
    };

    const res = await updateUserProfile('uid-123', payload);
    expect(res.success).toBe(true);
    // Ensure supabase.from was called for supplier
    expect(mockSupabaseFrom).toHaveBeenCalledWith('supplier');
    // Ensure `name` fallback was provided (supplier_legal_name used as fallback)
    expect(capturedUpsertArg).not.toBeNull();
    expect(capturedUpsertArg).toMatchObject({ name: 'My Supplier SA', user_id: 'uid-123' });
  });

  test('returns partialErrors when supplier upsert fails but overall succeeds', async () => {
    const updateSpy = jest.fn().mockReturnThis();
    const eqSpy = jest.fn().mockResolvedValue({ error: null });

    mockSupabaseFrom
      .mockImplementationOnce((table) => (table === 'users' ? { update: updateSpy, eq: eqSpy } : {}))
      .mockImplementationOnce((table) => (table === 'supplier' ? { upsert: jest.fn().mockResolvedValue({ error: { message: 'supplier upsert failed' } }) } : {}));

    const payload = { supplier_legal_name: 'Name', supplier_legal_rut: '1-9' };

    const res = await updateUserProfile('uid-123', payload);
    expect(res.success).toBe(true);
    expect(res.partialErrors).toBeDefined();
    expect(res.partialErrors.supplier).toMatch(/supplier upsert failed/);
  });
});
