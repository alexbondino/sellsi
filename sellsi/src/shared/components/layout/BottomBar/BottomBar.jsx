// 📁 shared/components/layout/BottomBar/BottomBar.jsx
import React, { useState } from 'react';
import { Box, Typography, IconButton, Divider, Button, Collapse } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import SupportIcon from '@mui/icons-material/Support';

const BottomBar = () => {
  const navigate = useNavigate();
  const handleNavigateToTerms = () => navigate('/terms-and-conditions');
  const handleNavigateToPrivacy = () => navigate('/privacy-policy');

  return (
    <>
      <Box sx={{ width: '100%', px: { xs: 2.25 }, bgcolor: '#000' }}>
        <Divider sx={{ borderColor: '#e0e0e0' }} />
      </Box>

      <Box
        component="footer"
        sx={{
          backgroundColor: '#000',
          color: '#fff',
          position: 'sticky',
          bottom: 0,
          width: '100%',
          px: { xs: 2.25, md: 8 },
          py: { xs: 2.5, md: 5 },
          borderTop: '1px solid #ffffff',
          zIndex: 1301,
        }}
      >
        <Box sx={{ maxWidth: 700, mx: 'auto', color: '#fff' }}>

          {/* Desktop layout */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 6,
              justifyContent: 'flex-start',
            }}
          >
            <Box sx={{ flex: '0 0 auto', maxWidth: 230, px: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 120 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0 }}>
                <img src="/Logos/sellsiwhite_logo_transparent.webp" alt="SELLSI Logo" style={{ height: '75px', width: '270px', objectFit: 'contain' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mt: 1, textAlign: 'center' }}>Conecta. Vende. Crece.</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, justifyContent: 'flex-start', alignItems: 'flex-start', flex: 1 }}>
              <Box sx={{ minWidth: 160 }}>
                <Typography variant="h6" sx={sectionTitleStyle}>Soporte</Typography>
                <Box sx={columnStyle}>
                  <Typography variant="body2" sx={navItemStyle} onClick={handleNavigateToTerms}>Términos y Condiciones</Typography>
                  <Typography variant="body2" sx={navItemStyle} onClick={handleNavigateToPrivacy}>Política de Privacidad</Typography>
                </Box>
              </Box>

              <Box sx={{ minWidth: 150, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ ...sectionTitleStyle, textAlign: 'center', width: '100%' }}>Síguenos</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
                  <SocialIcon href="https://www.linkedin.com/company/sellsi/" icon={<LinkedInIcon />} hoverColor="#0077b5" label="LinkedIn" />
                  <SocialIcon href="https://www.instagram.com/sellsi.cl/" icon={<InstagramIcon />} hoverColor="#e4405f" label="Instagram" />
                  <SocialIcon href="https://wa.me/56963109664" icon={<WhatsAppIcon />} hoverColor="#25d366" label="WhatsApp" />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, justifyContent: 'flex-start' }}>
                  <IconButton href="tel:+56963109664" sx={{ color: '#b0b0b0', mr: 1, p: 0.5, width: 40, minWidth: 40, display: 'flex', justifyContent: 'center', '&:hover': { color: '#0772D2', backgroundColor: 'rgba(255,255,255,0.1)' } }} aria-label="Llamar">
                    <PhoneIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <Typography variant="body2" component="a" href="tel:+56963109664" sx={{ color: '#b0b0b0', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#0772D2', textDecoration: 'underline' } }}>+56 9 6310 9664</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, justifyContent: 'flex-start' }}>
                  <IconButton href="mailto:contacto@sellsi.cl" sx={{ color: '#b0b0b0', mr: 1, p: 0.5, width: 40, minWidth: 40, display: 'flex', justifyContent: 'center', '&:hover': { color: '#0772D2', backgroundColor: 'rgba(255,255,255,0.1)' } }} aria-label="Email">
                    <EmailIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                  <Typography variant="body2" component="a" href="mailto:contacto@sellsi.cl" sx={{ color: '#b0b0b0', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#0772D2', textDecoration: 'underline' } }}>contacto@sellsi.cl</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Mobile layout: centered logo + collapsible Soporte (only Terms & Privacy) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', gap: 3, mb: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0 }}>
                <img src="/Logos/sellsiwhite_logo_transparent.webp" alt="SELLSI Logo" style={{ height: '60px', width: '216px', objectFit: 'contain', display: 'block' }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', mt: 1, textAlign: 'center' }}>Conecta. Vende. Crece.</Typography>
            </Box>

            <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', ml: { xs: 10.5, md: 0 } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Soporte</Typography>
                <Typography variant="body2" sx={{ ...navItemStyle, py: 0.5, width: '100%' }} onClick={handleNavigateToTerms}>Términos & Condiciones</Typography>
                <Typography variant="body2" sx={{ ...navItemStyle, py: 0.5, width: '100%' }} onClick={handleNavigateToPrivacy}>Política de Privacidad</Typography>
              </Box>
            </Box>
            
            {/* Redes sociales + teléfono - Mobile */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant="h6" sx={{ ...sectionTitleStyle, textAlign: 'center', width: '100%' }}>Síguenos</Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%' }}>
                <SocialIcon href="https://www.linkedin.com/company/sellsi/" icon={<LinkedInIcon />} hoverColor="#0077b5" label="LinkedIn" />
                <SocialIcon href="https://www.instagram.com/sellsi.cl/" icon={<InstagramIcon />} hoverColor="#e4405f" label="Instagram" />
                <SocialIcon href="https://wa.me/56963109664" icon={<WhatsAppIcon />} hoverColor="#25d366" label="WhatsApp" />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0, justifyContent: 'center', width: '100%' }}>
                <IconButton href="tel:+56963109664" sx={{ color: '#b0b0b0', mr: 1, p: 0.5, width: 40, minWidth: 40, display: 'flex', justifyContent: 'center', '&:hover': { color: '#0772D2', backgroundColor: 'rgba(255,255,255,0.1)' } }} aria-label="Llamar">
                  <PhoneIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="body2" component="a" href="tel:+56963109664" sx={{ color: '#b0b0b0', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#0772D2', textDecoration: 'underline' } }}>+56 9 6310 9664</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, justifyContent: 'center', width: '100%' }}>
                <IconButton href="mailto:contacto@sellsi.cl" sx={{ color: '#b0b0b0', mr: 1, p: 0.5, width: 40, minWidth: 40, display: 'flex', justifyContent: 'center', '&:hover': { color: '#0772D2', backgroundColor: 'rgba(255,255,255,0.1)' } }} aria-label="Email">
                  <EmailIcon sx={{ fontSize: 20 }} />
                </IconButton>
                <Typography variant="body2" component="a" href="mailto:contacto@sellsi.cl" sx={{ color: '#b0b0b0', textDecoration: 'none', fontWeight: 500, '&:hover': { color: '#0772D2', textDecoration: 'underline' } }}>contacto@sellsi.cl</Typography>
              </Box>
            </Box>
          </Box>

          {/* Copyright */}
          <Box sx={{ mt: { xs: 0, md: 7 }, textAlign: 'center', width: '100%' }}>
            <Divider sx={{ my: 0, borderColor: '#333', width: '100%' }} />
            <Box sx={{ textAlign: 'center', width: '100%', mb: 5 }}>
              <Typography variant="body2" sx={{ color: '#b0b0b0', fontSize: '0.9rem' }}>© 2025 SELLSI Todos los derechos reservados.</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

/* ---------- estilos reutilizables ---------- */
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

const SocialIcon = ({ href, icon, hoverColor = '#fff', label }) => (
  <IconButton href={href} target="_blank" rel="noopener noreferrer" sx={{ color: '#b0b0b0', '&:hover': { color: hoverColor, backgroundColor: 'rgba(255,255,255,0.1)' }, transition: 'all 0.3s ease' }} aria-label={label}>
    {icon}
  </IconButton>
);

export default BottomBar;
