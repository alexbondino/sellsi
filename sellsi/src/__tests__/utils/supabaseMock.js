// Enhanced helper to create Supabase mocks for tests with chainable API and auth behavior.
// Usage:
//   const { supabase, setTableResponse, triggerAuth } = createSupabaseMock();
//   setTableResponse('users', { data: { id: 'u1' }, error: null });
// Exposes a `supabase` object suitable for mocking '../../services/supabase'.

function createQuery(result = { data: null, error: null }) {
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    order: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    insert: jest.fn(() => chain),
    upsert: jest.fn(() => chain),
    update: jest.fn(() => chain),
    delete: jest.fn(() => chain),
    _setResult: (r) => {
      result = r;
      chain.single = jest.fn(() => Promise.resolve(result));
      chain.maybeSingle = jest.fn(() => Promise.resolve(result));
    }
  };
  return chain;
}

module.exports = {
  createSupabaseMock: (initialTableResponses = {}) => {
    let currentSession = null;
    let authCallback = null;

    const tableResponses = new Map(Object.entries(initialTableResponses));

    const supabase = {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: currentSession } })),
        onAuthStateChange: jest.fn(cb => {
          authCallback = cb;
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        }),
      },
      from: jest.fn(table => {
        const res = tableResponses.get(table) || { data: null, error: null };
        return createQuery(res);
      }),
    };

    const setTableResponse = (table, result = { data: null, error: null }) => {
      tableResponses.set(table, result);
    };

    const triggerAuth = (event, session) => {
      currentSession = session;
      if (typeof authCallback === 'function') {
        try {
          const { act } = require('@testing-library/react');
          try {
            act(() => authCallback(event, session));
          } catch (e) {
            authCallback(event, session);
          }
        } catch (e) {
          try { authCallback(event, session); } catch (err) { /* ignore */ }
        }
      }
    };

    // Provide convenience: apply jest.doMock so tests can require the service easily
    const applyMock = () => {
      jest.doMock('../../services/supabase', () => ({ supabase }));
    };

    return { supabase, setTableResponse, triggerAuth, applyMock };
  },

  // Backwards-compatible helper used by older tests: createFromMock({ tableName: implementation })
  // Returns { fromMock } and applies a jest.mock for '../../services/supabase' that uses the provided
  // table implementations when `supabase.from(table)` is called.
  createFromMock: (tableImpls = {}) => {
    const fromMock = jest.fn((table) => {
      if (Object.prototype.hasOwnProperty.call(tableImpls, table)) {
        return tableImpls[table]
      }
      // default fallback: empty chain returning empty data
      return createQuery({ data: [], error: null })
    })
    jest.doMock('../../services/supabase', () => ({ supabase: { from: fromMock } }))
    return { fromMock }
  }
};
