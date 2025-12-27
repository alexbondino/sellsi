import React from 'react';
import { render, act } from '@testing-library/react';

// Clean mocks for hooks and providers
const mockPrefetchRoute = jest.fn();
jest.mock('../../hooks/usePrefetch', () => ({
  usePrefetch: jest.fn(),
}));

jest.mock('../../infrastructure/providers', () => ({
  useAuth: jest.fn(),
  useRole: jest.fn(),
}));

import RolePrefetchProvider from '../../infrastructure/prefetch/RolePrefetchProvider';
import { usePrefetch } from '../../hooks/usePrefetch';
import { useRole, useAuth } from '../../infrastructure/providers';

describe('RolePrefetchProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();

    // Default auth and role
    useAuth.mockReturnValue({ session: { user: { id: 'u' } }, loadingUserStatus: false });
    useRole.mockReturnValue({ currentAppRole: 'buyer' });

    // Default prefetch hook implementation
    usePrefetch.mockReturnValue({ prefetchRoute: mockPrefetchRoute });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('does NOT schedule prefetch if user is loading', () => {
    useAuth.mockReturnValue({ session: null, loadingUserStatus: true });

    render(
      <RolePrefetchProvider buyerDelay={10} supplierDelay={10}>
        <div>OK</div>
      </RolePrefetchProvider>
    );

    act(() => jest.advanceTimersByTime(100));

    expect(mockPrefetchRoute).not.toHaveBeenCalled();
  });

  test('schedules prefetch for buyer routes (valid routes are prefetched)', () => {
    render(
      <RolePrefetchProvider buyerDelay={10} supplierDelay={10}>
        <div>OK</div>
      </RolePrefetchProvider>
    );

    // advance timers to trigger setTimeout
    act(() => jest.advanceTimersByTime(20));

    // Verify specific buyer routes were prefetched (behavior-focused, resistant to extra routes)
    expect(mockPrefetchRoute).toHaveBeenCalledWith('/buyer/marketplace');
    expect(mockPrefetchRoute).toHaveBeenCalledWith('/buyer/orders');
  });

  test('schedules prefetch for supplier routes (critical supplier routes are prefetched)', () => {
    // switch role to supplier for this test
    useRole.mockReturnValue({ currentAppRole: 'supplier' });

    render(
      <RolePrefetchProvider buyerDelay={10} supplierDelay={10}>
        <div>OK</div>
      </RolePrefetchProvider>
    );

    act(() => jest.advanceTimersByTime(20));

    // Verify critical supplier routes are prefetched (avoid brittle numeric counts)
    expect(mockPrefetchRoute).toHaveBeenCalledWith('/supplier/home');
    expect(mockPrefetchRoute).toHaveBeenCalledWith('/supplier/myproducts');
  });
});
