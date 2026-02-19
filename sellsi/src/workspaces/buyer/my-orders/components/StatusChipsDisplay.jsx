/**
 * StatusChipsDisplay Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Displays order status chips with dynamic tooltips and glow effects
 */

import React, { memo } from 'react'
import { Box, Chip, Tooltip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { getStatusChips } from '../utils/orderStatusUtils'

/**
 * Helper para calcular props dinámicas del chip
 */
function calculateChipProps(chip, order, recentlyPaid) {
  // Determine whether each stage was reached historically
  const paymentStatus = (order._effective_payment_status || order.payment_status || 'pending').toLowerCase()

  const pagoConfirmadoReached =
    paymentStatus === 'paid' ||
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
    if (paymentStatus === 'paid') {
      computedTooltip =
        'Pago confirmado. La orden quedará pendiente de aceptación por el proveedor.'
    } else if (paymentStatus === 'expired') {
      computedTooltip =
        'El tiempo para completar el pago se agotó (20 minutos).'
    } else if (paymentStatus === 'pending' && order.payment_method === 'bank_transfer') {
      computedTooltip =
        'Tu transferencia bancaria está siendo verificada por nuestro equipo. Esto puede tomar hasta 24 horas.'
    } else if (paymentStatus === 'rejected') {
      const reason = order.payment_rejection_reason
      computedTooltip = reason
        ? `El pago fue rechazado. Razón: "${reason}"`
        : 'El pago fue rechazado. Por favor contacta a soporte para más información.'
    } else {
      computedTooltip = 'Pago aún no confirmado.'
    }
  } else if (chip.key === 'pago_rechazado') {
    // Chip específico para pago rechazado
    const reason = order.payment_rejection_reason;
    computedTooltip = reason 
      ? `El pago fue rechazado. Razón: "${reason}"`
      : 'El pago fue rechazado. Por favor contacta a soporte para más información.';
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
  const isPagoRechazadoChip = chip.key === 'pago_rechazado'
  
  // No mostrar highlight en chip de pago si ya avanzamos a un status superior
  const hasAdvancedStatus = ['accepted', 'in_transit', 'delivered'].includes(
    order.status
  )
  
  const highlight =
    isPagoChip &&
    paymentStatus === 'paid' &&
    recentlyPaid.has(order.order_id) &&
    !hasAdvancedStatus

  // Glow effect: brillan chips activos y highlight
  // Pago rechazado también debe brillar (en rojo) cuando está activo
  const shouldGlow = highlight || 
    (chip.active && chip.key !== 'pago') || 
    (isPagoRechazadoChip && chip.active)
    
  const glowClass = shouldGlow ? `chip-glow chip-glow-${chip.key}` : ''

  // Determine icon to show to the left of the chip
  let iconType = null
  if (chip.key === 'pago') {
    if (pagoConfirmadoReached && paymentStatus !== 'expired') iconType = 'check'
    else if (paymentStatus === 'expired') iconType = 'error'
  } else if (chip.key === 'pago_rechazado') {
    iconType = 'error'
  } else if (chip.key === 'aceptado') {
    if (aceptadoReached) iconType = 'check'
  } else if (chip.key === 'en_transito') {
    if (enTransitoReached) iconType = 'check'
  } else if (chip.key === 'entregado') {
    if (entregadoReached) iconType = 'check'
  } else if (chip.key === 'rechazado') {
    if (rechazadoReached) iconType = 'error'
  }

  return { tooltip: computedTooltip, highlight, glowClass, iconType }
}

const StatusChipsDisplay = memo(function StatusChipsDisplay({
  order,
  productStatus,
  paymentStatus,
  isMobile,
  recentlyPaid,
}) {
  const normalizedPaymentStatus = (paymentStatus || order.payment_status || 'pending').toLowerCase()
  const orderWithEffectivePayment = {
    ...order,
    _effective_payment_status: normalizedPaymentStatus,
  }

  const allChips = getStatusChips(productStatus, normalizedPaymentStatus, orderWithEffectivePayment)
  
  // En mobile, solo mostrar chip activo
  const chipsToRender = isMobile
    ? [allChips.find((c) => c.active) || allChips[allChips.length - 1]]
    : allChips

  // Pre-calcular props de cada chip una sola vez
  const chipsWithProps = chipsToRender.map((chip) => ({
    chip,
    ...calculateChipProps(chip, orderWithEffectivePayment, recentlyPaid),
  }))

  const renderChip = ({ chip, tooltip, highlight, glowClass }) => (
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

  return (
    <>
      {/* ── Desktop: 2 columnas (íconos | chips) ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 0.75,
          mt: 0,
        }}
      >
        {/* Columna izquierda — íconos, ancho fijo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: 18, flexShrink: 0 }}>
          {chipsWithProps.map(({ chip, iconType }) => (
            <Box
              key={chip.key}
              sx={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {iconType === 'check' && (
                <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', opacity: 0.85 }} />
              )}
              {iconType === 'error' && (
                <CancelIcon sx={{ fontSize: 16, color: 'error.main', opacity: 0.85 }} />
              )}
            </Box>
          ))}
        </Box>

        {/* Columna derecha — chips, mismo minWidth que antes */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 140 }}>
          {chipsWithProps.map(renderChip)}
        </Box>
      </Box>

      {/* ── Mobile: fila de chips, igual que antes ── */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          flexDirection: 'row',
          gap: 1,
          minWidth: '100%',
          flexWrap: 'wrap',
          mt: 1,
        }}
      >
        {chipsWithProps.map(renderChip)}
      </Box>
    </>
  )
})

StatusChipsDisplay.displayName = 'StatusChipsDisplay'

export default StatusChipsDisplay
