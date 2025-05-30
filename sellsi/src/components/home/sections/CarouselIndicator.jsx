import React from 'react'
import { Box } from '@mui/material'

// Componente memoizado para indicadores de carrusel
const CarouselIndicator = React.memo(({ index, isActive, onClick }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
        height: { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 },
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backgroundColor: {
          xs: isActive ? 'primary.main' : 'rgba(0,0,0,0.3)',
          sm: isActive ? 'primary.main' : 'rgba(0,0,0,0.3)',
          md: isActive ? 'primary.main' : 'rgba(0,0,0,0.3)',
          lg: isActive ? 'primary.main' : 'rgba(255,255,255,0.7)',
          xl: isActive ? 'primary.main' : 'rgba(255,255,255,0.7)',
        },
        border: {
          xs: `2px solid ${isActive ? 'primary.main' : 'rgba(0,0,0,0.2)'}`,
          sm: `2px solid ${isActive ? 'primary.main' : 'rgba(0,0,0,0.2)'}`,
          md: `2px solid ${isActive ? 'primary.main' : 'rgba(0,0,0,0.2)'}`,
          lg: '2px solid white',
          xl: '2px solid white',
        },
        boxShadow: {
          xs: '0 2px 8px rgba(0,0,0,0.15)',
          sm: '0 2px 8px rgba(0,0,0,0.15)',
          md: '0 2px 8px rgba(0,0,0,0.15)',
          lg: '0 1px 4px rgba(0,0,0,0.2)',
          xl: '0 1px 4px rgba(0,0,0,0.2)',
        },
        '&:hover': {
          backgroundColor: {
            xs: 'primary.main',
            sm: 'primary.main',
            md: 'primary.main',
            lg: 'primary.light',
            xl: 'primary.light',
          },
          transform: {
            xs: 'scale(1.2)',
            sm: 'scale(1.2)',
            md: 'scale(1.2)',
            lg: 'scale(1.1)',
            xl: 'scale(1.1)',
          },
          border: {
            xs: '2px solid primary.main',
            sm: '2px solid primary.main',
            md: '2px solid primary.main',
            lg: '2px solid white',
            xl: '2px solid white',
          },
        },
      }}
    />
  )
})

CarouselIndicator.displayName = 'CarouselIndicator'

export default CarouselIndicator
