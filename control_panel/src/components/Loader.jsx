import React from 'react';
import { Box, CircularProgress } from '@mui/material';

// Imagen base del loader (optimizada). Opcional: añadir variante @2x y srcSet si se crea.
const LOADER_IMAGE_SRC = '/logos/sellsi_minilogoLoader.webp';
export const LOADER_DEFAULT_SIZE = 80;      // Radio externo (círculo)
export const LOADER_DEFAULT_LOGO_SIZE = 48;  // Tamaño del logo central

/**
 * Loader consistente: centraliza defaults para evitar divergencias.
 * Props siguen permitiendo overrides puntuales.
 */
const Loader = ({
  size = LOADER_DEFAULT_SIZE,
  logoSize = LOADER_DEFAULT_LOGO_SIZE,
  thickness = 4.5,
  color = 'primary'
}) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <img
        src={LOADER_IMAGE_SRC}
        alt="Logo"
        decoding="async"
        loading="eager"
        style={{
          width: logoSize,
          height: logoSize,
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          objectFit: 'contain'
        }}
      />
      <CircularProgress
        size={size}
        thickness={thickness}
        color={color}
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          zIndex: 221,
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
};

export default Loader;
