import React from 'react';
import { Box, Grid } from '@mui/material';

/* Pendiente de revisión Klaus */

/**
 * StatsCards - Componente UI reutilizable para mostrar tarjetas de estadísticas
 *
 * @param {Array} cards - Array de objetos con datos de las tarjetas:
 *   - { title: string, value: string|number, icon?: ReactElement, trend?: string,
 *       interval?: string, data?: Array, color?: string, onClick?: function }
 * @param {string} layout - Layout de las tarjetas ('grid', 'flex')
 * @param {object} gridProps - Props adicionales para el Grid (solo si layout='grid')
 * @param {object} cardComponent - Componente personalizado para renderizar cada tarjeta
 * @param {object} sx - Estilos personalizados para el contenedor
 * @param {boolean} responsive - Si debe ser responsive
 */
const StatsCards = ({
  cards = [],
  layout = 'flex',
  gridProps = {},
  cardComponent: CardComponent,
  sx = {},
  responsive = true,
}) => {
  if (!cards.length) return null;

  // Layout en Grid
  if (layout === 'grid') {
    return (
      <Grid container spacing={2} sx={sx} {...gridProps}>
        {cards.map((card, index) => (
          <Grid
            item
            xs={12}
            sm={6}
            md={responsive ? 4 : 6}
            lg={responsive ? 3 : 4}
            key={card.id || index}
          >
            {CardComponent ? (
              <CardComponent {...card} />
            ) : (
              <DefaultStatCard {...card} />
            )}
          </Grid>
        ))}
      </Grid>
    );
  }

  // Layout en Flex (default)
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1,
        width: '100%',
        ...sx,
      }}
    >
      {cards.map((card, index) => {
        const flexStyles = responsive
          ? {
              flex: {
                xs: '1 1 100%',
                sm: '1 1 calc(50% - 4px)',
                md: '1 1 calc(50% - 4px)',
                lg: `1 1 calc(${100 / cards.length}% - 4px)`,
              },
              maxWidth: { lg: `${100 / cards.length}%` },
              minWidth: { lg: '150px' },
            }
          : {
              flex: `1 1 calc(${100 / cards.length}% - 4px)`,
              minWidth: '150px',
            };

        return (
          <Box key={card.id || index} sx={flexStyles}>
            {CardComponent ? (
              <CardComponent {...card} />
            ) : (
              <DefaultStatCard {...card} />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

// Componente de tarjeta por defecto simple
const DefaultStatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  interval,
  color = 'primary',
  onClick,
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: 2,
            }
          : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {Icon && (
          <Icon
            sx={{
              fontSize: 24,
              color: `${color}.main`,
              mr: 1,
            }}
          />
        )}
        <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
          {title}
        </Box>
      </Box>

      <Box sx={{ fontSize: '1.5rem', fontWeight: 600, mb: 0.5 }}>{value}</Box>

      {interval && (
        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {interval}
        </Box>
      )}

      {trend && (
        <Box
          sx={{
            fontSize: '0.75rem',
            color:
              trend === 'up'
                ? 'success.main'
                : trend === 'down'
                ? 'error.main'
                : 'text.secondary',
            mt: 0.5,
          }}
        >
          {trend === 'up'
            ? '↗ Subiendo'
            : trend === 'down'
            ? '↘ Bajando'
            : '→ Estable'}
        </Box>
      )}
    </Box>
  );
};

// Helper para crear configuraciones de tarjetas comunes
export const createSupplierStatsCards = data => {
  const { products, totalSales, outOfStock, weeklyRequests } = data;

  return [
    {
      id: 'products',
      title: 'Productos Activos',
      value: products?.length?.toLocaleString() || '0',
      interval: 'Últimos 30 días',
      trend: 'up',
      color: 'primary',
    },
    {
      id: 'sales',
      title: 'Ventas Este Mes',
      value: `$${totalSales?.toLocaleString() || '0'}`,
      interval: 'Últimos 30 días',
      trend: 'up',
      color: 'success',
    },
    {
      id: 'stock',
      title: 'Productos Sin Stock',
      value: outOfStock?.toString() || '0',
      interval: 'Actualmente',
      trend: outOfStock > 5 ? 'down' : 'neutral',
      color: 'warning',
    },
    {
      id: 'requests',
      title: 'Solicitudes Semanales',
      value: weeklyRequests?.length?.toString() || '0',
      interval: 'Esta semana',
      trend: 'neutral',
      color: 'info',
    },
  ];
};

export const createBuyerStatsCards = data => {
  const { totalOrders, totalSpent, savedItems, activeOrders } = data;

  return [
    {
      id: 'orders',
      title: 'Total Pedidos',
      value: totalOrders?.toString() || '0',
      interval: 'Históricamente',
      trend: 'up',
      color: 'primary',
    },
    {
      id: 'spent',
      title: 'Total Gastado',
      value: `$${totalSpent?.toLocaleString() || '0'}`,
      interval: 'Históricamente',
      trend: 'up',
      color: 'success',
    },
    {
      id: 'saved',
      title: 'Productos Guardados',
      value: savedItems?.toString() || '0',
      interval: 'En wishlist',
      trend: 'neutral',
      color: 'secondary',
    },
    {
      id: 'active',
      title: 'Pedidos Activos',
      value: activeOrders?.toString() || '0',
      interval: 'En proceso',
      trend: 'neutral',
      color: 'warning',
    },
  ];
};

export default StatsCards;
