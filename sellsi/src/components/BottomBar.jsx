import React, { useState } from 'react'
import { Box, Typography, IconButton, Grid, Divider } from '@mui/material'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import InstagramIcon from '@mui/icons-material/Instagram'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import ContactModal from './ContactModal'

const BottomBar = () => {
  const [openContactModal, setOpenContactModal] = useState(false)

  const handleOpenContact = () => setOpenContactModal(true)
  const handleCloseContact = () => setOpenContactModal(false)

  return (
    <Box
      sx={{
        backgroundColor: '#000000',
        width: '100vw',
        px: 0,
        py: { xs: 4, md: 6 },
        display: 'flex',
        justifyContent: 'center',
        overflowX: 'hidden',
        zIndex: 200,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1200px',
          px: { xs: 3, md: 4 },
          color: '#fff',
        }}
      >
        <Grid container spacing={4}>
          {/* Logo y eslogan */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
              >
                {' '}
                <img
                  src="/logodark.svg"
                  alt="SELLSI Logo"
                  style={{ height: 180 }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: '#fff',
                  mb: 2,
                }}
              >
                Crece. Conecta. Vende.
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  lineHeight: 1.6,
                  maxWidth: 280,
                }}
              >
                La plataforma que conecta proveedores con vendedores de manera
                sencilla y eficiente.
              </Typography>
            </Box>
          </Grid>

          {/* Navegación */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                fontSize: '1rem',
                color: '#fff',
              }}
            >
              Navegación
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Inicio
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Quiénes Somos
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Servicios
              </Typography>{' '}
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
                onClick={handleOpenContact}
              >
                Contáctanos
              </Typography>
            </Box>
          </Grid>

          {/* Servicios */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                fontSize: '1rem',
                color: '#fff',
              }}
            >
              Servicios
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Marketplace
              </Typography>{' '}
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Para Proveedores
              </Typography>
              {/* <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Para Intermediarios
              </Typography> */}
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Para Compradores
              </Typography>
            </Box>
          </Grid>

          {/* Soporte */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                fontSize: '1rem',
                color: '#fff',
              }}
            >
              Soporte
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Centro de Ayuda
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Preguntas Frecuentes
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Términos y Condiciones
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                }}
              >
                Política de Privacidad
              </Typography>
            </Box>
          </Grid>

          {/* Redes Sociales */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                fontSize: '1rem',
                color: '#fff',
              }}
            >
              Síguenos
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <IconButton
                href="https://www.linkedin.com/company/sellsi/"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: '#b0b0b0',
                  '&:hover': {
                    color: '#0077b5',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                href="#"
                sx={{
                  color: '#b0b0b0',
                  '&:hover': {
                    color: '#e4405f',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
                aria-label="Instagram"
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                href="#"
                sx={{
                  color: '#b0b0b0',
                  '&:hover': {
                    color: '#25d366',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  },
                  transition: 'all 0.3s ease',
                }}
                aria-label="WhatsApp"
              >
                <WhatsAppIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Divider */}
        <Divider sx={{ my: 4, borderColor: '#333' }} />

        {/* Copyright */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{
              color: '#b0b0b0',
              fontSize: '0.9rem',
            }}
          >
            © 2025 SELLSI Todos los derechos reservados.{' '}
          </Typography>
        </Box>
      </Box>

      {/* Modal de Contacto */}
      <ContactModal open={openContactModal} onClose={handleCloseContact} />
    </Box>
  )
}

export default BottomBar
