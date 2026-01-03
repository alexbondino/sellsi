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
  monthlyRequestsCount = 0,
  productsActive = 0,
}) => {
  const chartData = {
    products: generateChartData(productsActive ?? products.length, 'up'),
    sales: generateChartData(totalSales / 1000, 'up'),
    outOfStock: generateChartData(outOfStock, 'down'),
    requests: generateChartData(monthlyRequestsCount, 'neutral'),
  };

  const dashboardData = [
    {
      title: 'Productos Activos',
      value: formatNumber(productsActive ?? products.length),
      trend: 'up',
      data: chartData.products,
      icon: InventoryIcon,
    },
    {
      title: 'Ventas Este Mes',
      value: formatCurrency(totalSales || 0),
      trend: 'up',
      data: chartData.sales,
      icon: AttachMoneyIcon,
    },
    {
      title: 'Productos Sin Stock',
      value: outOfStock.toString(),
      trend: outOfStock > 5 ? 'down' : 'neutral',
      data: chartData.outOfStock,
      icon: WarningIcon,
    },
    {
      title: 'Solicitudes Este Mes',
      value: Number(monthlyRequestsCount || 0).toString(),
      trend: 'neutral',
      data: chartData.requests,
      icon: AssignmentIcon,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,

        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)', // móvil: 2 columnas
          sm: 'repeat(2, 1fr)', // tablet: 2 columnas
          md: 'repeat(4, 1fr)', // desktop: 4 columnas SOLO si caben
        },

        alignItems: 'stretch',
        width: '100%',
      }}
    >
      {dashboardData.map((card, index) => (
        <Box
          key={index}
          sx={{
            width: '100%',
            minHeight: 130, // altura mínima adecuada
            maxHeight: 220, // evita que crezca demasiado
            display: 'flex',
          }}
        >
          <StatCard {...card} />
        </Box>
      ))}
    </Box>
  );
};

export default SummaryCards;
