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
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
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
jest.mock('../../src/services/supabase', () => {
  const createQuery = (result = { data: null, error: null }) => {
    const chain = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      single: jest.fn(() => Promise.resolve(result)),
    };
    return chain;
  };

  return {
    supabase: {
      from: jest.fn(() => createQuery()),
    },
  };
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
// Prevent import.meta usage in the real hook from breaking Jest parsing.
jest.mock('../../src/shared/hooks/product/useProductPriceTiers', () => ({
  useProductPriceTiers: jest.fn(() => ({
    tiers: [],
    loading: false,
    error: null,
  })),
}));
