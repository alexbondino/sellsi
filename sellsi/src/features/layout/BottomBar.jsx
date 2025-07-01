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
          px: { xs: 2.25, md: 8, lg: 0, xl: 0 },
          py: { xs: 2.5, md: 3 },
          overflowX: 'hidden',
          zIndex: 200,
        }}
      >
        <Box
          sx={{
            maxWidth: 700, // Más compacto para centrar el logo y la columna
            mx: 'auto',
            color: '#fff',
          }}
        >
          {/* Contenido principal en 2 columnas */}
          {/* Box principal: Logo + eslogan + secciones */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: { xs: 4, md: 6 },
              mb: 4,
              justifyContent: { xs: 'center', md: 'flex-start' },
            }}
          >
            {/* Logo y eslogan en columna */}
            <Box sx={{ flex: '0 0 auto', maxWidth: { xs: '100%', md: 180 }, px: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0, height: 60, overflow: 'hidden' }}>
                <img
                  src="/logodark.svg"
                  alt="SELLSI Logo"
                  style={{ height: 150, maxWidth: '100%' }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 1, textAlign: 'center', display: { xs: 'block', md: 'block' } }}
              >
                Crece. Conecta. Vende.
              </Typography>
            </Box>

            {/* Secciones a la derecha del logo */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 2, md: 4 },
                justifyContent: 'flex-start',
                alignItems: { xs: 'center', md: 'flex-start' },
                flex: 1,
              }}
            >
              {/* Navegación */}
              <Box sx={{ minWidth: 120 }}>
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
              </Box>

              {/* Servicios */}
              <Box sx={{ minWidth: 130 }}>
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
              </Box>

              {/* Soporte */}
              <Box sx={{ minWidth: 160 }}>
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
              </Box>

              {/* Redes Sociales */}
              <Box sx={{ minWidth: 120 }}>
                <Typography variant="h6" sx={sectionTitleStyle}>
                  Síguenos
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', minWidth: { xs: 0, md: '110px' }, width: { md: '110px', lg: '120px', xl: '140px' } }}>
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
              </Box>
            </Box>
          </Box>

          {/* Fila 2: Copyright */}
          <Divider sx={{ my: 0, borderColor: '#333' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{ color: '#b0b0b0', fontSize: '0.9rem' }}
            >
              © 2025 SELLSI Todos los derechos reservados.
            </Typography>
          </Box>
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
