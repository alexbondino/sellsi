// 📁 workspaces/landing/components/AboutUsSection.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const AboutUsSection = ({ quienesSomosRef }) => {
  return (
    <Box
      ref={quienesSomosRef}
      sx={{
        // Dejar 40px por encima cuando se haga scrollIntoView desde el TopBar
        scrollMarginTop: '40px',
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
        Somos Sellsi
      </Typography>

      {/* Subtítulo */}
      <Typography
        variant="h3"
        sx={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 600,
          color: 'primary.main',
          mb: 3,
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        Simplificamos el comercio entre empresas
      </Typography>

      {/* Texto */}
      <Typography
        variant="h3"
        sx={{
          lineHeight: 1.7,
          color: 'text.primary',
          maxWidth: '100%',
        }}
      >
        En un mercado altamente complejo,{' '}
        <Box component="span" sx={{ fontWeight: 800, color: 'primary.main' }}>
          Sellsi
        </Box>{' '}
        aporta claridad. Desarrollamos tecnología para transformar la manera en que las empresas interactúan.{' '}
        <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
          Simple. Seguro. Transparente.
        </Box>
      </Typography>
    </Box>
  );
};

export default AboutUsSection;
