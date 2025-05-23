import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom' // <--- AGREGA ESTO

const Home = () => {
  const navigate = useNavigate() // <--- AGREGA ESTO

  return (
    <Box>
      {/* Sección superior: fondo gris con texto a la izquierda */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '65vh',
          px: 8,
          backgroundColor: '#e6e6e6', // reemplaza 'box_backgroud.primary' si no está definido en el theme
        }}
      >
        {/* Texto izquierda */}
        <Box sx={{ flex: 1, maxWidth: '700px', pl: 6 }}>
          <Typography
            variant="h1"
            fontWeight="bold"
            color="text.black"
            gutterBottom
            sx={{ lineHeight: 1.4 }}
          >
            Somos Sellsi, el marketplace que conecta proveedores con vendedores
          </Typography>

          <Typography variant="h6" color="text.black" gutterBottom>
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
                color: 'text.white',
                fontWeight: 'bold',
                borderRadius: '8px',
                px: 10,
                py: 1,
                fontSize: '1.4rem',
                textTransform: 'none',
              }}
              onClick={() => navigate('/marketplace')} // <--- AGREGA ESTO
            >
              Ir a marketplace
            </Button>
          </Box>
        </Box>

        {/* Derecha: Placeholder (opcional imagen futura) */}
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

      {/* Sección inferior: fondo blanco */}
      <Box
        sx={{
          minHeight: '400px',
          backgroundColor: '#ffffff', // reemplaza con 'box_backgroud.secondary' si lo tienes definido
          px: 8,
          py: 6,
        }}
      >
        <Typography
          variant="h4"
          fontWeight="bold"
          color="text.black"
          gutterBottom
        >
          Conoce a nuestros proveedores (TODO)
        </Typography>
        <Typography variant="body1">
          Esta es una sección secundaria donde puedes colocar más contenido,
          testimonios, logos de empresas, etc.
        </Typography>
      </Box>
    </Box>
  )
}

export default Home
