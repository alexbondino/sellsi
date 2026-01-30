// Set environment variables before tests run (replaces import.meta.env)
// babel-plugin-transform-import-meta transforms import.meta.env.X to process.env.X
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_USE_MOCKS = 'false';
process.env.MODE = 'test';
process.env.NODE_ENV = 'test';

// Legacy global for compatibility (some tests may reference this)
global.importMeta = {
  env: {
    VITE_SUPABASE_URL: 'http://localhost:54321',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_USE_MOCKS: 'false',
    MODE: 'test',
    DEV: false,
    PROD: false,
  }
};
