import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import GlobalStyles from '@mui/material/GlobalStyles';
import { Toaster } from 'react-hot-toast';

import theme from '../../styles/theme';
import { BannerProvider } from '../../features/ui/banner/BannerContext';
import ScrollToTop from '../../features/ui/ScrollToTop';
import BanGuard from '../../components/BanGuard';
import { AuthProvider } from './AuthProvider';
import { RoleProvider } from './RoleProvider';
import { LayoutProvider } from './LayoutProvider';

const globalStyles = {
  html: { overflowX: 'hidden' },
  body: { overflowX: 'hidden', margin: 0, scrollBehavior: 'smooth' },
  '#root': { overflowX: 'hidden', position: 'relative' },
};

const toasterConfig = {
  position: "top-right",
  toastOptions: {
    duration: 4000,
    style: {
      background: '#333',
      color: '#fff',
      borderRadius: '8px',
      marginTop: '60px' // Mover los toasts más abajo del TopBar
    },
    success: { style: { background: '#4caf50' } },
    error: { style: { background: '#f44336' } },
  }
};

export const AppProviders = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      
      <BannerProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <RoleProvider>
              <LayoutProvider>
                <BanGuard>
                  {children}
                </BanGuard>
              </LayoutProvider>
            </RoleProvider>
          </AuthProvider>
        </BrowserRouter>
        
        <Toaster {...toasterConfig} />
      </BannerProvider>
    </ThemeProvider>
  );
};
