// Setup global para todos los tests del control panel
import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills para jsdom
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock global de import.meta.env
global.import = {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-key-admin-panel',
      VITE_CONTROL_PANEL_URL: 'http://localhost:5174'
    }
  }
}

// Configurar testing library
configure({ testIdAttribute: 'data-testid' })

// Mock global de console para reducir ruido en tests
const originalError = console.error
const originalWarn = console.warn
const originalLog = console.log

beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string') {
      const msg = args[0]
      // Ignorar warnings conocidos de React/MUI
      if (msg.includes('Warning: ReactDOM.render')) return
      if (msg.includes('MUI Grid') || msg.includes('The `item` prop')) return
      if (msg.includes('fetchpriority')) return
    }
    originalError.call(console, ...args)
  }
  
  console.warn = (...args) => {
    if (typeof args[0] === 'string') {
      const msg = args[0]
      // Ignorar warnings de deprecación de terceros
      if (msg.includes('deprecated')) return
    }
    originalWarn.call(console, ...args)
  }
  
  // Silenciar logs verbosos durante tests
  console.log = () => {}
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
  console.log = originalLog
})

// Mock de IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null }
  disconnect() { return null }
  unobserve() { return null }
}

// Mock de ResizeObserver (usado por MUI DataGrid)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() { return null }
  disconnect() { return null }
  unobserve() { return null }
}

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.sessionStorage = sessionStorageMock

// Mock del cliente Supabase para control panel
jest.mock('../src/services/supabase.js', () => {
  let authCallback = null
  let currentSession = null

  const createQueryChain = (mockData = { data: null, error: null }) => {
    const chain = {
      select: jest.fn(() => chain),
      insert: jest.fn(() => chain),
      update: jest.fn(() => chain),
      delete: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      neq: jest.fn(() => chain),
      gt: jest.fn(() => chain),
      gte: jest.fn(() => chain),
      lt: jest.fn(() => chain),
      lte: jest.fn(() => chain),
      like: jest.fn(() => chain),
      ilike: jest.fn(() => chain),
      is: jest.fn(() => chain),
      in: jest.fn(() => chain),
      contains: jest.fn(() => chain),
      containedBy: jest.fn(() => chain),
      range: jest.fn(() => chain),
      order: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      single: jest.fn(() => Promise.resolve(mockData)),
      maybeSingle: jest.fn(() => Promise.resolve(mockData)),
      then: jest.fn((resolve) => Promise.resolve(mockData).then(resolve))
    }
    return chain
  }

  const supabase = {
    from: jest.fn(() => createQueryChain()),
    rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ 
        data: { session: currentSession }, 
        error: null 
      })),
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: currentSession?.user || null }, 
        error: null 
      })),
      signInWithPassword: jest.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      onAuthStateChange: jest.fn((cb) => {
        authCallback = cb
        return { 
          data: { 
            subscription: { 
              unsubscribe: jest.fn() 
            } 
          } 
        }
      })
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        download: jest.fn(() => Promise.resolve({ data: new Blob(), error: null })),
        remove: jest.fn(() => Promise.resolve({ data: [], error: null })),
        list: jest.fn(() => Promise.resolve({ data: [], error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://test.com/file.jpg' } }))
      }))
    }
  }

  // Helper para triggerear cambios de auth en tests
  global.__TEST_SUPABASE_TRIGGER_AUTH = (event, session) => {
    currentSession = session
    if (typeof authCallback === 'function') {
      authCallback(event, session)
    }
  }

  return { supabase }
})

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
  useParams: () => ({}),
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: ({ children }) => children,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  Navigate: () => null
}))

// Mock de react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
    promise: jest.fn((promise) => promise)
  },
  Toaster: () => null
}))
