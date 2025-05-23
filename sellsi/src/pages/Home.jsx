import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const Home = () => {
  return (
    <Box>
      {/* Sección superior: fondo gris con texto a la izquierda */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '65vh',
          px: 30,
          backgroundColor: '#e6e6e6',
        }}
      >
        {/* Texto izquierda */}
        <Box sx={{ flex: 1, maxWidth: '700px' }}>
          <Typography
            variant="h1"
            fontWeight="bold"
            gutterBottom
            sx={{ lineHeight: 1.4 }}
          >
            Somos Sellsi, el marketplace que conecta proveedores con vendedores
          </Typography>

          <Typography variant="h6" gutterBottom>
            Conectamos proveedores con vendedores de manera sencilla. Olvídate
            de ir a hablar con cada uno de ellos. Desarrollamos el ecosistema
            que necesitas para transar lo que necesites y cuando lo necesites.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              sx={{
                mt: 5,
                backgroundColor: 'primary.main',
                fontWeight: 'bold',
                borderRadius: '8px',
                px: 10,
                py: 1,
                fontSize: '1.4rem',
                textTransform: 'none',
              }}
            >
              Ir a marketplace
            </Button>
          </Box>
        </Box>

        {/* Derecha: Imagen promocional */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img src="/promotion.svg" alt="Promo Img" style={{ height: 600 }} />
        </Box>
      </Box>

      {/* Sección: Conoce a nuestros proveedores */}
      <Box
        hidden
        sx={{
          minHeight: '400px',
          backgroundColor: '#ffffff',
          px: 30,
          py: 6,
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Conoce a nuestros proveedores (TODO)
        </Typography>
        <Typography variant="h6">
          Esta sección mostrará próximamente los perfiles destacados de
          proveedores registrados en nuestra plataforma.
        </Typography>
      </Box>

      {/* Sección: Quiénes somos */}
      <Box sx={{ px: 30, py: 6, backgroundColor: '#ffffff' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          ¿Quiénes somos?
        </Typography>
        <Typography variant="h6">
          En Sellsi, creemos en la eficiencia del comercio digital. Nuestra
          misión es facilitar la conexión entre proveedores y vendedores,
          optimizando el proceso de abastecimiento y generación de relaciones
          comerciales duraderas.
        </Typography>
      </Box>

      {/* Sección: Servicios */}
      <Box sx={{ px: 30, py: 6, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Servicios
        </Typography>
        <Typography variant="h6">
          Ofrecemos una plataforma intuitiva para descubrir productos, contactar
          proveedores verificados, recibir métricas clave de rendimiento y
          gestionar tus procesos de compra con total transparencia.
        </Typography>
      </Box>

      {/* Sección: Trabaja con nosotros */}
      <Box hidden sx={{ px: 30, py: 6, backgroundColor: '#ffffff' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Trabaja con nosotros
        </Typography>
        <Typography variant="h6">
          ¿Te apasiona la tecnología y el comercio digital? Únete a nuestro
          equipo y sé parte del cambio en la manera en que las empresas hacen
          negocios. Estamos en constante búsqueda de talento que comparta
          nuestra visión.
        </Typography>
      </Box>

      {/* Sección: Contáctanos */}
      <Box sx={{ px: 30, py: 6, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Contáctanos
        </Typography>
        <Typography variant="h6">
          ¿Tienes dudas o deseas más información? Escríbenos a
          contacto@sellsi.cl o completa el formulario de contacto en nuestro
          sitio. Estaremos encantados de ayudarte.
        </Typography>
      </Box>

      {/* Placeholder: Conoce a nuestros proveedores */}
    </Box>
  );
};

export default Home;
