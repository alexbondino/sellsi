// 📁 src/app/pages/landing/components/HeroSection.jsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function HeroSection({
  // ✅ usa ruta pública absoluta (funciona en build)
  illustrationSrc = '/assets/hero-illustration.webp',
  illustrationAlt = 'Presentación de Sellsi',
  onExploreClick,
  onDemoClick,
}) {
  const handleExplore = () =>
    onExploreClick ? onExploreClick() : window.location.assign('/marketplace');

  const handleDemo = () =>
    onDemoClick ? onDemoClick() : window.location.assign('/contacto');

  // Padding simétrico por lado (considera safe areas)
  const pl = {
    xs: 'max(25px, env(safe-area-inset-left))',
    sm: 'max(30px, env(safe-area-inset-right))',
    md: '180px', // MacBook Air M1
    mac: '180px',
    lg: '250px',
    xl: '250px',
  };
  const pr = {
    xs: 'max(25px, env(safe-area-inset-right))',
    sm: 'max(30px, env(safe-area-inset-right))',
    md: '180px', // MacBook Air M1
    lg: '250px',
    xl: '250px',
  };

  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        minHeight: { xs: 850, sm: 900, md: 500, lg: 500 },
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' },
        alignItems: 'center',
        gap: { xs: 3, md: 6 },
        pl,
        pr,
        bgcolor: '#000',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Columna izquierda: texto + imagen (en móvil) + CTAs */}
      <Box
        sx={{
          maxWidth: {
            xs: '100%', // Telefonos Chicos
            sm: '100%', // Telefonos grandes
            mini: 576, // Tablets
            md: 768, // ??
            mac: 580, //  Mac M1
            lg: 660, // 1080p
            xl: 2160, // 2K
          },
          zIndex: 1,
        }}
      >
        {/* Título */}
        <Typography
          variant="h1"
          sx={{
            color: '#fff',
            letterSpacing: '-0.5px',
            textShadow: '0 2px 8px rgba(0,0,0,0.18)',
            textAlign: 'left', // 👈 móvil a la izquierda
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

        {/* Subtítulo */}
        <Typography
          variant="h3"
          sx={{
            mt: 2.5,
            color: '#FFFFFF',
            maxWidth: 820,
            textAlign: 'left', // 👈 móvil a la izquierda
          }}
        >
          Nuestro marketplace B2B simplifica el abastecimiento, conecta
          compradores con proveedores confiables, impulsa las ventas y asegura
          transacciones rápidas y seguras. Todo, en un solo lugar.
        </Typography>

        {/* Imagen: entre texto y botones en móvil; absoluta en md+ */}
        <Box
          sx={{
            position: { xs: 'static', md: 'absolute' },
            bottom: { md: 0 },
            right: pr, // 👈 alineada con padding derecho en md+
            mt: { xs: 3, md: 0 },
            mb: { xs: 3, md: 0 }, // separa de los botones en móvil
            zIndex: 0,
          }}
        >
          <Box
            component="img"
            src={illustrationSrc}
            alt={illustrationAlt}
            loading="eager"
            decoding="sync"
            sx={{
              width: {
                xs: 'min(90vw, 420px)', // 👈 ocupa bien el ancho en móvil
                md: '600px',
              },
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              userSelect: 'none',
              pointerEvents: 'none',
              display: 'block',
            }}
          />
        </Box>

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
              width: {
                xs: '100%', // 👈 full-width en móvil
                sm: '100%',
                md: 270, // MacBook Air M1
                mac: 260,
                lg: 295,
              },
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
              width: { xs: '100%', sm: '100%', md: 295, mac: 260, lg: 295 }, // 👈 full-width en móvil
              bgcolor: '#F59E0B',
              color: '#fff',
              '&:hover': { bgcolor: '#FFA000' },
            }}
          >
            Agendar Demo
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
