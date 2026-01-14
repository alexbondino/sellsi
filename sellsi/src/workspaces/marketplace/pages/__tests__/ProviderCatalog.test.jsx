import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProviderCatalog from '../ProviderCatalog';
import * as ff from '../../../../shared/hooks/useFeatureFlag';

jest.mock('../../../../shared/hooks/useFeatureFlag');

describe('ProviderCatalog financing button', () => {
  afterEach(() => jest.resetAllMocks());

  test('renders Solicitar Financiamiento when flag enabled', async () => {
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: true, loading: false }));

    render(<ProviderCatalog />);

    // The page is large; wait for any button text match
    await waitFor(() => expect(screen.queryByText(/Solicitar Financiamiento/i)).toBeInTheDocument());
  });

  test('does not render when flag disabled', async () => {
    ff.useFeatureFlag.mockImplementation(() => ({ enabled: false, loading: false }));

    render(<ProviderCatalog />);

    await waitFor(() => expect(screen.queryByText(/Solicitar Financiamiento/i)).toBeNull());
  });
});