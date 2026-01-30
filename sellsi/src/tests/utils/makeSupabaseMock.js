// Helper to produce a supabase mock with sensible defaults and overrides
module.exports = function makeSupabaseMock(overrides = {}) {
  const defaultStorage = {
    from: (bucket) => ({
      upload: async (fileName, file) => ({ data: { id: `id-${fileName}` }, error: null }),
      getPublicUrl: (fileName) => ({ data: { publicUrl: `https://cdn.test/${fileName}` } }),
    }),
  };

  const defaultRpc = async () => ({ data: null, error: null });

  const defaultFrom = (table) => ({
    select: async () => ({ data: [], error: null }),
    delete: () => ({ eq: async () => ({ data: null, error: null }) }),
    insert: async (obj) => ({ data: obj, error: null }),
    update: () => ({ eq: async () => ({ data: null }) }),
  });

  const supabase = {
    storage: overrides.storage || defaultStorage,
    rpc: overrides.rpc || defaultRpc,
    from: overrides.from || defaultFrom,
    // Useful for code that references these (generateThumbnail uses them)
    supabaseUrl: overrides.supabaseUrl || 'https://supabase.test',
    supabaseKey: overrides.supabaseKey || 'anon-key',
  };

  return { supabase };
};