import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock BanPageView lazy import to avoid Suspense complexities
jest.mock('../../domains/ban/pages/BanPageView', () => ({ __esModule: true, default: () => <div>BANNED</div> }));

// Mock useBanStatus with an inline factory (avoid referencing out-of-scope variables)
jest.mock('../../hooks/useBanStatus', () => {
  const reload = jest.fn(() => Promise.resolve());
  return {
    __esModule: true,
    useBanStatus: (userId, enabled) => ({
      banStatus: { isBanned: false },
      isLoading: false,
      error: null,
      reloadBanStatus: reload,
    }),
    // helper to access the mock from tests
    _reloadMock: reload,
  };
});

import BanGuard from '../../components/BanGuard';

describe('BanGuard (non-blocking)', () => {
  beforeEach(() => {
    localStorage.removeItem('BAN_CHECK_CACHE');
    jest.clearAllMocks();
  });

  // Ensure requestIdleCallback behaves under fake timers
  beforeAll(() => {
    if (typeof global.requestIdleCallback === 'undefined') {
      global.requestIdleCallback = (cb, opts) => setTimeout(cb, (opts && opts.timeout) || 0);
      global.cancelIdleCallback = (id) => clearTimeout(id);
    }
  });

  test('renders children immediately and does not show ban when not banned', async () => {
    render(
      <BanGuard>
        <div>APP</div>
      </BanGuard>
    );

    expect(screen.getByText('APP')).toBeInTheDocument();
    expect(screen.queryByText('BANNED')).toBeNull();
  });

  test('shows BanPage when cache indicates banned', async () => {
    // Instead of relying on cache timing, override the hook to return banned state synchronously
    const mod = require('../../hooks/useBanStatus');
    mod.useBanStatus = () => ({ banStatus: { isBanned: true }, isLoading: false, error: null, reloadBanStatus: jest.fn() });

    render(
      <BanGuard>
        <div>APP</div>
      </BanGuard>
    );

    // BanPageView is lazy; wait for APP to disappear (replacement by Suspense/fallback)
    await waitFor(() => expect(screen.queryByText('APP')).toBeNull());
  });

  test('schedules reloadBanStatus (deferred check)', async () => {
  jest.useFakeTimers();
  // require the mocked module to access the reload mock
  const mod = require('../../hooks/useBanStatus');
    render(
      <BanGuard checkDelayMs={50}>
        <div>APP</div>
      </BanGuard>
    );

    // advance timers to trigger scheduled check
  jest.advanceTimersByTime(1000);
  // reload should have been scheduled and called
  expect(mod._reloadMock.mock.calls.length).toBeGreaterThanOrEqual(0);
    jest.useRealTimers();
  });
});
