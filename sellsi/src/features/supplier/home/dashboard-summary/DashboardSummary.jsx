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
    <Typography component="h2" variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
      Overview
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
