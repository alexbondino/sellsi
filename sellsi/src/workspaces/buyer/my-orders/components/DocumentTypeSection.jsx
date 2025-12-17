/**
 * DocumentTypeSection Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Displays document type chip (Boleta/Factura) and conditional messages
 */

import React, { memo } from 'react'
import { Box, Chip, Typography } from '@mui/material'

const DocumentTypeSection = memo(function DocumentTypeSection({ item, order }) {
  const dt = (item.document_type || item.documentType || '').toLowerCase()
  const norm = dt === 'boleta' || dt === 'factura' ? dt : 'ninguno'
  const hasInvoice = !!(item.invoice_path || item.invoice)

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
      
      {/* Mensaje condicional */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {order.status === 'accepted' &&
          !hasInvoice &&
          (norm === 'boleta' || norm === 'factura') && (
            <Typography variant="caption" color="text.secondary">
              El proveedor aún no ha subido tu{' '}
              {norm === 'boleta' ? 'Boleta' : 'Factura'}.
            </Typography>
          )}
      </Box>
    </Box>
  )
})

DocumentTypeSection.displayName = 'DocumentTypeSection'

export default DocumentTypeSection
