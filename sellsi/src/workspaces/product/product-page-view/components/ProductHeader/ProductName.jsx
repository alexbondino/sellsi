/**
 * ProductName - Muestra el nombre del producto
 *
 * Versiones responsivas:
 * - Desktop: h4 con botón copiar
 * - Mobile: h5 centrado sin botón
 */
import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { TYPOGRAPHY_STYLES, INFO_STYLES } from '../../styles/productPageStyles';
import { toTitleCase } from '../../../../../utils/textFormatters';

const ProductName = ({ nombre, isMobile = false }) => {
  const formattedName = toTitleCase(nombre);

  // Versión móvil - centrado sin botón copiar
  if (isMobile) {
    return (
      <Box sx={INFO_STYLES.mobileTitleContainer}>
        <Typography variant="h5" sx={TYPOGRAPHY_STYLES.productTitleMobile}>
          {formattedName}
        </Typography>
        <Divider
          sx={{
            width: '60%',
            mt: 2,
            mx: 'auto',
            borderColor: 'primary.main',
            borderWidth: 1.5,
          }}
        />
      </Box>
    );
  }

  // Versión desktop
  return (
    <Box sx={INFO_STYLES.titleContainer}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" sx={TYPOGRAPHY_STYLES.productTitleDesktop}>
          {formattedName}
        </Typography>
        <Divider
          sx={{
            width: '77.5%',
            mt: 0,
            borderColor: 'primary.main',
            borderWidth: 1,
          }}
        />
      </Box>
    </Box>
  );
};

export default ProductName;
