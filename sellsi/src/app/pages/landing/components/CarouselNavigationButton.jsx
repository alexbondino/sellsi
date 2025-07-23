import React from 'react';
import { IconButton } from '@mui/material';
import { ArrowForward, ArrowBack } from '@mui/icons-material';

/**
 * ====================================================================================
 * CAROUSEL NAVIGATION BUTTON - BOTÓN DE NAVEGACIÓN DE CARRUSEL
 * ============================================================================
 *
 * Componente UI puro para botones de navegación (anterior/siguiente) en carruseles
 *
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {string} props.direction - Dirección del botón ('prev' | 'next')
 * @param {Function} props.onClick - Función callback al hacer clic
 * @param {Object} props.position - Posición personalizada del botón (opcional)
 *
 * CARACTERÍSTICAS:
 * - Botones flotantes con posicionamiento absoluto
 * - Iconos direccionales intuitivos (flechas)
 * - Estilos responsivos y adaptativos
 * - Efectos hover y transiciones suaves
 * - Posicionamiento personalizable
 * - Accesibilidad optimizada
 */
const CarouselNavigationButton = React.memo(
  ({ direction, onClick, position }) => {
    const Icon = direction === 'prev' ? ArrowBack : ArrowForward;

    return (
      <IconButton
        aria-label={direction === 'prev' ? 'Anterior' : 'Siguiente'}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          if (e.currentTarget && typeof e.currentTarget.blur === 'function') {
            e.currentTarget.blur();
          }
          onClick && onClick(e);
        }}
        onMouseDown={e => e.preventDefault()}
        tabIndex={-1}
        sx={{
          background: 'rgba(0,0,0,0.3)',
          color: 'white',
          position: 'absolute',
          top: '50%',
          [direction === 'prev' ? 'left' : 'right']: '5%',
          zIndex: 5,
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateY(-50%)',
          '&:hover': {
            background: 'rgba(0,0,0,0.5)',
          },
          ...position,
        }}
        size="large"
      >
        <Icon fontSize="inherit" />
      </IconButton>
    );
  }
);

CarouselNavigationButton.displayName = 'CarouselNavigationButton';

export default CarouselNavigationButton;

