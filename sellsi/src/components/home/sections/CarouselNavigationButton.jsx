import React from 'react'
import { IconButton } from '@mui/material'
import { ArrowForward, ArrowBack } from '@mui/icons-material'

// Componente memoizado para botones de navegación de carrusel
const CarouselNavigationButton = React.memo(
  ({
    direction,
    onClick,
    variant = 'desktop', // 'desktop' | 'mobile'
    position,
  }) => {
    const Icon = direction === 'prev' ? ArrowBack : ArrowForward

    const getButtonSx = () => {
      const baseSx = {
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        color: 'white',
        zIndex: 5,
        '&:hover': {
          backgroundColor:
            variant === 'mobile' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.6)',
        },
      }

      if (variant === 'mobile') {
        return {
          ...baseSx,
          display: { xs: 'inline-flex', lg: 'none' },
          position: 'absolute',
          top: '45%',
          [direction === 'prev' ? 'left' : 'right']: '5%',
          transform: 'translateY(-50%)',
          width: 40,
          height: 40,
        }
      }

      // Desktop variant
      return {
        ...baseSx,
        display: { xs: 'none', lg: 'inline-flex' },
        position: 'absolute',
        top: '50%',
        [direction === 'prev' ? 'left' : 'right']: position,
        transform: 'translateY(-50%)',
      }
    }

    return (
      <IconButton onClick={onClick} sx={getButtonSx()}>
        <Icon fontSize={variant === 'mobile' ? 'medium' : 'large'} />
      </IconButton>
    )
  }
)

CarouselNavigationButton.displayName = 'CarouselNavigationButton'

export default CarouselNavigationButton
