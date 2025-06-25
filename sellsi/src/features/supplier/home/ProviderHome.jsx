// 📁 pages/ProviderHome.jsx
import React from 'react';
import { Box, Grid, Button, Container, ThemeProvider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSupplierDashboard } from './hooks/useSupplierDashboard';
import DashboardSummary from './dashboard-summary/DashboardSummary';
import MonthlySalesChart from '../../ui/graphs/BarChart';
import SideBarProvider from '../../layout/SideBar';
import { dashboardTheme } from '../../../styles/dashboardTheme';

const ProviderHome = () => {
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

  const productsOutOfStock = productStocks.filter(
    p => p.productqty === 0
  ).length;

  return (
    <ThemeProvider theme={dashboardTheme}>
      <SideBarProvider />
      <Box
        sx={{
          marginLeft: '210px',
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 9, md: 10 },
          px: 3,
          pb: 3,
        }}
      >
        <Container maxWidth="xl" disableGutters>
          <Grid container spacing={3}>
            <Grid size={12}>
              <Box sx={{ mb: 4 }}>
                <DashboardSummary
                  products={products}
                  totalSales={totalSales}
                  outOfStock={productsOutOfStock}
                  weeklyRequests={weeklyRequests}
                />
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
                >
                  Nuevo Producto
                </Button>
              </Box>

              <Box>
                <MonthlySalesChart data={monthlyData} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default ProviderHome;
