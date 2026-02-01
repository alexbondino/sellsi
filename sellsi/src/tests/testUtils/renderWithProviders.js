import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';

import { render } from '@testing-library/react';

export const renderWithProviders = (ui) => {
  const client = new QueryClient();
  return {
    ...render(
      <BrowserRouter>
        <QueryClientProvider client={client}>
          <ThemeProvider theme={dashboardThemeCore}>
            <BannerProvider>
              {ui}
            </BannerProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
    client
  };
};
