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
  Tooltip,
  Button
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VerifiedIcon from '@mui/icons-material/Verified';
import { ThemeProvider } from '@mui/material/styles';
import { dashboardThemeCore } from '../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../styles/layoutSpacing';
import { useBuyerOrders } from '../hooks';
import { createSignedInvoiceUrl } from '../../../services/storage/invoiceStorageService';
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
  // RESALTAR TRANSICIÓN A PAGO CONFIRMADO (realtime)
  // ============================================================================
  const [recentlyPaid, setRecentlyPaid] = React.useState(new Set()); // order_id set
  const prevPaidRef = React.useRef(new Set());
  React.useEffect(() => {
    const nextPrev = new Set(prevPaidRef.current);
    (orders || []).forEach(o => {
      if (o.payment_status === 'paid' && !prevPaidRef.current.has(o.order_id)) {
        // Nuevo pago confirmado: agregar a highlight set
        setRecentlyPaid(prev => {
          const clone = new Set(prev);
          clone.add(o.order_id);
          return clone;
        });
        // Remover highlight tras 12s
        setTimeout(() => {
          setRecentlyPaid(prev => {
            if (!prev.has(o.order_id)) return prev;
            const clone = new Set(prev); clone.delete(o.order_id); return clone;
          });
        }, 12000);
      }
      if (o.payment_status === 'paid') nextPrev.add(o.order_id);
    });
    prevPaidRef.current = nextPrev;
  }, [orders]);

  // Mark related notifications as read on mount
  const { markContext } = (typeof useNotificationsContext === 'function' ? require('../../notifications/components/NotificationProvider') : { useNotificationsContext: null }).useNotificationsContext?.() || {};
  React.useEffect(() => {
    try { markContext && markContext('buyer_orders'); } catch(_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // PAGINACIÓN (5 órdenes por página)
  // ============================================================================
  const ORDERS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil((orders?.length || 0) / ORDERS_PER_PAGE));
  }, [orders]);

  // Asegura que currentPage esté dentro de rango cuando cambian las órdenes
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const handlePageChange = React.useCallback((page) => {
    const safePage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(safePage);
    // Scroll suave al inicio para que el usuario vea desde arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [totalPages]);

  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const visibleOrders = React.useMemo(() => {
    return (orders || []).slice(startIndex, endIndex);
  }, [orders, startIndex, endIndex]);

  const Pagination = React.useMemo(() => {
    if (!orders || orders.length <= ORDERS_PER_PAGE) return null;

    const showPages = 5; // similar a Marketplace
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);
    if (endPage - startPage < showPages - 1) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 1,
          py: 2,
          flexWrap: 'wrap'
        }}
      >
        <Button
          variant="outlined"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          sx={{ minWidth: 'auto', px: 2, fontSize: '0.875rem' }}
        >
          ‹ Anterior
        </Button>

        {startPage > 1 && (
          <>
            <Button
              variant={1 === currentPage ? 'contained' : 'outlined'}
              onClick={() => handlePageChange(1)}
              sx={{ minWidth: 40 }}
            >
              1
            </Button>
            {startPage > 2 && <Typography variant="body2">...</Typography>}
          </>
        )}

        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? 'contained' : 'outlined'}
            onClick={() => handlePageChange(page)}
            sx={{ minWidth: 40, fontSize: '0.875rem' }}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <Typography variant="body2">...</Typography>
            )}
            <Button
              variant={totalPages === currentPage ? 'contained' : 'outlined'}
              onClick={() => handlePageChange(totalPages)}
              sx={{ minWidth: 40 }}
            >
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outlined"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          sx={{ minWidth: 'auto', px: 2, fontSize: '0.875rem' }}
        >
          Siguiente ›
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          Página {currentPage} de {totalPages}
        </Typography>
      </Box>
    );
  }, [orders, ORDERS_PER_PAGE, currentPage, totalPages, handlePageChange]);

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
  
  // ✅ NUEVO: Función para unificar campos de envío
  const getShippingAmount = (order) => {
    const shippingValue = order?.shipping_amount ?? order?.shipping ?? order?.total_shipping ?? order?.shipping_cost ?? 0;
    const parsed = Number(shippingValue);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  
  // Función para generar número de orden desde cart_id
  const formatOrderNumber = (cartId) => {
    if (!cartId) return 'N/A';
    return `#${cartId.slice(-8).toUpperCase()}`;
  };

  // Estado de producto basado exclusivamente en el estado del pedido (fuente de verdad backend)
  const getProductStatus = (_item, _orderDate, orderStatus) => {
    if (orderStatus === 'cancelled') return 'rejected'; // unificamos cancelado como rechazado para el primer chip
    const allowed = ['pending', 'accepted', 'rejected', 'in_transit', 'delivered'];
    return allowed.includes(orderStatus) ? orderStatus : 'pending';
  };

  // Función para obtener los chips de estado (4 etapas incluyendo Pago Confirmado)
  const getStatusChips = (status, paymentStatus, order = null) => {
    // 🔧 FIX: Verificar cancelled_at además de status para determinar cancelación real
    const isCancelled = status === 'cancelled' || (order && order.cancelled_at);
    const isRejected = status === 'rejected' || isCancelled;
    if (isRejected) {
      // Determinar label y color del chip de pago según payment_status
      const getPaymentChipInfo = (paymentStatus) => {
        switch (paymentStatus) {
          case 'paid':
            return {
              label: 'Pago Confirmado',
              color: 'success',
              tooltip: 'Pago confirmado.'
            };
          case 'expired':
            return {
              label: 'Pago Expirado',
              color: 'error',
              tooltip: 'El tiempo para completar el pago se agotó (20 minutos).'
            };
          case 'pending':
          default:
            return {
              label: 'Procesando Pago',
              color: 'warning',
              tooltip: 'Pago en proceso.'
            };
        }
      };

      const paymentInfo = getPaymentChipInfo(paymentStatus);
      return [
        // Un único chip de pago que evoluciona según payment_status
        {
          key: 'pago',
          label: paymentInfo.label,
          active: paymentStatus === 'paid' || paymentStatus === 'pending' || paymentStatus === 'expired',
          color: paymentInfo.color,
          tooltip: paymentInfo.tooltip
        },
        { key: 'rechazado', label: isCancelled ? 'Cancelado' : 'Rechazado', active: true, color: 'error', tooltip: isCancelled ? 'Tu pedido fue cancelado.' : 'Tu pedido fue rechazado por el proveedor.' },
        { key: 'en_transito', label: 'En Transito', active: false, color: 'default', tooltip: 'Pendiente de despacho por el proveedor.' },
        { key: 'entregado', label: 'Entregado', active: false, color: 'default', tooltip: 'Aún no se ha entregado.' }
      ];
    }

    // Determinar clave activa única
    let activeKey = null;
    // 🔧 FIX: Si hay cancelled_at, la orden está cancelada independientemente del status
    if (order && order.cancelled_at) {
      activeKey = 'rechazado'; // Mostrar como cancelado
    } else if (status === 'delivered') {
      activeKey = 'entregado';
    } else if (status === 'in_transit') {
      activeKey = 'en_transito';
    } else if (status === 'accepted') {
      activeKey = 'aceptado';
    } else if (status === 'rejected') {
      activeKey = 'rechazado';
    } else if (paymentStatus === 'paid' || paymentStatus === 'pending' || paymentStatus === 'expired') {
      activeKey = 'pago';
    }

    const chips = [
      // Un único chip de pago. La etiqueta y el estilo se deciden por el estado de pago.
      {
        key: 'pago',
        label: paymentStatus === 'paid' 
          ? 'Pago Confirmado' 
          : paymentStatus === 'expired' 
            ? 'Pago Expirado' 
            : 'Procesando Pago',
        active: activeKey === 'pago',
        color: paymentStatus === 'paid' 
          ? 'success' 
          : paymentStatus === 'expired' 
            ? 'error' 
            : 'warning',
        tooltip: paymentStatus === 'paid'
          ? 'Pago confirmado. La orden quedará pendiente de aceptación por el proveedor.'
          : paymentStatus === 'expired'
            ? 'El tiempo para completar el pago se agotó (20 minutos).'
            : 'Estamos verificando tu pago.'
      },
      {
        key: 'aceptado',
        label: 'Pedido Aceptado',
        active: activeKey === 'aceptado',
        color: 'info',
        tooltip: activeKey === 'aceptado'
          ? 'El proveedor aceptó tu pedido.'
          : 'En espera de aceptación por el proveedor.'
      },
      {
        key: 'en_transito',
        label: 'En Transito',
        active: activeKey === 'en_transito',
        color: 'secondary',
        tooltip: activeKey === 'en_transito'
          ? 'El pedido fue despachado y está en camino.'
          : 'Pendiente de despacho por el proveedor.'
      },
      {
        key: 'entregado',
        label: 'Entregado',
        active: activeKey === 'entregado',
        color: 'success',
        tooltip: activeKey === 'entregado'
          ? 'El pedido fue entregado.'
          : 'Aún no se ha entregado.'
      }
    ];
    return chips;
  };

  // Render especial para órdenes de pago (tabla orders) con payment_status
  // Banner eliminado: estados integrados en chips
  const renderPaymentStatusBanner = () => null;
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
            <>
              {/* Paginación superior */}
              {Pagination}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {visibleOrders.map(order => (
                <Paper
          key={order.synthetic_id || order.order_id}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                          Pedido {formatOrderNumber(order.parent_order_id || order.order_id)}
                        </Typography>
                        {(order.is_virtual_split || order.is_supplier_part) && (
                          <Chip size="small" color="primary" label={order.supplier_name ? `Proveedor: ${order.supplier_name}` : 'Parte de Pedido'} />
                        )}
                      </Box>
            {order.parent_order_id && order.parent_order_id !== order.order_id && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
              Orden de Pago {formatOrderNumber(order.parent_order_id)}
                        </Typography>
                      )}
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" color="primary.main" fontWeight="bold">
                          {formatCurrency(
                            order.final_amount || (order.total_amount + getShippingAmount(order)) || order.total_amount
                          )}{order.is_virtual_split ? ' (Subtotal)' : ''}
                        </Typography>
                        { getShippingAmount(order) > 0 ? (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Incluye envío: {formatCurrency(getShippingAmount(order))}
                          </Typography>
                        ) : null }
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de compra: {formatDate(order.created_at)}
                    </Typography>

                    {/* Fecha estimada / fecha de entrega real */}
                    {order.estimated_delivery_date && (
                      <Typography variant="body2" color="text.secondary">
                        {order.status === 'accepted' ? 'Fecha estimada prevista:' : 'Fecha estimada de entrega:'} {formatDate(order.estimated_delivery_date)}
                      </Typography>
                    )}

                    {order.status === 'delivered' && (order.delivered_at || order.deliveredAt || order.delivered) && (
                      <Typography variant="body2" color="text.secondary">
                        Pedido entregado con fecha: {formatDate(order.delivered_at || order.deliveredAt || order.delivered)}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Subtarjetas de productos */}
                  <Stack spacing={2}>
                    {order.items.map((item, index) => {
                      // Para partes de proveedor (supplier part) usamos su propio status parcial
                      const productStatus = order.is_supplier_part
                        ? order.status
                        : (order.is_payment_order ? 'pending' : getProductStatus(item, order.created_at, order.status));
                      const statusChips = getStatusChips(productStatus, order.payment_status, order);
                      
                      // Crear key única y robusta combinando múltiples identificadores
                      const itemKey = item.cart_items_id || 
                                    `${order.order_id || order.synthetic_id}-${item.product_id || 'no-product'}-${index}`;
                      
                      return (
                        <Paper
                          key={itemKey}
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
                              {(() => {
                                const unit = (typeof item.price_at_addition === 'number' && Number.isFinite(item.price_at_addition))
                                  ? item.price_at_addition
                                  : (typeof item.product?.price === 'number' && Number.isFinite(item.product.price))
                                    ? item.product.price
                                    : 0;
                                const lineTotal = unit * (item.quantity || 0);
                                return (
                                  <Typography variant="body1" fontWeight="medium" color="primary.main">
                                    {item.quantity} × {formatCurrency(unit)} = {formatCurrency(lineTotal)}
                                  </Typography>
                                );
                              })()}
                              {/* Documento tributario seleccionado */}
                              {(() => {
                                const dt = (item.document_type || item.documentType || '').toLowerCase();
                                const norm = dt === 'boleta' || dt === 'factura' ? dt : 'ninguno';
                                const invoicePath = item.tax_document_path || item.invoice_path || item.invoice || null;

                                return (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Chip
                                      size="small"
                                      label={norm === 'boleta' ? 'Boleta' : norm === 'factura' ? 'Factura' : 'Sin Documento Tributario'}
                                      color={norm === 'factura' ? 'info' : norm === 'boleta' ? 'success' : 'default'}
                                      sx={{ fontSize: '0.65rem' }}
                                    />
                                    {/* Mensaje y botón condicionales */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      {order.status === 'accepted' && !invoicePath && (norm === 'boleta' || norm === 'factura') && (
                                        <Typography variant="caption" color="text.secondary">
                                          Aquí podrás descargar tu {norm === 'boleta' ? 'Boleta' : 'Factura'} una vez el proveedor la cargue al sistema.
                                        </Typography>
                                      )}

                                      {invoicePath && (
                                        <InvoiceDownload
                                          invoicePath={invoicePath}
                                          documentType={norm}
                                          orderId={order.order_id}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                );
                              })()}
                            </Box>
                            
                            {/* Chips de estado (incluye Pago Confirmado) */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 140 }}>
                              {getStatusChips(productStatus, order.payment_status, order).map((chip, chipIndex) => {
                                  // Determine whether each stage was reached historically
                                  const pagoConfirmadoReached = order.payment_status === 'paid' || ['accepted', 'in_transit', 'delivered'].includes(order.status);
                                  const aceptadoReached = ['accepted', 'in_transit', 'delivered'].includes(order.status) && !order.cancelled_at;
                                  const enTransitoReached = ['in_transit', 'delivered'].includes(order.status) && !order.cancelled_at;
                                  const entregadoReached = order.status === 'delivered' && !order.cancelled_at;
                                  const rechazadoReached = ['rejected', 'cancelled'].includes(order.status) || order.cancelled_at;

                                  let computedTooltip = chip.tooltip || '';
                                  if (chip.key === 'pago') {
                                    if (order.payment_status === 'paid') {
                                      computedTooltip = 'Pago confirmado. La orden quedará pendiente de aceptación por el proveedor.';
                                    } else if (order.payment_status === 'expired') {
                                      computedTooltip = 'El tiempo para completar el pago se agotó (20 minutos).';
                                    } else {
                                      computedTooltip = 'Pago aún no confirmado.';
                                    }
                                  } else if (chip.key === 'aceptado') {
                                    computedTooltip = aceptadoReached
                                      ? 'El proveedor aceptó tu pedido.'
                                      : 'En espera de aceptación por el proveedor.';
                                  } else if (chip.key === 'en_transito') {
                                    computedTooltip = enTransitoReached
                                      ? 'El pedido fue despachado y está en camino.'
                                      : 'Pendiente de despacho por el proveedor.';
                                  } else if (chip.key === 'entregado') {
                                    computedTooltip = entregadoReached
                                      ? 'El pedido fue entregado.'
                                      : 'Aún no se ha entregado.';
                                  } else if (chip.key === 'rechazado') {
                                    computedTooltip = rechazadoReached
                                      ? (order.cancelled_at ? 'Tu pedido fue cancelado.' : 'Tu pedido fue rechazado por el proveedor.')
                                      : 'Pedido no rechazado.';
                                  }

                                  const isPagoChip = chip.key === 'pago';
                                  const highlight = isPagoChip && order.payment_status === 'paid' && recentlyPaid.has(order.order_id);
                                  return (
                                    <Tooltip key={chip.key} title={computedTooltip} arrow placement="left">
                                      <Chip
                                        label={chip.label}
                                        color={chip.active || highlight ? (chip.color || 'default') : 'default'}
                                        variant={(chip.active || highlight) ? 'filled' : 'outlined'}
                                        size="small"
                                        sx={{
                                          fontSize: '0.70rem',
                                          opacity: (chip.active || highlight) ? 1 : 0.45,
                                          ...(highlight ? {
                                            position: 'relative',
                                            boxShadow: theme => `0 0 0 0 rgba(76,175,80,0.6)`,
                                            animation: 'pulsePaid 1.2s ease-in-out 4',
                                            '@keyframes pulsePaid': {
                                              '0%': { boxShadow: '0 0 0 0 rgba(76,175,80,0.6)' },
                                              '70%': { boxShadow: '0 0 0 12px rgba(76,175,80,0)' },
                                              '100%': { boxShadow: '0 0 0 0 rgba(76,175,80,0)' }
                                            }
                                          } : {})
                                        }}
                                      />
                                    </Tooltip>
                                  );
                                })}
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Stack>
                </Paper>
              ))}
            </Box>
              {/* Paginación inferior */}
              {Pagination}
            </>
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

// Helper component to download invoices with client-side throttling
const InvoiceDownload = ({ invoicePath, documentType = 'documento', orderId }) => {
  const [loading, setLoading] = React.useState(false);

  const DOWNLOAD_LIMIT_COUNT = 5; // max attempts
  const DOWNLOAD_WINDOW_MS = 60 * 1000; // per 60 seconds
  const storageKey = `invoice_downloads_${orderId}`;

  const canDownload = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return true;
      const arr = JSON.parse(raw);
      const now = Date.now();
      const recent = arr.filter(ts => now - ts < DOWNLOAD_WINDOW_MS);
      return recent.length < DOWNLOAD_LIMIT_COUNT;
    } catch (e) {
      return true;
    }
  };

  const recordDownload = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(Date.now());
      // Keep only last N to avoid growing forever
      const pruned = arr.slice(-DOWNLOAD_LIMIT_COUNT * 2);
      localStorage.setItem(storageKey, JSON.stringify(pruned));
    } catch (e) {
      // ignore
    }
  };

  const handleDownload = async () => {
    if (!canDownload()) {
      alert('Límite de descargas alcanzado. Intenta de nuevo en un momento.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await createSignedInvoiceUrl(invoicePath, 60);
      if (error || !data?.signedUrl) {
        alert('No se pudo generar la URL de descarga. Intenta más tarde.');
        return;
      }
      recordDownload();
      window.open(data.signedUrl, '_blank');
    } catch (e) {
      console.error('Error generando URL firmada:', e);
      alert('Error al generar descarga.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Tu Documento Tributario {documentType === 'boleta' ? '(Boleta)' : documentType === 'factura' ? '(Factura)' : ''} está listo para ser descargado.
      </Typography>
      <Button size="small" variant="outlined" onClick={handleDownload} disabled={loading}>
        {loading ? 'Generando...' : 'Descargar'}
      </Button>
    </Box>
  );
};
