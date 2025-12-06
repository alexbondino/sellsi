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
  const IMAGE_1 = '/Landing Page/imagenuno.webp';
  const IMAGE_2 = '/Landing Page/supplierImage.png'; // cámbiala si quieres otra

  const Img = ({ src }) => (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="img"
        src={src}
        alt="Landing Media"
        sx={{
          width: '100%',
          height: { xs: 280, sm: 320, md: 380, lg: 420 },
          objectFit: 'cover',
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
          },
        }}
      />
    </Box>
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
          gap: { xs: 6, md: 8 },
          alignItems: 'center',
        }}
      >
        {/* (1,1) Imagen Compradores */}
        <Box
          gridColumn={{ xs: '1', md: '1' }}
          gridRow={{ xs: '2', md: '1' }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Img src={IMAGE_1} />
        </Box>

        {/* (1,2) Texto Compradores */}
        <Box
          gridColumn={{ xs: '1', md: '2' }}
          gridRow={{ xs: '1', md: '1' }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              px: 2,
              py: 0.75,
              borderRadius: '50px',
              bgcolor: 'rgba(46, 82, 178, 0.1)',
              border: '1px solid rgba(46, 82, 178, 0.2)',
              mb: 2,
              alignItems: 'center',
              justifyContent: 'center',
              width: '40%',
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#2E52B2',
                letterSpacing: '0.5px',
              }}
            >
              PARA COMPRADORES
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#2E52B2',
              mb: 1,
              textAlign: 'left',
              fontSize: { xs: '1.6rem', md: 25 },
            }}
          >
            Centraliza y agiliza tus compras B2B en un solo lugar
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gap: 1.25,
              mt: 4,
              '& *': { fontSize: 18 },
            }}
          >
            <Bullet color="#2E52B2">
              Accede a proveedores verificados: Encuentra socios comerciales
              confiables en minutos.
            </Bullet>
            <Bullet color="#2E52B2">
              Optimiza tus tiempos de compra: Cotiza en línea, negocia volumen y
              cierra tratos en tiempo récord, sin cadenas de correos.
            </Bullet>
            <Bullet color="#2E52B2">
              Simplifica tu gestión: Realiza compras seguras y obtén tus
              facturas al instante en nuestra plataforma.
            </Bullet>
          </Box>

          <Button
            variant="contained"
            onClick={goExplore}
            sx={{
              px: 3.5,
              py: 1.25,
              fontSize: '17px',
              height: 50,
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
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              px: 2,
              py: 0.75,
              borderRadius: '50px',
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              mb: 2,
              alignItems: 'center',
              justifyContent: 'center',
              width: '40%',
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: '#F59E0B',
                letterSpacing: '0.5px',
              }}
            >
              PARA PROVEEDORES
            </Typography>
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#F59E0B',
              mb: 1,
              textAlign: 'left',
              lineHeight: 1.2,
              fontSize: { xs: '1.6rem', md: 25 },
            }}
          >
            Expande tu mercado y potencia tus ventas B2B
          </Typography>

          <Box
            sx={{ display: 'grid', gap: 1.25, mt: 4, '& *': { fontSize: 18 } }}
          >
            <Bullet color="#F59E0B">
              Accede a demanda calificada: Conecta con una red de empresas en
              Chile listas para comprar, sin salir a prospectar.
            </Bullet>
            <Bullet color="#F59E0B">
              Recibe cotizaciones directas: Digitaliza tu catálogo y cierra
              ventas por volumen con clientes que buscan lo que ofreces.
            </Bullet>
            <Bullet color="#F59E0B">
              Centraliza tu operación: Gestiona pedidos, negocia precios y emite
              tus facturas automáticamente en nuestra plataforma.
            </Bullet>
          </Box>

          <Button
            variant="contained"
            onClick={goBecomeSupplier}
            sx={{
              px: 3.5,
              py: 1.25,
              fontSize: '17px',
              height: 50,
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
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Img src={IMAGE_2} />
        </Box>
      </Grid>
    </Box>
  );
}
