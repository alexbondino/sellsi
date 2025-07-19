// 📁 pages/ProviderHome.jsx
import React, { Suspense } from 'react';
import {
  Box,
  Grid,
  Button,
  Container,
  ThemeProvider,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useSupplierDashboard } from './hooks/useSupplierDashboard';
import SideBarProvider from '../../layout/SideBar';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';

// Lazy imports para reducir el bundle inicial
const DashboardSummary = React.lazy(() =>
  import('./dashboard-summary/DashboardSummary')
);
const MonthlySalesChart = React.lazy(() => import('../../ui/graphs/BarChart'));

// Loading fallbacks optimizados
const DashboardSummaryFallback = () => (
  <Grid container spacing={2}>
    {[1, 2, 3, 4].map(item => (
      <Grid key={item} size={{ xs: 12, sm: 6, md: 3 }}>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
      </Grid>
    ))}
  </Grid>
);

const ChartFallback = () => (
  <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
);

const ProviderHome = () => {
  const navigate = useNavigate();
  const {
    products,
    sales,
    productStocks,
    weeklyRequests,
    monthlyData,
    totalSales,
    loading,
    error,
  } = useSupplierDashboard();

  // Ahora cuenta productos inactivos (is_active === false)
  const productsOutOfStock = products.filter(p => p.is_active === false).length;

  // Ahora cuenta productos activos (is_active === true)
  const productsActive = products.filter(p => p.is_active === true).length;

  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <SideBarProvider />
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 },
          px: 3,
          pb: SPACING_BOTTOM_MAIN,
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Grid container spacing={3}>
            <Grid size={12}>
              <Box sx={{ mb: 4 }}>
                <Suspense fallback={<DashboardSummaryFallback />}>
                  <DashboardSummary
                    products={products}
                    totalSales={totalSales}
                    outOfStock={productsOutOfStock}
                    weeklyRequests={weeklyRequests}
                    productsActive={productsActive}
                  />
                </Suspense>
              </Box>

              <Box sx={{ mb: 4 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  fullWidth
                  sx={{
                    py: 2,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'rgba(99, 102, 241, 0.16) 0px 4px 16px',
                    '&:hover': {
                      boxShadow: 'rgba(99, 102, 241, 0.24) 0px 6px 20px',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onClick={() =>
                    navigate('/supplier/addproduct', {
                      state: { fromHome: true },
                    })
                  }
                >
                  Nuevo Producto
                </Button>
              </Box>

              <Box>
                <Suspense fallback={<ChartFallback />}>
                  <MonthlySalesChart data={monthlyData} />
                </Suspense>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ProviderHome;
