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
import { ThemeProvider, useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore';
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing';
import { useBuyerOrders } from '../hooks/useBuyerOrders';
import { createSignedInvoiceUrl } from '../../../../services/storage/invoiceStorageService'; // legacy fallback
import { CheckoutSummaryImage } from '../../../../components/UniversalProductImage';
// Unificar formateo de fechas con TableRows (usa marketplace/pages/utils/formatters)
import { formatDate as formatDateUnified } from '../../../../domains/marketplace/pages/utils/formatters';
import ContactModal from '../../../../shared/components/modals/ContactModal';
import BuyerOrdersSkeleton from '../../../../shared/components/display/skeletons/BuyerOrdersSkeleton';

const BuyerOrders = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
  formatDate: formatDateHook,
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

  // Contact modal state (abre desde varios lugares, aquí para el buyer orders)
  const [openContactModal, setOpenContactModal] = React.useState(false);
  const openContact = React.useCallback(() => setOpenContactModal(true), []);
  const closeContact = React.useCallback(() => setOpenContactModal(false), []);

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

  // DEBUG DIAGNOSTICS disabled for production
  const DEBUG_BUYER_ORDERS_UI = false;

  // ============================================================================
  // RENDERIZADO CONDICIONAL
  // ============================================================================
  
  // Mostrar loading: usar skeletons inteligentes en lugar de spinner
  if (loading) {
    return (
      <ThemeProvider theme={dashboardThemeCore}>
        <Box
          sx={{
            backgroundColor: 'background.default',
            minHeight: '100vh',
            pt: { xs: 4.5, md: 5 },
            ml: { xs: 0, md: 10, lg: 14, xl: 24 },
            px: { xs: 0, md: 3 },
            pb: SPACING_BOTTOM_MAIN,
          }}
        >
          <Container maxWidth={isMobile ? false : "xl"} disableGutters={isMobile ? true : false}>
            {/* Header: siempre visible, fuera del skeleton */}
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

            {/* Lista placeholder */}
            <BuyerOrdersSkeleton rows={3} />
          </Container>
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
            px: { xs: 0, md: 3 },
            pb: SPACING_BOTTOM_MAIN,
          }}
        >
          <Container maxWidth={isMobile ? false : "xl"} disableGutters={isMobile ? true : false}>
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
    // � FIX: Verificar cancelled_at además de status para determinar cancelación real
  const isPaymentExpired = paymentStatus === 'expired';
  // Do not treat a payment expiration alone as a rejected/cancelled order for UI chips.
  // If payment expired, avoid marking cancelled/rejected chips as active.
  const isCancelled = (status === 'cancelled' || (order && order.cancelled_at)) && !isPaymentExpired;
  const isRejected = (status === 'rejected' && !isPaymentExpired) || isCancelled;
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
        // 🔧 IMPROVEMENT: Si ya hemos avanzado más allá del pago, mostrar como completado
        color: (activeKey === 'pago') 
          ? (paymentStatus === 'paid' ? 'success' : paymentStatus === 'expired' ? 'error' : 'warning')
          : (paymentStatus === 'paid' && ['aceptado', 'en_transito', 'entregado'].includes(activeKey)) 
            ? 'success' : 'default',
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
          px: { xs: 0, md: 3 },
          pb: SPACING_BOTTOM_MAIN,
        }}
      >
        <Container maxWidth={isMobile ? false : "xl"} disableGutters={isMobile ? true : false}>
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
        p: { xs: 1.5, md: 3 },
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
                        {/* Mensaje de contacto junto al número de pedido */}
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            ¿Tienes algún problema con tu pedido? No dudes en
                          <Button
                            variant="text"
                            size="small"
                            onClick={openContact}
                            sx={{
                              color: 'primary.main',
                              textTransform: 'none',
                              fontWeight: 600,
                              p: 0,
                              minWidth: 'auto',
                              ml: 0.5,
                            }}
                          >
                            Contactarnos
                          </Button>
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
                      Fecha de compra: {formatDateUnified(order.created_at)}
                    </Typography>

                    {/* Fecha estimada de entrega (ETA): mostrar solo si status in_transit o delivered */}
                    {order.estimated_delivery_date && (order.status === 'in_transit' || order.status === 'delivered') && (
                      <Typography variant="body2" color="text.secondary">
                        {(() => {
                          let eta = order.estimated_delivery_date;
                          let formatted;
                          try {
                            if (eta) {
                              const d = new Date(eta);
                              // Forzar fecha en UTC y formato '23 de agosto de 2025'
                                formatted = d.toLocaleDateString('es-CL', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' });
                            }
                          } catch(_) {
                            formatted = formatDateUnified(eta);
                          }
                          if (!formatted) formatted = formatDateUnified(eta);
                          return `Entrega estimada: ${formatted}`;
                        })()}
                      </Typography>
                    )}

                    {order.status === 'delivered' && (order.delivered_at || order.deliveredAt || order.delivered) && (
                      <Typography variant="body2" color="text.secondary">
                        Pedido entregado con fecha: {formatDateUnified(order.delivered_at || order.deliveredAt || order.delivered)}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* =============================================
                      DOCUMENTOS TRIBUTARIOS (DEDUPED POR SUPPLIER)
                     ============================================= */}
                  {(() => {
                    // Construir un mapa supplier -> invoice (1 por supplier)
                    const supplierInvoiceMap = {};
                    (order.items || []).forEach(it => {
                      const invoicePath = it.invoice_path || it.invoice || null; // prefer invoice_path enriched
                      if (!invoicePath) return;
                      const supplierId = it.product?.supplier?.id || it.product?.supplier_id || it.supplier_id || it.product?.supplierId || 'unknown';
                      if (!supplierInvoiceMap[supplierId]) {
                        const rawDt = (it.document_type || it.documentType || '').toLowerCase();
                        const documentType = rawDt === 'factura' || rawDt === 'boleta' ? rawDt : 'documento';
                        supplierInvoiceMap[supplierId] = {
                          supplierName: it.product?.supplier?.name || it.supplier_name || it.product?.proveedor || 'Proveedor',
                          invoicePath,
                          documentType
                        };
                      }
                    });
                    const invoices = Object.values(supplierInvoiceMap);
                    if (!invoices.length) return null;
                    return (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          Documentos Tributarios
                        </Typography>
                        <Stack spacing={1}>
                          {invoices.map(inv => (
                            <InvoiceDownload
                              key={inv.invoicePath}
                              invoicePath={inv.invoicePath}
                              documentType={inv.documentType}
                              orderId={order.order_id}
                            />
                          ))}
                        </Stack>
                      </Box>
                    );
                  })()}

                  {/* Subtarjetas de productos */}
                  <Stack spacing={2}>
                    {order.items.map((item, index) => {
                      // Para partes de proveedor (supplier part) usamos su propio status parcial
                      const productStatus = order.is_supplier_part
                        ? order.status // ya viene overlay aplicado en hook
                        : (order.is_payment_order ? order.status : getProductStatus(item, order.created_at, order.status));
                      const statusChips = getStatusChips(productStatus, order.payment_status, order);
                      if (DEBUG_BUYER_ORDERS_UI) {
                        try {
                          console.log('[BuyerOrders][DEBUG] item render', {
                            order_id: order.order_id,
                            supplier_id: order.supplier_id,
                            product_id: item.product_id || item.id,
                            computed_status: productStatus,
                            payment_status: order.payment_status,
                            chip_active: statusChips.find(c=>c.active)?.key,
                            chip_labels: statusChips.map(c=>`${c.key}:${c.active?'ON':'off'}`)
                          });
                        } catch(_) {}
                      }
                      
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
                              width={70}
                              height={70}
                              sx={{
                                borderRadius: '50%',
                                flexShrink: 0
                              }}
                            />
                            
                            {/* Información del producto */}
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {/* Compact group: product name + small chip immediately to its right */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
                                  <Typography
                                    variant="h6"
                                    fontWeight="medium"
                                    sx={{
                                      mb: 0,
                                      whiteSpace: 'normal',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '40ch'
                                    }}
                                  >
                                    {item.product.name}
                                  </Typography>
                                  {(() => {
                                    const isOffered = item.isOffered || item.metadata?.isOffered || !!item.offer_id || !!item.offered_price;
                                    if (!isOffered) return null;
                                    return (
                                      <Typography
                                        data-testid="chip-ofertado"
                                        variant="subtitle2"
                                        sx={{
                                          color: 'success.main',
                                          fontWeight: 800,
                                          fontSize: '0.75rem',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          px: 1,
                                          py: '3px',
                                          borderRadius: '6px',
                                          border: '1px solid',
                                          borderColor: 'success.main',
                                          bgcolor: 'rgba(76, 175, 80, 0.06)'
                                        }}
                                      >
                                        OFERTADO
                                      </Typography>
                                    );
                                  })()}
                                </Box>
                              </Box>
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
                                  <Typography variant="body1" fontWeight="medium" color="#000000fa">
                                    {item.quantity} uds a {formatCurrency(unit)} c/u = {formatCurrency(lineTotal)}
                                  </Typography>
                                );
                              })()}
                              {/* Documento tributario seleccionado */}
                              {(() => {
                                const dt = (item.document_type || item.documentType || '').toLowerCase();
                                const norm = dt === 'boleta' || dt === 'factura' ? dt : 'ninguno';
                                // invoice_path ahora proviene del enrichment de invoices_meta (hook useBuyerOrders)
                                // Ya no mostramos botón por ítem: se agrupa por supplier a nivel de la orden (dedupe)
                                const hasInvoice = !!(item.invoice_path || item.invoice);

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
                                      {order.status === 'accepted' && !hasInvoice && (norm === 'boleta' || norm === 'factura') && (
                                        <Typography variant="caption" color="text.secondary">
                                          El proveedor aún no ha subido tu {norm === 'boleta' ? 'Boleta' : 'Factura'}.
                                        </Typography>
                                      )}
                                      {/* Texto extra al tener factura deduplicada removido por solicitud del usuario */}
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
                                  // 🔧 FIX: No mostrar highlight en chip de pago si ya avanzamos a un status superior
                                  const hasAdvancedStatus = ['accepted', 'in_transit', 'delivered'].includes(order.status);
                                  const highlight = isPagoChip && order.payment_status === 'paid' && recentlyPaid.has(order.order_id) && !hasAdvancedStatus;
                                  
                                  // ✨ GLOW EFFECT: Agregar glow a todos los chips activos con colores específicos
                                  const getGlowColor = (chipKey, chipColor) => {
                                    const glowColors = {
                                      'pago': 'rgba(76,175,80,0.6)', // Verde para pago
                                      'aceptado': 'rgba(33,150,243,0.6)', // Azul para aceptado
                                      'en_transito': 'rgba(156,39,176,0.6)', // Púrpura para en tránsito
                                      'entregado': 'rgba(76,175,80,0.6)', // Verde para entregado
                                      'rechazado': 'rgba(244,67,54,0.6)' // Rojo para rechazado
                                    };
                                    return glowColors[chipKey] || 'rgba(158,158,158,0.6)'; // Gris por defecto
                                  };
                                  
                                  const shouldGlow = highlight || (chip.active && chip.key !== 'pago');
                                  const glowColor = getGlowColor(chip.key, chip.color);
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
                                          ...(shouldGlow ? {
                                            position: 'relative',
                                            boxShadow: `0 0 0 0 ${glowColor}`,
                                            animation: `pulse${chip.key} 1.5s ease-in-out infinite`,
                                            [`@keyframes pulse${chip.key}`]: {
                                              '0%': { 
                                                boxShadow: `0 0 0 0 ${glowColor}`,
                                                transform: 'scale(1)'
                                              },
                                              '50%': { 
                                                boxShadow: `0 0 0 8px ${glowColor.replace('0.6', '0')}`,
                                                transform: 'scale(1.02)'
                                              },
                                              '100%': { 
                                                boxShadow: `0 0 0 0 ${glowColor.replace('0.6', '0')}`,
                                                transform: 'scale(1)'
                                              }
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
      
  {/* Contact modal global para esta página */}
  <ContactModal open={openContactModal} onClose={closeContact} />
            </Box>
              {/* Paginación inferior */}
              {Pagination}
            </>
          ) : (
            // Estado vacío
            <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
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
      // QUICK WIN: usar edge function segura para validar ownership antes de generar URL
      const token = localStorage.getItem('sb:token') || localStorage.getItem('access_token') || localStorage.getItem('sb-access-token');
      const endpoint = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/get-invoice-url`;
  let signedUrl = null;
      try {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ path: invoicePath })
        });
        if (resp.ok) {
          const json = await resp.json();
            signedUrl = json.url || null;
        } else {
          // Fallback a método antiguo sólo si 404/403 para no romper UX (se puede retirar luego)
          if (resp.status === 404 || resp.status === 403) {
            // no fallback para seguridad estricta; mostrar error
            const errJson = await resp.json().catch(()=>({}));
            alert(errJson.error || 'No autorizado para descargar esta factura.');
            return;
          } else {
            // fallback legacy
            const legacy = await createSignedInvoiceUrl(invoicePath, 60);
            signedUrl = legacy?.data?.signedUrl || null;
          }
        }
      } catch (edgeErr) {
        // fallback legacy en caso de fallo de red a función
        try {
          const legacy = await createSignedInvoiceUrl(invoicePath, 60);
          signedUrl = legacy?.data?.signedUrl || null;
        } catch (_) {}
      }
      if (!signedUrl) {
        alert('No se pudo generar la URL de descarga. Intenta más tarde.');
        return;
      }
      recordDownload();
      // Intento 1: descarga directa creando un blob
      try {
        const resp = await fetch(signedUrl);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        // Derivar nombre de archivo desde el path original
        const filename = (invoicePath.split('/')?.pop() || 'factura.pdf').replace(/\?.*$/, '');
        a.href = url;
        a.download = filename.endsWith('.pdf') ? filename : filename + '.pdf';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 250);
      } catch (e) {
        // Fallback: abrir en nueva pestaña para que el navegador gestione la vista previa
        window.open(signedUrl, '_blank');
      }
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
        Tu {documentType === 'boleta' ? 'Boleta' : documentType === 'factura' ? 'Factura' : ''} está lista para ser descargada.
      </Typography>
      <Button
        size="small"
        variant="text"
        onClick={handleDownload}
        disabled={loading}
        sx={{
          border: 'none',
          boxShadow: 'none',
          textTransform: 'none',
          color: 'primary.main',
          p: 0,
          minWidth: 'auto',
          '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
        }}
      >
        {loading ? 'Generando...' : 'Descargar'}
      </Button>
    </Box>
  );
};
