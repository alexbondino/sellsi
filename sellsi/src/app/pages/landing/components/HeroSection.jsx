// 📁 src/app/pages/landing/components/HeroSection.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function HeroSection({
  illustrationSrc = '../../../../../public/assets/hero-illustration.png',
  illustrationAlt = 'Presentación de Sellsi',
  onExploreClick,
  onDemoClick,
}) {
  const handleExplore = () =>
    onExploreClick ? onExploreClick() : window.location.assign('/marketplace');

  const handleDemo = () =>
    onDemoClick ? onDemoClick() : window.location.assign('/contacto');

  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        minHeight: { xs: 500, md: 500, lg: 500 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
        alignItems: 'center',
        gap: { xs: 3, md: 6 },
        px: '250px', // ✅ padding fijo izquierda/derecha
        bgcolor: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Columna izquierda: texto + CTAs */}
      <Box maxWidth="660px">
        {/* Título principal */}
        <Typography
          variant="h1"
          sx={{
            color: '#fff',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}
        >
          Software que conecta{' '}
          <Box component="span" sx={{ color: '#3f6ce9ff' }}>
            Compradores
          </Box>{' '}
          con{' '}
          <Box component="span" sx={{ color: '#F59E0B' }}>
            Proveedores
          </Box>{' '}
          de todo Chile
        </Typography>

        {/* Subtítulo / descripción */}
        <Typography
          variant="h3"
          sx={{
            mt: 2.5,
            color: '#FFFFFF',
            maxWidth: 820,
          }}
        >
          Nuestro marketplace B2B simplifica el abastecimiento, conecta
          compradores con proveedores confiables, impulsa las ventas y asegura
          transacciones rápidas y seguras. Todo, en un solo lugar.
        </Typography>

        {/* Botones */}
        <Box
          sx={{
            mt: 4,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleExplore}
            sx={{
              px: 3.5,
              py: 1.25,
              fontSize: '20px',
              height: 59,
              width: 295,
              fontWeight: 700,
              borderRadius: 2,
              boxShadow: '0 6px 18px rgba(33,150,243,0.28)',
              bgcolor: '#2E52B2',
            }}
          >
            Explorar Marketplace
          </Button>

          <Button
            variant="contained"
            onClick={handleDemo}
            sx={{
              px: 3.5,
              py: 1.25,
              fontSize: '20px',
              fontWeight: 700,
              borderRadius: 2,
              height: 59,
              width: 295,
              bgcolor: '#F59E0B',
              color: '#fff',
              '&:hover': { bgcolor: '#FFA000' },
            }}
          >
            Agendar Demo
          </Button>
        </Box>
      </Box>

      {/* Columna derecha: ilustración */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' }, // no hace falta flex aquí
          position: 'absolute', // 👈 la fijamos dentro del section
          bottom: 0, // 👈 pegada al borde inferior
          right: '250px', // 👈 la empujamos para alinearla con tu padding
        }}
      >
        <Box
          component="img"
          src={illustrationSrc}
          alt={illustrationAlt}
          loading="eager"
          decoding="sync"
          sx={{
            width: '600px',
            height: 'auto',
            objectFit: 'contain',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Box>
  );
}
