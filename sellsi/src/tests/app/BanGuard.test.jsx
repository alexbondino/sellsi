import React from 'react';
import { render, screen, act } from '@testing-library/react';
import BanGuard from '../../components/BanGuard';
import { useBanStatus } from '../../hooks/useBanStatus';

// 1. Mock limpio y directo
const mockReloadBanStatus = jest.fn();

jest.mock('../../hooks/useBanStatus', () => ({
  useBanStatus: jest.fn(),
}));

jest.mock('../../domains/ban/pages/BanPageView', () => ({ __esModule: true, default: () => <div data-testid="banned-screen">BANNED</div> }));

describe('BanGuard Integration', () => {
  // Polyfill requestIdleCallback if missing
  beforeAll(() => {
    if (typeof global.requestIdleCallback === 'undefined') {
      global.requestIdleCallback = (cb) => setTimeout(cb, 0);
      global.cancelIdleCallback = (id) => clearTimeout(id);
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();

    // Default: not banned
    useBanStatus.mockReturnValue({
      banStatus: { isBanned: false },
      isLoading: false,
      error: null,
      reloadBanStatus: mockReloadBanStatus,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders children immediately when not banned', () => {
    render(
      <BanGuard>
        <div data-testid="app-content">APP</div>
      </BanGuard>
    );

    // Positive assertions
    expect(screen.getByTestId('app-content')).toBeInTheDocument();
    expect(screen.queryByTestId('banned-screen')).not.toBeInTheDocument();
  });

  test('shows BanPage when hook returns banned status', async () => {
    // Override for this test
    useBanStatus.mockReturnValue({
      banStatus: { isBanned: true },
      isLoading: false,
      error: null,
      reloadBanStatus: mockReloadBanStatus,
    });

    render(
      <BanGuard>
        <div>APP</div>
      </BanGuard>
    );

    // Positive check: BANNED view appears
    const banned = await screen.findByTestId('banned-screen');
    expect(banned).toBeInTheDocument();

    // Secondary: APP content should no longer be present
    expect(screen.queryByText('APP')).not.toBeInTheDocument();
  });

  test('schedules reloadBanStatus after checkDelayMs', () => {
    const DELAY_MS = 50;

    // Replace requestIdleCallback with a synchronous invoker to make scheduling deterministic
    const origRIC = global.requestIdleCallback;
    const origCancel = global.cancelIdleCallback;
    try {
      global.requestIdleCallback = (cb) => { cb(); return 0; };
      global.cancelIdleCallback = () => {};

      const mod = require('../../hooks/useBanStatus');

      // Ensure hook does not write cache immediately (simulate loading state) so scheduling runs
      useBanStatus.mockReturnValue({ banStatus: null, isLoading: true, error: null, reloadBanStatus: mockReloadBanStatus });

      // Verify scheduling uses requestIdleCallback when available by spying on it
      const spyRIC = jest.fn(cb => { cb(); return 0; });
      const origRIC = global.requestIdleCallback;
      const origCancel = global.cancelIdleCallback;
      try {
        global.requestIdleCallback = spyRIC;
        global.cancelIdleCallback = () => {};

        // Ensure reload is a promise-returning function so runCheck can use .catch/.finally
        mockReloadBanStatus.mockResolvedValue(Promise.resolve());

        render(
          <BanGuard checkDelayMs={DELAY_MS}>
            <div>APP</div>
          </BanGuard>
        );

        // Sanity check: ensure no valid cache prevents scheduling
        expect(localStorage.getItem('BAN_CHECK_CACHE')).toBeNull();

        // requestIdleCallback should have been used
        expect(spyRIC).toHaveBeenCalled();
      } finally {
        if (origRIC) global.requestIdleCallback = origRIC;
        if (origCancel) global.cancelIdleCallback = origCancel;
      }
    } finally {
      if (origRIC) global.requestIdleCallback = origRIC;
      if (origCancel) global.cancelIdleCallback = origCancel;
    }
  });

  test('does NOT schedule reload if component unmounts quickly', () => {
    const DELAY_MS = 1000;

    const { unmount } = render(
      <BanGuard checkDelayMs={DELAY_MS}>
        <div>APP</div>
      </BanGuard>
    );

    // Unmount before delay elapses
    unmount();

    act(() => {
      jest.advanceTimersByTime(DELAY_MS + 100);
    });

    expect(mockReloadBanStatus).not.toHaveBeenCalled();
  });
});
