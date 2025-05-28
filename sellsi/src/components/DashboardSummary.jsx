import React from 'react';
import { Grid } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import PaidIcon from '@mui/icons-material/Paid';
import WarningIcon from '@mui/icons-material/Warning';
import ListAltIcon from '@mui/icons-material/ListAlt';
import DashboardCard from './Widget';

const DashboardSummary = ({
  products,
  totalSales,
  outOfStock,
  weeklyRequests,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <DashboardCard
        icon={<InventoryIcon />}
        title="Productos activos"
        value={products.length}
        color="blue"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <DashboardCard
        icon={<PaidIcon />}
        title="Ventas este mes"
        value={`$${totalSales.toLocaleString()}`}
        color="green"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <DashboardCard
        icon={<WarningIcon />}
        title="Productos sin stock"
        value={outOfStock}
        color="red"
      />
    </Grid>
    <Grid item xs={12} sm={6}>
      <DashboardCard
        icon={<ListAltIcon />}
        title="Solicitudes esta semana"
        value={weeklyRequests.length}
        color="blue"
      />
    </Grid>
  </Grid>
);

export default DashboardSummary;
