import React from 'react';
import { Box, Paper, Skeleton, Stack } from '@mui/material';

// Skeleton tailored for BuyerOrders: card-like rows with avatar image, title, meta and right-side chips/totals
const BuyerOrdersSkeleton = ({ rows = 3 }) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Paper key={i} sx={{ p: { xs: 1.5, md: 3 }, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
              <Skeleton variant="circular" width={70} height={70} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton variant="text" width="60%" height={28} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
                <Skeleton variant="text" width="30%" height={20} sx={{ mt: 0.5 }} />
              </Box>
            </Stack>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end', ml: 2 }}>
              <Skeleton variant="text" width={120} height={28} />
              <Skeleton variant="rectangular" width={110} height={26} />
            </Box>
          </Box>

          <Skeleton variant="rectangular" width="100%" height={12} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={84} height={28} />
            <Skeleton variant="rounded" width={84} height={28} />
            <Skeleton variant="rounded" width={84} height={28} />
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default BuyerOrdersSkeleton;
