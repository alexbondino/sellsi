import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter } from 'react-router-dom';
import { dashboardThemeCore } from '../../styles/dashboardThemeCore';

export const renderWithProviders = (ui) => {
  const client = new QueryClient();
  return {
    ...require('@testing-library/react').render(
      <BrowserRouter>
        <QueryClientProvider client={client}>
          <ThemeProvider theme={dashboardThemeCore}>
            {ui}
          </ThemeProvider>
        </QueryClientProvider>
      </BrowserRouter>
    ),
    client
  };
};
