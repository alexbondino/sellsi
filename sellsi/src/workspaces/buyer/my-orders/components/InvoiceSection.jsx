/**
 * InvoiceSection Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Displays deduplicated invoices section grouped by supplier
 */

import React, { memo } from 'react'
import { Box, Typography, Stack } from '@mui/material'
import InvoiceDownload from './InvoiceDownload'
import { getDeduplicatedInvoices } from '../utils/orderHelpers'

const InvoiceSection = memo(function InvoiceSection({ order }) {
  const invoices = getDeduplicatedInvoices(order)
  
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
})

InvoiceSection.displayName = 'InvoiceSection'

export default InvoiceSection
