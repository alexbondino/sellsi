import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const BottomBar = () => {
  return (
    <Box
      sx={{
        backgroundColor: 'bars.main',
        width: '100vw',
        px: 0,
        py: 1,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          px: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#fff', // <- Todo el texto e íconos heredan este color
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <img src="/logo.svg" alt="SELLSI Logo" style={{ height: 28 }} />
          <Typography sx={{ color: '#fff' }}>
            Marketplace que conecta
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Redirección a redes */}
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
