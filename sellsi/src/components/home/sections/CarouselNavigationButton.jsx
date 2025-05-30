import React from 'react'
import { IconButton } from '@mui/material'
import { ArrowForward, ArrowBack } from '@mui/icons-material'

// Componente memoizado para botones de navegación de carrusel
const CarouselNavigationButton = React.memo(
  ({ direction, onClick, position }) => {
    const Icon = direction === 'prev' ? ArrowBack : ArrowForward

    return (
      <IconButton
        onClick={onClick}
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          color: 'white',
          zIndex: 5,
          position: 'absolute',
          transform: 'translateY(-50%)',
          // Display logic: mobile on xs-md, desktop on lg-xl
          display: {
            xs: 'inline-flex',
            sm: 'inline-flex',
            md: 'inline-flex',
            lg: 'inline-flex',
            xl: 'inline-flex',
          },
          // Position logic
          top: {
            xs: '45%',
            sm: '45%',
            md: '45%',
            lg: '50%',
            xl: '50%',
          },
          [direction === 'prev' ? 'left' : 'right']: {
            xs: '5%',
            sm: '5%',
            md: '5%',
            lg: position || '2%',
            xl: position || '2%',
          },
          // Size logic
          width: {
            xs: 40,
            sm: 40,
            md: 40,
            lg: 48,
            xl: 48,
          },
          height: {
            xs: 40,
            sm: 40,
            md: 40,
            lg: 48,
            xl: 48,
          },
          '&:hover': {
            backgroundColor: {
              xs: 'rgba(0, 0, 0, 0.7)',
              sm: 'rgba(0, 0, 0, 0.7)',
              md: 'rgba(0, 0, 0, 0.7)',
              lg: 'rgba(0, 0, 0, 0.6)',
              xl: 'rgba(0, 0, 0, 0.6)',
            },
          },
        }}
      >
        {' '}
        <Icon
          sx={{
            fontSize: {
              xs: '24px',
              sm: '24px',
              md: '24px',
              lg: '32px',
              xl: '32px',
            },
          }}
        />
      </IconButton>
    )
  }
)

CarouselNavigationButton.displayName = 'CarouselNavigationButton'

export default CarouselNavigationButton
