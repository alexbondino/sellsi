function createSupabaseMock(overrides = {}) {
  // Allow passing partial overrides: { storage, rpc, from, supabaseUrl, supabaseKey }
  // If caller provides an existing supabase object (module), mutate it in-place so tests
  // that imported the module will use our mocks. Otherwise, create a fresh object.
  const supabaseRef = overrides && Object.keys(overrides).length ? overrides : {};

  const auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } }, error: null }),
    refreshSession: jest.fn().mockResolvedValue(null),
  };

  if (!supabaseRef.auth) supabaseRef.auth = {};
  supabaseRef.auth.getUser = auth.getUser;
  supabaseRef.auth.refreshSession = auth.refreshSession;

  // If caller provided a storage.from implementation, keep it; otherwise set a default
  const defaultStorageFrom = {
    upload: jest.fn().mockResolvedValue({ error: null, data: { path: 'user-1/logo.png' } }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.test/user-1/logo.png' } }),
    remove: jest.fn().mockResolvedValue({ error: null }),
  };

  if (!supabaseRef.storage) supabaseRef.storage = {};
  if (supabaseRef.storage.from && typeof supabaseRef.storage.from === 'function') {
    // leave provided implementation
  } else {
    supabaseRef.storage.from = jest.fn().mockReturnValue(defaultStorageFrom);
  }

  const usersTable = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  };

  if (!supabaseRef.from) {
    supabaseRef.from = jest.fn().mockImplementation(table => {
      if (table === 'users') return usersTable;
      return { upsert: jest.fn().mockResolvedValue({ error: null }) };
    });
  }

  // Allow overriding rpc
  if (!supabaseRef.rpc) supabaseRef.rpc = async () => ({ data: null, error: null });

  // Keep useful handles for assertions
  return { usersTable, storageFrom: defaultStorageFrom, auth, supabase: supabaseRef };
}

module.exports = { createSupabaseMock };
