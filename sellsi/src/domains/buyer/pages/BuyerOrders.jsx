import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Chip, 
  CircularProgress, 
  Alert,
  Avatar,
  Divider,
  Stack,
  Tooltip
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';
import { useBuyerOrders } from '../hooks';
import { CheckoutSummaryImage } from '../../../components/UniversalProductImage';

const BuyerOrders = () => {
  // ============================================================================
  // HOOKS Y ESTADO
  // ============================================================================
  // Obtener el buyer ID del localStorage (método temporal)
  const buyerId = localStorage.getItem('user_id');
  
  // Hook personalizado para manejar pedidos del comprador
  const {
    orders,
    loading,
    error,
    getProductImage,
    getStatusDisplayName,
    getStatusColor,
    formatDate,
    formatCurrency
  } = useBuyerOrders(buyerId);

  // ============================================================================
  // RENDERIZADO CONDICIONAL
  // ============================================================================
  
  // Mostrar loading
  if (loading) {
    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
            ml: { xs: 0, md: 10, lg: 14, xl: 24 },
            px: 3,
            pb: SPACING_BOTTOM_MAIN,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <CircularProgress size={40} />
        </Box>
      </ThemeProvider>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
            ml: { xs: 0, md: 10, lg: 14, xl: 24 },
            px: 3,
            pb: SPACING_BOTTOM_MAIN,
          }}
        >
          <Container maxWidth="xl" disableGutters>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================
  
  // Función para generar número de orden desde cart_id
  const formatOrderNumber = (cartId) => {
    if (!cartId) return 'N/A';
    return `#${cartId.slice(-8).toUpperCase()}`;
  };

  // Función para determinar el estado del producto basado en fechas y estado del supplier
  const getProductStatus = (item, orderDate, orderStatus) => {
    const now = new Date();
    const purchaseDate = new Date(orderDate);
    
    // Si el supplier ya marcó como entregado, prevalece
    if (orderStatus === 'delivered') {
      return 'delivered';
    }
    
    // Si el supplier rechazó, prevalece
    if (orderStatus === 'rejected') {
      return 'rejected';
    }
    
    // Buscar delivery_days del producto para esta región
    const deliveryRegions = item.product.delivery_regions || [];
    let deliveryDays = 7; // Default si no se encuentra
    
    // Aquí deberías obtener la región del comprador, por ahora uso default
    const buyerRegion = 'Región Metropolitana'; // TODO: obtener región real del comprador
    
    const regionMatch = deliveryRegions.find(dr => dr.region === buyerRegion);
    if (regionMatch) {
      deliveryDays = regionMatch.delivery_days;
    }
    
    // Calcular fecha estimada de entrega
    const estimatedDeliveryDate = new Date(purchaseDate);
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + deliveryDays);
    
    // Determinar estado basado en fechas
    if (now >= estimatedDeliveryDate) {
      return 'delivered';
    } else if (orderStatus === 'in_transit' || orderStatus === 'accepted') {
      return 'in_transit';
    } else {
      return 'pending';
    }
  };

  // Función para obtener los 3 chips de estado
  const getStatusChips = (status) => {
    const chips = [
      { 
        label: 'Pendiente', 
        active: status === 'pending',
        color: status === 'pending' ? 'warning' : 'default'
      },
      { 
        label: 'En Tránsito', 
        active: status === 'in_transit',
        color: status === 'in_transit' ? 'info' : 'default'
      },
      { 
        label: 'Entregado', 
        active: status === 'delivered',
        color: status === 'delivered' ? 'success' : 'default'
      }
    ];
    return chips;
  };

  // Render especial para órdenes de pago (tabla orders) con payment_status
  const renderPaymentStatusBanner = (order) => {
    if (!order.is_payment_order) return null;
    const paymentStatus = order.payment_status || 'pending';
    if (paymentStatus === 'pending') {
      return (
        <Alert severity="info" icon={<CircularProgress size={18} />} sx={{ mb: 2 }}>
          Procesando pago con Khipu... Esta orden se confirmará automáticamente cuando el pago sea verificado.
        </Alert>
      );
    }
    if (paymentStatus === 'paid') {
      return (
        <Alert severity="success" sx={{ mb: 2 }}>
          Pago confirmado. La orden será materializada y aparecerá como pedido normal en breve.
        </Alert>
      );
    }
    // Cualquier otro estado se considera error/issue
    if (paymentStatus !== 'pending' && paymentStatus !== 'paid') {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          Hubo un problema con tu pago (estado: {paymentStatus}). Si el error persiste contacta soporte.
        </Alert>
      );
    }
    return null;
  };
  // ============================================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================================
  return (
    <ThemeProvider theme={dashboardThemeCore}>
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100vh',
          pt: { xs: 4.5, md: 5 },
          ml: { xs: 0, md: 10, lg: 14, xl: 24 },
          px: 3,
          pb: SPACING_BOTTOM_MAIN,
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {/* Título de la página */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <AssignmentIcon sx={{ color: 'primary.main', fontSize: 36, mr: 1 }} />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
              gutterBottom
            >
              Mis Pedidos
            </Typography>
          </Box>

          {/* Lista de pedidos */}
          {orders.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {orders.map(order => (
                <Paper
                  key={order.order_id}
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
                  {/* Banner estado pago (si aplica) */}
                  {renderPaymentStatusBanner(order)}

                  {/* Header de la orden */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {order.is_payment_order ? 'Orden de Pago' : 'Pedido'} {formatOrderNumber(order.order_id)}
                      </Typography>
                      <Typography variant="h6" color="primary.main" fontWeight="bold">
                        {formatCurrency(order.total_amount)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de compra: {formatDate(order.created_at)}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Subtarjetas de productos */}
                  <Stack spacing={2}>
                    {order.items.map((item, index) => {
                      // Para payment orders aún no convertidos, mostramos solo estado de pago
                      const productStatus = order.is_payment_order ? 'pending' : getProductStatus(item, order.created_at, order.status);
                      const statusChips = getStatusChips(productStatus);
                      
                      return (
                        <Paper
                          key={item.cart_items_id}
                          sx={{
                            p: 2,
                            backgroundColor: 'grey.50',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Imagen del producto */}
                            <CheckoutSummaryImage
                              product={item.product}
                              width={40}
                              height={40}
                              sx={{
                                borderRadius: '50%',
                                flexShrink: 0
                              }}
                            />
                            
                            {/* Información del producto */}
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" fontWeight="medium" gutterBottom>
                                {item.product.name}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Proveedor: {item.product?.supplier?.name || item.product?.proveedor || 'Proveedor desconocido'}
                                </Typography>
                                {(item.product?.supplier?.verified || item.product?.verified || item.product?.supplierVerified) && (
                                  <VerifiedIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                )}
                              </Box>
                              <Typography variant="body1" fontWeight="medium" color="primary.main">
                                {item.quantity} × {formatCurrency(item.price_at_addition)} = {formatCurrency(item.quantity * item.price_at_addition)}
                              </Typography>
                            </Box>
                            
                            {/* Chips de estado */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 120 }}>
                                {order.is_payment_order ? (
                                  <Tooltip title={`Estado de pago: ${order.payment_status}`} arrow>
                                    <Chip
                                      label={order.payment_status === 'pending' ? 'Procesando Pago' : order.payment_status === 'paid' ? 'Pago Confirmado' : 'Error Pago'}
                                      color={order.payment_status === 'pending' ? 'warning' : order.payment_status === 'paid' ? 'success' : 'error'}
                                      variant='filled'
                                      size='small'
                                      sx={{ fontSize: '0.70rem' }}
                                    />
                                  </Tooltip>
                                ) : (
                                  statusChips.map((chip) => (
                                    <Chip
                                      key={chip.label}
                                      label={chip.label}
                                      color={chip.color}
                                      variant={chip.active ? 'filled' : 'outlined'}
                                      size="small"
                                      sx={{ 
                                        fontSize: '0.75rem',
                                        opacity: chip.active ? 1 : 0.5 
                                      }}
                                    />
                                  ))
                                )}
                              </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              ))}
            </Box>
          ) : (
            // Estado vacío
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
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default BuyerOrders;
