import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
let ProviderCatalog;
try {
  ProviderCatalog = require('../../workspaces/marketplace/pages/ProviderCatalog').default;
} catch (e) {
  // Fallback: some test runs resolve the package index instead
  ProviderCatalog = require('../../workspaces/marketplace').ProviderCatalog;
}
import * as ff from '../../shared/hooks/useFeatureFlag';
import { supabase } from '../../services/supabase';
import * as Router from 'react-router-dom';

// Polyfill for window.matchMedia used by MUI's useMediaQuery in tests
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

jest.mock('../../../../shared/hooks/useFeatureFlag');

// Avoid MUI useMediaQuery runtime issues by mocking it (desktop by default)
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

describe('ProviderCatalog financing button', () => {
  beforeEach(() => {
    // Provide a safe default for product lookups to avoid network calls
    jest.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'products') {
        return { select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: [], error: null }) }) }) }) }) };
      }
      return { select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }) };
    });
  });

  afterEach(() => jest.resetAllMocks());

  test('renders Solicitar Financiamiento when flag enabled', async () => {
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: true, loading: false }));

    const provider = { user_id: 'user-123', user_nm: 'provider-abc', verified: true };
    jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: [provider], error: null });

    render(
      React.createElement(Router.MemoryRouter, { initialEntries: ['/catalog/provider-abc/user-123'] },
        React.createElement(Router.Routes, null,
          React.createElement(Router.Route, { path: '/catalog/:userNm/:userId', element: React.createElement(ProviderCatalog) })
        )
      )
    );

    // The page is large; wait for any button text match
    await waitFor(() => expect(screen.queryByText(/Solicitar Financiamiento/i)).toBeInTheDocument());
  });

  test('does not render when flag disabled', async () => {
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: false, loading: false }));

    // Ensure provider is found so the UI renders normally
    const provider = { user_id: 'user-123', user_nm: 'provider-abc', verified: true };
    jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: [provider], error: null });

    render(
      React.createElement(Router.MemoryRouter, { initialEntries: ['/catalog/provider-abc/user-123'] },
        React.createElement(Router.Routes, null,
          React.createElement(Router.Route, { path: '/catalog/:userNm/:userId', element: React.createElement(ProviderCatalog) })
        )
      )
    );

    await waitFor(() => expect(screen.queryByText(/Solicitar Financiamiento/i)).toBeNull());
  });

  test('hides button when viewing own provider catalog', async () => {
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: true, loading: false }));

    // We provide route params using MemoryRouter + Route when rendering instead of spying on useParams.

    // Mock supabase user lookup to return the provider as verified
    const provider = { user_id: 'user-123', user_nm: 'provider-abc', verified: true };
    jest.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: () => ({ eq: () => ({ single: async () => ({ data: provider, error: null }) }) }),
        };
      }
      // fallback for other calls
      return { select: () => ({ eq: () => ({ order: () => ({ }) }) }) };
    });

    // Ensure RPC returns provider too (avoid network calls)
    jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: [provider], error: null });

    // Mock auth session to match the provider user_id
    jest.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: { user: { id: 'user-123' } } } });

    render(
      React.createElement(Router.MemoryRouter, { initialEntries: ['/catalog/provider-abc/user-123'] },
        React.createElement(Router.Routes, null,
          React.createElement(Router.Route, { path: '/catalog/:userNm/:userId', element: React.createElement(ProviderCatalog) })
        )
      )
    );

    // Button should never appear because user is the provider
    await waitFor(() => expect(screen.queryByText(/Solicitar Financiamiento/i)).toBeNull());
  });
});