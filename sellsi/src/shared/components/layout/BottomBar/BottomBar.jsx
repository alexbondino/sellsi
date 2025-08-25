// 📁 shared/components/layout/BottomBar/BottomBar.jsx
import React from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsappIcon from '@mui/icons-material/WhatsApp';

const BottomBar = () => {
  const navigate = useNavigate();

  const handleNavigateToTerms = () => navigate('/terms-and-conditions');
  const handleNavigateToPrivacy = () => navigate('/privacy-policy');

  return (
    <>
      {/* Línea separadora superior (fina, blanca) */}
      <Box sx={{ width: '100%', px: { xs: 2 }, bgcolor: '#000' }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      </Box>

      <Box
        component="footer"
        sx={{
          backgroundColor: '#000',
          color: '#fff',
          position: 'sticky',
          bottom: 0,
          width: '100%',
          px: { xs: 2, md: 6 },
          py: { xs: 3, md: 4 },
          borderTop: '1px solid rgba(255,255,255,0.2)',
          zIndex: 1301,
        }}
      >
        <Box
          sx={{
            maxWidth: '100%',
            mx: {
              xs: 'max(25px, env(safe-area-inset-left))', // Telefonos Chicos
              sm: 'max(30px, env(safe-area-inset-left))', // Telefonos grandes
              mac: '180px', //  Mac M1
              lg: '250px', // 1080p
              xl: '250px', // 2K
            },
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1fr auto auto',
            },
            alignItems: 'center',
          }}
        >
          {/* IZQUIERDA: logo + eslogan (en línea como tu imagen) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 2, md: 3 },
              minWidth: 0,
            }}
          >
            {/* Caja del logo (mantiene altura y “bloque” visual del mock) */}
            <Box
              sx={{
                height: {
                  xs: 'max(100px, env(safe-area-inset-left))',
                  sm: 'max(100px, env(safe-area-inset-left))',
                  md: 250,
                  mac: 180,
                  lg: 250,
                  xl: 250,
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              <img
                src="/logodark.svg"
                alt="SELLSI"
                style={{ height: '100%', display: 'block' }}
              />
            </Box>

            {/* Eslogan */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.25rem' },
                whiteSpace: 'nowrap',
              }}
            >
              Crece. Conecta. Vende.
            </Typography>
          </Box>

          {/* CENTRO: Soporte */}
          <Box sx={{ textAlign: { xs: 'left', md: 'left' } }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1rem', md: '1.15rem' },
              }}
            >
              Soporte
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Typography
                variant="body1"
                onClick={handleNavigateToTerms}
                sx={linkStyle}
              >
                Términos & Condiciones
              </Typography>
              <Typography
                variant="body1"
                onClick={handleNavigateToPrivacy}
                sx={linkStyle}
              >
                Política de Privacidad
              </Typography>
            </Box>
          </Box>

          {/* DERECHA: redes + teléfono */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-end' }, // 👉 centrado en mobile
              gap: 2,
              mt: { xs: 5, sm: 5, md: 0 }, // 👉 separa más en mobile
            }}
          >
            {/* Íconos sociales */}
            <Box sx={{ display: 'flex', gap: 2, mx: { xs: 0, md: 5 } }}>
              <SocialIcon
                href="https://www.whatsapp.com/"
                icon={<WhatsappIcon />}
                label="Whatsapp"
              />
              <SocialIcon
                href="https://www.instagram.com/"
                icon={<InstagramIcon />}
                label="Instagram"
              />
              <SocialIcon
                href="https://www.linkedin.com/company/sellsi/"
                icon={<LinkedInIcon />}
                label="LinkedIn"
              />
            </Box>

            {/* Teléfono */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              <IconButton
                href="tel:+56963109664"
                aria-label="Llamar"
                sx={phoneIconStyle}
              >
                <PhoneIcon />
              </IconButton>
              <Typography
                component="a"
                href="tel:+56997206896"
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  '&:hover': { color: '#fff', textDecoration: 'underline' },
                }}
              >
                (+569) 97206896
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Copyright */}
        <Box sx={{ mt: { xs: 3, md: 2 }, textAlign: 'center' }}>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 1.5 }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>
            © 2025 SELLSI Todos los derechos reservados.
          </Typography>
        </Box>
      </Box>
    </>
  );
};

/* ---------- estilos reutilizables ---------- */
const linkStyle = {
  cursor: 'pointer',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 500,
  '&:hover': { color: '#fff', textDecoration: 'underline' },
};

const phoneIconStyle = {
  color: 'rgba(255,255,255,0.6)',
  p: 0.5,
  '&:hover': {
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
};

const SocialIcon = ({ href, icon, label }) => (
  <IconButton
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    sx={{
      color: 'rgba(255,255,255,0.6)',
      '&:hover': {
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.08)',
      },
      transition: 'all 0.25s ease',
    }}
  >
    {icon}
  </IconButton>
);

export default BottomBar;
