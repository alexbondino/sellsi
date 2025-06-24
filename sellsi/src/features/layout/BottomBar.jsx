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
          px: { xs: 2.25 },
        }}
      >
        <Divider sx={{ borderColor: '#e0e0e0' }} />
      </Box>

      <Box
        sx={{
          backgroundColor: '#000000',
          width: '100%',
          px: { xs: 2.25, mac: 18 },
          py: { xs: 4, md: 6 },
          overflowX: 'hidden',
          zIndex: 200,
        }}
      >
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            color: '#fff',
          }}
        >
          {/* Logo y eslogan */}
          <Box sx={{ mb: { xs: 4, md: 0 }, maxWidth: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
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

          {/* Secciones alineadas a la derecha */}
          <Grid
            container
            spacing={4}
            sx={{
              maxWidth: 800,
              justifyContent: 'flex-end',
            }}
          >
            {/* Navegación */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={sectionTitleStyle}>
                Navegación
              </Typography>
              <Box sx={columnStyle}>
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
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={sectionTitleStyle}>
                Servicios
              </Typography>
              <Box sx={columnStyle}>
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
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="h6" sx={sectionTitleStyle}>
                Soporte
              </Typography>
              <Box sx={columnStyle}>
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
            <Grid item xs={12} sm={6} md={3}>
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
        </Box>

        <Divider sx={{ my: 4, borderColor: '#333' }} />

        <Box sx={{ textAlign: 'center' }}>
          <Typography
            variant="body2"
            sx={{ color: '#b0b0b0', fontSize: '0.9rem' }}
          >
            © 2025 SELLSI Todos los derechos reservados.
          </Typography>
        </Box>

        <ContactModal open={openContactModal} onClose={handleCloseContact} />
      </Box>
    </>
  );
};

// Estilos reutilizables
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

const columnStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

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
