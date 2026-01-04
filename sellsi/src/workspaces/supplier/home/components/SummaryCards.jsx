import React from 'react';
import { Box } from '@mui/material';
import { StatCard } from '../../../../ui-components';
import {
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  LocalOffer as LocalOfferIcon,
  AccountBalanceWallet as WalletIcon,
  PendingActions as PendingActionsIcon,
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
  monthlyOffersCount = 0,
  pendingReleaseAmount = 0,
  pendingRequestsCount = 0,
}) => {
  const chartData = {
    products: generateChartData(productsActive ?? products.length, 'up'),
    sales: generateChartData(totalSales / 1000, 'up'),
    outOfStock: generateChartData(outOfStock, 'down'),
    requests: generateChartData(monthlyRequestsCount, 'neutral'),
    offers: generateChartData(monthlyOffersCount, 'neutral'),
    pendingRelease: generateChartData(pendingReleaseAmount / 1000, 'neutral'),
    pendingRequests: generateChartData(pendingRequestsCount, 'neutral'),
  };

  const dashboardData = [
    {
      title: 'Ventas Este Mes',
      value: formatCurrency(totalSales || 0),
      trend: 'up',
      data: chartData.sales,
      icon: AttachMoneyIcon,
    },
    {
      title: 'Monto por Liberar',
      value: formatCurrency(pendingReleaseAmount || 0),
      trend: 'neutral',
      data: chartData.pendingRelease,
      icon: WalletIcon,
    },
    {
      title: 'Solicitudes Este Mes',
      value: Number(monthlyRequestsCount || 0).toString(),
      trend: 'neutral',
      data: chartData.requests,
      icon: AssignmentIcon,
    },
    {
      title: 'Solicitudes Pendientes',
      value: Number(pendingRequestsCount || 0).toString(),
      trend: pendingRequestsCount > 0 ? 'up' : 'neutral',
      data: chartData.pendingRequests,
      icon: PendingActionsIcon,
    },
    {
      title: 'Ofertas Este Mes',
      value: Number(monthlyOffersCount || 0).toString(),
      trend: 'neutral',
      data: chartData.offers,
      icon: LocalOfferIcon,
    },
    {
      title: 'Productos Activos',
      value: formatNumber(productsActive ?? products.length),
      trend: 'up',
      data: chartData.products,
      icon: InventoryIcon,
    },
    {
      title: 'Productos Sin Stock',
      value: outOfStock.toString(),
      trend: outOfStock > 5 ? 'down' : 'neutral',
      data: chartData.outOfStock,
      icon: WarningIcon,
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
          md: 'repeat(4, 1fr)', // desktop: 4 columnas (2 filas de 4 para 6 cards)
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
