import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SummaryCards from './SummaryCards';
import DailySalesChart from './DailySalesChart';
import SalesByProductChart from './SalesByProductChart';
import SalesByCustomerChart from './SalesByCustomerChart';

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

      {/* Gráficos: Ventas diarias (1/2), Ventas por producto (1/4), Ventas por cliente (1/4) */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DailySalesChart />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SalesByProductChart />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SalesByCustomerChart />
        </Grid>
      </Grid>
    </Box>
  </Box>
);

export default DashboardSummary;
