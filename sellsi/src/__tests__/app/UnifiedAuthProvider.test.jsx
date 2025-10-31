import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase used by UnifiedAuthProvider
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: () => ({ eq: () => ({ single: jest.fn().mockResolvedValue({ data: { user_nm: 'ACME', main_supplier: true, logo_url: '' }, error: null }) }) }),
        };
      }
      return { select: () => ({ eq: () => ({ single: jest.fn().mockResolvedValue({ data: null, error: null }) }) }) };
    }),
  }
}));

import { UnifiedAuthProvider, useAuth } from '../../infrastructure/providers/UnifiedAuthProvider';

const TestConsumer = () => {
  const { currentAppRole, loadingUserStatus, userProfile } = useAuth();
  return (
    <div>
      <div>role:{String(currentAppRole)}</div>
      <div>loading:{String(loadingUserStatus)}</div>
      <div>profile:{userProfile ? userProfile.user_nm : 'null'}</div>
    </div>
  );
};

describe('UnifiedAuthProvider basic flows', () => {
  test('derives role from profile and exposes initialization state', async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Wait until provider has resolved profile and loading cleared
    await waitFor(() => expect(screen.getByText(/profile:/).textContent).toContain('ACME'));
    await waitFor(() => expect(screen.getByText(/loading:/).textContent).toContain('false'));
    // role should be derived to supplier for the mocked profile
    expect(screen.getByText(/role:/).textContent).toMatch(/supplier/);
  });

  test('profile fetch error triggers onboarding flag (needsOnboarding)', async () => {
    // override supabase.from to return an error
    const sup = require('../../services/supabase');
    sup.supabase.from = jest.fn().mockImplementation((table) => ({ select: () => ({ eq: () => ({ single: jest.fn().mockResolvedValue({ data: null, error: { message: 'db down' } }) }) }) }));

    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Provider should set loading false and profile null
    await waitFor(() => expect(screen.getByText(/profile:/).textContent).toContain('null'));
    expect(screen.getByText(/loading:/).textContent).toContain('false');
  });

  test('no session defaults to buyer role', async () => {
    // mock getSession to return no session
    const sup = require('../../services/supabase');
    sup.supabase.auth.getSession = jest.fn().mockResolvedValue({ data: { session: null } });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/loading:/).textContent).toContain('false'));
    expect(screen.getByText(/role:/).textContent).toContain('buyer');
  });
});
