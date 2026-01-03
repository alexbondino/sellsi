import React from 'react';
import { Box, Typography, Grid, Button, Tooltip } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AddIcon from '@mui/icons-material/Add';
import SummaryCards from './SummaryCards';
import DailySalesChart from './DailySalesChart';
import DailyRequestsChart from './DailyRequestsChart';
// import RequestListWrapper from './RequestListWrapper';

const DashboardSummary = ({
  products,
  totalSales,
  outOfStock,
  monthlyRequestsCount,
  productsActive,
  onNewProduct,
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
      />

      {/* Botón de nuevo producto entre cards y gráficas */}
      {onNewProduct && (
        <Box>
          <Tooltip
            title="Crea y publica un producto de manera individual con todos sus detalles"
            placement="bottom"
            arrow
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              fullWidth
              sx={{
                py: 2,
                borderRadius: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'rgba(99, 102, 241, 0.16) 0px 4px 16px',
                '&:hover': {
                  boxShadow: 'rgba(99, 102, 241, 0.24) 0px 6px 20px',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
              onClick={onNewProduct}
            >
              Nuevo Producto
            </Button>
          </Tooltip>
        </Box>
      )}

      {/* Gráficos de ventas y solicitudes diarias en 2 columnas */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DailySalesChart />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DailyRequestsChart />
        </Grid>
      </Grid>

      {/* <RequestListWrapper weeklyRequests={weeklyRequests} /> */}
    </Box>
  </Box>
);

export default DashboardSummary;
