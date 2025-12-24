function createSupabaseMock(overrides = {}) {
  // Allow passing partial overrides: { storage, rpc, from, supabaseUrl, supabaseKey }
  const supabase = { ...overrides };

  const auth = {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } }, error: null }),
    refreshSession: jest.fn().mockResolvedValue(null),
  };

  if (!supabase.auth) supabase.auth = {};
  supabase.auth.getUser = auth.getUser;
  supabase.auth.refreshSession = auth.refreshSession;

  // If caller provided a storage.from implementation, keep it; otherwise set a default
  const defaultStorageFrom = {
    upload: jest.fn().mockResolvedValue({ error: null, data: { path: 'user-1/logo.png' } }),
    getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://cdn.test/user-1/logo.png' } }),
    remove: jest.fn().mockResolvedValue({ error: null }),
  };

  if (!supabase.storage) supabase.storage = {};
  if (supabase.storage.from && typeof supabase.storage.from === 'function') {
    // leave provided implementation
  } else {
    supabase.storage.from = jest.fn().mockReturnValue(defaultStorageFrom);
  }

  const usersTable = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  };

  if (!supabase.from) {
    supabase.from = jest.fn().mockImplementation(table => {
      if (table === 'users') return usersTable;
      return { upsert: jest.fn().mockResolvedValue({ error: null }) };
    });
  }

  // Allow overriding rpc
  if (!supabase.rpc) supabase.rpc = async () => ({ data: null, error: null });

  // Keep useful handles for assertions
  return { usersTable, storageFrom: defaultStorageFrom, auth, supabase };
}

module.exports = { createSupabaseMock };
