// Prevent module init order issues and provide inspectable mocks
const mockSupabaseFrom = jest.fn();
const mockStorageFrom = jest.fn();

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: (...args) => mockSupabaseFrom(...args),
    storage: { from: (...args) => mockStorageFrom(...args) },
    auth: { getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'uid-123' } }, error: null })) }
  }
}));

// Mock profile cache to assert invalidation
const mockInvalidateCache = jest.fn();
jest.mock('../../services/user/profileCache', () => ({ invalidateUserProfileCache: (...args) => mockInvalidateCache(...args) }));

const { supabase } = require('../../services/supabase');
const { uploadProfileImage } = require('../../services/user/profileService');
const { invalidateUserProfileCache } = require('../../services/user/profileCache');

// Helper for async responses and errors
const asyncRes = (data = null, error = null) => Promise.resolve({ data, error });
const err = (message) => Promise.resolve({ data: null, error: { message } });

// Base factories for storage and db mocks
const baseStorage = () => ({
  upload: jest.fn(() => asyncRes(null)),
  getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn/fake.png' } })),
  list: jest.fn(() => asyncRes([])),
  remove: jest.fn(() => asyncRes(null))
});

const baseSupabase = () => ({
  update: jest.fn(() => ({ eq: jest.fn(() => asyncRes({ data: null })) })),
  select: jest.fn(() => ({ eq: jest.fn(() => ({ single: jest.fn(() => asyncRes({ data: { logo_url: 'https://cdn/fake.png' } })) })) }))
});

describe('uploadProfileImage error/retry behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default implementations (success by default)
    // Default happy-path mocks (use factories for clarity)
    mockStorageFrom.mockReturnValue(baseStorage());
    mockSupabaseFrom.mockReturnValue(baseSupabase());
    mockInvalidateCache.mockClear();
  });

  test('returns error when upload fails', async () => {
    // storage.upload will return an error
    mockStorageFrom.mockReturnValueOnce({ ...baseStorage(), upload: jest.fn(() => err('upload failed')) });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);
    expect(res.url).toBeNull();
    expect(res.error).toBeTruthy();
  });

  test('returns error when users.update fails after successful upload', async () => {
    // storage.upload success (default)
    mockStorageFrom.mockReturnValueOnce({ ...baseStorage(), getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://cdn/new-image.png' } })) });

    // users.update -> eq().select() returns error
    mockSupabaseFrom.mockReturnValueOnce({ update: jest.fn(() => ({ eq: jest.fn(() => err('update failed')) })) });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);
    expect(res.url).toBeNull();
    expect(res.error).toBeTruthy();
  });

  test('retries update when user read shows mismatch and returns success on retry', async () => {
    const publicUrl = 'https://cdn/new-image.png';

    // 1) storage.upload success
    // Sequence for storage calls: deleteAllUserImages -> upload -> getPublicUrl
    mockStorageFrom
      .mockReturnValueOnce({ ...baseStorage(), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), upload: jest.fn(() => asyncRes(null)), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), getPublicUrl: jest.fn(() => ({ data: { publicUrl } })), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) });

    // Sequence of supabase.from calls:
    // a) users.update(...).eq(...).select() -> succeeds (no error)
    // b) users.select('logo_url').eq(...).single() -> returns different logo_url -> triggers retry
    // c) users.update(...).eq(...) -> retry update -> return success

    const firstUpdateSelect = jest.fn(() => asyncRes([{}], null));
    const firstUpdate = jest.fn(() => ({ eq: jest.fn(() => ({ select: firstUpdateSelect })) }));

    const userReadSingle = jest.fn(() => asyncRes({ logo_url: 'https://cdn/old.png' }, null));
    const userSelect = jest.fn(() => ({ eq: jest.fn(() => ({ single: userReadSingle })) }));

    const retryEq = jest.fn(() => asyncRes(null, null));
    const retryUpdate = jest.fn(() => ({ eq: retryEq }));

    mockSupabaseFrom
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

  test('does not retry when existing logo matches new public URL', async () => {
    const publicUrl = 'https://cdn/fake.png';

    mockStorageFrom
      .mockReturnValueOnce({ ...baseStorage(), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), upload: jest.fn(() => asyncRes(null)), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), getPublicUrl: jest.fn(() => ({ data: { publicUrl } })), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) });

    const firstUpdateSelect = jest.fn(() => asyncRes([{}], null));
    const firstUpdate = jest.fn(() => ({ eq: jest.fn(() => ({ select: firstUpdateSelect })) }));

    const userReadSingle = jest.fn(() => asyncRes({ logo_url: publicUrl }, null));
    const userSelect = jest.fn(() => ({ eq: jest.fn(() => ({ single: userReadSingle })) }));

    const retryEq = jest.fn(() => asyncRes(null, null));
    const retryUpdate = jest.fn(() => ({ eq: retryEq }));

    mockSupabaseFrom
      .mockReturnValueOnce({ update: firstUpdate })
      .mockReturnValueOnce({ select: userSelect })
      .mockReturnValueOnce({ update: retryUpdate });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);

    expect(res.url).toBe(publicUrl);
    expect(res.error).toBeNull();
    expect(retryUpdate).not.toHaveBeenCalled();
  });

  test('continues when remove fails', async () => {
    const publicUrl = 'https://cdn/new-image.png';

    mockStorageFrom
      .mockReturnValueOnce({ ...baseStorage(), list: jest.fn(() => asyncRes(['old.png'])), remove: jest.fn(() => err('remove failed')) })
      .mockReturnValueOnce({ ...baseStorage(), upload: jest.fn(() => asyncRes(null)), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), getPublicUrl: jest.fn(() => ({ data: { publicUrl } })), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) });

    const firstUpdateSelect = jest.fn(() => Promise.resolve({ data: [{},], error: null }));
    const firstUpdate = jest.fn(() => ({ eq: jest.fn(() => ({ select: firstUpdateSelect })) }));

    const userReadSingle = jest.fn(() => Promise.resolve({ data: { logo_url: 'https://cdn/old.png' }, error: null }));
    const userSelect = jest.fn(() => ({ eq: jest.fn(() => ({ single: userReadSingle })) }));

    mockSupabaseFrom
      .mockReturnValueOnce({ update: firstUpdate })
      .mockReturnValueOnce({ select: userSelect });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);
    // delete/remove failed in cleanup step -> current behavior: return error and do NOT invalidate cache
    expect(res.url).toBeNull();
    expect(res.error).toBeTruthy();
    expect(mockInvalidateCache).not.toHaveBeenCalled();
  });

  test('returns error when getPublicUrl returns no data', async () => {
    // sequence: list -> upload -> getPublicUrl (returns null)
    mockStorageFrom
      .mockReturnValueOnce({ ...baseStorage(), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), upload: jest.fn(() => asyncRes(null)), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), getPublicUrl: jest.fn(() => ({ data: null })), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);
    expect(res.url).toBeNull();
    expect(res.error).toBeTruthy();
  });

  test('invalidates cache on successful update', async () => {
    const publicUrl = 'https://cdn/new-image.png';

    mockStorageFrom
      .mockReturnValueOnce({ ...baseStorage(), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), upload: jest.fn(() => asyncRes(null)), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) })
      .mockReturnValueOnce({ ...baseStorage(), getPublicUrl: jest.fn(() => ({ data: { publicUrl } })), list: jest.fn(() => asyncRes([])), remove: jest.fn(() => asyncRes(null)) });

    const firstUpdateSelect = jest.fn(() => asyncRes([{}], null));
    const firstUpdate = jest.fn(() => ({ eq: jest.fn(() => ({ select: firstUpdateSelect })) }));

    const userReadSingle = jest.fn(() => asyncRes({ logo_url: publicUrl }, null));
    const userSelect = jest.fn(() => ({ eq: jest.fn(() => ({ single: userReadSingle })) }));

    mockSupabaseFrom
      .mockReturnValueOnce({ update: firstUpdate })
      .mockReturnValueOnce({ select: userSelect });

    const fakeFile = { name: 'logo.png' };
    const res = await uploadProfileImage('uid-123', fakeFile);

    expect(res.url).toBe(publicUrl);
    expect(res.error).toBeNull();
    expect(mockInvalidateCache).toHaveBeenCalledWith('uid-123');
  });

});
