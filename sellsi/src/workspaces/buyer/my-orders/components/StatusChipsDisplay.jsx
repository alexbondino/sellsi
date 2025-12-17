/**
 * StatusChipsDisplay Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Displays order status chips with dynamic tooltips and glow effects
 */

import React, { memo } from 'react'
import { Box, Chip, Tooltip } from '@mui/material'
import { getStatusChips } from '../utils/orderStatusUtils'

/**
 * Helper para calcular props dinámicas del chip
 */
function calculateChipProps(chip, order, recentlyPaid) {
  // Determine whether each stage was reached historically
  const pagoConfirmadoReached =
    order.payment_status === 'paid' ||
    ['accepted', 'in_transit', 'delivered'].includes(order.status)
  
  const aceptadoReached =
    ['accepted', 'in_transit', 'delivered'].includes(order.status) &&
    !order.cancelled_at
  
  const enTransitoReached =
    ['in_transit', 'delivered'].includes(order.status) && !order.cancelled_at
  
  const entregadoReached =
    order.status === 'delivered' && !order.cancelled_at
  
  const rechazadoReached =
    ['rejected', 'cancelled'].includes(order.status) || order.cancelled_at

  let computedTooltip = chip.tooltip || ''
  
  // Calcular tooltip dinámico
  if (chip.key === 'pago') {
    if (order.payment_status === 'paid') {
      computedTooltip =
        'Pago confirmado. La orden quedará pendiente de aceptación por el proveedor.'
    } else if (order.payment_status === 'expired') {
      computedTooltip =
        'El tiempo para completar el pago se agotó (20 minutos).'
    } else {
      computedTooltip = 'Pago aún no confirmado.'
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
  // No mostrar highlight en chip de pago si ya avanzamos a un status superior
  const hasAdvancedStatus = ['accepted', 'in_transit', 'delivered'].includes(
    order.status
  )
  
  const highlight =
    isPagoChip &&
    order.payment_status === 'paid' &&
    recentlyPaid.has(order.order_id) &&
    !hasAdvancedStatus

  // Glow effect: brillan chips activos y highlight
  const shouldGlow = highlight || (chip.active && chip.key !== 'pago')
  const glowClass = shouldGlow ? `chip-glow chip-glow-${chip.key}` : ''

  return { tooltip: computedTooltip, highlight, glowClass }
}

const StatusChipsDisplay = memo(function StatusChipsDisplay({
  order,
  productStatus,
  isMobile,
  recentlyPaid,
}) {
  const allChips = getStatusChips(productStatus, order.payment_status, order)
  
  // En mobile, solo mostrar chip activo
  const chipsToRender = isMobile
    ? [allChips.find((c) => c.active) || allChips[allChips.length - 1]]
    : allChips

  return (
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
      {chipsToRender.map((chip) => {
        const { tooltip, highlight, glowClass } = calculateChipProps(
          chip,
          order,
          recentlyPaid
        )

        return (
          <Tooltip key={chip.key} title={tooltip} arrow placement="left">
            <Chip
              label={chip.label}
              color={chip.active || highlight ? chip.color || 'default' : 'default'}
              variant={chip.active || highlight ? 'filled' : 'outlined'}
              size="small"
              className={glowClass}
              sx={{
                fontSize: '0.70rem',
                opacity: chip.active || highlight ? 1 : 0.45,
              }}
            />
          </Tooltip>
        )
      })}
    </Box>
  )
})

StatusChipsDisplay.displayName = 'StatusChipsDisplay'

export default StatusChipsDisplay
