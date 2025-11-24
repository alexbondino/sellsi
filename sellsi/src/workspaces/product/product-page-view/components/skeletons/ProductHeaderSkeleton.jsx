import React from 'react'
import { Box, Skeleton } from '@mui/material'
import { ProductImageGallerySkeleton, ProductInfoSkeleton } from '../ProductPageSkeletons'
import { PriceTiersSkeleton, SinglePriceSkeleton } from './PriceSkeletons'
import { PurchaseActionsSkeleton } from './PurchaseActionsSkeleton'
import { DocumentTypesChipsSkeleton } from './DocumentTypesChipsSkeleton'

/**
 * ProductHeaderSkeleton
 * Combina galería + info principal + pricing + acciones
 */
export const ProductHeaderSkeleton = ({
  isMobile = false,
  showTiers = true,
  showPurchaseActions = true,
  showDocumentTypesChips = true,
  withOfferButton = true,
}) => {
  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, width: '100%', gap: { xs: 2, md: 0 } }}>
        {/* Galería */}
        <Box sx={{ flex: { xs: 'none', md: 1 }, width: '100%', display: 'flex', justifyContent: 'center', px: 0 }}>
          <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: 500 } }}>
            <ProductImageGallerySkeleton isMobile={isMobile} />
          </Box>
        </Box>
        {/* Info */}
        <Box sx={{ flex: { xs: 'none', md: 1 }, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', px: { xs: 0, md: 1 }, width: { xs: '100%', md: '80%' }, maxWidth: { xs: 'none', md: 580 } }}>
          {/* Nombre */}
          <Skeleton variant="text" width={isMobile ? '70%' : '85%'} height={isMobile ? 38 : 56} sx={{ mb: 2 }} />
          {/* Chips documentos */}
          {showDocumentTypesChips && <DocumentTypesChipsSkeleton isMobile={isMobile} count={3} />}
          {/* Stock / compra mínima */}
          <Skeleton variant="text" width={160} height={24} />
          <Skeleton variant="text" width={190} height={24} sx={{ mb: 2 }} />
          {/* Precio */}
          {showTiers ? <PriceTiersSkeleton rows={4} /> : <SinglePriceSkeleton />}
          {/* Acciones */}
          {showPurchaseActions && <PurchaseActionsSkeleton withOffer={withOfferButton} />}
        </Box>
      </Box>
    </Box>
  )
}

export default ProductHeaderSkeleton
