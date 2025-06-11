import React from 'react'
import { Paper, Typography } from '@mui/material'

/**
 * ============================================================================
 * COMPONENTE STATCARD - TARJETA DE ESTADÍSTICA REUTILIZABLE
 * ============================================================================
 *
 * Componente reutilizable para mostrar estadísticas en formato card
 * Utilizado en BuyerPerformance y otros componentes de métricas
 *
 * @param {Object} props - Propiedades del componente
 * @param {string} props.title - Título de la estadística
 * @param {string|number} props.value - Valor principal a mostrar
 * @param {string} [props.subtitle] - Texto descriptivo opcional
 * @param {string} [props.color='primary'] - Color del tema Material-UI para el valor
 * @param {Object} [props.sx] - Estilos adicionales para el Paper
 */
const StatCard = ({ title, value, subtitle, color = 'primary', sx = {} }) => (
  <Paper
    sx={{
      p: 3,
      borderRadius: 2,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      transition: 'transform 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      },
      ...sx, // Permitir estilos personalizados
    }}
  >
    <Typography
      variant="h4"
      sx={{ fontWeight: 'bold', color: `${color}.main`, mb: 1 }}
    >
      {value}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
      {title}
    </Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Paper>
)

export default StatCard
