/**
 * OrderItem Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Displays a single product item within an order
 */

import React, { memo } from 'react'
import { Paper, Box } from '@mui/material'
import { CheckoutSummaryImage } from '../../../../components/UniversalProductImage'
import ProductInfo from './ProductInfo'
import DocumentTypeSection from './DocumentTypeSection'
import StatusChipsDisplay from './StatusChipsDisplay'
import { getProductStatus } from '../utils/orderHelpers'

const OrderItem = memo(function OrderItem({
  item,
  order,
  index,
  isMobile,
  formatCurrency,
  recentlyPaid,
}) {
  const normalizePaymentStatus = (status) => {
    const normalized = String(status || 'pending').toLowerCase()
    if (normalized === 'failed' || normalized === 'cancelled') return 'rejected'
    return normalized
  }

  const getEffectivePaymentStatus = () => {
    const baseStatus = normalizePaymentStatus(order.payment_status)

    const qty = Math.max(0, Number(item?.quantity || 0))
    const unitPrice = Math.max(
      0,
      Number(item?.price_at_addition ?? item?.priceAtAddition ?? item?.product?.price ?? 0)
    )
    const lineTotal = Math.round(unitPrice * qty)
    const financedAmount = Math.max(0, Math.round(Number(item?.financing_amount || 0)))

    if (lineTotal > 0 && financedAmount >= lineTotal) {
      return 'paid'
    }

    return baseStatus
  }

  const effectivePaymentStatus = getEffectivePaymentStatus()

  // Cálculo de productStatus
  const productStatus = order.is_supplier_part
    ? order.status // ya viene overlay aplicado en hook
    : order.is_payment_order
    ? order.status
    : getProductStatus(item, order.created_at, order.status)

  return (
    <Paper
      sx={{
        p: { xs: 1.5, md: 2 },
        backgroundColor: 'grey.50',
        borderRadius: 1,
        border: '1px solid',
        borderColor: { xs: 'rgba(0, 0, 0, 0.08)', md: 'grey.200' },
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
        <ProductInfo
          item={item}
          order={order}
          formatCurrency={formatCurrency}
          isMobile={isMobile}
        />

        {/* Chips de estado */}
        <StatusChipsDisplay
          order={order}
          productStatus={productStatus}
          paymentStatus={effectivePaymentStatus}
          isMobile={isMobile}
          recentlyPaid={recentlyPaid}
        />
      </Box>
    </Paper>
  )
})

OrderItem.displayName = 'OrderItem'

export default OrderItem
