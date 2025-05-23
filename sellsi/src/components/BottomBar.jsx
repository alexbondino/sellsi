import React from 'react';
import { Box, Typography, IconButton, useMediaQuery } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTheme } from '@mui/material/styles';

const BottomBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.bars.main,
        width: '100%', // ✅ reemplazado '100vw' para evitar scroll lateral
        px: 2,
        py: 2,
        display: 'flex',
        justifyContent: 'center',
        overflowX: 'hidden', // ✅ seguridad adicional
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          color: '#fff',
        }}
      >
        {/* Logo y texto */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src="/logo.svg" alt="SELLSI Logo" style={{ height: 28 }} />
          <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
            Marketplace que conecta
          </Typography>
        </Box>

        {/* Íconos de redes sociales */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton href="#" sx={{ color: '#fff' }}>
            <LinkedInIcon />
          </IconButton>
          <IconButton href="#" sx={{ color: '#fff' }}>
            <InstagramIcon />
          </IconButton>
          <IconButton href="#" sx={{ color: '#fff' }}>
            <WhatsAppIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default BottomBar;
