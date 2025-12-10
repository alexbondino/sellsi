import React from 'react';
import { Box, Card, CardContent, CardActions, Skeleton, Stack } from '@mui/material';

/**
 * Skeleton para MobileOfferCard
 * Usado en SupplierOffersList y OffersList (buyer offers)
 */
const MobileOffersSkeleton = ({ rows = 3 }) => {
  return (
    <Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} sx={{ mb: 2, borderRadius: 2 }}>
          <CardContent>
            {/* Header: Avatar + Product Name + Status Chip */}
            <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
              <Skeleton variant="circular" width={56} height={56} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Skeleton variant="text" width="80%" height={24} />
                <Skeleton variant="text" width="50%" height={20} sx={{ mt: 0.5 }} />
              </Box>
              <Skeleton variant="rounded" width="30%" height={24} sx={{ minWidth: 80, maxWidth: 110 }} />
            </Stack>

            {/* Divider */}
            <Skeleton variant="rectangular" width="100%" height={1} sx={{ mb: 2 }} />

            {/* Details: Quantity, Price, Total */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Skeleton variant="text" width="35%" height={20} />
                <Skeleton variant="text" width="25%" height={20} />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Skeleton variant="text" width="40%" height={20} />
                <Skeleton variant="text" width="30%" height={20} />
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Skeleton variant="text" width="35%" height={20} />
                <Skeleton variant="text" width="35%" height={24} />
              </Stack>
            </Stack>

            {/* Divider */}
            <Skeleton variant="rectangular" width="100%" height={1} sx={{ mt: 2, mb: 2 }} />

            {/* Buyer/Supplier info */}
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="70%" height={20} sx={{ mt: 0.5 }} />
          </CardContent>

          {/* Actions */}
          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Skeleton variant="rounded" width="35%" height={36} sx={{ minWidth: 90 }} />
            <Skeleton variant="rounded" width="35%" height={36} sx={{ minWidth: 90 }} />
          </CardActions>
        </Card>
      ))}
    </Box>
  );
};

export default MobileOffersSkeleton;
