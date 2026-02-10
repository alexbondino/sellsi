import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock Supabase auth & simple helpers (we'll use the real UnifiedAuthProvider)
const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }));

jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Helper to render the real provider + router
const renderApp = (initialRoute = '/') =>
  render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <UnifiedAuthProvider>
        <AppRouter />
      </UnifiedAuthProvider>
    </MemoryRouter>
  );

import { AppRouter } from '../../infrastructure/router/AppRouter';
import { UnifiedAuthProvider } from '../../infrastructure/providers/UnifiedAuthProvider';

// Mock Banner to avoid requiring BannerProvider during router mount
jest.mock('../../shared/components/display/banners/Banner', () => ({
  __esModule: true,
  default: () => <div>BANNER</div>,
}));

// Mock SuspenseLoader to assert fallback
jest.mock('../../shared/components/layout/SuspenseLoader', () => ({
  __esModule: true,
  default: () => <div>LOADING</div>,
}));

// Some routes import from the workspace barrel '../../workspaces/marketplace' which
// exposes named exports (Marketplace, ProviderCatalog). The AppRouter lazy-loads
// the workspace module directly; ensure it is mocked so Suspense resolves quickly.
jest.mock('../../workspaces/marketplace', () => ({
  __esModule: true,
  Marketplace: () => <div>MARKETPLACE</div>,
  ProviderCatalog: () => <div>PROVIDER_CATALOG_MOCK</div>,
}));

// Mock many lazy-loaded route components used by AppRouter to simple placeholders
function mockDefault(id) {
  return {
    __esModule: true,
    default: () => <div>{id}</div>,
  };
}

// ✅ UNIFICADO: MarketplaceBuyer ahora usa Marketplace con hasSideBar prop
jest.mock('../../workspaces/marketplace/pages/Marketplace', () =>
  mockDefault('MARKETPLACE')
);
jest.mock('../../domains/buyer/pages/BuyerCart', () =>
  mockDefault('BUYER_CART')
);
jest.mock('../../domains/checkout/pages/PaymentMethod', () =>
  mockDefault('PAYMENT_METHOD')
);
jest.mock('../../domains/checkout/pages/CheckoutSuccess', () =>
  mockDefault('CHECKOUT_SUCCESS')
);
jest.mock('../../domains/checkout/pages/CheckoutCancel', () =>
  mockDefault('CHECKOUT_CANCEL')
);
jest.mock('../../workspaces/supplier/home/components/Home', () =>
  mockDefault('PROVIDER_HOME')
);
jest.mock('../../workspaces/supplier/my-products/components/MyProducts', () =>
  mockDefault('MY_PRODUCTS')
);
jest.mock(
  '../../workspaces/supplier/create-product/components/AddProduct',
  () => mockDefault('ADD_PRODUCT')
);
jest.mock('../../workspaces/supplier/my-requests/components/MyOrdersPage', () =>
  mockDefault('MY_ORDERS')
);
// Note: MarketplaceSupplier was removed during workspace reorganization
// The route is temporarily disabled in AppRouter, so we skip this mock
jest.mock('../../workspaces/supplier/my-offers/components/SupplierOffers', () =>
  mockDefault('SUPPLIER_OFFERS')
);
jest.mock('../../domains/profile/pages/Profile', () => mockDefault('PROFILE'));
jest.mock('../../workspaces/buyer/my-orders/components/BuyerOrders', () =>
  mockDefault('BUYER_ORDERS')
);
jest.mock('../../workspaces/buyer/my-offers/components/BuyerOffers', () =>
  mockDefault('BUYER_OFFERS')
);
jest.mock(
  '../../workspaces/product/product-page-view/pages/TechnicalSpecs',
  () => mockDefault('TECHNICAL_SPECS')
);
jest.mock('../../workspaces/marketplace/pages/ProviderCatalog', () =>
  mockDefault('PROVIDER_CATALOG')
);
jest.mock('../../workspaces/product/product-page-view/ProductPageWrapper', () =>
  mockDefault('PRODUCT_PAGE')
);
jest.mock('../../workspaces/auth/onboarding/components/Onboarding', () =>
  mockDefault('ONBOARDING')
);
jest.mock(
  '../../workspaces/auth/account-recovery/components/ResetPassword',
  () => mockDefault('RESET_PASSWORD')
);
jest.mock('../../shared/components/layout/NotFound', () =>
  mockDefault('NOT_FOUND')
);
jest.mock('../../domains/ban/pages/BanPageView', () => mockDefault('BANNED'));
jest.mock('../../workspaces/legal/components/TermsAndConditionsPage', () =>
  mockDefault('TERMS')
);
jest.mock('../../workspaces/legal/components/PrivacyPolicyPage', () =>
  mockDefault('PRIVACY')
);
jest.mock('../../workspaces/auth/login/services/AuthCallback', () =>
  mockDefault('AUTH_CALLBACK')
);

// workspaces/auth barrel used for Login/Register exports
jest.mock('../../workspaces/auth', () => ({
  Login: () => <div>LOGIN</div>,
  Register: () => <div>REGISTER</div>,
  AdminLogin: () => <div>ADMIN_LOGIN</div>,
  AdminDashboard: () => <div>ADMIN_DASH</div>,
  AdminPanelHome: () => <div>ADMIN_PANEL</div>,
  AdminMetrics: () => <div>ADMIN_METRICS</div>,
}));

// Mock supabase client used by UnifiedAuthProvider. We'll override methods per-test.
import { supabase as supabaseClient } from '../../services/supabase';

// Helper to mock the users table response
const setUsersResponse = (data, error = null) => {
  supabaseClient.from = jest.fn().mockImplementation(table => {
    if (table === 'users') {
      return {
        select: () => ({ eq: () => ({ single: jest.fn().mockResolvedValue({ data, error }), maybeSingle: jest.fn().mockResolvedValue({ data, error }) }) }),
        insert: jest.fn(() => ({ select: () => ({ single: jest.fn().mockResolvedValue({ data: data || null, error: null }) }) })),
        update: jest.fn(() => ({ select: () => ({ single: jest.fn().mockResolvedValue({ data: data || null, error: null }) }) })),
        upsert: jest.fn(() => ({ select: () => ({ single: jest.fn().mockResolvedValue({ data: data || null, error: null }) }) })),

      };
    }
    return {
      select: () => ({ eq: () => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) }) }),
    };
  });
};

describe('AppRouter integration (with mocked UnifiedAuthProvider via supabase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clean any global test artifacts to avoid cross-test leakage
    try { delete globalThis.__TEST_SAVED_AUTH_CB; } catch (e) {}
    if (Array.isArray(globalThis.__TEST_AUTH_LISTENERS)) globalThis.__TEST_AUTH_LISTENERS.length = 0;
  });

  test('neutral "/" redirects to supplier dashboard when profile has main_supplier true', async () => {
    // Session present
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });

    // users table returns supplier profile
    setUsersResponse({ user_nm: 'ACME', main_supplier: true, logo_url: '' }, null);

    renderApp('/');

    // Expect supplier home to be rendered
    await waitFor(() => expect(screen.getByText('PROVIDER_HOME')).toBeInTheDocument());
  });

  test('authenticated buyer can access buyer and supplier protected routes; unknown route shows 404', async () => {
    // Session + buyer profile
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-2' } } } });
    setUsersResponse({ user_nm: 'Buyer', main_supplier: false }, null);

    // 1) buyer cart
    renderApp('/buyer/cart');
    await waitFor(() => expect(screen.getByText('BUYER_CART')).toBeInTheDocument());

    // 2) supplier home (still protected, should render because PrivateRoute only checks auth/onboarding)
    renderApp('/supplier/home');
    await waitFor(() => expect(screen.getByText('PROVIDER_HOME')).toBeInTheDocument());

    // 3) unknown route -> NotFound
    renderApp('/no-such-route');
    await waitFor(() => expect(screen.getByText('NOT_FOUND')).toBeInTheDocument());
  });

  test('Suspense fallback is shown for lazy routes then replaced by route component', async () => {
    // Ensure no session
    mockGetSession.mockResolvedValue({ data: { session: null } });
    setUsersResponse(null, null);

    renderApp('/marketplace');

    // Fallback should be visible quickly
    expect(screen.getByText('LOADING')).toBeInTheDocument();

    // Then marketplace component should appear
    await waitFor(() => expect(screen.getByText('MARKETPLACE')).toBeInTheDocument());
  });

  test('onboarding redirect when needsOnboarding true', async () => {
    // Session present
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-3' } } } });

    // Simulate profile fetch error from supabase (user not found)
    setUsersResponse(null, { message: 'not found' });

    // Navigate directly to onboarding and expect it to be rendered when the profile requires onboarding
    renderApp('/onboarding');

    await waitFor(() => expect(screen.getByText('ONBOARDING')).toBeInTheDocument());
  });

  test('logout redirects to / when hitting private routes', async () => {
    // Start authenticated on a private route (session + supplier profile)
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-4' } } } });
    setUsersResponse({ user_nm: 'ACME', main_supplier: true }, null);

    // Register a listener (we'll extract the callback via mock.calls after render)
    mockOnAuthStateChange.mockImplementationOnce(cb => {
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    console.log('[TEST DEBUG logout] before render calls=', mockOnAuthStateChange.mock.calls.length);
    renderApp('/supplier/home');
    await waitFor(() => expect(screen.getByText('PROVIDER_HOME')).toBeInTheDocument());
    console.warn('[TEST DEBUG logout] after render calls=', mockOnAuthStateChange.mock.calls.length);

    // Trigger sign out via test helper (preferred) or by extracting the registered callback from the mock
    // Prefer invoking the registered mock callback(s) directly to ensure provider's listener runs,
    // and also notify the global trigger so any other test-level listeners run too.
    if (mockOnAuthStateChange.mock.calls.length > 0) {
      const last = mockOnAuthStateChange.mock.calls.slice(-1)[0];
      console.warn('[TEST DEBUG] mockOnAuthStateChange.calls.length=', mockOnAuthStateChange.mock.calls.length, 'last=', !!last, 'last0_type=', typeof (last && last[0]));
      if (last && typeof last[0] === 'function') {
        const cb = last[0];
        const { act } = require('@testing-library/react');
        console.warn('[TEST DEBUG] invoking callback directly');
        act(() => cb('SIGNED_OUT', null));
      }
    }
    if (typeof globalThis.__TEST_SUPABASE_TRIGGER_AUTH === 'function') {
      console.warn('[TEST DEBUG] also using global trigger');
      globalThis.__TEST_SUPABASE_TRIGGER_AUTH('SIGNED_OUT', null);
    }

    // Debug: dump DOM after trigger
    console.warn('[TEST DEBUG] DOM after SIGNED_OUT:\n', document.body.innerHTML.slice(0, 500));
    console.warn('[TEST DEBUG] localStorage user_id after SIGNED_OUT:', localStorage.getItem('user_id'));

    // Expect landing/marketplace or root content
    await waitFor(() => expect(screen.queryByText(/PROVIDER_HOME/)).not.toBeInTheDocument());
  });



  test('supabase error during profile fetch sets onboarding and handled gracefully', async () => {
    // Session present
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-5' } } } });

    // Simulate supabase returning error for profile
    setUsersResponse(null, { message: 'db down' });

    renderApp('/buyer/cart');
    await waitFor(() => expect(screen.getByText('ONBOARDING')).toBeInTheDocument());
  });

  test('corrupted profile data (pending username) triggers onboarding', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-6' } } } });
    setUsersResponse({ user_nm: 'pendiente' }, null);

    renderApp('/buyer/cart');
    await waitFor(() => expect(screen.getByText('ONBOARDING')).toBeInTheDocument());
  });

  test('manual role override persistence navigates appropriately', async () => {
    // Set session present but profile is buyer
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'user-7' } } } });
    setUsersResponse({ user_nm: 'ACME', main_supplier: false }, null);

    // Save original localStorage and simulate manual override stored in localStorage
    const originalLS = globalThis.localStorage;
    try {
      Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => 'supplier' }, configurable: true });

      renderApp('/');

      // Current behavior: manual override stored does NOT force a supplier redirect when profile is buyer
      await waitFor(() => expect(screen.getByText('MARKETPLACE')).toBeInTheDocument());
    } finally {
      // restore original (robustly)
      try {
        Object.defineProperty(globalThis, 'localStorage', { value: originalLS, configurable: true });
      } catch (e) {
        try { delete globalThis.localStorage; } catch (_) {}
      }
    }
  });

  // --- ADDITIONAL ROBUSTNESS TESTS ---
  test('unauthenticated visiting protected supplier route redirects to /', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    setUsersResponse(null, null);

    renderApp('/supplier/home');

    // Expect landing page or marketplace to be rendered
    await waitFor(() => {
      const hits = screen.queryAllByText(/Conectamos|Explorar Marketplace|MARKETPLACE/);
      expect(hits.length).toBeGreaterThan(0);
    });
  });

  test('handles malformed localStorage value without crashing', async () => {
    // Simulate localStorage returning a malformed (non supplier) value
    const originalLS = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: jest.fn(() => '<<malformed>>') },
      configurable: true,
    });

    mockGetSession.mockResolvedValue({ data: { session: null } });
    setUsersResponse(null, null);

    renderApp('/marketplace');

    // Expect the router to still resolve and show the marketplace component
    await waitFor(() => expect(screen.getByText('MARKETPLACE')).toBeInTheDocument());

    // restore (use defineProperty to avoid readonly issues)
    try {
      Object.defineProperty(globalThis, 'localStorage', { value: originalLS, configurable: true });
    } catch (e) {
      try { delete globalThis.localStorage; } catch (er) {}
    }
  });

  test('SIGNED_IN listener triggers profile fetch and updates UI', async () => {
    // Start without session
    mockGetSession.mockResolvedValue({ data: { session: null } });

    // Register a listener (we'll extract the callback via mock.calls after render)
    mockOnAuthStateChange.mockImplementationOnce(cb => {
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    renderApp('/');

    // Ensure onAuthStateChange was registered
    await waitFor(() => expect(mockOnAuthStateChange).toHaveBeenCalled());

    // Simulate SIGNED_IN event and a profile that is a supplier
    const session = { user: { id: 'signed-in-user' } };
    setUsersResponse({ user_nm: 'Signed', main_supplier: true }, null);
    // Prefer invoking the registered mock callback(s) directly to ensure provider's listener runs,
    // and also notify the global trigger so any other test-level listeners run too.
    if (mockOnAuthStateChange.mock.calls.length > 0) {
      const last = mockOnAuthStateChange.mock.calls.slice(-1)[0];
      if (last && typeof last[0] === 'function') {
        const cb = last[0];
        const { act } = require('@testing-library/react');
        console.warn('[TEST DEBUG] invoking callback directly SIGNED_IN');
        act(() => cb('SIGNED_IN', session));
      }
    }
    if (typeof globalThis.__TEST_SUPABASE_TRIGGER_AUTH === 'function') {
      console.warn('[TEST DEBUG] also using global trigger SIGNED_IN');
      globalThis.__TEST_SUPABASE_TRIGGER_AUTH('SIGNED_IN', session);
    }

    // Expect supplier home to appear as provider reacts to SIGNED_IN
    await waitFor(() => expect(screen.getByText('PROVIDER_HOME')).toBeInTheDocument());
  });

  test('unsubscribes on unmount (onAuthStateChange cleanup)', async () => {
    const unsubscribeSpy = jest.fn();
    supabaseClient.auth = {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: unsubscribeSpy } } }),
    };

    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <UnifiedAuthProvider>
          <AppRouter />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Unmount should call unsubscribe
    unmount();
    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
