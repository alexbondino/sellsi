/**
 * ProductInfo Component
 * Extracted from BuyerOrders.jsx for reusability
 * 
 * Displays product information: name, supplier, price, quantity, document type
 */

import React, { memo } from 'react'
import { Box, Typography } from '@mui/material'
import VerifiedIcon from '@mui/icons-material/Verified'
import { calculateItemUnitPrice, calculateItemLineTotal } from '../utils/orderHelpers'
import DocumentTypeSection from './DocumentTypeSection'

const ProductInfo = memo(function ProductInfo({ item, formatCurrency, isMobile, order }) {
  const unit = calculateItemUnitPrice(item)
  const lineTotal = calculateItemLineTotal(item)
  
  const isOffered =
    item.isOffered ||
    item.metadata?.isOffered ||
    !!item.offer_id ||
    !!item.offered_price

  return (
    <Box sx={{ flex: 1, minWidth: { xs: 'calc(100% - 100px)', md: 0 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
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
          {isOffered && (
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
          )}
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
      
      <Typography
        variant="body1"
        fontWeight="medium"
        color="#000000fa"
        sx={{
          fontSize: { xs: '0.9rem', md: '1rem' },
        }}
      >
        {item.quantity} uds a {formatCurrency(unit)} c/u = {formatCurrency(lineTotal)}
      </Typography>

      {/* Documento tributario */}
      <DocumentTypeSection item={item} order={order} />
    </Box>
  )
})

ProductInfo.displayName = 'ProductInfo'

export default ProductInfo
