import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { supabase } from '../../services/supabase';
import { useFeatureFlag } from '../useFeatureFlag';

// Small component to surface the hook values
function HookConsumer({ workspace, key, defaultValue }) {
  const { enabled, loading } = useFeatureFlag({ workspace, key, defaultValue });
  return (
    <div>
      <span data-testid="enabled">{String(enabled)}</span>
      <span data-testid="loading">{String(loading)}</span>
    </div>
  );
}

describe('useFeatureFlag', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('returns enabled=true when supabase has the flag enabled', async () => {
    // Mock schema().from(...).select(...).eq().eq().maybeSingle()
    supabase.schema = jest.fn(() => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({ data: { enabled: true }, error: null }),
            }),
          }),
        }),
      }),
    }));

    render(<HookConsumer workspace="my-financing" key={'financing_enabled'} defaultValue={false} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('enabled').textContent).toBe('true');
  });

  test('falls back to defaultValue on error', async () => {
    supabase.schema = jest.fn(() => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: () => Promise.reject(new Error('Network')),
            }),
          }),
        }),
      }),
    }));

    render(<HookConsumer workspace="my-financing" key={'financing_enabled'} defaultValue={false} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('enabled').textContent).toBe('false');
  });

  test('sets loading=false immediately when workspace or key is missing', async () => {
    render(<HookConsumer workspace="" key={''} defaultValue={false} />);

    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
  });
});