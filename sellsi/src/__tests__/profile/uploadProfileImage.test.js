jest.mock('../../services/supabase', () => {
  // Generic storage mock factory used below per test via mockReturnValueOnce
  const storageFrom = jest.fn(() => ({
    upload: jest.fn(() => Promise.resolve({ error: null })),
    getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn/fake.png' } })),
    list: jest.fn(() => Promise.resolve({ data: [], error: null })),
    remove: jest.fn(() => Promise.resolve({ error: null }))
  }));

  const supabase = {
    storage: {
      from: storageFrom
    },
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'uid-123' } }, error: null }))
    },
    from: jest.fn()
  };

  return { supabase };
});

const { supabase } = require('../../services/supabase');
const { uploadProfileImage } = require('../../services/user/profileService');

describe('uploadProfileImage error/retry behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns error when upload fails', async () => {
    // storage.upload will return an error
    supabase.storage.from.mockReturnValueOnce({
      upload: jest.fn(() => Promise.resolve({ error: { message: 'upload failed' } })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn/fake.png' } })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
      remove: jest.fn(() => Promise.resolve({ error: null }))
    });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);
    expect(res.url).toBeNull();
    expect(res.error).toBeTruthy();
  });

  test('returns error when users.update fails after successful upload', async () => {
    // 1) storage.upload success
    supabase.storage.from.mockReturnValueOnce({
      upload: jest.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn/new-image.png' } })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
      remove: jest.fn(() => Promise.resolve({ error: null }))
    });

    // 2) users.update -> eq().select() returns error
    const updateEq = jest.fn(() => Promise.resolve({ data: null, error: { message: 'update failed' } }));
    const update = jest.fn(() => ({ eq: updateEq }));
    supabase.from.mockReturnValueOnce({ update });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);
    expect(res.url).toBeNull();
    expect(res.error).toBeTruthy();
  });

  test('retries update when user read shows mismatch and returns success on retry', async () => {
    const publicUrl = 'https://cdn/new-image.png';

    // 1) storage.upload success
    // First call: deleteAllUserImages -> list returns empty
    supabase.storage.from.mockReturnValueOnce({
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
      remove: jest.fn(() => Promise.resolve({ error: null }))
    });

    // Second call: upload
    supabase.storage.from.mockReturnValueOnce({
      upload: jest.fn(() => Promise.resolve({ error: null })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
      remove: jest.fn(() => Promise.resolve({ error: null }))
    });

    // Third call: getPublicUrl
    supabase.storage.from.mockReturnValueOnce({
      getPublicUrl: jest.fn(() => ({ data: { publicUrl } })),
      list: jest.fn(() => Promise.resolve({ data: [], error: null })),
      remove: jest.fn(() => Promise.resolve({ error: null }))
    });

    // Sequence of supabase.from calls:
    // a) users.update(...).eq(...).select() -> succeeds (no error)
    // b) users.select('logo_url').eq(...).single() -> returns different logo_url -> triggers retry
    // c) users.update(...).eq(...) -> retry update -> return success

    const firstUpdateSelect = jest.fn(() => Promise.resolve({ data: [{},], error: null }));
    const firstUpdate = jest.fn(() => ({ eq: jest.fn(() => ({ select: firstUpdateSelect })) }));

    const userReadSingle = jest.fn(() => Promise.resolve({ data: { logo_url: 'https://cdn/old.png' }, error: null }));
    const userSelect = jest.fn(() => ({ eq: jest.fn(() => ({ single: userReadSingle })) }));

    const retryEq = jest.fn(() => Promise.resolve({ error: null }));
    const retryUpdate = jest.fn(() => ({ eq: retryEq }));

    supabase.from
      .mockReturnValueOnce({ update: firstUpdate })
      .mockReturnValueOnce({ select: userSelect })
      .mockReturnValueOnce({ update: retryUpdate });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);

    expect(res.url).toBe(publicUrl);
    expect(res.error).toBeNull();

    // Ensure the retry update was attempted
    expect(retryUpdate).toHaveBeenCalled();
  });
});
