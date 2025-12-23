// Setup global para todos los tests
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills para jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// NOTE: import.meta.env is handled by babel-plugin-transform-import-meta
// which transforms it to process.env at build time.
// Environment variables are set in setEnvVars.js

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
      if (msg.includes('Warning: ReactDOM.render is no longer supported'))
        return;
      // Ignore invalid DOM prop coming from third-party libs (fetchpriority vs fetchPriority)
      if (
        msg.toLowerCase().includes('fetchpriority') ||
        msg.toLowerCase().includes('fetchpriority')
      )
        return;
      // Ignore MUI Grid migration warnings that appear in tests
      if (
        msg.includes('MUI Grid') ||
        msg.includes('The `item` prop has been removed') ||
        msg.includes('The `xs` prop has been removed')
      )
        return;
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
// Cambiada ruta para apuntar al workspace centralizado
jest.mock('../workspaces/supplier/shared-utils/featureFlags', () => ({
  FeatureFlags: {},
  ThumbTimings: {},
}));

// ===== MOCK: useMarketplaceLogic hook =====
// This hook uses import.meta.env which Jest can't parse. Mock it globally.
jest.mock('../shared/hooks/marketplace/useMarketplaceLogic', () => ({
  useMarketplaceLogic: jest.fn(() => ({
    busqueda: '',
    setBusqueda: jest.fn(),
    handleBusquedaChange: jest.fn(),
    currentOrdenamiento: 'Más recientes',
    currentSortOptions: [],
    handleOrdenamiento: jest.fn(),
    handleUnifiedToggleFilters: jest.fn(),
    hayFiltrosActivos: false,
    filtroVisible: false,
    filtroModalOpen: false,
    searchBarMarginLeft: 0,
    isMobileFilterOpen: false,
    onMobileFilterClose: jest.fn(),
    isProviderView: false,
    onToggleProviderView: jest.fn(),
    hasSideBar: false,
  })),
}));

// ===== MOCK: shared/hooks index barrel =====
// The barrel exports useMarketplaceLogic which uses import.meta.env
jest.mock('../shared/hooks', () => ({
  useMarketplaceLogic: jest.fn(() => ({})),
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
jest.mock('../services/supabase', () => {
  let authCallback = null;
  let currentSession = null;

  const createQuery = (result = { data: null, error: null }) => {
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      insert: jest.fn(() => chain),
      upsert: jest.fn(() => chain),
      maybeSingle: jest.fn(() => Promise.resolve(result)),
      single: jest.fn(() => Promise.resolve(result)),
    };
    return chain;
  };

  const supabase = {
    from: jest.fn(() => createQuery()),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: currentSession } })
      ),
      onAuthStateChange: jest.fn(cb => {
        authCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
    },
  };

  // Expose a test helper to trigger auth events from tests via globalThis
  // Wrap listener invocations inside act() to avoid React's "not wrapped in act(...)" warnings
  globalThis.__TEST_SUPABASE_TRIGGER_AUTH = (event, session) => {
    currentSession = session;
    // Call the internal listener if registered
    if (typeof authCallback === 'function') {
      try {
        // use act to ensure state updates are flushed synchronously in tests
        const { act } = require('@testing-library/react');
        try {
          act(() => authCallback(event, session));
        } catch (e) {
          // act may throw if already inside an act; fallback to direct call
          try {
            authCallback(event, session);
          } catch (e2) {
            /* ignore */
          }
        }
      } catch (e) {
        // If require fails for some reason, call directly
        try {
          authCallback(event, session);
        } catch (e2) {
          /* ignore */
        }
      }
    }
    // Also call any globally registered test listeners (e.g., provider-level hooks)
    if (Array.isArray(globalThis.__TEST_AUTH_LISTENERS)) {
      globalThis.__TEST_AUTH_LISTENERS.forEach(l => {
        try {
          const { act } = require('@testing-library/react');
          try {
            act(() => l(event, session));
          } catch (e) {
            l(event, session);
          }
        } catch (e) {
          try {
            l(event, session);
          } catch (e2) {
            /* ignore */
          }
        }
      });
    }
  };

  // Helper: dispatch window events wrapped in act() to avoid "not wrapped in act(...)" warnings
  globalThis.dispatchWindowEvent = (event) => {
    try {
      const { act } = require('@testing-library/react');
      try {
        act(() => globalThis.dispatchEvent(event));
      } catch (e) {
        // If already inside act or act fails, fallback to direct dispatch
        globalThis.dispatchEvent(event);
      }
    } catch (e) {
      // Fallback when require or act isn't available
      globalThis.dispatchEvent(event);
    }
  };

  // Allow tests to override the .from mock by spying on supabase.from directly
  return { supabase };
});

// ===== MOCK: user services =====
// Some user/service modules use `import.meta.env`. Provide a safe stub so imports in tests don't parse import.meta.
jest.mock('../services/user', () => {
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
