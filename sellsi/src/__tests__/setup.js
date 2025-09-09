// Setup global para todos los tests
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills para jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock global de import.meta
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key'
    }
  }
};

// Configurar testing library
configure({ testIdAttribute: 'data-testid' });

// Mock global de console.error para evitar ruido en tests
const originalError = console.error;
const originalLog = console.log;
const originalInfo = console.info;
const originalDebug = console.debug;
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string') {
      const msg = args[0];
      // Ignore legacy ReactDOM.render deprecation noise
      if (msg.includes('Warning: ReactDOM.render is no longer supported')) return;
      // Ignore invalid DOM prop coming from third-party libs (fetchpriority vs fetchPriority)
      if (msg.toLowerCase().includes('fetchpriority') || msg.toLowerCase().includes('fetchpriority')) return;
      // Ignore MUI Grid migration warnings that appear in tests
      if (msg.includes('MUI Grid') || msg.includes('The `item` prop has been removed') || msg.includes('The `xs` prop has been removed')) return;
    }
    originalError.call(console, ...args);
  };
  // Silenciar logs verbosos durante tests (se restauran en afterAll)
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
});

afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
  console.info = originalInfo;
  console.debug = originalDebug;
});

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  
  observe() {
    return null;
  }
  
  disconnect() {
    return null;
  }
  
  unobserve() {
    return null;
  }
};

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// ===== MOCK: featureFlags module =====
// Some modules in the app use import.meta.env which Jest's CommonJS environment doesn't support.
// Provide a simple manual mock for the flags module so tests that import it don't fail at parse time.
jest.mock('../../src/shared/flags/featureFlags', () => ({
  FeatureFlags: {},
  ThumbTimings: {},
}));

// ===== MOCK: supabase client chain helper =====
// Provide a minimal mock implementation that mirrors the `.from(...).select(...).eq(...).single()` chain
// used by hooks such as useTechnicalSpecs. Tests can override behavior by spying on these functions.
const createQueryMock = (result = { data: null, error: null }) => {
  const chain = {
    select: jest.fn(() => chain),
    eq: jest.fn(() => chain),
    single: jest.fn(() => Promise.resolve(result)),
  };
  return chain;
};

// Minimal inline mock for the supabase client chain used by the app.
// Implemented entirely inside the factory to avoid referencing external variables (Jest rule).
// Provide a richer supabase mock that stores an auth state change callback so tests can trigger SIGNED_IN/SIGNED_OUT.
jest.mock('../../src/services/supabase', () => {
  let authCallback = null;
  let currentSession = null;

  const createQuery = (result = { data: null, error: null }) => {
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      single: jest.fn(() => Promise.resolve(result)),
    };
    return chain;
  };

  const supabase = {
    from: jest.fn(() => createQuery()),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: currentSession } })),
      onAuthStateChange: jest.fn((cb) => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
  };

  // Expose a test helper to trigger auth events from tests via globalThis
  globalThis.__TEST_SUPABASE_TRIGGER_AUTH = (event, session) => {
    currentSession = session;
    // Call the internal listener if registered
    if (typeof authCallback === 'function') {
      try { authCallback(event, session); } catch (e) { /* ignore */ }
    }
    // Also call any globally registered test listeners (e.g., provider-level hooks)
    if (Array.isArray(globalThis.__TEST_AUTH_LISTENERS)) {
      globalThis.__TEST_AUTH_LISTENERS.forEach((l) => {
        try { l(event, session); } catch (e) { /* ignore */ }
      });
    }
  };

  // Allow tests to override the .from mock by spying on supabase.from directly
  return { supabase };
});

// ===== MOCK: user services =====
// Some user/service modules use `import.meta.env`. Provide a safe stub so imports in tests don't parse import.meta.
jest.mock('../../src/services/user', () => {
  return {
    // export commonly used methods as no-op or simple stubs
    getUserProfile: jest.fn(() => Promise.resolve({ data: null, error: null })),
    getUserById: jest.fn(() => Promise.resolve({ data: null, error: null })),
    createOrder: jest.fn(() => Promise.resolve({ data: null, error: null })),
    // spread any further exports as needed by tests; tests can override these mocks per-suite
  };
});

// ===== MOCK: useProductPriceTiers hook =====
// Deprecated: the shared hook was removed in favor of centralized tier caching.
// Tests should mock higher-level modules or provide product fixtures with
// `priceTiers` and `tiersStatus` fields instead of mocking this hook.
