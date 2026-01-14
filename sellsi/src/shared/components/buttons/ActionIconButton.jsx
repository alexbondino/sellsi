/**
 * ============================================================================
 * ACTION ICON BUTTON - Componente estandarizado para botones de acción
 * ============================================================================
 * 
 * Botón de acción consistente usado en todas las tablas y listas.
 * Proporciona estilos, tamaños y efectos hover estandarizados.
 */

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';

/**
 * Variantes de color disponibles con sus hovers correspondientes
 */
const COLOR_VARIANTS = {
  success: {
    color: 'success',
    hover: { backgroundColor: 'success.light', color: 'white' },
  },
  error: {
    color: 'error',
    hover: { backgroundColor: 'error.light', color: 'white' },
  },
  primary: {
    color: 'primary',
    hover: { backgroundColor: 'primary.light', color: 'white' },
  },
  info: {
    color: 'info',
    hover: { backgroundColor: 'info.light', color: 'white' },
  },
  default: {
    color: 'default',
    hover: { backgroundColor: 'action.hover' },
  },
};

/**
 * ActionIconButton - Botón de acción estandarizado
 * 
 * @param {string} tooltip - Texto del tooltip
 * @param {string} variant - Variante de color: 'success' | 'error' | 'primary' | 'default'
 * @param {function} onClick - Handler del click
 * @param {ReactNode} children - Icono a mostrar
 * @param {object} sx - Estilos adicionales (opcional)
 * @param {string} ariaLabel - Aria label para accesibilidad (opcional)
 */
const ActionIconButton = ({
  tooltip,
  variant = 'default',
  onClick,
  children,
  sx = {},
  ariaLabel,
  ...otherProps
}) => {
  const colorConfig = COLOR_VARIANTS[variant] || COLOR_VARIANTS.default;

  // Clonar el icono hijo y forzar fontSize="medium" para todos los iconos si es un elemento React
  let iconToRender = children;
  if (React.isValidElement(children)) {
    iconToRender = React.cloneElement(children, { fontSize: 'medium' });
  }

  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        color={colorConfig.color}
        onClick={onClick}
        aria-label={ariaLabel || tooltip}
        sx={{
          '&:hover': colorConfig.hover,
          '&:focus': { outline: 'none', boxShadow: 'none' },
          '&.Mui-focusVisible': { outline: 'none', boxShadow: 'none' },
          ...sx,
        }}
        {...otherProps}
      >
        {iconToRender}
      </IconButton>
    </Tooltip>
  );
};

export default ActionIconButton;
