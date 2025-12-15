/**
 * OrderCard Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Orchestrates OrderHeader, InvoiceSection, and OrderItems
 */

import React, { memo } from 'react'
import { Paper, Divider, Stack } from '@mui/material'
import OrderHeader from './OrderHeader'
import InvoiceSection from './InvoiceSection'
import OrderItem from './OrderItem'

const OrderCard = memo(function OrderCard({
  order,
  isMobile,
  formatOrderNumber,
  formatDateUnified,
  formatCurrency,
  getShippingAmount,
  handleOpenDeleteDialog,
  openContact,
  recentlyPaid,
}) {
  return (
    <Paper
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
      {/* Header de la orden */}
      <OrderHeader
        order={order}
        isMobile={isMobile}
        formatOrderNumber={formatOrderNumber}
        formatDateUnified={formatDateUnified}
        formatCurrency={formatCurrency}
        getShippingAmount={getShippingAmount}
        handleOpenDeleteDialog={handleOpenDeleteDialog}
        openContact={openContact}
      />

      <Divider sx={{ mb: 2 }} />

      {/* Sección de facturas */}
      <InvoiceSection order={order} />

      {/* Items de la orden */}
      <Stack spacing={2}>
        {order.items.map((item, index) => {
          // Crear key única y robusta
          const itemKey =
            item.cart_items_id ||
            `${order.order_id || order.synthetic_id}-${item.product_id || 'no-product'}-${index}`

          return (
            <OrderItem
              key={itemKey}
              item={item}
              order={order}
              index={index}
              isMobile={isMobile}
              formatCurrency={formatCurrency}
              recentlyPaid={recentlyPaid}
            />
          )
        })}
      </Stack>
    </Paper>
  )
})

OrderCard.displayName = 'OrderCard'

export default OrderCard
