import React from 'react';
import { render, act, screen, waitFor } from '@testing-library/react';

// Mock useAuth to control session (make it a jest.fn so tests can override per-case)
jest.mock('../../infrastructure/providers', () => ({ useAuth: jest.fn() }));
import { useAuth } from '../../infrastructure/providers';

// Mock cart store
const mockInit = jest.fn();
jest.mock('../../shared/stores/cart/cartStore', () => jest.fn(() => ({ initializeCartWithUser: mockInit })));

import { useAppInitialization } from '../../shared/hooks/useAppInitialization';

const TestComponent = ({ onReady }) => {
  const state = useAppInitialization();
  React.useEffect(() => {
    onReady && onReady(state);
  }, [state, onReady]);

  // Render an observable node so tests can wait for initialization reliably
  return state.isInitialized ? <div data-testid="initialized" /> : <div data-testid="not-initialized" />;
};

describe('useAppInitialization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Default: not authenticated, not loading
    useAuth.mockReturnValue({ session: null, loadingUserStatus: false });
  });

  test('exposes initialized state and sets up popstate listener', async () => {
    render(<TestComponent />);

    // Wait for initialized state to appear (robust against async init)
    await screen.findByTestId('initialized');

    // Dispatch popstate and assert it triggers closeAllModals event
    const handler = jest.fn();
    window.addEventListener('closeAllModals', handler);
    act(() => window.dispatchEvent(new PopStateEvent('popstate')));
    expect(handler).toHaveBeenCalled();
    window.removeEventListener('closeAllModals', handler);
  });

  test('reports not initialized when loadingUserStatus is true', async () => {
    useAuth.mockReturnValue({ session: null, loadingUserStatus: true });
    render(<TestComponent />);
    await screen.findByTestId('not-initialized');
  });

  test('initializes cart when session exists', async () => {
    useAuth.mockReturnValue({ session: { user: { id: 'uid-1' } }, loadingUserStatus: false });
    render(<TestComponent />);
    await screen.findByTestId('initialized');
    expect(mockInit).toHaveBeenCalledWith('uid-1');
  });
});
