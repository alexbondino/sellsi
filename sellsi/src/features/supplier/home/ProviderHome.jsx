// 📁 pages/ProviderHome.jsx
import React from 'react';
import { Box, Grid, Button, Container, ThemeProvider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSupplierDashboard } from '../hooks/useSupplierDashboard';
import DashboardSummary from './DashboardSummary';
import MonthlySalesChart from '../../ui/graphs/BarChart';
import SidebarProvider from '../../layout/SideBar';
import ProviderTopBar from '../../layout/ProviderTopBar';
import { dashboardTheme } from '../../../styles/dashboardTheme';

const ProviderHome = () => {
  const supplierId = localStorage.getItem('supplierid');
  const {
    products,
    sales,
    productStocks,
    weeklyRequests,
    monthlyData,
    totalSales,
  } = useSupplierDashboard(supplierId);
  const productsOutOfStock = productStocks.filter(
    p => p.productqty === 0
  ).length;

  return (
    <ThemeProvider theme={dashboardTheme}>
      {/* TopBar específico para Provider */}
      <ProviderTopBar />
      <SidebarProvider /> {/* Contenido principal con el tema aplicado */}
      <Box
        sx={{
          marginLeft: '250px',
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 9, md: 10 }, // Padding-top para compensar la TopBar fija + contenido
          px: 3, // Solo padding horizontal
          pb: 3, // Solo padding bottom
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {' '}
          <Grid container spacing={3}>
            {/* Contenido principal (Dashboard + Chart + Button) - Ahora ocupa todo el ancho */}
            <Grid item xs={12}>
              <Box sx={{ mb: 4 }}>
                <DashboardSummary
                  products={products}
                  totalSales={totalSales}
                  outOfStock={productsOutOfStock}
                  weeklyRequests={weeklyRequests}
                />
              </Box>

              {/* Botón Nuevo Producto */}
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

              {/* Gráfico de Ventas */}
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
