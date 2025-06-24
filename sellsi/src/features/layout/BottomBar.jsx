import React, { useState } from 'react';
import { Box, Typography, IconButton, Divider, Grid } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContactModal from '../ui/ContactModal';

const BottomBar = () => {
  const [openContactModal, setOpenContactModal] = useState(false);

  const handleOpenContact = () => setOpenContactModal(true);
  const handleCloseContact = () => setOpenContactModal(false);

  return (
    <>
      {/* Línea horizontal alineada con el contenido */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          backgroundColor: 'transparent',
        }}
      >
        <Box
          sx={{
            width: '100%',
            px: { xs: 2.25, md: 2.25 }, // 18px de padding lateral
          }}
        >
          <Divider sx={{ borderColor: '#e0e0e0' }} />
        </Box>
      </Box>

      <Box
        sx={{
          backgroundColor: '#000000',
          width: '100%',
          px: { md: 10, mac: 18, lg: 15 },
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
            px: { xs: 2.25, md: 2.25 }, // 18px laterales
            color: '#fff',
          }}
        >
          <Grid container spacing={4}>
            {/* Logo y eslogan */}
            <Grid sx={{ xs: 12, md: 4 }}>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}
                >
                  <img
                    src="/logodark.svg"
                    alt="SELLSI Logo"
                    style={{ height: 168 }}
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
            <Grid sx={{ xs: 12, sm: 6, md: 2 }}>
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
                <Typography variant="body2" sx={navItemStyle}>
                  Inicio
                </Typography>
                <Typography variant="body2" sx={navItemStyle}>
                  Quiénes Somos
                </Typography>
                <Typography variant="body2" sx={navItemStyle}>
                  Servicios
                </Typography>
                <Typography
                  variant="body2"
                  sx={navItemStyle}
                  onClick={handleOpenContact}
                >
                  Contáctanos
                </Typography>
              </Box>
            </Grid>

            {/* Servicios */}
            <Grid sx={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="h6" sx={sectionTitleStyle}>
                Servicios
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={navItemStyle}>
                  Marketplace
                </Typography>
                <Typography variant="body2" sx={navItemStyle}>
                  Para Proveedores
                </Typography>
                <Typography variant="body2" sx={navItemStyle}>
                  Para Compradores
                </Typography>
              </Box>
            </Grid>

            {/* Soporte */}
            <Grid sx={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="h6" sx={sectionTitleStyle}>
                Soporte
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="body2" sx={navItemStyle}>
                  Centro de Ayuda
                </Typography>
                <Typography variant="body2" sx={navItemStyle}>
                  Preguntas Frecuentes
                </Typography>
                <Typography variant="body2" sx={navItemStyle}>
                  Términos y Condiciones
                </Typography>
                <Typography variant="body2" sx={navItemStyle}>
                  Política de Privacidad
                </Typography>
              </Box>
            </Grid>

            {/* Redes Sociales */}
            <Grid sx={{ xs: 12, sm: 6, md: 2 }}>
              <Typography variant="h6" sx={sectionTitleStyle}>
                Síguenos
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <SocialIcon
                  href="https://www.linkedin.com/company/sellsi/"
                  icon={<LinkedInIcon />}
                  hoverColor="#0077b5"
                  label="LinkedIn"
                />
                <SocialIcon
                  href="#"
                  icon={<InstagramIcon />}
                  hoverColor="#e4405f"
                  label="Instagram"
                />
                <SocialIcon
                  href="#"
                  icon={<WhatsAppIcon />}
                  hoverColor="#25d366"
                  label="WhatsApp"
                />
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4, borderColor: '#333' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{ color: '#b0b0b0', fontSize: '0.9rem' }}
            >
              © 2025 SELLSI Todos los derechos reservados.
            </Typography>
          </Box>
        </Box>

        {/* Modal de Contacto */}
        <ContactModal open={openContactModal} onClose={handleCloseContact} />
      </Box>
    </>
  );
};

// Reusable styles
const navItemStyle = {
  color: '#b0b0b0',
  cursor: 'pointer',
  '&:hover': { color: '#fff' },
};

const sectionTitleStyle = {
  fontWeight: 600,
  mb: 2,
  fontSize: '1rem',
  color: '#fff',
};

// Reusable social icon component
const SocialIcon = ({ href, icon, hoverColor, label }) => (
  <IconButton
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      color: '#b0b0b0',
      '&:hover': {
        color: hoverColor,
        backgroundColor: 'rgba(255,255,255,0.1)',
      },
      transition: 'all 0.3s ease',
    }}
    aria-label={label}
  >
    {icon}
  </IconButton>
);

export default BottomBar;
