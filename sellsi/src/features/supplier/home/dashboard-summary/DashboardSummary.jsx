import React from 'react';
import { Box, Typography } from '@mui/material';
import SummaryCards from './SummaryCards';
import RequestListWrapper from './RequestListWrapper';

const DashboardSummary = ({
  products,
  totalSales,
  outOfStock,
  weeklyRequests,
}) => (
  <Box sx={{ width: '100%' }}>
    <Typography
      variant="h4"
      fontWeight={600}
      color="primary.main"
      gutterBottom
      sx={{ mb: 4 }}
    >
      Resumen
    </Typography>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%' }}>
      <SummaryCards
        products={products}
        totalSales={totalSales}
        outOfStock={outOfStock}
        weeklyRequests={weeklyRequests}
      />
      <RequestListWrapper weeklyRequests={weeklyRequests} />
    </Box>
  </Box>
);

export default DashboardSummary;
