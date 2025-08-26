// 📁 src/app/pages/landing/components/AboutUsSection.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const AboutUsSection = ({ serviciosRef }) => {
  return (
    <Box
      ref={serviciosRef}
      sx={{
        width: '100%',
        boxSizing: 'border-box',
        px: {
          xs: 'max(25px, env(safe-area-inset-left))', // Telefonos Chicos
          sm: 'max(30px, env(safe-area-inset-left))', // Telefonos grandes
          mac: '180px', //  Mac M1
          lg: '250px', // 1080p
          xl: '250px', // 2K
        },
        py: { xs: 6, sm: 7, md: 8, mac: 6, lg: 9, xl: 9 },
        backgroundColor: 'rgba(46,82,178,0.08)', // fondo claro tipo el ejemplo
        borderRadius: { xs: 0, md: 2 },
      }}
    >
      {/* Título */}
      <Typography
        variant="h1"
        sx={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 800,
          color: 'primary.main',
          mb: { xs: 3, md: 4 },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        ¿Quienes Somos?
      </Typography>

      {/* Párrafo 1 */}
      <Typography
        variant="h3"
        sx={{
          lineHeight: 1.7,
          color: 'text.primary',
          maxWidth: '100%',
          mb: 3,
        }}
      >
        En{' '}
        <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Sellsi
        </Box>{' '}
        ayudamos a
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {' '}
          empresas compradoras
        </Box>{' '}
        a encontrar
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {' '}
          proveedores confiables
        </Box>{' '}
        y gestionar sus compras en un
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {' '}
          marketplace B2B
        </Box>{' '}
        simple, seguro y transparente.
      </Typography>

      {/* Párrafo 2 */}
      <Typography
        variant="h3"
        sx={{
          lineHeight: 1.7,
          color: 'text.primary',
          maxWidth: '100%',
        }}
      >
        Para{' '}
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          proveedores
        </Box>
        , ofrecemos un canal digital para
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {' '}
          aumentar la visibilidad
        </Box>
        ,
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {' '}
          llegar a nuevos clientes
        </Box>{' '}
        y
        <Box component="span" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {' '}
          vender con control
        </Box>{' '}
        sobre precios y stock.
      </Typography>
    </Box>
  );
};

export default AboutUsSection;
