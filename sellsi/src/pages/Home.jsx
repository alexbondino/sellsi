import React, { useRef } from 'react';
import { Box, Typography, Button } from '@mui/material';

const Home = ({ scrollTargets }) => {
  // Referencias a secciones
  const quienesSomosRef = useRef(null);
  const serviciosRef = useRef(null);
  const contactanosRef = useRef(null);

  // Asignar referencias al objeto externo para usarlas desde App
  if (scrollTargets) {
    scrollTargets.current = {
      quienesSomosRef,
      serviciosRef,
      contactanosRef,
    };
  }

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

        {/* Imagen derecha */}
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

      {/* Sección: Conoce a nuestros proveedores (oculta por ahora) */}
      <Box
        hidden
        sx={{ minHeight: '400px', backgroundColor: '#ffffff', px: 30, py: 6 }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Conoce a nuestros proveedores (TODO)
        </Typography>
        <Typography variant="h6">
          Esta sección mostrará próximamente los perfiles destacados de
          proveedores registrados en nuestra plataforma.
        </Typography>
      </Box>

      {/* Sección: ¿Quiénes somos? */}
      <Box
        ref={quienesSomosRef}
        sx={{ px: 30, py: 6, backgroundColor: '#ffffff' }}
      >
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
      <Box
        ref={serviciosRef}
        sx={{ px: 30, py: 6, backgroundColor: '#f9f9f9' }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Servicios
        </Typography>
        <Typography variant="h6">
          Ofrecemos una plataforma intuitiva para descubrir productos, contactar
          proveedores verificados, recibir métricas clave de rendimiento y
          gestionar tus procesos de compra con total transparencia.
        </Typography>
      </Box>

      {/* Sección: Trabaja con nosotros (oculta por ahora) */}
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
      <Box
        ref={contactanosRef}
        sx={{
          px: 30,
          py: 8,
          backgroundColor: '#f9f9f9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'left',
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Contáctanos
        </Typography>
        <Typography
          variant="h6"
          sx={{ mb: 4, textAlign: 'left', maxWidth: 600 }}
        >
          Envía una consulta y nos pondremos en contacto contigo lo antes
          posible.
        </Typography>

        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            maxWidth: 600,
            backgroundColor: 'white',
            p: 4,
            borderRadius: 3,
            boxShadow: 3,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2 }}>
            <input
              type="text"
              placeholder="Nombre"
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '1rem',
                width: '100%',
                backgroundColor: 'white',
              }}
            />
            <input
              type="email"
              placeholder="E-mail"
              style={{
                flex: 1,
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '1rem',
                width: '100%',
                backgroundColor: 'white',
              }}
            />
          </Box>

          <textarea
            placeholder="Mensaje"
            rows={5}
            style={{
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '1rem',
              width: '100%',
              resize: 'none',
              backgroundColor: 'white',
            }}
          />

          <Button
            variant="contained"
            color="primary"
            sx={{
              mt: 1,
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              textTransform: 'none',
              py: 1.2,
            }}
          >
            Enviar Consulta
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Home;
