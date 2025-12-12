import React from 'react';
import { Box, Paper, Skeleton, Stack, Divider } from '@mui/material';

// Skeleton mejorado para BuyerOrders: replica estructura real con mobile/desktop variants
const BuyerOrdersSkeleton = ({ rows = 3 }) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Paper 
          key={i} 
          sx={{ 
            p: { xs: 1.5, md: 3 }, 
            mb: 3, 
            borderRadius: 2,
            border: { xs: '2px solid #0000008a', md: 'none' },
          }}
        >
          {/* MOBILE HEADER */}
          <Box sx={{ mb: 2, display: { xs: 'block', md: 'none' } }}>
            {/* Order number + date */}
            <Box sx={{ mb: 1 }}>
              <Skeleton variant="text" width="45%" height={24} />
              <Skeleton variant="text" width="55%" height={20} sx={{ mt: 0.5 }} />
            </Box>

            {/* Supplier chip */}
            <Box sx={{ mb: 2 }}>
              <Skeleton variant="rounded" width="60%" height={24} sx={{ maxWidth: 200 }} />
            </Box>

            {/* Price section */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
              <Box sx={{ width: '30%' }} />
              <Box sx={{ textAlign: 'right' }}>
                <Skeleton variant="text" width={100} height={28} />
                <Skeleton variant="text" width={80} height={16} sx={{ mt: 0.5 }} />
              </Box>
            </Box>

            {/* Contact text + button */}
            <Skeleton variant="text" width="80%" height={20} sx={{ mb: 1, mx: 'auto' }} />
            <Skeleton variant="rounded" width="100%" height={36} />
          </Box>

          {/* DESKTOP HEADER */}
          <Box sx={{ mb: 3, display: { xs: 'none', md: 'block' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              {/* Left: Order info */}
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Skeleton variant="text" width="25%" height={28} />
                  <Skeleton variant="text" width="35%" height={20} />
                  <Skeleton variant="rounded" width="20%" height={24} sx={{ maxWidth: 150 }} />
                </Stack>
              </Box>

              {/* Right: Price + actions */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ textAlign: 'right' }}>
                  <Skeleton variant="text" width={120} height={28} />
                  <Skeleton variant="text" width={90} height={16} sx={{ mt: 0.5 }} />
                </Box>
              </Stack>
            </Box>
          </Box>

          {/* Divider */}
          <Divider sx={{ mb: 2 }} />

          {/* Items section */}
          <Box>
            {Array.from({ length: 2 }).map((_, idx) => (
              <Box key={idx} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  {/* Product image */}
                  <Skeleton variant="rounded" width={80} height={80} />
                  
                  {/* Product details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Skeleton variant="text" width="70%" height={22} />
                    <Skeleton variant="text" width="40%" height={18} sx={{ mt: 0.5 }} />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Skeleton variant="text" width={60} height={18} />
                      <Skeleton variant="text" width={80} height={18} />
                    </Stack>
                  </Box>

                  {/* Item price (desktop) */}
                  <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'right' }}>
                    <Skeleton variant="text" width={90} height={22} />
                  </Box>
                </Stack>
              </Box>
            ))}
          </Box>

          {/* Status chips */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Skeleton variant="rounded" width="22%" height={28} sx={{ minWidth: 75 }} />
            <Skeleton variant="rounded" width="22%" height={28} sx={{ minWidth: 75 }} />
            <Skeleton variant="rounded" width="22%" height={28} sx={{ minWidth: 75 }} />
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default BuyerOrdersSkeleton;
