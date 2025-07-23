import React from 'react';
import { Box, Typography } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SummaryCards from './SummaryCards';
// import RequestListWrapper from './RequestListWrapper';

const DashboardSummary = ({
  products,
  totalSales,
  outOfStock,
  weeklyRequests,
  productsActive,
}) => (
  <Box sx={{ width: '100%' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
      <AssessmentIcon sx={{ color: 'primary.main', fontSize: 36, mr: 1 }} />
      <Typography
        variant="h4"
        fontWeight={600}
        color="primary.main"
        gutterBottom
      >
        Resumen
      </Typography>
    </Box>
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, width: '100%' }}>
      <SummaryCards
        products={products}
        totalSales={totalSales}
        outOfStock={outOfStock}
        weeklyRequests={weeklyRequests}
        productsActive={productsActive}
      />
      {/* <RequestListWrapper weeklyRequests={weeklyRequests} /> */}
    </Box>
  </Box>
);

export default DashboardSummary;
