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
  buyerImgSrc = '/assets/hero-illustration.png',
  supplierImgSrc = '/assets/hero-illustration-2.png',
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

  // Estilos comunes de imagen (mockup)
  const imageSx = {
    width: { xs: '100%', md: 640, lg: 640 },
    height: { xs: 'auto', md: 370, lg: 370 },
    objectFit: 'cover',
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    backgroundColor: '#fff',
    display: 'block',
  };

  return (
    <Box ref={quienesSomosRef} component="section">
      {/* ===================== Bloque 1: Compradores ===================== */}
      <Grid container spacing={{ xs: 3, md: 6 }}>
        {/* Imagen izquierda */}
        <Grid item xs={12} md={6} mr={10}>
          <YouTubeEmbed
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Compradores - Demo"
          />
        </Grid>

        {/* Texto + CTA derecha */}
        <Grid item xs={12} md={6} width="640px">
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
        {/* Texto + CTA izquierda */}
        <Grid item xs={12} md={6} mr={10} width="640px">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#F59E0B',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            Llega a nuevos clientes y aumenta tus ventas
          </Typography>

          <Box sx={{ display: 'grid', gap: 1.25, mb: 3, mt: 5 }}>
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

          {/* Bloque 2 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
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

        {/* Imagen derecha */}
        <Grid item xs={12} md={6} order={{ xs: 1, md: 2 }}>
          <YouTubeEmbed
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Compradores - Demo"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
