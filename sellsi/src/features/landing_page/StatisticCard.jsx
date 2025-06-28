import React from 'react'
import { Box, Typography } from '@mui/material'

/**
 * ============================================================================
 * STATISTIC CARD - TARJETA DE ESTADÍSTICA
 * ============================================================================
 *
 * Componente UI puro para mostrar estadísticas numéricas con iconos
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.stat - Objeto con datos de la estadística
 * @param {string|number} props.stat.number - Número a mostrar (puede ser animado)
 * @param {string} props.stat.label - Etiqueta principal de la estadística
 * @param {string} props.stat.description - Descripción adicional
 * @param {ReactElement} props.stat.icon - Icono a mostrar
 *
 * CARACTERÍSTICAS:
 * - Componente memoizado para rendimiento óptimo
 * - Layout responsivo para todos los dispositivos
 * - Soporte para números animados (count-up)
 * - Estilos consistentes con el sistema de diseño
 * - Efectos hover y transiciones suaves
 * - Altura fija para alineación perfecta
 */
const StatisticCard = React.memo(({ stat }) => {
  const cardSx = {
    display: 'flex',
    alignItems: 'center', // ✅ Mantener centrado horizontalmente
    gap: { xs: 0.5, sm: 0.5, md: 2.5, lg: 2.5, xl: 2.5 },
    p: { xs: 0.3, sm: 0.3, md: 3, lg: 2.5, xl: 3 },
    background: '#000000',
    borderRadius: { xs: 2, sm: 2, md: 2, lg: 2, xl: 2 },
    width: { xs: 106, sm: 120, md: 200, lg: 250, xl: 220 },
    // ✅ Altura fija para asegurar alineación perfecta en mobile
    height: { xs: 80, sm: 85, md: 90, lg: 120, xl: 100 },
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    border: '2px solid white',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
      borderColor: '#ffffff',
    },
  }

  const iconSx = {
    fontSize: { xs: 18, sm: 22, md: 28, lg: 32, xl: 32 },
  }

  const labelSx = {
    fontSize: {
      xs: '0.75rem',
      sm: '0.8rem',
      md: '1rem',
      lg: '1.1rem',
      xl: '1.15rem',
    },
    color: 'white',
    lineHeight: 1,
    mb: { xs: 0.8, sm: 0.8, md: 1, lg: 1, xl: 1 },
    ml: { xs: 0, sm: 0, md: 0, lg: 1.5, xl: 0.5 },
  }

  const numberSx = {
    fontSize: {
      xs: '1.4rem',
      sm: '1.6rem',
      md: '1.8rem',
      lg: '2.1rem',
      xl: '2.2rem',
    },
    color: 'white',
    fontFamily: 'monospace',
    lineHeight: 1,
    fontWeight: 'bold',
    ml: { xs: 0, sm: 0, md: 0, lg: 1.5, xl: 0.5 },
  }

  return (
    <Box sx={cardSx}>
      <Box
        sx={{
          color: 'white', // Iconos en blanco para buen contraste con #252440
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {React.cloneElement(stat.icon, { sx: iconSx })}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" sx={labelSx}>
          {stat.label}
        </Typography>
        <Typography variant="h6" fontWeight="bold" sx={numberSx}>
          {stat.number}
        </Typography>
      </Box>
    </Box>
  )
})

StatisticCard.displayName = 'StatisticCard'

export default StatisticCard
