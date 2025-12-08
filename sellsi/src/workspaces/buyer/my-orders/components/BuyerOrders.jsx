import React, { memo, useState } from 'react'
import toast from 'react-hot-toast'
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
  Button,
  IconButton,
} from '@mui/material'
import './BuyerOrders.css'
import AssignmentIcon from '@mui/icons-material/Assignment'
import VerifiedIcon from '@mui/icons-material/Verified'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore'
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing'
import { supabase } from '../../../../services/supabase'
import { useBuyerOrders } from '../hooks/useBuyerOrders'
import { CheckoutSummaryImage } from '../../../../components/UniversalProductImage'
// Unificar formateo de fechas con TableRows (usa workspaces/marketplace/utils/formatters)
import { formatDate as formatDateUnified } from '../../../../workspaces/marketplace'
import ContactModal from '../../../../shared/components/modals/ContactModal'
import ConfirmDialog from '../../../../shared/components/modals/ConfirmDialog'
import BuyerOrdersSkeleton from '../../../../shared/components/display/skeletons/BuyerOrdersSkeleton'
import InvoiceDownload from './InvoiceDownload'
import OrdersPagination from './OrdersPagination'
import { getStatusChips, normalizeOrderStatus } from '../utils/orderStatusUtils'

const BuyerOrders = memo(function BuyerOrders() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  // ============================================================================
  // AUTENTICACIÓN - Obtener buyer ID desde Supabase Auth
  // ============================================================================
  const [buyerId, setBuyerId] = React.useState(null)
  const [authResolved, setAuthResolved] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true

    const resolveBuyerId = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        const authUid = user?.id || null
        if (!isMounted) return
        setBuyerId(authUid)
        setAuthResolved(true)
      } catch (e) {
        console.error('[BuyerOrders] Error obteniendo usuario Supabase:', e)
        setBuyerId(null)
        setAuthResolved(true)
      }
    }

    resolveBuyerId()

    return () => {
      isMounted = false
    }
  }, [])

  // ============================================================================
  // ESTADO DEL COMPONENTE
  // ============================================================================

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Hook personalizado para manejar pedidos del comprador
  const {
    orders,
    loading,
    error,
    hideExpiredOrder,
    getProductImage,
    getStatusDisplayName,
    getStatusColor,
    formatDate: formatDateHook,
    formatCurrency,
  } = useBuyerOrders(buyerId)

  // ============================================================================
  // RESALTAR TRANSICIÓN A PAGO CONFIRMADO (realtime)
  // ============================================================================
  const [recentlyPaid, setRecentlyPaid] = React.useState(new Set()) // order_id set
  const prevPaidRef = React.useRef(new Set())
  React.useEffect(() => {
    const nextPrev = new Set(prevPaidRef.current)
    ;(orders || []).forEach((o) => {
      if (o.payment_status === 'paid' && !prevPaidRef.current.has(o.order_id)) {
        // Nuevo pago confirmado: agregar a highlight set
        setRecentlyPaid((prev) => {
          const clone = new Set(prev)
          clone.add(o.order_id)
          return clone
        })
        // Remover highlight tras 12s
        setTimeout(() => {
          setRecentlyPaid((prev) => {
            if (!prev.has(o.order_id)) return prev
            const clone = new Set(prev)
            clone.delete(o.order_id)
            return clone
          })
        }, 12000)
      }
      if (o.payment_status === 'paid') nextPrev.add(o.order_id)
    })
    prevPaidRef.current = nextPrev
  }, [orders])

  // Contact modal state (abre desde varios lugares, aquí para el buyer orders)
  const [openContactModal, setOpenContactModal] = React.useState(false)
  const openContact = React.useCallback(() => setOpenContactModal(true), [])
  const closeContact = React.useCallback(() => setOpenContactModal(false), [])

  // Mark related notifications as read on mount
  const { markContext } =
    (typeof useNotificationsContext === 'function'
      ? require('../../notifications/components/NotificationProvider')
      : { useNotificationsContext: null }
    ).useNotificationsContext?.() || {}
  React.useEffect(() => {
    try {
      markContext && markContext('buyer_orders')
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================================================
  // DELETE EXPIRED ORDER HANDLERS
  // ============================================================================
  const handleOpenDeleteDialog = React.useCallback((order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = React.useCallback(() => {
    setDeleteDialogOpen(false)
    setOrderToDelete(null)
  }, [])

  const handleConfirmDelete = React.useCallback(async () => {
    if (!orderToDelete) return

    setDeleteLoading(true)
    try {
      const orderId = orderToDelete.parent_order_id || orderToDelete.order_id
      const result = await hideExpiredOrder(orderId)

      if (result.success) {
        toast.success('Pedido eliminado correctamente')
      } else {
        console.error('[BuyerOrders] Failed to delete order:', result.error)
        toast.error('Error al eliminar el pedido')
      }
    } catch (err) {
      console.error('[BuyerOrders] Error deleting order:', err)
      toast.error('Error al eliminar el pedido')
    } finally {
      setDeleteLoading(false)
      handleCloseDeleteDialog()
    }
  }, [orderToDelete, hideExpiredOrder, handleCloseDeleteDialog])

  // ============================================================================
  // PAGINACIÓN (5 órdenes por página)
  // ============================================================================
  const ORDERS_PER_PAGE = 5
  const [currentPage, setCurrentPage] = React.useState(1)

  const totalPages = React.useMemo(() => {
    return Math.max(1, Math.ceil((orders?.length || 0) / ORDERS_PER_PAGE))
  }, [orders])

  // Asegura que currentPage esté dentro de rango cuando cambian las órdenes
  React.useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
    if (currentPage < 1) setCurrentPage(1)
  }, [currentPage, totalPages])

  const handlePageChange = React.useCallback(
    (page) => {
      const safePage = Math.min(Math.max(1, page), totalPages)
      setCurrentPage(safePage)
      // Scroll suave al inicio para que el usuario vea desde arriba
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [totalPages]
  )

  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
  const endIndex = startIndex + ORDERS_PER_PAGE
  const visibleOrders = React.useMemo(() => {
    return (orders || []).slice(startIndex, endIndex)
  }, [orders, startIndex, endIndex])

  // DEBUG DIAGNOSTICS disabled for production
  const DEBUG_BUYER_ORDERS_UI = false

  // ============================================================================
  // RENDERIZADO CONDICIONAL
  // ============================================================================

  // Mostrar loading mientras se resuelve autenticación o se cargan órdenes
  if (!authResolved || loading) {
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
          <Container
            maxWidth={isMobile ? false : 'xl'}
            disableGutters={isMobile ? true : false}
          >
            {/* Header: siempre visible, fuera del skeleton */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <AssignmentIcon
                sx={{ color: 'primary.main', fontSize: 36, mr: 1 }}
              />
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
    )
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
          <Container
            maxWidth={isMobile ? false : 'xl'}
            disableGutters={isMobile ? true : false}
          >
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          </Container>
        </Box>
      </ThemeProvider>
    )
  }

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  // ✅ NUEVO: Función para unificar campos de envío
  const getShippingAmount = (order) => {
    const shippingValue =
      order?.shipping_amount ??
      order?.shipping ??
      order?.total_shipping ??
      order?.shipping_cost ??
      0
    const parsed = Number(shippingValue)
    return Number.isFinite(parsed) ? parsed : 0
  }

  // Función para generar número de orden desde cart_id
  const formatOrderNumber = (cartId) => {
    if (!cartId) return 'N/A'
    return `#${cartId.slice(-8).toUpperCase()}`
  }

  // Estado de producto basado exclusivamente en el estado del pedido (fuente de verdad backend)
  const getProductStatus = (_item, _orderDate, orderStatus) => {
    if (orderStatus === 'cancelled') return 'rejected' // unificamos cancelado como rechazado para el primer chip
    return normalizeOrderStatus(orderStatus)
  }

  // Render especial para órdenes de pago (tabla orders) con payment_status
  // Banner eliminado: estados integrados en chips
  const renderPaymentStatusBanner = () => null
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
        <Container
          maxWidth={isMobile ? false : 'xl'}
          disableGutters={isMobile ? true : false}
        >
          {/* Título de la página */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 4 } }}
          >
            <AssignmentIcon
              sx={{
                color: 'primary.main',
                fontSize: { xs: 28, md: 36 },
                mr: 1,
              }}
            />
            <Typography
              variant="h4"
              fontWeight={600}
              color="primary.main"
              gutterBottom
              sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' }, mb: 0 }}
            >
              Mis Pedidos
            </Typography>
          </Box>

          {/* Lista de pedidos */}
          {orders.length > 0 ? (
            <>
              {/* Paginación superior */}
              <OrdersPagination
                totalItems={orders?.length || 0}
                itemsPerPage={ORDERS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {visibleOrders.map((order) => (
                  <Paper
                    key={order.synthetic_id || order.order_id}
                    sx={{
                      p: { xs: 1.5, md: 3 },
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: { xs: '2px solid #0000008a', md: 'none' },
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
                    {/* MOBILE HEADER */}
                    <Box sx={{ mb: 2, display: { xs: 'block', md: 'none' } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            Pedido{' '}
                            {formatOrderNumber(
                              order.parent_order_id || order.order_id
                            )}
                          </Typography>
                          {order.parent_order_id &&
                            order.parent_order_id !== order.order_id && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                              >
                                Orden de Pago{' '}
                                {formatOrderNumber(order.parent_order_id)}
                              </Typography>
                            )}
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Fecha de compra:{' '}
                            {formatDateUnified(order.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          mb: 2,
                          flexWrap: 'wrap',
                        }}
                      >
                        {(order.is_virtual_split || order.is_supplier_part) && (
                          <Chip
                            size="small"
                            color="primary"
                            label={
                              order.supplier_name
                                ? `Proveedor: ${order.supplier_name}`
                                : 'Parte de Pedido'
                            }
                            sx={{ fontSize: '0.75rem' }}
                          />
                        )}
                        {order.estimated_delivery_date &&
                          order.status === 'in_transit' && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Entrega estimada:{' '}
                              {(() => {
                                let eta = order.estimated_delivery_date
                                let formatted
                                try {
                                  if (eta) {
                                    const d = new Date(eta)
                                    formatted = d.toLocaleDateString('es-CL', {
                                      timeZone: 'UTC',
                                      day: 'numeric',
                                      month: 'long',
                                    })
                                  }
                                } catch (_) {}
                                return formatted || formatDateUnified(eta)
                              })()}
                            </Typography>
                          )}
                        {order.status === 'delivered' &&
                          (order.delivered_at ||
                            order.deliveredAt ||
                            order.delivered) && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Fecha de entrega:{' '}
                              {formatDateUnified(
                                order.delivered_at ||
                                  order.deliveredAt ||
                                  order.delivered
                              )}
                            </Typography>
                          )}
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          mb: 2,
                        }}
                      >
                        <Box>
                          {order.payment_status === 'expired' && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => handleOpenDeleteDialog(order)}
                              sx={{
                                textTransform: 'none',
                                p: 0,
                                minWidth: 'auto',
                              }}
                            >
                              Eliminar
                            </Button>
                          )}
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="h6"
                            color="primary.main"
                            fontWeight="bold"
                          >
                            {formatCurrency(
                              order.final_amount ||
                                order.total_amount + getShippingAmount(order) ||
                                order.total_amount
                            )}
                          </Typography>
                          {getShippingAmount(order) > 0 && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              Envío: {formatCurrency(getShippingAmount(order))}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', mb: 1 }}
                      >
                        ¿Deseas solicitar alguna condición especial?
                      </Typography>

                      <Button
                        variant="outlined"
                        fullWidth
                        size="small"
                        onClick={openContact}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Contactar con Sellsi
                      </Button>
                    </Box>

                    {/* DESKTOP HEADER */}
                    <Box sx={{ mb: 3, display: { xs: 'none', md: 'block' } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: { xs: 'column', md: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', md: 'center' },
                          mb: 1,
                          gap: { xs: 1, md: 0 },
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Typography variant="h6" fontWeight="bold">
                              Pedido{' '}
                              {formatOrderNumber(
                                order.parent_order_id || order.order_id
                              )}
                            </Typography>
                            {/* Mensaje de contacto junto al número de pedido */}
                            <Box
                              sx={{
                                ml: { xs: 0, md: 1 },
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: { xs: 'none', md: 'block' } }}
                              >
                                ¿Deseas solicitar alguna condición especial? No
                                dudes en
                              </Typography>
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
                                {isMobile
                                  ? 'Contactar con Sellsi'
                                  : 'Contactarnos'}
                              </Button>
                            </Box>
                            {(order.is_virtual_split ||
                              order.is_supplier_part) && (
                              <Chip
                                size="small"
                                color="primary"
                                label={
                                  order.supplier_name
                                    ? `Proveedor: ${order.supplier_name}`
                                    : 'Parte de Pedido'
                                }
                              />
                            )}
                          </Box>
                          {order.parent_order_id &&
                            order.parent_order_id !== order.order_id && (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.2 }}
                              >
                                Orden de Pago{' '}
                                {formatOrderNumber(order.parent_order_id)}
                              </Typography>
                            )}
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            width: { xs: '100%', md: 'auto' },
                            justifyContent: {
                              xs: 'space-between',
                              md: 'flex-end',
                            },
                            mt: { xs: 1, md: 0 },
                          }}
                        >
                          {/* Delete button for expired payment orders */}
                          {order.payment_status === 'expired' ? (
                            <Tooltip title="Eliminar pedido de la lista">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenDeleteDialog(order)}
                                sx={{
                                  color: 'error.main',
                                  '&:hover': {
                                    backgroundColor: 'error.lighter',
                                  },
                                  '&:focus': {
                                    outline: 'none',
                                  },
                                  '&:focus-visible': {
                                    outline: 'none',
                                  },
                                }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Box />
                          )}
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography
                              variant="h6"
                              color="primary.main"
                              fontWeight="bold"
                            >
                              {formatCurrency(
                                order.final_amount ||
                                  order.total_amount +
                                    getShippingAmount(order) ||
                                  order.total_amount
                              )}
                              {order.is_virtual_split ? ' (Subtotal)' : ''}
                            </Typography>
                            {getShippingAmount(order) > 0 ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                Incluye envío:{' '}
                                {formatCurrency(getShippingAmount(order))}
                              </Typography>
                            ) : null}
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de compra: {formatDateUnified(order.created_at)}
                      </Typography>

                      {/* Entrega estimada: solo mostrar si status es in_transit (NO delivered) */}
                      {order.estimated_delivery_date &&
                        order.status === 'in_transit' && (
                          <Typography variant="body2" color="text.secondary">
                            {(() => {
                              let eta = order.estimated_delivery_date
                              let formatted
                              try {
                                if (eta) {
                                  const d = new Date(eta)
                                  // Forzar fecha en UTC y formato '23 de agosto de 2025'
                                  formatted = d.toLocaleDateString('es-CL', {
                                    timeZone: 'UTC',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                }
                              } catch (_) {
                                formatted = formatDateUnified(eta)
                              }
                              if (!formatted) formatted = formatDateUnified(eta)
                              return `Entrega estimada: ${formatted}`
                            })()}
                          </Typography>
                        )}

                      {/* Fecha de entrega: mostrar cuando status es delivered con delivered_at */}
                      {order.status === 'delivered' &&
                        (order.delivered_at ||
                          order.deliveredAt ||
                          order.delivered) && (
                          <Typography variant="body2" color="text.secondary">
                            Fecha de entrega:{' '}
                            {formatDateUnified(
                              order.delivered_at ||
                                order.deliveredAt ||
                                order.delivered
                            )}
                          </Typography>
                        )}
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* =============================================
                      DOCUMENTOS TRIBUTARIOS (DEDUPED POR SUPPLIER)
                     ============================================= */}
                    {(() => {
                      // Construir un mapa supplier -> invoice (1 por supplier)
                      const supplierInvoiceMap = {}
                      ;(order.items || []).forEach((it) => {
                        const invoicePath =
                          it.invoice_path || it.invoice || null // prefer invoice_path enriched
                        if (!invoicePath) return
                        const supplierId =
                          it.product?.supplier?.id ||
                          it.product?.supplier_id ||
                          it.supplier_id ||
                          it.product?.supplierId ||
                          'unknown'
                        if (!supplierInvoiceMap[supplierId]) {
                          const rawDt = (
                            it.document_type ||
                            it.documentType ||
                            ''
                          ).toLowerCase()
                          const documentType =
                            rawDt === 'factura' || rawDt === 'boleta'
                              ? rawDt
                              : 'documento'
                          supplierInvoiceMap[supplierId] = {
                            supplierName:
                              it.product?.supplier?.name ||
                              it.supplier_name ||
                              it.product?.proveedor ||
                              'Proveedor',
                            invoicePath,
                            documentType,
                          }
                        }
                      })
                      const invoices = Object.values(supplierInvoiceMap)
                      if (!invoices.length) return null
                      return (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                            Documentos Tributarios
                          </Typography>
                          <Stack spacing={1}>
                            {invoices.map((inv) => (
                              <InvoiceDownload
                                key={inv.invoicePath}
                                invoicePath={inv.invoicePath}
                                documentType={inv.documentType}
                                orderId={order.order_id}
                              />
                            ))}
                          </Stack>
                        </Box>
                      )
                    })()}

                    {/* Subtarjetas de productos */}
                    <Stack spacing={2}>
                      {order.items.map((item, index) => {
                        // Para partes de proveedor (supplier part) usamos su propio status parcial
                        const productStatus = order.is_supplier_part
                          ? order.status // ya viene overlay aplicado en hook
                          : order.is_payment_order
                          ? order.status
                          : getProductStatus(
                              item,
                              order.created_at,
                              order.status
                            )
                        const statusChips = getStatusChips(
                          productStatus,
                          order.payment_status,
                          order
                        )
                        if (DEBUG_BUYER_ORDERS_UI) {
                          try {
                            console.log('[BuyerOrders][DEBUG] item render', {
                              order_id: order.order_id,
                              supplier_id: order.supplier_id,
                              product_id: item.product_id || item.id,
                              computed_status: productStatus,
                              payment_status: order.payment_status,
                              chip_active: statusChips.find((c) => c.active)
                                ?.key,
                              chip_labels: statusChips.map(
                                (c) => `${c.key}:${c.active ? 'ON' : 'off'}`
                              ),
                            })
                          } catch (_) {}
                        }

                        // Crear key única y robusta combinando múltiples identificadores
                        const itemKey =
                          item.cart_items_id ||
                          `${order.order_id || order.synthetic_id}-${
                            item.product_id || 'no-product'
                          }-${index}`

                        return (
                          <Paper
                            key={itemKey}
                            sx={{
                              p: { xs: 1.5, md: 2 },
                              backgroundColor: 'grey.50',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: {
                                xs: 'rgba(0, 0, 0, 0.08)',
                                md: 'grey.200',
                              },
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: { xs: 'flex-start', md: 'center' },
                                gap: 2,
                                flexWrap: { xs: 'wrap', md: 'nowrap' },
                              }}
                            >
                              {/* Imagen del producto */}
                              <CheckoutSummaryImage
                                product={item.product}
                                width={70}
                                height={70}
                                sx={{
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                }}
                              />

                              {/* Información del producto */}
                              <Box
                                sx={{
                                  flex: 1,
                                  minWidth: { xs: 'calc(100% - 100px)', md: 0 },
                                }}
                              >
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 1,
                                  }}
                                >
                                  {/* Compact group: product name + small chip immediately to its right */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      minWidth: 0,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      fontWeight="medium"
                                      sx={{
                                        mb: 0,
                                        whiteSpace: 'normal',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        maxWidth: '40ch',
                                        fontSize: {
                                          xs: '0.95rem',
                                          md: '1.25rem',
                                        },
                                        lineHeight: { xs: 1.3, md: 1.5 },
                                      }}
                                    >
                                      {item.product.name}
                                    </Typography>
                                    {(() => {
                                      const isOffered =
                                        item.isOffered ||
                                        item.metadata?.isOffered ||
                                        !!item.offer_id ||
                                        !!item.offered_price
                                      if (!isOffered) return null
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
                                            bgcolor: 'rgba(76, 175, 80, 0.06)',
                                          }}
                                        >
                                          OFERTADO
                                        </Typography>
                                      )
                                    })()}
                                  </Box>
                                </Box>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                    sx={{
                                      fontSize: {
                                        xs: '0.8rem',
                                        md: '0.875rem',
                                      },
                                    }}
                                  >
                                    Proveedor:{' '}
                                    {item.product?.supplier?.name ||
                                      item.product?.proveedor ||
                                      'Proveedor desconocido'}
                                  </Typography>
                                  {(item.product?.supplier?.verified ||
                                    item.product?.verified ||
                                    item.product?.supplierVerified) && (
                                    <VerifiedIcon
                                      sx={{
                                        fontSize: 16,
                                        color: 'primary.main',
                                      }}
                                    />
                                  )}
                                </Box>
                                {(() => {
                                  const unit =
                                    typeof item.price_at_addition ===
                                      'number' &&
                                    Number.isFinite(item.price_at_addition)
                                      ? item.price_at_addition
                                      : typeof item.product?.price ===
                                          'number' &&
                                        Number.isFinite(item.product.price)
                                      ? item.product.price
                                      : 0
                                  const lineTotal = unit * (item.quantity || 0)
                                  return (
                                    <Typography
                                      variant="body1"
                                      fontWeight="medium"
                                      color="#000000fa"
                                      sx={{
                                        fontSize: { xs: '0.9rem', md: '1rem' },
                                      }}
                                    >
                                      {item.quantity} uds a{' '}
                                      {formatCurrency(unit)} c/u ={' '}
                                      {formatCurrency(lineTotal)}
                                    </Typography>
                                  )
                                })()}
                                {/* Documento tributario seleccionado */}
                                {(() => {
                                  const dt = (
                                    item.document_type ||
                                    item.documentType ||
                                    ''
                                  ).toLowerCase()
                                  const norm =
                                    dt === 'boleta' || dt === 'factura'
                                      ? dt
                                      : 'ninguno'
                                  // invoice_path ahora proviene del enrichment de invoices_meta (hook useBuyerOrders)
                                  // Ya no mostramos botón por ítem: se agrupa por supplier a nivel de la orden (dedupe)
                                  const hasInvoice = !!(
                                    item.invoice_path || item.invoice
                                  )

                                  return (
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        mt: 0.5,
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <Chip
                                        size="small"
                                        label={
                                          norm === 'boleta'
                                            ? 'Boleta'
                                            : norm === 'factura'
                                            ? 'Factura'
                                            : 'Sin Documento Tributario'
                                        }
                                        color={
                                          norm === 'factura'
                                            ? 'info'
                                            : norm === 'boleta'
                                            ? 'success'
                                            : 'default'
                                        }
                                        sx={{ fontSize: '0.65rem' }}
                                      />
                                      {/* Mensaje y botón condicionales */}
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                        }}
                                      >
                                        {order.status === 'accepted' &&
                                          !hasInvoice &&
                                          (norm === 'boleta' ||
                                            norm === 'factura') && (
                                            <Typography
                                              variant="caption"
                                              color="text.secondary"
                                            >
                                              El proveedor aún no ha subido tu{' '}
                                              {norm === 'boleta'
                                                ? 'Boleta'
                                                : 'Factura'}
                                              .
                                            </Typography>
                                          )}
                                        {/* Texto extra al tener factura deduplicada removido por solicitud del usuario */}
                                      </Box>
                                    </Box>
                                  )
                                })()}
                              </Box>

                              {/* Chips de estado (incluye Pago Confirmado) */}
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'row', md: 'column' },
                                  gap: 1,
                                  minWidth: { xs: '100%', md: 140 },
                                  width: { xs: '100%', md: 'auto' },
                                  flexWrap: 'wrap',
                                  mt: { xs: 1, md: 0 },
                                }}
                              >
                                {(() => {
                                  const allChips = getStatusChips(
                                    productStatus,
                                    order.payment_status,
                                    order
                                  )
                                  // En mobile, solo mostramos el chip activo (o el último si ninguno está activo explícitamente)
                                  // En desktop, mostramos todos
                                  const chipsToRender = isMobile
                                    ? [
                                        allChips.find((c) => c.active) ||
                                          allChips[allChips.length - 1],
                                      ]
                                    : allChips

                                  return chipsToRender.map(
                                    (chip, chipIndex) => {
                                      // Determine whether each stage was reached historically
                                      const pagoConfirmadoReached =
                                        order.payment_status === 'paid' ||
                                        [
                                          'accepted',
                                          'in_transit',
                                          'delivered',
                                        ].includes(order.status)
                                      const aceptadoReached =
                                        [
                                          'accepted',
                                          'in_transit',
                                          'delivered',
                                        ].includes(order.status) &&
                                        !order.cancelled_at
                                      const enTransitoReached =
                                        ['in_transit', 'delivered'].includes(
                                          order.status
                                        ) && !order.cancelled_at
                                      const entregadoReached =
                                        order.status === 'delivered' &&
                                        !order.cancelled_at
                                      const rechazadoReached =
                                        ['rejected', 'cancelled'].includes(
                                          order.status
                                        ) || order.cancelled_at

                                      let computedTooltip = chip.tooltip || ''
                                      if (chip.key === 'pago') {
                                        if (order.payment_status === 'paid') {
                                          computedTooltip =
                                            'Pago confirmado. La orden quedará pendiente de aceptación por el proveedor.'
                                        } else if (
                                          order.payment_status === 'expired'
                                        ) {
                                          computedTooltip =
                                            'El tiempo para completar el pago se agotó (20 minutos).'
                                        } else {
                                          computedTooltip =
                                            'Pago aún no confirmado.'
                                        }
                                      } else if (chip.key === 'aceptado') {
                                        computedTooltip = aceptadoReached
                                          ? 'El proveedor aceptó tu pedido.'
                                          : 'En espera de aceptación por el proveedor.'
                                      } else if (chip.key === 'en_transito') {
                                        computedTooltip = enTransitoReached
                                          ? 'El pedido fue despachado y está en camino.'
                                          : 'Pendiente de despacho por el proveedor.'
                                      } else if (chip.key === 'entregado') {
                                        computedTooltip = entregadoReached
                                          ? 'El pedido fue entregado.'
                                          : 'Aún no se ha entregado.'
                                      } else if (chip.key === 'rechazado') {
                                        computedTooltip = rechazadoReached
                                          ? order.cancelled_at
                                            ? 'Tu pedido fue cancelado.'
                                            : 'Tu pedido fue rechazado por el proveedor.'
                                          : 'Pedido no rechazado.'
                                      }

                                      const isPagoChip = chip.key === 'pago'
                                      // 🔧 FIX: No mostrar highlight en chip de pago si ya avanzamos a un status superior
                                      const hasAdvancedStatus = [
                                        'accepted',
                                        'in_transit',
                                        'delivered',
                                      ].includes(order.status)
                                      const highlight =
                                        isPagoChip &&
                                        order.payment_status === 'paid' &&
                                        recentlyPaid.has(order.order_id) &&
                                        !hasAdvancedStatus

                                      // ✨ GLOW EFFECT: Agregar glow a todos los chips activos con colores específicos
                                      // Determinar si debe brillar y qué clase CSS usar
                                      const shouldGlow =
                                        highlight ||
                                        (chip.active && chip.key !== 'pago')
                                      const glowClass = shouldGlow
                                        ? `chip-glow chip-glow-${chip.key}`
                                        : ''

                                      return (
                                        <Tooltip
                                          key={chip.key}
                                          title={computedTooltip}
                                          arrow
                                          placement="left"
                                        >
                                          <Chip
                                            label={chip.label}
                                            color={
                                              chip.active || highlight
                                                ? chip.color || 'default'
                                                : 'default'
                                            }
                                            variant={
                                              chip.active || highlight
                                                ? 'filled'
                                                : 'outlined'
                                            }
                                            size="small"
                                            className={glowClass}
                                            sx={{
                                              fontSize: '0.70rem',
                                              opacity:
                                                chip.active || highlight
                                                  ? 1
                                                  : 0.45,
                                            }}
                                          />
                                        </Tooltip>
                                      )
                                    }
                                  )
                                })()}
                              </Box>
                            </Box>
                          </Paper>
                        )
                      })}
                    </Stack>
                  </Paper>
                ))}

                {/* Contact modal global para esta página */}
                <ContactModal open={openContactModal} onClose={closeContact} />

                {/* Delete confirmation dialog for expired orders */}
                <ConfirmDialog
                  open={deleteDialogOpen}
                  title="¿Eliminar este pedido?"
                  description={`El pedido ${
                    orderToDelete
                      ? formatOrderNumber(
                          orderToDelete.parent_order_id ||
                            orderToDelete.order_id
                        )
                      : ''
                  } con pago expirado será eliminado de tu lista de pedidos. Esta acción no se puede deshacer.`}
                  confirmText={deleteLoading ? 'Eliminando...' : 'Eliminar'}
                  cancelText="Cancelar"
                  onConfirm={handleConfirmDelete}
                  onCancel={handleCloseDeleteDialog}
                  disabled={deleteLoading}
                />
              </Box>
              {/* Paginación inferior */}
              <OrdersPagination
                totalItems={orders?.length || 0}
                itemsPerPage={ORDERS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            // Estado vacío
            <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No tienes pedidos aún
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                ¡Explora nuestro marketplace y haz tu primer pedido!
              </Typography>
            </Paper>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  )
})

BuyerOrders.displayName = 'BuyerOrders'

export default BuyerOrders
