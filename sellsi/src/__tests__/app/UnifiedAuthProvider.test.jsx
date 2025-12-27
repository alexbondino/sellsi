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
  invalidateUserProfileCache: jest.fn(),
}));

import { getUserProfile, invalidateUserProfileCache } from '../../services/user/profileService';
import { supabase } from '../../services/supabase';
import { UnifiedAuthProvider, useAuth } from '../../infrastructure/providers/UnifiedAuthProvider';

const TestConsumer = () => {
  const { currentAppRole, loadingUserStatus, userProfile, needsOnboarding } = useAuth();
  return (
    <div>
      <div data-testid="role">{String(currentAppRole)}</div>
      <div data-testid="loading">{String(loadingUserStatus)}</div>
      <div data-testid="profile">{userProfile ? userProfile.user_nm : 'null'}</div>
      <div data-testid="phone">{userProfile ? (userProfile.phone_nbr || 'null') : 'null'}</div>
      <div data-testid="onboarding">{String(needsOnboarding)}</div>
    </div>
  );
};

describe('UnifiedAuthProvider basic flows', () => {
  // Ensure clean mocks between tests
  beforeEach(() => {
    // Reset implementations and call state so per-test overrides don't leak
    jest.resetAllMocks();

    // Re-initialize default supabase mock behavior that resetAllMocks clears
    const { supabase } = require('../../services/supabase');
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
    supabase.from.mockImplementation(() => createQuery());
    supabase.auth.getSession.mockImplementation(() => Promise.resolve({ data: { session: null } }));
    supabase.auth.onAuthStateChange.mockImplementation(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }));
  });

  test('derives role from profile and exposes initialization state', async () => {
    // Arrange: session present and profile available
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    // Include phone_nbr to verify provider exposes it
    getUserProfile.mockResolvedValue({ data: { user_id: 'user-1', user_nm: 'ACME', main_supplier: true, logo_url: '', phone_nbr: '+56912345678' }, error: null });

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
    // Nuevo: verificar que phone_nbr se expone en el contexto
    expect(screen.getByTestId('phone')).toHaveTextContent('+56912345678');
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
    // The provider may expose an empty profile cell or the string 'null' depending on internal handling;
    // assert that profile is falsy and onboarding flag was set.
    expect(screen.getByTestId('profile').textContent).toBeFalsy();
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

  test('creates profile automatically when missing (success)', async () => {
    // Arrange: session present but profile missing
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-2', email: 'u2@example.com' } } } });
    getUserProfile.mockResolvedValue({ data: null, error: null });

    const createdProfile = { user_nm: 'AUTO', main_supplier: true, logo_url: '' };
    const insertChain = {
      insert: jest.fn(() => insertChain),
      select: jest.fn(() => insertChain),
      single: jest.fn(() => Promise.resolve({ data: createdProfile, error: null })),
    };
    supabase.from.mockReturnValue(insertChain);

    // Act
    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Assert: new profile is exposed, onboarding set true, and cache invalidated
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('profile')).toHaveTextContent('AUTO');
    expect(screen.getByTestId('onboarding')).toHaveTextContent('true');
    expect(invalidateUserProfileCache).toHaveBeenCalledWith('user-2');
  });

  test('onboarding flow (invalidate + refresh) updates phone without F5', async () => {
    // Arrange: session present and service returns a stale profile (no phone) unless forced
    supabase.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'user-3', email: 'u3@example.com' } } } });

    getUserProfile.mockImplementation((userId, options = {}) => {
      if (options && options.force) {
        return Promise.resolve({ data: { user_id: 'user-3', user_nm: 'ACME', main_supplier: true, logo_url: '', phone_nbr: '+569999000' }, error: null });
      }
      // Stale response without phone
      return Promise.resolve({ data: { user_id: 'user-3', user_nm: 'ACME', main_supplier: true, logo_url: '', phone_nbr: null }, error: null });
    });

    // Small consumer with an action to simulate onboarding completion
    const OnboardTrigger = () => {
      const { refreshUserProfile } = useAuth();
      return (
        <button
          data-testid="onboard"
          onClick={async () => {
            // Simulate the onboarding's invalidate + refresh sequence
            invalidateUserProfileCache('user-3');
            await refreshUserProfile();
          }}
        >Trigger</button>
      );
    };

    // Act: render provider with consumer and trigger
    render(
      <MemoryRouter initialEntries={["/"]}>
        <UnifiedAuthProvider>
          <TestConsumer />
          <OnboardTrigger />
        </UnifiedAuthProvider>
      </MemoryRouter>
    );

    // Initial state: phone is null (stale)
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('phone')).toHaveTextContent('null');

    // Act: trigger onboarding completion
    screen.getByTestId('onboard').click();

    // Assert: invalidate was called, and phone gets updated to the new number
    await waitFor(() => expect(invalidateUserProfileCache).toHaveBeenCalledWith('user-3'));
    await waitFor(() => expect(screen.getByTestId('phone')).toHaveTextContent('+569999000'));

    // Also assert getUserProfile was called with force to ensure freshness
    const forcedCall = getUserProfile.mock.calls.find(c => c[0] === 'user-3' && c[1] && c[1].force === true);
    expect(forcedCall).toBeDefined();
  });
});
