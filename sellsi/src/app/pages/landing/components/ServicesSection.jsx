// 📁 src/app/pages/landing/components/ServicesSection.jsx
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button, // para CTA azul
} from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import YouTubeEmbed from '../../../../shared/components/YouTubeEmbed';

export default function ServicesSection({
  quienesSomosRef,
  onExploreClick,
  onBecomeSupplierClick,
}) {
  const goExplore = () =>
    onExploreClick ? onExploreClick() : window.location.assign('/marketplace');

  const goBecomeSupplier = () =>
    onBecomeSupplierClick
      ? onBecomeSupplierClick()
      : window.location.assign('/contacto');

  // ✅ Bullet usa variant="bullet" definido en theme.js
  const Bullet = ({ children, color = 'primary.main' }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
      <ChevronRightRoundedIcon sx={{ mt: '6px', color }} />
      <Typography variant="bullet">{children}</Typography>
    </Box>
  );

  return (
    <Box ref={quienesSomosRef} component="section">
      {/* ===================== Bloque 1: Compradores ===================== */}
      <Grid container spacing={{ xs: 3, md: 6 }}>
        {/* Columna izquierda (video en desktop) */}
        <Grid
          item
          xs={12}
          md={6}
          mr={{
            xs: 0, // Telefonos Chicos
            sm: 0, // Telefonos grandes
            mini: 10, // Tablets
            md: 10, // ??
            mac: 10, //  Mac M1
            lg: 10, // 1080p
            xl: 10, // 2K
          }}
        >
          {/* --- Mobile-only: Título arriba del video --- */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: '#2E52B2',
                mb: 2,
                textAlign: 'left',
              }}
            >
              Simplifica y agiliza tus compras B2B en un solo lugar
            </Typography>
          </Box>

          {/* Video (siempre visible) */}
          <YouTubeEmbed
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Compradores - Demo"
          />

          {/* --- Mobile-only: Bullets debajo del video --- */}
          <Box sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.25, mt: 3 }}>
            <Bullet color="#2E52B2">
              Encuentra proveedores verificados y confiables en minutos.
            </Bullet>
            <Bullet color="#2E52B2">
              Ahorra tiempo comparando precios y condiciones en un solo
              marketplace.
            </Bullet>
            <Bullet color="#2E52B2">
              Realiza compras seguras con procesos simples, transparentes y
              confiables.
            </Bullet>
          </Box>

          {/* --- Mobile-only: Botón al final --- */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              justifyContent: 'center',
              mt: 5,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={goExplore}
              sx={{
                px: 3.5,
                py: 1.25,
                fontSize: '20px',
                height: 59,
                width: '100%',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 6px 18px rgba(33,150,243,0.28)',
                bgcolor: '#2E52B2',
              }}
            >
              Explorar Marketplace
            </Button>
          </Box>
        </Grid>

        {/* Columna derecha (texto + CTA en desktop) */}
        <Grid
          item
          xs={12}
          md={6}
          width="640px"
          sx={{ display: { xs: 'none', md: 'block' } }}
          alignContent={'right'}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#2E52B2',
              mb: 2,
            }}
          >
            Simplifica y agiliza tus compras B2B en un solo lugar
          </Typography>

          <Box sx={{ display: 'grid', gap: 1.25, mb: 3, mt: 5 }}>
            <Bullet color="#2E52B2">
              Encuentra proveedores verificados y confiables en minutos.
            </Bullet>
            <Bullet color="#2E52B2">
              Ahorra tiempo comparando precios y condiciones en un solo
              marketplace.
            </Bullet>
            <Bullet color="#2E52B2">
              Realiza compras seguras con procesos simples, transparentes y
              confiables.
            </Bullet>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={goExplore}
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
          </Box>
        </Grid>
      </Grid>

      {/* ===================== Bloque 2: Proveedores ===================== */}
      <Grid
        container
        spacing={{ xs: 3, md: 6 }}
        alignItems="center"
        sx={{ mt: { xs: 8, md: 12 } }}
      >
        {/* Texto + CTA izquierda (desktop) */}
        <Grid
          item
          xs={12}
          md={6}
          mr={{
            xs: 0, // Telefonos Chicos
            sm: 0, // Telefonos grandes
            mini: 10, // Tablets
            md: 10, // ??
            mac: 10, //  Mac M1
            lg: 10, // 1080p
            xl: 10, // 2K
          }}
          width="640px"
          order={{ xs: 1, md: 1 }} // título primero en móvil
        >
          {/* Título (visible siempre) */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#F59E0B',
              mb: 2,
              lineHeight: 1.2,
              textAlign: 'left',
            }}
          >
            Llega a nuevos clientes y aumenta tus ventas
          </Typography>

          {/* --- Desktop-only: Bullets debajo del título --- */}
          <Box
            sx={{
              display: { xs: 'none', md: 'grid' },
              gap: 1.25,
              mb: 3,
              mt: 5,
            }}
          >
            <Bullet color="#F59E0B">
              Accede a una red creciente de empresas compradoras en Chile.
            </Bullet>
            <Bullet color="#F59E0B">
              Destaca tus productos en un marketplace seguro y confiable.
            </Bullet>
            <Bullet color="#F59E0B">
              Simplifica la gestión de ventas con herramientas diseñadas para
              ti.
            </Bullet>
          </Box>

          {/* --- Desktop-only: Botón --- */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'center',
              mt: 5,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={goBecomeSupplier}
              sx={{
                px: 3.5,
                py: 1.25,
                fontSize: '20px',
                height: 59,
                width: 295,
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 6px 18px rgba(33,150,243,0.28)',
                bgcolor: '#F59E0B',
              }}
            >
              Quiero Ser Proveedor
            </Button>
          </Box>
        </Grid>

        {/* Video derecha (desktop). En móvil también muestra bullets+botón debajo */}
        <Grid item xs={12} md={6} order={{ xs: 2, md: 2 }}>
          <YouTubeEmbed
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Compradores - Demo"
          />

          {/* --- Mobile-only: Bullets después del video --- */}
          <Box
            sx={{
              display: { xs: 'grid', md: 'none' },
              gap: 1.25,
              mb: 3,
              mt: 3,
            }}
          >
            <Bullet color="#F59E0B">
              Accede a una red creciente de empresas compradoras en Chile.
            </Bullet>
            <Bullet color="#F59E0B">
              Destaca tus productos en un marketplace seguro y confiable.
            </Bullet>
            <Bullet color="#F59E0B">
              Simplifica la gestión de ventas con herramientas diseñadas para
              ti.
            </Bullet>
          </Box>

          {/* --- Mobile-only: Botón --- */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              justifyContent: 'center',
              mt: 2,
            }}
          >
            <Button
              variant="contained"
              onClick={goBecomeSupplier}
              sx={{
                px: 3.5,
                py: 1.25,
                fontSize: '20px',
                height: 59,
                width: '100%',
                fontWeight: 700,
                borderRadius: 2,
                boxShadow: '0 6px 18px rgba(33,150,243,0.28)',
                bgcolor: '#F59E0B',
                color: '#fff',
                '&:hover': { bgcolor: '#FFA000' },
              }}
            >
              Quiero Ser Proveedor
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
