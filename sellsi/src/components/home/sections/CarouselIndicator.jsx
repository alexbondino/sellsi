import React from 'react'
import { Box } from '@mui/material'

// Componente memoizado para indicadores de carrusel
const CarouselIndicator = React.memo(
  ({
    index,
    isActive,
    onClick,
    variant = 'desktop', // 'desktop' | 'mobile'
  }) => {
    const baseSx = {
      width: 12,
      height: 12,
      borderRadius: '50%',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    }

    const desktopSx = {
      ...baseSx,
      backgroundColor: isActive ? 'primary.main' : 'rgba(255,255,255,0.7)',
      border: '2px solid white',
      boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      '&:hover': {
        backgroundColor: 'primary.light',
        transform: 'scale(1.1)',
      },
    }

    const mobileSx = {
      ...baseSx,
      backgroundColor: isActive ? 'primary.main' : 'rgba(0,0,0,0.3)',
      border: `2px solid ${isActive ? 'primary.main' : 'rgba(0,0,0,0.2)'}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      '&:hover': {
        backgroundColor: 'primary.main',
        transform: 'scale(1.2)',
        border: '2px solid primary.main',
      },
    }

    return (
      <Box
        onClick={onClick}
        sx={variant === 'desktop' ? desktopSx : mobileSx}
      />
    )
  }
)

CarouselIndicator.displayName = 'CarouselIndicator'

export default CarouselIndicator
