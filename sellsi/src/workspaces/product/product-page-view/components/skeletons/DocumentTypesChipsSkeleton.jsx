import React from 'react'
import { Box, Skeleton } from '@mui/material'

export const DocumentTypesChipsSkeleton = ({ count = 3, isMobile = false }) => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: '100%', mb: 1 }}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} variant="rounded" width={isMobile ? 76 : 64} height={28} />
    ))}
  </Box>
)

export default DocumentTypesChipsSkeleton
