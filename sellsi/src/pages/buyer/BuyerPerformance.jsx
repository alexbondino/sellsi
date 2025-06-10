import React from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  LinearProgress,
} from '@mui/material';
import SidebarBuyer from '../../features/layout/SidebarBuyer';
import MarketplaceTopBar from '../../features/layout/MarketplaceTopBar';

const BuyerPerformance = () => {
  // Mock data para performance (más tarde se conectará con Supabase)
  const performanceData = {
    totalPurchases: 12,
    totalSpent: '$890.400',
    averageOrderValue: '$74.200',
    completedOrders: 10,
    pendingOrders: 2,
    completionRate: 83.3,
    topCategories: [
      { name: 'Electrónicos', count: 5, percentage: 41.7 },
      { name: 'Muebles', count: 4, percentage: 33.3 },
      { name: 'Hogar', count: 3, percentage: 25.0 },
    ],
  };

  const StatCard = ({ title, value, subtitle, color = 'primary' }) => (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        },
      }}
    >
      <Typography
        variant="h4"
        sx={{ fontWeight: 'bold', color: `${color}.main`, mb: 1 }}
      >
        {value}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
  return (
    <Box>
      {/* TopBar específico para Marketplace */}
      <MarketplaceTopBar />

      <Box sx={{ display: 'flex' }}>
        <SidebarBuyer />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            ml: '250px',
            p: 3,
            backgroundColor: '#f8fafc',
            minHeight: '100vh',
          }}
        >
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h1"
              sx={{ mb: 4, fontWeight: 'bold' }}
            >
              Mi Performance
            </Typography>
            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Compras"
                  value={performanceData.totalPurchases}
                  subtitle="Pedidos realizados"
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Gastado Total"
                  value={performanceData.totalSpent}
                  subtitle="En todas las compras"
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Promedio por Pedido"
                  value={performanceData.averageOrderValue}
                  subtitle="Valor medio"
                  color="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Tasa de Completado"
                  value={`${performanceData.completionRate}%`}
                  subtitle="Pedidos finalizados"
                  color="warning"
                />
              </Grid>
            </Grid>
            {/* Estado de pedidos */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Estado de Pedidos
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      Pedidos Completados
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', color: 'success.main' }}
                    >
                      {performanceData.completedOrders}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (performanceData.completedOrders /
                        performanceData.totalPurchases) *
                      100
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                    color="success"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body1" sx={{ flexGrow: 1 }}>
                      Pedidos Pendientes
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', color: 'warning.main' }}
                    >
                      {performanceData.pendingOrders}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (performanceData.pendingOrders /
                        performanceData.totalPurchases) *
                      100
                    }
                    sx={{ height: 8, borderRadius: 4 }}
                    color="warning"
                  />
                </Grid>
              </Grid>
            </Paper>
            {/* Categorías favoritas */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Categorías Favoritas
              </Typography>
              <Box>
                {performanceData.topCategories.map((category, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {category.count} compras ({category.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={category.percentage}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </Paper>{' '}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default BuyerPerformance;
