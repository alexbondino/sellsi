import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  Grid,
  AppBar,
  Toolbar,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContactModal from '../ui/ContactModal';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomBar = () => {
  const [openContactModal, setOpenContactModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [navValue, setNavValue] = useState(location.pathname);

  const handleOpenContact = () => setOpenContactModal(true);
  const handleCloseContact = () => setOpenContactModal(false);

  useEffect(() => {
    setNavValue(location.pathname);
  }, [location.pathname]);

  const mobileNavItems = [
    { label: 'Inicio', value: '/', icon: <HomeIcon /> },
    {
      label: 'Marketplace',
      value: '/buyer/marketplace',
      icon: <StorefrontIcon />,
    },
    { label: 'Pedidos', value: '/buyer/orders', icon: <ReceiptLongIcon /> },
    {
      label: 'Contacto',
      value: 'contact',
      icon: <MailOutlineIcon />,
      onClick: handleOpenContact,
    },
  ];

  return (
    <>
      <AppBar
        position="fixed"
        elevation={3}
        sx={{
          top: 'auto',
          bottom: 0,
          display: { xs: 'block', md: 'none' },
          zIndex: theme => theme.zIndex.appBar,
          backgroundColor: 'background.paper',
        }}
      >
        <Toolbar sx={{ p: 0 }}>
          <BottomNavigation
            showLabels
            value={navValue}
            onChange={(event, newValue) => {
              setNavValue(newValue);
              const item = mobileNavItems.find(i => i.value === newValue);
              if (item?.onClick) item.onClick();
              else if (item) navigate(item.value);
            }}
            sx={{ width: '100%', height: '100%' }}
          >
            {mobileNavItems.map(item => (
              <BottomNavigationAction
                key={item.label}
                label={item.label}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </BottomNavigation>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ width: '100%', px: { xs: 2.25 } }}>
          <Divider sx={{ borderColor: '#e0e0e0' }} />
        </Box>
        <Box
          component="footer"
          sx={{
            backgroundColor: '#000000',
            width: '100%',
            px: { xs: 2.25, mac: 18 },
            py: { xs: 4, md: 6 },
            overflowX: 'hidden',
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
                sx={{ fontWeight: 600, fontSize: '1.1rem', mb: 2 }}
              >
                Crece. Conecta. Vende.
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#b0b0b0', lineHeight: 1.6, maxWidth: 280 }}
              >
                La plataforma que conecta proveedores con vendedores de manera
                sencilla y eficiente.
              </Typography>
            </Box>
            <Grid
              container
              spacing={4}
              sx={{ maxWidth: 800, justifyContent: 'flex-end' }}
            >
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
        </Box>
      </Box>
      <ContactModal open={openContactModal} onClose={handleCloseContact} />
    </>
  );
};

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
const columnStyle = { display: 'flex', flexDirection: 'column', gap: 1 };
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
