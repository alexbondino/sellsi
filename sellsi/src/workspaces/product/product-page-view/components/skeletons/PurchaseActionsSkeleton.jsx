import React from 'react'
import { Box, Skeleton } from '@mui/material'

export const PurchaseActionsSkeleton = ({ withOffer = true }) => (
  <Box sx={{ display: 'flex', width: '100%', alignItems: 'center', columnGap: { xs: 2, md: 3 }, mt: 1, mb: 2 }}>
    {withOffer && (
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
        <Skeleton variant="rectangular" width={180} height={52} sx={{ borderRadius: 2 }} />
      </Box>
    )}
    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
      <Skeleton variant="rectangular" width={180} height={52} sx={{ borderRadius: 2 }} />
    </Box>
    <Box sx={{ flex: 1 }} />
  </Box>
)

export default PurchaseActionsSkeleton
