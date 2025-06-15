import React from 'react'
import { Chip } from '@mui/material'

/**
 * StatusChip - Componente UI reutilizable para mostrar estados con chips
 *
 * @param {string|number} value - Valor para determinar el estado
 * @param {Array} statusConfig - Configuración de estados:
 *   - { condition: function, label: string, color: string, variant?: string }
 * @param {string} defaultLabel - Label por defecto si no match ninguna condición
 * @param {string} defaultColor - Color por defecto
 * @param {string} size - Tamaño del chip
 * @param {object} sx - Estilos personalizados
 */
const StatusChip = ({
  value,
  statusConfig = [],
  defaultLabel = 'Sin estado',
  defaultColor = 'default',
  size = 'small',
  sx = {},
  variant = 'filled',
}) => {
  // Encontrar la configuración que coincida
  const matchingStatus = statusConfig.find((config) => config.condition(value))

  const status = matchingStatus || {
    label: defaultLabel,
    color: defaultColor,
    variant: variant,
  }

  return (
    <Chip
      label={status.label}
      color={status.color}
      size={size}
      variant={status.variant || variant}
      sx={{
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        height: size === 'small' ? 20 : 24,
        ...sx,
      }}
    />
  )
}

// Configuraciones predefinidas comunes
export const STOCK_STATUS_CONFIG = [
  {
    condition: (stock) => stock === 0,
    label: 'Agotado',
    color: 'error',
  },
  {
    condition: (stock) => stock > 0 && stock < 10,
    label: 'Stock bajo',
    color: 'warning',
  },
  {
    condition: (stock) => stock >= 10,
    label: 'En stock',
    color: 'success',
  },
]

export const ORDER_STATUS_CONFIG = [
  {
    condition: (status) => status === 'pending',
    label: 'Pendiente',
    color: 'warning',
  },
  {
    condition: (status) => status === 'processing',
    label: 'Procesando',
    color: 'info',
  },
  {
    condition: (status) => status === 'shipped',
    label: 'Enviado',
    color: 'primary',
  },
  {
    condition: (status) => status === 'delivered',
    label: 'Entregado',
    color: 'success',
  },
  {
    condition: (status) => status === 'cancelled',
    label: 'Cancelado',
    color: 'error',
  },
]

export const PRODUCT_STATUS_CONFIG = [
  {
    condition: (status) => status === 'active',
    label: 'Activo',
    color: 'success',
  },
  {
    condition: (status) => status === 'inactive',
    label: 'Inactivo',
    color: 'default',
  },
  {
    condition: (status) => status === 'draft',
    label: 'Borrador',
    color: 'warning',
  },
]

export default StatusChip
