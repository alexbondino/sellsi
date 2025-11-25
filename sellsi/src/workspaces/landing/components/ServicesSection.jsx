// 📁 workspaces/landing/components/ServicesSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Button } from '@mui/material';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';

export default function ServicesSection({
  serviciosRef,
  onExploreClick,
  onBecomeSupplierClick,
}) {
  const navigate = useNavigate();

  const goExplore = () =>
    onExploreClick ? onExploreClick() : window.location.assign('/marketplace');

  const goBecomeSupplier = () => {
    if (onBecomeSupplierClick) return onBecomeSupplierClick();
    navigate(
      `/?scrollTo=${encodeURIComponent('contactModal')}&t=${Date.now()}`
    );
  };

  const Bullet = ({ children, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
      <ChevronRightRoundedIcon sx={{ mt: '6px', color }} />
      <Typography variant="bullet">{children}</Typography>
    </Box>
  );

  // 🔥 IMÁGENES
  const IMAGE_1 = '/Landing Page/imagenuno.png';
  const IMAGE_2 = '/Landing Page/supplierImage.png'; // cámbiala si quieres otra

  const Img = ({ src }) => (
    <Box
      component="img"
      src={src}
      alt="Landing Media"
      sx={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 2,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minHeight: { xs: 220, sm: 260, md: 340, lg: 380 },
        maxHeight: '100%',
      }}
    />
  );

  return (
    <Box
      ref={serviciosRef}
      component="section"
      sx={{ pt: { xs: 2, md: 10 }, pb: 10 }}
    >
      <Grid
        container
        spacing={5}
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr 1fr',
          },
          gridTemplateRows: {
            xs: 'auto auto auto auto',
            md: 'auto auto',
          },
          gridAutoRows: { xs: 'auto', md: '1fr' },
          gap: 6,
        }}
      >
        {/* (1,1) Imagen Compradores */}
        <Box
          gridColumn="1"
          gridRow="1"
          height="100%"
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <Img src={IMAGE_1} />
        </Box>

        {/* (1,2) Texto Compradores */}
        <Box
          gridColumn={{ xs: '1', md: '2' }}
          gridRow={{ xs: '2', md: '1' }}
          height="100%"
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
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

          <Box sx={{ display: 'grid', gap: 1.25, mt: 4 }}>
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

          <Button
            variant="contained"
            onClick={goExplore}
            sx={{
              px: 3.5,
              py: 1.25,
              fontSize: '20px',
              height: 59,
              width: '100%',
              mt: 5,
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#2E52B2',
              color: '#fff',
              boxShadow: '0 6px 18px rgba(33,150,243,0.28)',
            }}
          >
            Explorar Marketplace
          </Button>
        </Box>

        {/* (2,1) Texto Proveedores */}
        <Box
          gridColumn="1"
          gridRow={{ xs: '3', md: '2' }}
          height="100%"
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#F59E0B',
              mb: 2,
              textAlign: 'left',
              lineHeight: 1.2,
            }}
          >
            Llega a nuevos clientes y aumenta tus ventas
          </Typography>

          <Box sx={{ display: 'grid', gap: 1.25, mt: 4 }}>
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

          <Button
            variant="contained"
            onClick={goBecomeSupplier}
            sx={{
              px: 3.5,
              py: 1.25,
              fontSize: '20px',
              height: 59,
              width: '100%',
              mt: 5,
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: '#F59E0B',
              color: '#fff',
              boxShadow: '0 6px 18px rgba(33,150,243,0.28)',
            }}
          >
            Quiero Ser Proveedor
          </Button>
        </Box>

        {/* (2,2) Imagen Proveedores */}
        <Box
          gridColumn={{ xs: '1', md: '2' }}
          gridRow={{ xs: '4', md: '2' }}
          sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <Img src={IMAGE_2} />
        </Box>
      </Grid>
    </Box>
  );
}
