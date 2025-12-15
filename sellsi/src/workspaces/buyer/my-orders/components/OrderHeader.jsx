/**
 * OrderHeader Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Displays order header with responsive mobile/desktop variants
 */

import React, { memo } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

const OrderHeader = memo(function OrderHeader({
  order,
  isMobile,
  formatOrderNumber,
  formatDateUnified,
  formatCurrency,
  getShippingAmount,
  handleOpenDeleteDialog,
  openContact,
}) {
  // Función helper para formatear fecha de entrega estimada
  const formatEstimatedDelivery = (eta) => {
    let formatted
    try {
      if (eta) {
        const d = new Date(eta)
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
    return formatted || formatDateUnified(eta)
  }

  return (
    <>
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
              Pedido {formatOrderNumber(order.parent_order_id || order.order_id)}
            </Typography>
            {order.parent_order_id && order.parent_order_id !== order.order_id && (
              <Typography variant="caption" color="text.secondary" display="block">
                Orden de Pago {formatOrderNumber(order.parent_order_id)}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Fecha de compra: {formatDateUnified(order.created_at)}
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
          {order.estimated_delivery_date && order.status === 'in_transit' && (
            <Typography variant="caption" color="text.secondary">
              Entrega estimada: {formatEstimatedDelivery(order.estimated_delivery_date)}
            </Typography>
          )}
          {order.status === 'delivered' &&
            (order.delivered_at || order.deliveredAt || order.delivered) && (
              <Typography variant="caption" color="text.secondary">
                Fecha de entrega:{' '}
                {formatDateUnified(
                  order.delivered_at || order.deliveredAt || order.delivered
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
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              {formatCurrency(
                order.final_amount ||
                  order.total_amount + getShippingAmount(order) ||
                  order.total_amount
              )}
            </Typography>
            {getShippingAmount(order) > 0 && (
              <Typography variant="caption" color="text.secondary" display="block">
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
          onClick={() => openContact(order)}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" fontWeight="bold">
                Pedido {formatOrderNumber(order.parent_order_id || order.order_id)}
              </Typography>
              
              {/* Mensaje de contacto */}
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
                  ¿Deseas solicitar alguna condición especial? No dudes en
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => openContact(order)}
                  sx={{
                    color: 'primary.main',
                    textTransform: 'none',
                    fontWeight: 600,
                    p: 0,
                    minWidth: 'auto',
                    ml: 0.5,
                  }}
                >
                  {isMobile ? 'Contactar con Sellsi' : 'Contactarnos'}
                </Button>
              </Box>
              
              {(order.is_virtual_split || order.is_supplier_part) && (
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
            
            {order.parent_order_id && order.parent_order_id !== order.order_id && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                Orden de Pago {formatOrderNumber(order.parent_order_id)}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: { xs: '100%', md: 'auto' },
              justifyContent: { xs: 'space-between', md: 'flex-end' },
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
                    '&:hover': { backgroundColor: 'error.lighter' },
                    '&:focus': { outline: 'none' },
                    '&:focus-visible': { outline: 'none' },
                  }}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Box />
            )}
            
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary.main" fontWeight="bold">
                {formatCurrency(
                  order.final_amount ||
                    order.total_amount + getShippingAmount(order) ||
                    order.total_amount
                )}
                {order.is_virtual_split ? ' (Subtotal)' : ''}
              </Typography>
              {getShippingAmount(order) > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Incluye envío: {formatCurrency(getShippingAmount(order))}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Fecha de compra: {formatDateUnified(order.created_at)}
        </Typography>

        {/* Entrega estimada: solo mostrar si status es in_transit */}
        {order.estimated_delivery_date && order.status === 'in_transit' && (
          <Typography variant="body2" color="text.secondary">
            Entrega estimada: {formatEstimatedDelivery(order.estimated_delivery_date)}
          </Typography>
        )}

        {/* Fecha de entrega: mostrar cuando status es delivered */}
        {order.status === 'delivered' &&
          (order.delivered_at || order.deliveredAt || order.delivered) && (
            <Typography variant="body2" color="text.secondary">
              Fecha de entrega:{' '}
              {formatDateUnified(order.delivered_at || order.deliveredAt || order.delivered)}
            </Typography>
          )}
      </Box>
    </>
  )
})

OrderHeader.displayName = 'OrderHeader'

export default OrderHeader
