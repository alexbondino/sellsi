// 📁 workspaces/landing/components/HeroSection.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function HeroSection({
  illustrationSrc = '/assets/hero-illustration.webp',
  illustrationAlt = 'Presentación de Sellsi',
  onExploreClick,
  onDemoClick,
}) {
  const navigate = useNavigate();

  const handleExplore = () =>
    onExploreClick ? onExploreClick() : window.location.assign('/marketplace');

  const handleDemo = () => {
    if (onDemoClick) return onDemoClick();
    const search = `?scrollTo=${encodeURIComponent(
      'contactModal'
    )}&t=${Date.now()}`;
    navigate(`/${search}`);
  };

  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        minHeight: { xs: 900, md: 600 },
        bgcolor: '#000',
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: '1fr 1fr',
        },
        alignItems: 'center',
        gap: { xs: 4, md: 6 },
        // 🔥 MISMOS MÁRGENES LATERALES QUE EL CONTENEDOR DE HOME
        px: {
          xs: 'max(25px, env(safe-area-inset-left))', // Teléfonos chicos
          sm: 'max(30px, env(safe-area-inset-left))', // Teléfonos grandes
          mac: '180px', // Mac M1
          lg: '250px', // 1080p
          xl: '250px', // 2K
        },
        py: { xs: 6, md: 8 },
      }}
    >
      {/* =================== COLUMNA 1: TEXTO + BOTONES =================== */}
      <Box
        sx={{
          gridColumn: 1,
          color: '#fff',
          width: '100%',
          zIndex: 2,
          maxWidth: { xs: '100%' },
        }}
      >
        <Typography
          variant="h1"
          sx={{
            color: '#fff',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 8px rgba(0,0,0,0.18)',
            textAlign: 'left',
          }}
        >
          Plataforma que conecta{' '}
          <Box component="span" sx={{ color: '#3f6ce9ff' }}>
            Compradores
          </Box>{' '}
          con{' '}
          <Box component="span" sx={{ color: '#F59E0B' }}>
            Proveedores
          </Box>{' '}
          de todo Chile
        </Typography>

        <Typography
          variant="h3"
          sx={{
            mt: 2.5,
            color: '#FFFFFF',
            maxWidth: 820,
            textAlign: 'left',
          }}
        >
          Nuestro marketplace corporativo simplifica el abastecimiento, conecta
          compradores con proveedores confiables, impulsa las ventas y asegura
          transacciones rápidas y seguras. Todo, en un solo lugar.
        </Typography>

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
              width: { xs: '100%', md: '45%' },
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2E52B2',
              boxShadow: '0 6px 18px rgba(33,150,243,0.28)',
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
              height: 59,
              width: { xs: '100%', md: '45%' },
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#F59E0B',
              color: '#fff',
              '&:hover': { bgcolor: '#FFA000' },
            }}
          >
            Agendar Demo
          </Button>
        </Box>
      </Box>

      {/* =================== COLUMNA 2: SOLO IMAGEN =================== */}
      <Box
        sx={{
          gridColumn: { xs: 1, md: 2 },
          justifySelf: { xs: 'center', md: 'end' },
        }}
      >
        <Box
          component="img"
          src={illustrationSrc}
          alt={illustrationAlt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          sx={{
            width: { xs: 'min(90vw, 420px)', md: '100%' },
            height: '100%',
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
