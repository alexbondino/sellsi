import React from 'react';
import { Box, Typography, Container, Paper, Chip } from '@mui/material';
import SidebarBuyer from '../../features/layout/SidebarBuyer';
import MarketplaceTopBar from '../../features/layout/MarketplaceTopBar';

const BuyerOrders = () => {
  // Mock data para pedidos (más tarde se conectará con Supabase)
  const orders = [
    {
      id: 1,
      orderNumber: 'ORD-001',
      date: '2024-12-01',
      status: 'Entregado',
      total: '$150.000',
      products: 'Silla Ergonómica, Escritorio',
    },
    {
      id: 2,
      orderNumber: 'ORD-002',
      date: '2024-12-15',
      status: 'En Tránsito',
      total: '$89.900',
      products: 'Monitor 4K',
    },
    {
      id: 3,
      orderNumber: 'ORD-003',
      date: '2024-12-20',
      status: 'Procesando',
      total: '$45.500',
      products: 'Teclado Mecánico',
    },
  ];

  const getStatusColor = status => {
    switch (status) {
      case 'Entregado':
        return 'success';
      case 'En Tránsito':
        return 'info';
      case 'Procesando':
        return 'warning';
      default:
        return 'default';
    }
  };
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
              Mis Pedidos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {orders.map(order => (
                <Paper
                  key={order.id}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        Pedido {order.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Fecha: {order.date}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status}
                      color={getStatusColor(order.status)}
                      variant="filled"
                    />
                  </Box>

                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Productos:</strong> {order.products}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: 'primary.main' }}
                  >
                    Total: {order.total}
                  </Typography>
                </Paper>
              ))}
            </Box>
            {orders.length === 0 && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No tienes pedidos aún
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  ¡Explora nuestro marketplace y haz tu primer pedido!
                </Typography>
              </Paper>
            )}{' '}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default BuyerOrders;
