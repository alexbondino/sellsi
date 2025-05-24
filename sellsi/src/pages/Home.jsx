import React, { useRef } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const Home = ({ scrollTargets }) => {
  const navigate = useNavigate()

  const quienesSomosRef = useRef(null)
  const serviciosRef = useRef(null)
  const contactanosRef = useRef(null)

  if (scrollTargets) {
    scrollTargets.current = {
      quienesSomosRef,
      serviciosRef,
      contactanosRef,
    }
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'hidden' }}>
      {/* Sección superior */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '65vh',
          px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
          py: 6,
          backgroundColor: '#e6e6e6',
          gap: { xs: 6, md: 0 },
        }}
      >
        {/* Texto izquierda */}
        <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: 700 } }}>
          <Typography
            variant="h1"
            fontWeight="bold"
            gutterBottom
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              lineHeight: 1.4,
            }}
          >
            Somos Sellsi, el marketplace que conecta proveedores con vendedores
          </Typography>

          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontSize: { xs: '1rem', md: '1.2rem' } }}
          >
            Conectamos proveedores con vendedores de manera sencilla. Olvídate
            de ir a hablar con cada uno de ellos. Desarrollamos el ecosistema
            que necesitas para transar lo que necesites y cuando lo necesites.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              mt: 5,
            }}
          >
            <Button
              variant="contained"
              sx={{
                backgroundColor: 'primary.main',
                fontWeight: 'bold',
                borderRadius: '8px',
                px: 10,
                py: 1,
                fontSize: '1.2rem',
                textTransform: 'none',
              }}
              onClick={() => navigate('/marketplace')}
            >
              Ir a marketplace
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <img
            src="/promotion.svg"
            alt="Promo"
            style={{ width: '100%', maxWidth: 600 }}
          />
        </Box>
      </Box>

      {/* Secciones scrollables */}
      {[
        {
          ref: null,
          hidden: true,
          bg: '#ffffff',
          title: 'Conoce a nuestros proveedores (TODO)',
          text: 'Esta sección mostrará próximamente los perfiles destacados de proveedores registrados en nuestra plataforma.',
        },
        {
          ref: quienesSomosRef,
          bg: '#ffffff',
          title: '¿Quiénes somos?',
          text: 'En Sellsi, creemos en la eficiencia del comercio digital...',
        },
        {
          ref: serviciosRef,
          bg: '#e6e6e6',
          title: 'Servicios',
          text: 'Ofrecemos una plataforma intuitiva para descubrir productos...',
        },
        {
          ref: null,
          hidden: true,
          bg: '#ffffff',
          title: 'Trabaja con nosotros',
          text: '¿Te apasiona la tecnología y el comercio digital?...',
        },
      ].map(({ ref, hidden, bg, title, text }, i) => (
        <Box
          key={i}
          ref={ref}
          hidden={hidden}
          sx={{
            px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
            py: 6,
            backgroundColor: bg,
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h6">{text}</Typography>
        </Box>
      ))}

      {/* Contáctanos */}
      <Box
        ref={contactanosRef}
        sx={{
          px: { xs: 2, sm: 4, md: 8, lg: 15, xl: 30 },
          py: 8,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Contáctanos
        </Typography>
        <Typography
          variant="h6"
          sx={{ mb: 4, textAlign: 'left', maxWidth: 600 }}
        >
          Envía una consulta y nos pondremos en contacto contigo...
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
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
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
  )
}

export default Home
