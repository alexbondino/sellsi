import React from 'react'
import { Box, Typography, Chip } from '@mui/material'
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

const StockIndicator = ({
  stock,
  lowStockThreshold = 10,
  criticalStockThreshold = 3,
  showUnits = true,
  variant = 'body2',
  showIcon = false,
  asChip = false,
  sx = {},
}) => {
  // Determinar el estado del stock
  const getStockStatus = () => {
    if (stock <= 0) {
      return {
        status: 'out',
        color: 'error.main',
        message: 'Sin stock',
        chipColor: 'error',
        icon: <ErrorIcon fontSize="small" />,
      }
    } else if (stock <= criticalStockThreshold) {
      return {
        status: 'critical',
        color: 'error.main',
        message: `¡Solo ${stock} disponible${stock > 1 ? 's' : ''}!`,
        chipColor: 'error',
        icon: <ErrorIcon fontSize="small" />,
      }
    } else if (stock <= lowStockThreshold) {
      return {
        status: 'low',
        color: 'warning.main',
        message: `¡Solo ${stock} disponible${stock > 1 ? 's' : ''}!`,
        chipColor: 'warning',
        icon: <WarningIcon fontSize="small" />,
      }
    } else {
      // Formatear stock con separador de miles
      const formattedStock = stock.toLocaleString('es-CL')
      return {
        status: 'available',
        color: '#000000ff',
        message: showUnits ? `Stock disponible: ${formattedStock} unidades` : 'En stock',
        chipColor: 'success',
        icon: <CheckCircleIcon fontSize="small" />,
      }
    }
  }

  const stockInfo = getStockStatus()

  if (asChip) {
    return (
      <Chip
        icon={showIcon ? stockInfo.icon : undefined}
        label={stockInfo.message}
        color={stockInfo.chipColor}
        size="small"
        variant="filled"
        sx={sx}
      />
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...sx }}>
      {showIcon && stockInfo.icon}
      <Typography
        variant={variant}
        color={stockInfo.color}
        sx={{ fontWeight: 600 }}
      >
        {stockInfo.message}
      </Typography>
    </Box>
  )
}

export default StockIndicator
