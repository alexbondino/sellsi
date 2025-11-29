// Set environment variables before tests run (replaces import.meta.env)
process.env.VITE_SUPABASE_URL = 'http://localhost:54321';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.MODE = 'test';
process.env.NODE_ENV = 'test';
