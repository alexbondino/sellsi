import React from 'react'
import { Box, Typography } from '@mui/material'
import Grid from '@mui/material/Grid'
import StatCard from './StatCard'
import RequestList from './RequestList'
import {
  Inventory as InventoryIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material'

// Función para generar datos de gráfico simulados basados en valores reales
const generateChartData = (baseValue, trend) => {
  const dataPoints = 30
  const data = []
  let currentValue = baseValue * 0.8 // Empezar un poco más bajo

  for (let i = 0; i < dataPoints; i++) {
    const randomVariation = (Math.random() - 0.5) * 0.2 * baseValue
    const trendFactor = trend === 'up' ? 1.02 : trend === 'down' ? 0.98 : 1.001
    currentValue = Math.max(0, currentValue * trendFactor + randomVariation)
    data.push(Math.round(currentValue))
  }

  return data
}

const DashboardSummary = ({
  products,
  totalSales,
  outOfStock,
  weeklyRequests,
}) => {
  // Generar datos de gráficos basados en los valores reales
  const chartData = {
    products: generateChartData(products.length, 'up'),
    sales: generateChartData(totalSales / 1000, 'up'), // Dividir por 1000 para mejor visualización
    outOfStock: generateChartData(outOfStock, 'down'),
    requests: generateChartData(weeklyRequests.length, 'neutral'),
  }
  const dashboardData = [
    {
      title: 'Productos Activos',
      value: products.length.toLocaleString(),
      interval: 'Últimos 30 días',
      trend: 'up',
      data: chartData.products,
      icon: InventoryIcon,
    },
    {
      title: 'Ventas Este Mes',
      value: `$${totalSales.toLocaleString()}`,
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
      value: weeklyRequests.length.toString(),
      interval: 'Esta semana',
      trend: 'neutral',
      data: chartData.requests,
      icon: AssignmentIcon,
    },
  ]

  return (
    <Box sx={{ width: '100%' }}>
      <Typography
        component="h2"
        variant="h6"
        sx={{
          mb: 2,
          fontWeight: 600,
          color: 'text.primary',
        }}
      >
        Overview
      </Typography>{' '}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          width: '100%',
        }}
      >
        {' '}
        {dashboardData.map((card, index) => (
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
            <Box
              sx={{
                transform: { lg: 'scale(0.85)' },
                transformOrigin: 'center',
              }}
            >
              <StatCard {...card} />
            </Box>
          </Box>
        ))}{' '}
        <Box
          sx={{
            flex: {
              xs: '1 1 100%',
              sm: '1 1 100%',
              md: '1 1 100%',
              lg: '1 1 calc(24% - 4px)',
            },
            maxWidth: { lg: '22%' },
            minWidth: { lg: '180px' },
          }}
        >
          <Box
            sx={{ transform: { lg: 'scale(0.8)' }, transformOrigin: 'center' }}
          >
            <RequestList weeklyRequests={weeklyRequests} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardSummary
