import React from 'react'
import { Box, Typography, LinearProgress, Chip, Stack } from '@mui/material'
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

/**
 * Componente compartido para mostrar indicador de stock
 * @param {Object} props
 * @param {number} props.stock - Stock actual
 * @param {number} props.maxStock - Stock máximo
 * @param {boolean} props.showProgressBar - Mostrar barra de progreso
 * @param {boolean} props.showLabel - Mostrar etiqueta de texto
 */
const StockIndicator = ({
  stock,
  maxStock,
  showProgressBar = true,
  showLabel = true,
}) => {
  const stockPercentage = (stock / maxStock) * 100

  const getStockStatus = () => {
    if (stock === 0)
      return { color: 'error', icon: ErrorIcon, text: 'Sin stock' }
    if (stockPercentage <= 20)
      return { color: 'warning', icon: WarningIcon, text: 'Stock bajo' }
    if (stockPercentage <= 50)
      return { color: 'info', icon: InventoryIcon, text: 'Stock limitado' }
    return { color: 'success', icon: CheckCircleIcon, text: 'Disponible' }
  }

  const status = getStockStatus()
  const Icon = status.icon

  return (
    <Box>
      {showLabel && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Chip
            icon={<Icon />}
            label={status.text}
            color={status.color}
            size="small"
            variant="filled"
          />

          <Typography variant="body2" color="text.secondary">
            {stock} disponibles
          </Typography>
        </Stack>
      )}

      {showProgressBar && stock > 0 && (
        <Box sx={{ mt: 1 }}>
          <LinearProgress
            variant="determinate"
            value={stockPercentage}
            color={status.color}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: 'grey.200',
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, display: 'block' }}
          >
            {Math.round(stockPercentage)}% del stock disponible
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default StockIndicator
