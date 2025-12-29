import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'
import {
  Box,
  Typography,
  Container,
  Paper,
  Alert,
  Button,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import './BuyerOrders.css'
import AssignmentIcon from '@mui/icons-material/Assignment'
import { ThemeProvider, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { dashboardThemeCore } from '../../../../styles/dashboardThemeCore'
import { SPACING_BOTTOM_MAIN } from '../../../../styles/layoutSpacing'
import { formatDate as formatDateUnified } from '../../../../workspaces/marketplace'

// Hooks
import { useAuthenticatedBuyer } from '../../shared-hooks'
import { useBuyerOrders } from '../hooks/useBuyerOrders'
import { usePaidOrdersHighlight } from '../hooks/usePaidOrdersHighlight'

// Utils
import {
  formatOrderNumber,
  getShippingAmount,
  buildOrderContextForContact,
} from '../utils/orderHelpers'

// Components
import ContactModal from '../../../../shared/components/modals/ContactModal'
import ConfirmDialog from '../../../../shared/components/modals/ConfirmDialog'
import BuyerOrdersSkeleton from '../../../../shared/components/display/skeletons/BuyerOrdersSkeleton'
import OrdersPagination from './OrdersPagination'
import OrderCard from './OrderCard'

const BuyerOrders = memo(function BuyerOrders() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const navigate = useNavigate()
  
  // ============================================================================
  // AUTENTICACIÓN
  // ============================================================================
  const { buyerId, authResolved } = useAuthenticatedBuyer()

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
    totalCount,
    fetchOrders,
    hideExpiredOrder,
    formatCurrency,
  } = useBuyerOrders(buyerId)

  // ============================================================================
  // RESALTAR TRANSICIÓN A PAGO CONFIRMADO (realtime)
  // ============================================================================
  const recentlyPaid = usePaidOrdersHighlight(orders)

  // Contact modal state (abre desde varios lugares, aquí para el buyer orders)
  const [openContactModal, setOpenContactModal] = useState(false)
  const [selectedOrderContext, setSelectedOrderContext] = useState(null)
  
  const openContact = useCallback((order = null) => {
    setSelectedOrderContext(buildOrderContextForContact(order))
    setOpenContactModal(true)
  }, [])
  
  const closeContact = useCallback(() => {
    setOpenContactModal(false)
    setSelectedOrderContext(null)
  }, [])

  // Mark related notifications as read on mount
  const { markContext } =
    (typeof useNotificationsContext === 'function'
      ? require('../../notifications/components/NotificationProvider')
      : { useNotificationsContext: null }
    ).useNotificationsContext?.() || {}
  useEffect(() => {
    try {
      markContext && markContext('buyer_orders')
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ============================================================================
  // DELETE EXPIRED ORDER HANDLERS
  // ============================================================================
  const handleOpenDeleteDialog = useCallback((order) => {
    setOrderToDelete(order)
    setDeleteDialogOpen(true)
  }, [])

  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setOrderToDelete(null)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
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
  // PAGINACIÓN BACKEND (20 órdenes por página)
  // ============================================================================
  const ORDERS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)
  const fetchTriggeredRef = useRef(false)

  // Calcular total de páginas basado en totalCount o fallback a orders en memoria
  const totalPages = useMemo(() => {
    // Si tenemos totalCount del backend, usarlo
    if (totalCount > 0) {
      return Math.max(1, Math.ceil(totalCount / ORDERS_PER_PAGE))
    }
    // Fallback: si paginación backend no está lista, usar cliente
    return Math.max(1, Math.ceil((orders?.length || 0) / ORDERS_PER_PAGE))
  }, [orders, totalCount])

  // Fetch orders cuando cambia la página o buyerId
  useEffect(() => {
    if (!buyerId || !authResolved) return

    const offset = (currentPage - 1) * ORDERS_PER_PAGE

    // Llamar fetchOrders directamente, no incluirlo en deps para evitar loops
    fetchOrders({ limit: ORDERS_PER_PAGE, offset })
    fetchTriggeredRef.current = true

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, buyerId, authResolved])

  // Asegura que currentPage esté dentro de rango cuando cambian las órdenes
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
    if (currentPage < 1) setCurrentPage(1)
  }, [currentPage, totalPages])

  const handlePageChange = useCallback(
    (page) => {
      const safePage = Math.min(Math.max(1, page), totalPages)
      setCurrentPage(safePage)
      // Scroll suave al inicio para que el usuario vea desde arriba
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    [totalPages]
  )

  // Mostrar todas las órdenes cargadas (ya vienen paginadas del backend)
  const visibleOrders = orders || []

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
            maxWidth={false}
            disableGutters={isMobile}
            sx={{ width: '100%' }}
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
            maxWidth={false}
            disableGutters={isMobile}
            sx={{ width: '100%' }}
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
          maxWidth={false}
          disableGutters={isMobile}
          sx={{ width: '100%' }}
        >
          {/* Título de la página */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <AssignmentIcon
              sx={{
                color: 'primary.main',
                fontSize: 36,
                mr: 1,
              }}
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

          {/* Lista de pedidos */}
          {orders.length > 0 ? (
            <>
              {/* Paginación superior */}
              <OrdersPagination
                totalItems={totalCount > 0 ? totalCount : orders?.length || 0}
                itemsPerPage={ORDERS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {visibleOrders.map((order) => (
                  <OrderCard
                    key={order.synthetic_id || order.order_id}
                    order={order}
                    isMobile={isMobile}
                    formatOrderNumber={formatOrderNumber}
                    formatDateUnified={formatDateUnified}
                    formatCurrency={formatCurrency}
                    getShippingAmount={getShippingAmount}
                    handleOpenDeleteDialog={handleOpenDeleteDialog}
                    openContact={openContact}
                    recentlyPaid={recentlyPaid}
                  />
                ))}
              </Box>
              
              {/* Paginación inferior */}
              <OrdersPagination
                totalItems={totalCount > 0 ? totalCount : orders?.length || 0}
                itemsPerPage={ORDERS_PER_PAGE}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            // Estado vacío
            <Paper sx={{ p: { xs: 2, md: 4 }, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <AssignmentIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" color="text.secondary">
                Aun no haz realizado pedidos
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Los pedidos se crean cuando concretas compras a través del Marketplace.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                En esta sección podrás hacer seguimiento a tus compras.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                ¡Explora nuestro marketplace y haz tu primer pedido!
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/buyer/marketplace')}
              >
                Ir al Marketplace
              </Button>
            </Paper>
          )}

          {/* Contact modal global para esta página */}
          <ContactModal
            open={openContactModal}
            onClose={closeContact}
            context={selectedOrderContext}
          />

          {/* Delete confirmation dialog for expired orders */}
          <ConfirmDialog
            open={deleteDialogOpen}
            title="¿Eliminar este pedido?"
            description={`El pedido ${
              orderToDelete
                ? formatOrderNumber(
                    orderToDelete.parent_order_id || orderToDelete.order_id
                  )
                : ''
            } con pago expirado será eliminado de tu lista de pedidos. Esta acción no se puede deshacer.`}
            confirmText={deleteLoading ? 'Eliminando...' : 'Eliminar'}
            cancelText="Cancelar"
            onConfirm={handleConfirmDelete}
            onCancel={handleCloseDeleteDialog}
            disabled={deleteLoading}
          />
        </Container>
      </Box>
    </ThemeProvider>
  )
})

BuyerOrders.displayName = 'BuyerOrders'

export default BuyerOrders
