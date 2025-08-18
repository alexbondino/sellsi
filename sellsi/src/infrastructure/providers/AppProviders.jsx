import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import GlobalStyles from '@mui/material/GlobalStyles';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import theme from '../../styles/theme';
import { queryClient } from '../../utils/queryClient';
import { globalCacheManager } from '../../utils/cacheManager';
import { globalObserverPool } from '../../utils/observerPoolManager';
import { BannerProvider } from '../../shared/components/display/banners/BannerContext';
import ScrollToTop from '../../shared/components/navigation/ScrollToTop';
import BanGuard from '../../components/BanGuard';
import { AuthProvider } from './AuthProvider';
import { RoleProvider } from './RoleProvider';
import { LayoutProvider } from './LayoutProvider';
import { NotificationsProvider } from '../../domains/notifications/components/NotificationProvider';
import { TransferInfoManager } from '../../shared/components/managers';

const globalStyles = {
  html: { overflowX: 'hidden' },
  body: { overflowX: 'hidden', margin: 0, scrollBehavior: 'smooth' },
  '#root': { overflowX: 'hidden', position: 'relative' },
};

export const AppProviders = ({ children }) => {
  // Inicializar servicios globales
  useEffect(() => {
    // Exponer cache manager globalmente para debugging
    if (typeof window !== 'undefined') {
      window.cacheManager = globalCacheManager;
      window.observerPool = globalObserverPool;
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles} />
        
        <BannerProvider>
          <BrowserRouter>
            <ScrollToTop />
            <AuthProvider>
              <TransferInfoManager />
              <RoleProvider>
                <NotificationsProvider>
                  <LayoutProvider>
                    <BanGuard>
                      {children}
                    </BanGuard>
                  </LayoutProvider>
                </NotificationsProvider>
              </RoleProvider>
            </AuthProvider>
          </BrowserRouter>
          
          <Toaster 
            position="top-right"
            gutter={8}
            containerStyle={{
              top: 70,
              right: 20,
              zIndex: 9999
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e0e0e0',
                maxWidth: '400px',
                wordBreak: 'break-word'
              },
              success: { 
                style: { 
                  background: '#e8f5e8',
                  color: '#2e7D32',
                  border: '1px solid #4caf50'
                },
                iconTheme: {
                  primary: '#4caf50',
                  secondary: '#fff'
                }
              },
              error: { 
                style: { 
                  background: '#ffeaea',
                  color: '#c62828',
                  border: '1px solid #f44336'
                },
                iconTheme: {
                  primary: '#f44336',
                  secondary: '#fff'
                }
              },
              loading: {
                style: {
                  background: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #2196f3'
                },
                iconTheme: {
                  primary: '#2196f3',
                  secondary: '#fff'
                }
              }
            }}
          />
        </BannerProvider>
      </ThemeProvider>
      
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};
