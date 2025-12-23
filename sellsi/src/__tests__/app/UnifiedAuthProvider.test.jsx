import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock supabase auth and provide a minimal .from chain compatible with profile creation
jest.mock('../../services/supabase', () => {
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

  return {
    supabase: {
      from: jest.fn(() => createQuery()),
      auth: {
        getSession: jest.fn(),
        onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
      },
    },
  };
});

// Mock the profile service used by UnifiedAuthProvider
jest.mock('../../services/user/profileService', () => ({
  getUserProfile: jest.fn(),
}));

import { getUserProfile } from '../../services/user/profileService';
import { supabase } from '../../services/supabase';
import { UnifiedAuthProvider, useAuth } from '../../infrastructure/providers/UnifiedAuthProvider';

const TestConsumer = () => {
  const { currentAppRole, loadingUserStatus, userProfile, needsOnboarding } = useAuth();
  return (
    <div>
      <div data-testid="role">{String(currentAppRole)}</div>
      <div data-testid="loading">{String(loadingUserStatus)}</div>
      <div data-testid="profile">{userProfile ? userProfile.user_nm : 'null'}</div>
      <div data-testid="onboarding">{String(needsOnboarding)}</div>
    </div>
  );
};

describe('UnifiedAuthProvider basic flows', () => {
  // Ensure clean mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('derives role from profile and exposes initialization state', async () => {
    // Arrange: session present and profile available
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    getUserProfile.mockResolvedValue({ data: { user_id: 'user-1', user_nm: 'ACME', main_supplier: true, logo_url: '' }, error: null });

    // Act
    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('profile')).toHaveTextContent('ACME');
    expect(screen.getByTestId('role')).toHaveTextContent('supplier');
  });

  test('profile fetch error triggers onboarding flag (needsOnboarding)', async () => {
    // Arrange: session present but service returns error
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    getUserProfile.mockResolvedValue({ data: null, error: { message: 'Profile not found' } });

    // Act
    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('profile')).toHaveTextContent('null');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('true');
  });

  test('no session defaults to buyer role', async () => {
    // Arrange: no session
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    // Act
    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('role')).toHaveTextContent('buyer');
    expect(getUserProfile).not.toHaveBeenCalled();
  });
});
