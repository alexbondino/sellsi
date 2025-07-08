import React from 'react';
import { Box, CircularProgress } from '@mui/material';
// Usar la ruta pública para el logo
const minilogo = '/minilogo.svg';

const Loader = ({ size = 80, logoSize = 48, thickness = 4.5, color = 'primary' }) => (
  <Box sx={{ position: 'relative', width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    <img
      src={minilogo}
      alt="Logo"
      style={{ width: logoSize, height: logoSize, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}
    />
    <CircularProgress
      size={size}
      thickness={thickness}
      color={color}
      sx={{
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 1
      }}
    />
  </Box>
);

export default Loader;
