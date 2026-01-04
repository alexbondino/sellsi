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
  pendingOffersCount = 0,
}) => {
  const chartData = {
    products: generateChartData(productsActive ?? products.length, 'up'),
    sales: generateChartData(totalSales / 1000, 'up'),
    outOfStock: generateChartData(outOfStock, 'down'),
    requests: generateChartData(monthlyRequestsCount, 'neutral'),
    offers: generateChartData(monthlyOffersCount, 'neutral'),
    pendingRelease: generateChartData(pendingReleaseAmount / 1000, 'neutral'),
    pendingRequests: generateChartData(pendingRequestsCount, 'neutral'),
    pendingOffers: generateChartData(pendingOffersCount, 'neutral'),
  };

  // Tooltips informativos para cada KPI
  const tooltips = {
    ventas:
      'Suma del total de las ventas generadas desde el día 1 del mes actual hasta hoy, descontando el monto de comisión cobrada por Sellsi',
    montoPorLiberar:
      'Saldo retenido temporalmente por Sellsi hasta la confirmación de entrega de los pedidos',
    solicitudesEsteMes:
      'Número total de órdenes de compra recibidas durante el mes en curso, incluyendo las ya despachadas',
    solicitudesPendientes:
      'Pedidos recibidos que aún no has atendido. Requieren tu atención inmediata para gestionar su aprobación o rechazo',
    productosSinStock:
      'Productos con inventario en 0. Actualmente no están disponibles para los compradores hasta que repongas stock',
    ofertasPendientes:
      'Negociaciones iniciadas por potenciales compradores que esperan tu aprobación o rechazo',
    ofertasEsteMes:
      'Número total de ofertas recibidas por potenciales compradores este mes, se contabilizan tanto negociaciones exitosas, en curso y rechazadas',
  };

  const dashboardData = [
    {
      title: 'Ventas Este Mes',
      value: formatCurrency(totalSales || 0),
      trend: 'up',
      data: chartData.sales,
      icon: AttachMoneyIcon,
      tooltip: tooltips.ventas,
    },
    {
      title: 'Monto por Liberar',
      value: formatCurrency(pendingReleaseAmount || 0),
      trend: 'neutral',
      data: chartData.pendingRelease,
      icon: WalletIcon,
      tooltip: tooltips.montoPorLiberar,
    },
    {
      title: 'Solicitudes Este Mes',
      value: Number(monthlyRequestsCount || 0).toString(),
      trend: 'neutral',
      data: chartData.requests,
      icon: AssignmentIcon,
      tooltip: tooltips.solicitudesEsteMes,
    },
    {
      title: 'Ofertas Este Mes',
      value: Number(monthlyOffersCount || 0).toString(),
      trend: 'neutral',
      data: chartData.offers,
      icon: LocalOfferIcon,
      tooltip: tooltips.ofertasEsteMes,
    },
    {
      title: 'Productos Sin Stock',
      value: outOfStock.toString(),
      trend: outOfStock > 5 ? 'down' : 'neutral',
      data: chartData.outOfStock,
      icon: WarningIcon,
      linkTo: '/supplier/myproducts',
      linkLabel: 'Ir a Mis Productos',
      tooltip: tooltips.productosSinStock,
    },
    {
      title: 'Solicitudes Pendientes',
      value: Number(pendingRequestsCount || 0).toString(),
      trend: pendingRequestsCount > 0 ? 'up' : 'neutral',
      data: chartData.pendingRequests,
      icon: PendingActionsIcon,
      linkTo: '/supplier/my-orders',
      linkLabel: 'Ir a Mis Pedidos',
      tooltip: tooltips.solicitudesPendientes,
    },
    {
      title: 'Ofertas Pendientes',
      value: Number(pendingOffersCount || 0).toString(),
      trend: pendingOffersCount > 0 ? 'up' : 'neutral',
      data: chartData.pendingOffers,
      icon: LocalOfferIcon,
      linkTo: '/supplier/offers',
      linkLabel: 'Ir a Mis Ofertas',
      tooltip: tooltips.ofertasPendientes,
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
