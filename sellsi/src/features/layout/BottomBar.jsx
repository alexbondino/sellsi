import React, { useState } from 'react';
import { Box, Typography, IconButton, Divider, Grid, Button, Collapse } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import MenuIcon from '@mui/icons-material/Menu';
import BusinessIcon from '@mui/icons-material/Business';
import SupportIcon from '@mui/icons-material/Support';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContactModal from '../../shared/components/modals/ContactModal';

const BottomBar = () => {
  const navigate = useNavigate();
  const [openContactModal, setOpenContactModal] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const handleOpenContact = () => setOpenContactModal(true);
  const handleCloseContact = () => setOpenContactModal(false);

  const toggleNavigation = () => setNavigationOpen(!navigationOpen);
  const toggleServices = () => setServicesOpen(!servicesOpen);
  const toggleSupport = () => setSupportOpen(!supportOpen);

  const handleNavigateToTerms = () => {
    navigate('/terms-and-conditions');
  };

  const handleNavigateToPrivacy = () => {
    navigate('/privacy-policy');
  };

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
          py: { xs: 2.5, md: 2 },
          overflowX: 'hidden',
          zIndex: 1301, // Debe ser mayor que la SideBar (por defecto 1200 en MUI Drawer)
          position: 'sticky', // Ahora sticky
          bottom: 0, // Se pega al fondo de la ventana
        }}
      >
        <Box
          sx={{
            maxWidth: 700,
            mx: 'auto',
            color: '#fff',
          }}
        >
          {/* Desktop Layout */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 6,
              justifyContent: 'flex-start',
            }}
          >
            {/* Logo y eslogan */}
            <Box sx={{ flex: '0 0 auto', maxWidth: 200, px: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0, height: 60, overflow: 'hidden' }}>
                <img
                  src="/logodark.svg"
                  alt="SELLSI Logo"
                  style={{ height: 150, maxWidth: '100%' }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, fontSize: '1rem', mt: 1, textAlign: 'center' }}
              >
                Crece. Conecta. Vende.
              </Typography>
            </Box>

            {/* Secciones a la derecha del logo */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 4,
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                flex: 1,
              }}
            >

              {/* Servicios - Desktop */}
              <Box sx={{ minWidth: 130 }}>
                <Typography variant="h6" sx={sectionTitleStyle}>
                  Servicios
                </Typography>
                <Box sx={columnStyle}>
                  <Typography variant="body2" sx={navItemStyle}>
                    Para Proveedores
                  </Typography>
                  <Typography variant="body2" sx={navItemStyle}>
                    Para Compradores
                  </Typography>
                </Box>
              </Box>

              {/* Soporte - Desktop */}
              <Box sx={{ minWidth: 160 }}>
                <Typography variant="h6" sx={sectionTitleStyle}>
                  Soporte
                </Typography>
                <Box sx={columnStyle}>
                  <Typography
                    variant="body2"
                    sx={navItemStyle}
                    onClick={handleOpenContact}
                  >
                    Contáctanos
                  </Typography>
                  <Typography variant="body2" sx={navItemStyle}>
                    Preguntas Frecuentes
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={navItemStyle}
                    onClick={handleNavigateToTerms}
                  >
                    Términos y Condiciones
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={navItemStyle}
                    onClick={handleNavigateToPrivacy}
                  >
                    Política de Privacidad
                  </Typography>
                </Box>
              </Box>

              {/* Redes Sociales - Desktop */}
              <Box sx={{ minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ ...sectionTitleStyle, textAlign: 'center', width: '100%' }}>
                  Síguenos
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
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
                {/* Teléfono debajo de los iconos */}
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'center' }}>
                  <IconButton
                    href="tel:+56963109664"
                    sx={{ color: '#b0b0b0', mr: 1, p: 0.5, '&:hover': { color: '#25d366', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                    aria-label="Llamar a +56 9 6310 9664"
                  >
                    <PhoneIcon />
                  </IconButton>
                  <Typography
                    variant="body2"
                    component="a"
                    href="tel:+56963109664"
                    sx={{ color: '#b0b0b0', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#25d366', textDecoration: 'underline' } }}
                  >
                    +56 9 6310 9664
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Mobile Layout */}
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              mb: 4,
            }}
          >
            {/* Logo y eslogan - Mobile */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0, height: 60, overflow: 'hidden' }}>
                <img
                  src="/logodark.svg"
                  alt="SELLSI Logo"
                  style={{ height: 150, maxWidth: '100%' }}
                />
              </Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 1, textAlign: 'center' }}
              >
                Crece. Conecta. Vende.
              </Typography>
            </Box>

            {/* Botones colapsables - Mobile */}
            <Box sx={{ width: '100%', maxWidth: 400 }}>

              {/* Servicios - Mobile */}
              <Box sx={{ mb: 1 }}>
                <Button
                  onClick={toggleServices}
                  sx={{
                    width: '100%',
                    justifyContent: 'space-between',
                    color: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Servicios
                    </Typography>
                  </Box>
                  {servicesOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Button>
                <Collapse in={servicesOpen}>
                  <Box sx={{ pl: 2, pr: 2, pt: 1, pb: 1 }}>
                    <Typography variant="body2" sx={{ ...navItemStyle, py: 0.5 }}>
                      Para Proveedores
                    </Typography>
                    <Typography variant="body2" sx={{ ...navItemStyle, py: 0.5 }}>
                      Para Compradores
                    </Typography>
                  </Box>
                </Collapse>
              </Box>

              {/* Soporte - Mobile */}
              <Box sx={{ mb: 1 }}>
                <Button
                  onClick={toggleSupport}
                  sx={{
                    width: '100%',
                    justifyContent: 'space-between',
                    color: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    py: 1.5,
                    px: 2,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SupportIcon />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      Soporte
                    </Typography>
                  </Box>
                  {supportOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </Button>
                <Collapse in={supportOpen}>
                  <Box sx={{ pl: 2, pr: 2, pt: 1, pb: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ ...navItemStyle, py: 0.5 }}
                      onClick={handleOpenContact}
                    >
                      Contáctanos
                    </Typography>
                    <Typography variant="body2" sx={{ ...navItemStyle, py: 0.5 }}>
                      Preguntas Frecuentes
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ ...navItemStyle, py: 0.5 }}
                      onClick={handleNavigateToTerms}
                    >
                      Términos y Condiciones
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ ...navItemStyle, py: 0.5 }}
                      onClick={handleNavigateToPrivacy}
                    >
                      Política de Privacidad
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
            </Box>

            {/* Redes Sociales - Mobile */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="h6" sx={{ ...sectionTitleStyle, textAlign: 'center', width: '100%' }}>
                Síguenos
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%' }}>
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
              {/* Teléfono debajo de los iconos */}
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'center', width: '100%' }}>
                <IconButton
                  href="tel:+56963109664"
                  sx={{ color: '#b0b0b0', mr: 1, p: 0.5, '&:hover': { color: '#25d366', backgroundColor: 'rgba(255,255,255,0.1)' } }}
                  aria-label="Llamar a +56 9 6310 9664"
                >
                  <PhoneIcon />
                </IconButton>
                <Typography
                  variant="body2"
                  component="a"
                  href="tel:+56963109664"
                  sx={{ color: '#b0b0b0', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#25d366', textDecoration: 'underline' } }}
                >
                  +56 9 6310 9664
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Copyright */}
          <Divider sx={{ my: 1, borderColor: '#333' }} />
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
  mb: 1,
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