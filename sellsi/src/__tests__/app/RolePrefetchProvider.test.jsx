import React from 'react';
import { render, act } from '@testing-library/react';

// Mock hooks
jest.mock('../../hooks/usePrefetch', () => {
  const mockPrefetchRoute = jest.fn();
  return { usePrefetch: () => ({ prefetchRoute: mockPrefetchRoute }), __esModule: true };
});

// Provide a mutable mock role so tests can switch role without module reloads
const mockRole = { current: 'buyer' };
jest.mock('../../infrastructure/providers', () => ({
  useAuth: () => ({ session: { user: { id: 'u' } }, loadingUserStatus: false }),
  useRole: () => ({ currentAppRole: mockRole.current }),
  __esModule: true,
}));

import RolePrefetchProvider from '../../infrastructure/prefetch/RolePrefetchProvider';

describe('RolePrefetchProvider', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('schedules prefetch for buyer routes', () => {
    render(
      <RolePrefetchProvider buyerDelay={10} supplierDelay={10}>
        <div>OK</div>
      </RolePrefetchProvider>
    );

    // advance timers to trigger setTimeout
  act(() => jest.advanceTimersByTime(20));
  // require the module to access the mock created inside the factory
  const { usePrefetch } = require('../../hooks/usePrefetch');
  expect(usePrefetch().prefetchRoute).toHaveBeenCalled();
  });

  test('schedules prefetch for supplier routes', () => {
  // switch role to supplier for this test
  const modProviders = require('../../infrastructure/providers');
    mockRole.current = 'supplier';
    jest.useFakeTimers();
    const RolePrefetch = require('../../infrastructure/prefetch/RolePrefetchProvider').default;
  const { usePrefetch } = require('../../hooks/usePrefetch');
  // reset any previous calls to ensure deterministic counts
  usePrefetch().prefetchRoute.mockClear();

    render(
      <RolePrefetch buyerDelay={10} supplierDelay={10}>
        <div>OK</div>
      </RolePrefetch>
    );

    act(() => jest.advanceTimersByTime(20));
    // supplierRoutes length is 4
    expect(usePrefetch().prefetchRoute).toHaveBeenCalledTimes(4);
    jest.useRealTimers();
    // restore role
    mockRole.current = 'buyer';
  });
});
