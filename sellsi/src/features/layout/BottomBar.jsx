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
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: { xs: 4, md: 6 },
              mb: 4,
            }}
          >
            {/* Columna 1: Logo y eslogan */}
            <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: 350 }, px: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0 }}>
                <img
                  src="/logodark.svg"
                  alt="SELLSI Logo"
                  style={{ height: 140, maxWidth: '100%' }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  mb: 2,
                  textAlign: 'center',
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
                  textAlign: 'justify',
                  mx: 'auto',
                  width: '100%',
                  display: 'block',
                }}
              >
                La plataforma que conecta proveedores con vendedores de manera
                sencilla y eficiente.
              </Typography>
            </Box>

            {/* Columna 2: Secciones de navegación en 2x2 */}
            <Box sx={{ flex: 1, px: 0, maxWidth: 350 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5, // Reducido de 2 a 1.5
                  maxWidth: 350, // Reducido de 400 a 350
                  '@media (max-width: 600px)': {
                    gridTemplateColumns: '1fr',
                  },
                }}
              >
                {/* Navegación */}
                <Box sx={{ maxWidth: 160 }}>
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
                <Box sx={{ maxWidth: 160 }}>
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
                <Box sx={{ maxWidth: 160 }}>
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
                <Box sx={{ maxWidth: 160 }}>
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
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Fila 2: Copyright */}
          <Divider sx={{ my: 3, borderColor: '#333' }} />
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
