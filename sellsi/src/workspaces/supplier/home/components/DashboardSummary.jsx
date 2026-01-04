import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SummaryCards from './SummaryCards';
import DailySalesChart from './DailySalesChart';
import DailyRequestsChart from './DailyRequestsChart';

const DashboardSummary = ({
  products,
  totalSales,
  outOfStock,
  monthlyRequestsCount,
  productsActive,
  monthlyOffersCount,
  pendingReleaseAmount,
  pendingRequestsCount,
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
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}
    >
      <SummaryCards
        products={products}
        totalSales={totalSales}
        outOfStock={outOfStock}
        monthlyRequestsCount={monthlyRequestsCount}
        productsActive={productsActive}
        monthlyOffersCount={monthlyOffersCount}
        pendingReleaseAmount={pendingReleaseAmount}
        pendingRequestsCount={pendingRequestsCount}
      />

      {/* Gráficos de ventas y solicitudes diarias en 2 columnas */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DailySalesChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DailyRequestsChart />
        </Grid>
      </Grid>
    </Box>
  </Box>
);

export default DashboardSummary;
