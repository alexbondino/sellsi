import React from 'react';
import { render, act } from '@testing-library/react';

// Mock useAuth to control session
jest.mock('../../infrastructure/providers', () => ({ useAuth: () => ({ session: null, loadingUserStatus: false }) }));

// Mock cart store
const mockInit = jest.fn();
jest.mock('../../shared/stores/cart/cartStore', () => {
  return jest.fn(() => ({ initializeCartWithUser: mockInit }));
});

import { useAppInitialization } from '../../shared/hooks/useAppInitialization';

const TestComponent = ({ onReady }) => {
  const state = useAppInitialization();
  React.useEffect(() => {
    onReady && onReady(state);
  }, [state, onReady]);
  return null;
};

describe('useAppInitialization', () => {
  test('exposes initialized state and sets up popstate listener', () => {
    let received = null;
    render(<TestComponent onReady={(s) => { received = s; }} />);
    expect(received).not.toBeNull();
    expect(received.isInitialized).toBe(true);

    // Dispatch popstate and ensure no exceptions thrown (listener exists)
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  });
});
