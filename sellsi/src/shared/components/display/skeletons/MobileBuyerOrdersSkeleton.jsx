import React from 'react';
import { Box, Card, CardContent, CardActions, Skeleton, Stack } from '@mui/material';

/**
 * Skeleton para vista mobile de BuyerOrders
 * Similar a MobileOrderCard pero enfocado en pedidos de comprador
 */
const MobileBuyerOrdersSkeleton = ({ rows = 3 }) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            {/* Header: Order info + Status */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" height={24} />
                <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />
              </Box>
              <Skeleton variant="rounded" width="30%" height={24} sx={{ minWidth: 80, maxWidth: 110 }} />
            </Stack>

            {/* Divider */}
            <Skeleton variant="rectangular" width="100%" height={1} sx={{ mb: 2 }} />

            {/* Product info with image */}
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Skeleton variant="rounded" width={80} height={80} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton variant="text" width="90%" height={20} />
                <Skeleton variant="text" width="60%" height={20} sx={{ mt: 0.5 }} />
                <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />
              </Box>
            </Stack>

            {/* Order details */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="30%" height={20} />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Skeleton variant="text" width="35%" height={20} />
                <Skeleton variant="text" width="40%" height={24} />
              </Stack>
            </Stack>

            {/* Divider */}
            <Skeleton variant="rectangular" width="100%" height={1} sx={{ mt: 2, mb: 2 }} />

            {/* Supplier info */}
            <Skeleton variant="text" width="65%" height={20} />
          </CardContent>

          {/* Actions */}
          <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
            <Skeleton variant="rounded" width={48} height={36} />
            <Skeleton variant="rounded" width={48} height={36} />
          </CardActions>
        </Card>
      ))}
    </Box>
  );
};

export default MobileBuyerOrdersSkeleton;
