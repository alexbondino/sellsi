import React from 'react'
import { Box, Typography } from '@mui/material'

// Componente memoizado para estadísticas individuales
const StatisticCard = React.memo(({ stat, isMobile = false }) => {
  const cardSx = isMobile
    ? {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2.5,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        minWidth: { xs: 170, sm: 170 },
        maxWidth: { xs: 170, sm: 170 },
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        },
      }
    : {
        display: 'flex',
        alignItems: 'center',
        gap: 2.5,
        p: 3,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        minWidth: 200,
        maxWidth: 200,
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        },
      }

  const iconSx = isMobile ? { fontSize: { xs: 24, sm: 28 } } : { fontSize: 32 }

  const labelSx = isMobile
    ? {
        fontSize: { xs: '0.85rem', sm: '0.9rem' },
        color: 'text.secondary',
        lineHeight: 1,
        mb: 0.8,
      }
    : {
        fontSize: '1rem',
        color: 'text.secondary',
        lineHeight: 1,
        mb: 1,
      }

  const numberSx = isMobile
    ? {
        fontSize: { xs: '1.5rem', sm: '1.6rem' },
        color: 'primary.main',
        fontFamily: 'monospace',
        lineHeight: 1,
      }
    : {
        fontSize: '1.8rem',
        color: 'primary.main',
        fontFamily: 'monospace',
        lineHeight: 1,
      }

  return (
    <Box sx={cardSx}>
      <Box
        sx={{
          color: 'primary.main',
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
