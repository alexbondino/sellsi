// Utilities to seed/cleanup data for integration tests that use a real Supabase project.
// Usage:
//   const { ensureEnvVars, insertBuyer, cleanupTestData } = require('./helpers/supabaseTestUtils')
//   beforeAll(() => ensureEnvVars())
//   const buyer = await insertBuyer({ name: 'X' })

const ensureEnvVars = () => {
  if (process.env.VITE_USE_MOCKS === 'true') {
    throw new Error('VITE_USE_MOCKS is true: Supabase mocks are enabled. Set VITE_USE_MOCKS=false to use real Supabase in tests.');
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set to connect to Supabase');
  }
};

const getClient = () => {
  // Prefer the client exposed by setup.js
  const real = globalThis.__TEST_SUPABASE_REAL || (require('../../services/supabase') || {}).supabase;
  if (!real) throw new Error('Supabase client not available. Ensure VITE_USE_MOCKS=false and env vars are set.');
  return real;
};

const checkTablesExist = async () => {
  const supabase = getClient();
  const { data, error } = await supabase.from('financing_requests').select('id').limit(1).maybeSingle();
  if (error) return { ok: false, error };
  return { ok: true };
};

const insertBuyer = async (data = {}) => {
  const supabase = getClient();
  const payload = {
    name: data.name || `Test Buyer ${Date.now()}`,
    email: data.email || `test-buyer-${Date.now()}@example.com`,
    balance: data.balance || 0,
  };
  const { data: res, error } = await supabase.from('buyer').insert([payload]).select().single();
  if (error) throw error;
  return res;
};

const insertSupplier = async (data = {}) => {
  const supabase = getClient();
  const payload = {
    name: data.name || `Test Supplier ${Date.now()}`,
    legal_rut: data.legal_rut || null,
    balance: data.balance || 0,
  };
  const { data: res, error } = await supabase.from('supplier').insert([payload]).select().single();
  if (error) throw error;
  return res;
};

const createFinancingRequest = async ({ buyer_id, supplier_id, amount = 100000, due_date = null }) => {
  const supabase = getClient();
  const payload = { buyer_id, supplier_id, amount, available_amount: amount, due_date };
  const { data: res, error } = await supabase.from('financing_requests').insert([payload]).select().single();
  if (error) throw error;
  return res;
};

const deleteFinancingRequest = async (id) => {
  const supabase = getClient();
  const { error } = await supabase.from('financing_requests').delete().eq('id', id);
  if (error) throw error;
  return true;
};

const cleanupTestData = async ({ buyers = [], suppliers = [], financings = [] } = {}) => {
  const supabase = getClient();
  if (financings && financings.length) {
    await supabase.from('financing_documents').delete().in('financing_request_id', financings);
    await supabase.from('financing_transactions').delete().in('financing_request_id', financings);
    await supabase.from('financing_requests').delete().in('id', financings);
  }
  if (buyers && buyers.length) {
    await supabase.from('buyer').delete().in('id', buyers);
  }
  if (suppliers && suppliers.length) {
    await supabase.from('supplier').delete().in('id', suppliers);
  }
  return true;
};

module.exports = {
  ensureEnvVars,
  getClient,
  checkTablesExist,
  insertBuyer,
  insertSupplier,
  createFinancingRequest,
  deleteFinancingRequest,
  cleanupTestData,
};
