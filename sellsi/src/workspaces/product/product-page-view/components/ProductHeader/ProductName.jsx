/**
 * ProductName - Muestra el nombre del producto
 *
 * Versiones responsivas:
 * - Desktop: h4 con botón copiar
 * - Mobile: h5 centrado sin botón
 */
import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  TYPOGRAPHY_STYLES,
  INFO_STYLES,
} from '../../styles/productPageStyles';

const ProductName = ({ nombre, isMobile = false }) => {
  // Versión móvil - centrado sin botón copiar
  if (isMobile) {
    return (
      <Box sx={INFO_STYLES.mobileTitleContainer}>
        <Typography variant="h5" sx={TYPOGRAPHY_STYLES.productTitleMobile}>
          {nombre}
        </Typography>
      </Box>
    );
  }

  // Versión desktop
  return (
    <Box sx={INFO_STYLES.titleContainer}>
      <Typography variant="h4" sx={TYPOGRAPHY_STYLES.productTitleDesktop}>
        {nombre}
      </Typography>
    </Box>
  );
};

export default ProductName;
