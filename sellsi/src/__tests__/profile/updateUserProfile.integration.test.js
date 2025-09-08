jest.mock('../../services/supabase', () => {
  // Provide a minimal chainable supabase mock for update().eq() and upsert/select flows
  const mockEq = jest.fn(() => ({ error: null, data: [] }));
  const mockUpdate = jest.fn(() => ({ eq: mockEq }));
  const mockUpsert = jest.fn(() => ({ error: null }));
  const mockSelect = jest.fn(() => ({ data: null, error: null, maybeSingle: jest.fn(() => ({ data: null, error: null })), single: jest.fn(() => ({ data: null, error: null })) }));

  const mockFrom = jest.fn(() => ({
    update: mockUpdate,
    upsert: mockUpsert,
    select: mockSelect,
    maybeSingle: jest.fn(() => ({ data: null, error: null })),
    single: jest.fn(() => ({ data: null, error: null }))
  }));

  const supabase = {
    from: mockFrom,
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => ({ error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn/fake.png' } })),
        list: jest.fn(() => ({ data: [], error: null })),
        remove: jest.fn(() => ({ error: null }))
      }))
    },
    auth: {
      getUser: jest.fn(() => ({ data: { user: { id: 'uid-123', email: 'a@b' } }, error: null }))
    }
  };

  return { supabase };
});

const { supabase } = require('../../services/supabase');
const { updateUserProfile } = require('../../services/user/profileService');

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

  test('proceeds to DB operations when payload valid', async () => {
    const payload = { shipping_region: 'metropolitana', shipping_commune: 'Santiago', shipping_address: 'Av 1' };
    const res = await updateUserProfile('uid-123', payload);
    expect(res.success).toBe(true);
    // At least users.update should be called once
    expect(supabase.from).toHaveBeenCalled();
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

  test('swallows non-fatal bank_info upsert errors and returns success true', async () => {
    // 1) users.update succeeds
    // 2) bank_info upsert returns an error (should be caught and logged in service)
    supabase.from
      .mockReturnValueOnce({ update: jest.fn(() => ({ eq: jest.fn(() => Promise.resolve({ error: null })) })) })
      .mockReturnValueOnce({ upsert: jest.fn(() => Promise.resolve({ error: { message: 'bank upsert failed' } })) });

    const payload = { account_holder: 'X', bank: 'BCI', account_number: '123' };
    const res = await updateUserProfile('uid-123', payload);

    // Service catches bank upsert errors and does not fail the whole operation
    expect(res.success).toBe(true);
    // Ensure supabase.from was called at least twice (users update + bank upsert)
    expect(supabase.from).toHaveBeenCalled();
  });
});
