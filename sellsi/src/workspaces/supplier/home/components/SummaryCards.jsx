import React from 'react';
import { Box } from '@mui/material';
import { StatCard } from '../../../../ui-components';
import {
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { generateChartData } from '../utils/utils';
import {
  formatNumber,
  formatCurrency,
} from '../../../../shared/utils/formatters';

const SummaryCards = ({
  products = [],
  totalSales = 0,
  outOfStock = 0,
  weeklyRequestsCount = 0,
  productsActive = 0,
}) => {
  const chartData = {
    products: generateChartData(productsActive ?? products.length, 'up'),
    sales: generateChartData(totalSales / 1000, 'up'),
    outOfStock: generateChartData(outOfStock, 'down'),
    requests: generateChartData(weeklyRequestsCount, 'neutral'),
  };

  const dashboardData = [
    {
      title: 'Productos Activos',
      value: formatNumber(productsActive ?? products.length),
      interval: 'Últimos 30 días',
      trend: 'up',
      data: chartData.products,
      icon: InventoryIcon,
    },
    {
      title: 'Ventas Este Mes',
      value: formatCurrency(totalSales || 0),
      interval: 'Últimos 30 días',
      trend: 'up',
      data: chartData.sales,
      icon: AttachMoneyIcon,
    },
    {
      title: 'Productos Sin Stock',
      value: outOfStock.toString(),
      interval: 'Últimos 30 días',
      trend: outOfStock > 5 ? 'down' : 'neutral',
      data: chartData.outOfStock,
      icon: WarningIcon,
    },
    {
      title: 'Solicitudes Semanales',
      value: Number(weeklyRequestsCount || 0).toString(),
      interval: 'Esta semana',
      trend: 'neutral',
      data: chartData.requests,
      icon: AssignmentIcon,
    },
  ];

  return dashboardData.map((card, index) => (
    <Box
      key={index}
      sx={{
        flex: {
          xs: '1 1 100%',
          sm: '1 1 calc(50% - 4px)',
          md: '1 1 calc(50% - 4px)',
          lg: '1 1 calc(19% - 4px)',
        },
        maxWidth: { lg: '19%' },
        minWidth: { lg: '150px' },
      }}
    >
      <Box sx={{ transform: { lg: 'scale(0.85)' }, transformOrigin: 'center' }}>
        <StatCard {...card} />
      </Box>
    </Box>
  ));
};

export default SummaryCards;
